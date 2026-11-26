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
import { embedDocuments, resolveEmbeddings } from "../refdocs/embeddings";
import type { LawEntry } from "./lawSidecar";
import { ensureLawZip } from "./lawSource";
import { parseUslmTitle, type ParsedUslm } from "./parseUslm";
import { readZip } from "./unzip";

/*
 * Builds one law document in law.db: zip → USLM XML → rows → embeddings.
 * No model writes the context: the parser builds each block's header and
 * chapeaus itself, so contextualSummary stays null and there is no Haiku cost.
 */

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
  const existing = await getDocument(docId, "law");
  if (existing?.sha256 === sha256 && !opts.force) {
    console.log(`  ${docId}: sha unchanged (${sha256.slice(0, 12)}…), skipping ingest`);
    return { docId, skipped: true, replaced: false, sections: -1, blocks: -1, embedded: -1 };
  }
  const zip = await ensureLawZip(entry);
  const parsed = parseUslmTitle(titleXml(zip, entry.zipRelPath), docId);
  console.log(`  parsed ${parsed.sections.length} sections, ${parsed.blocks.length} blocks`);
  if (existing) await deleteDocument(docId, "law");
  const payload = lawPayload(entry, parsed);
  // Rows first: an embedding failure leaves them for `law reembed`.
  await writeFile(canonicalTextPath(entry), parsed.canonicalText, "utf8");
  await writeDocument(payload, "law");
  await setDocumentSource(docId, zip, "law");
  const embedded = await embedLawBlocks(payload.blocks);
  return {
    docId,
    skipped: false,
    replaced: existing !== null,
    sections: payload.sections.length,
    blocks: payload.blocks.length,
    embedded,
  };
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

export function lawPayload(entry: LawEntry, parsed: ParsedUslm): IngestPayload {
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
      format: "uslm",
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

export async function embedLawBlocks(blocks: EmbedInput[]): Promise<number> {
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
        { embeddingModel: cfg.id, library: "law" },
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
