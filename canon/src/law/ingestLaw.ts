import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { setDocumentSource } from "../db/corpusFiles";
import {
  deleteDocument,
  getDocument,
  setBlockEmbeddings,
  writeDocument,
  type IngestPayload,
  type RefBlock,
} from "../db/corpusStore";
import type { LawLibrary } from "../db/libsql";
import { embedDocuments, resolveEmbeddings } from "../refdocs/embeddings";
import type { ParsedDoc } from "../refdocs/parse";
import { lawLibraryOfId } from "./lawLibrary";
import type { LawEntry } from "./lawSidecar";
import { ensureLawParts, ensureLawZip } from "./lawSource";
import { parseCaExtract } from "./parseCaml";
import { parseEcfrParts } from "./parseEcfr";
import { parseUslmTitle } from "./parseUslm";
import { readZip } from "./unzip";

/*
 * Builds one law document in its jurisdiction's law file (federal.db,
 * ca.db): source → XML → rows → embeddings. The
 * Code is one USLM zip; the regulations are eCFR XML, one file per part;
 * California's code is one extract zip of law tables and CAML XML files.
 * No model writes the context: the parser builds each block's header and
 * the lead text above it, so contextualSummary stays null and there is no
 * Haiku cost.
 */

/** What both parsers return. */
export interface ParsedLaw extends ParsedDoc {
  canonicalText: string;
  stats: object;
}

interface LawSource {
  parsed: ParsedLaw;
  /** The blob the law file stores. */
  blob: Uint8Array;
}

export interface LawIngestResult {
  docId: string;
  skipped: boolean;
  replaced: boolean;
  sections: number;
  blocks: number;
  embedded: number;
}

// Each chunk is written as soon as it is embedded, so a failure keeps the vectors made so far.
const EMBED_CHUNK = 512;

export async function ingestLaw(
  entry: LawEntry,
  opts: { force?: boolean } = {},
): Promise<LawIngestResult> {
  const { docId, sha256 } = entry.sidecar;
  const library = lawLibraryOfId(docId);
  const existing = await getDocument(docId, library);
  if (existing?.sha256 === sha256 && !opts.force) {
    console.log(`  ${docId}: sha unchanged (${sha256.slice(0, 12)}…), skipping ingest`);
    return { docId, skipped: true, replaced: false, sections: -1, blocks: -1, embedded: -1 };
  }
  const { parsed, blob } = await readSource(entry);
  console.log(`  parsed ${parsed.sections.length} sections, ${parsed.blocks.length} blocks`);
  console.log(`  ${JSON.stringify(parsed.stats)}`);
  if (existing) await deleteDocument(docId, library);
  const payload = lawPayload(entry, parsed);
  // Rows first: an embedding failure leaves them for `law reembed`.
  await writeFile(canonicalTextPath(entry), parsed.canonicalText, "utf8");
  await writeDocument(payload, library);
  await setDocumentSource(docId, blob, library);
  const embedded = await embedLawBlocks(library, payload.blocks);
  return {
    docId,
    skipped: false,
    replaced: existing !== null,
    sections: payload.sections.length,
    blocks: payload.blocks.length,
    embedded,
  };
}

async function readSource(entry: LawEntry): Promise<LawSource> {
  const { docId } = entry.sidecar;
  if (entry.sidecar.format === "ecfr") {
    const parts = await ensureLawParts(entry);
    const xmls = parts.files.map(({ data }) => new TextDecoder().decode(data));
    return { parsed: parseEcfrParts(xmls, docId), blob: parts.zip };
  }
  const zip = await ensureLawZip(entry);
  if (entry.sidecar.format === "caml")
    return { parsed: parseCaExtract(readZip(zip), docId), blob: zip };
  return { parsed: parseUslmTitle(titleXml(zip, entry.zipRelPath), docId), blob: zip };
}

// A release zip holds one title: one XML file.
function titleXml(zip: Uint8Array, zipRelPath: string): string {
  const xml = readZip(zip).filter((file) => file.name.toLowerCase().endsWith(".xml"));
  if (xml.length !== 1)
    throw new Error(`${zipRelPath}: expected one XML file in the zip, found ${xml.length}`);
  return new TextDecoder().decode(xml[0].data);
}

// A gitignored debugging aid next to the zip, as the corpus writes one next to each PDF.
const canonicalTextPath = (entry: LawEntry) => entry.zipPath.replace(/\.zip$/, ".canonical.txt");

const sha1 = (text: string) => createHash("sha1").update(text).digest("hex");

export function lawPayload(entry: LawEntry, parsed: ParsedLaw): IngestPayload {
  const { sidecar } = entry;
  const docId = sidecar.docId;
  const length = parsed.canonicalText.length;
  return {
    document: {
      docId,
      title: sidecar.title,
      publisher: sidecar.publisher,
      taxYear: sidecar.taxYear,
      sourcePath: entry.zipRelPath,
      sourceUrl: sidecar.sourceUrl,
      sha256: sidecar.sha256,
      totalPages: 1,
      totalChars: length,
      canonicalTextPath: entry.zipRelPath.replace(/\.zip$/, ".canonical.txt"),
      format: sidecar.format,
      published: sidecar.published,
    },
    // No pages: one page row holds the whole text, as for an HTML document.
    pages: [{ docId, pageNum: 1, charStart: 0, charEnd: length }],
    sections: parsed.sections.map((section) => ({ docId, ...section })),
    blocks: parsed.blocks.map((block) => ({ docId, ...block, blockTextSha1: sha1(block.text) })),
  };
}

/* Fails soft, as the corpus pipeline does: returns how many blocks got a vector. */
type EmbedInput = Pick<RefBlock, "blockId" | "text" | "contextualizedText">;

export async function embedLawBlocks(library: LawLibrary, blocks: EmbedInput[]): Promise<number> {
  let done = 0;
  try {
    const cfg = resolveEmbeddings();
    const started = Date.now();
    for (let i = 0; i < blocks.length; i += EMBED_CHUNK) {
      const chunk = blocks.slice(i, i + EMBED_CHUNK);
      const vectors = await embedDocuments(
        cfg,
        chunk.map((block) => block.contextualizedText ?? block.text),
      );
      await setBlockEmbeddings(
        chunk.map((block, index) => ({ blockId: block.blockId, embedding: vectors[index] })),
        { embeddingModel: cfg.id, library },
      );
      done += chunk.length;
      console.log(`  embedded ${done}/${blocks.length} blocks (${cfg.id})`);
    }
    console.log(`  embedding done in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (err) {
    console.warn(
      `  (embedding stopped at ${done}/${blocks.length} — ${err instanceof Error ? err.message : String(err)}\n` +
        "   law search is keyword-only for the rest; run `npm run corpus -- law reembed` once Ollama is up)",
    );
  }
  return done;
}
