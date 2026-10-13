import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  deleteDocument,
  getDocument,
  setBlockEmbeddings,
  writeDocument,
  type RefBlock,
  type RefPage,
  type RefSection,
} from "../mastra/db/corpusStore";
import { sha1, summarizeBlocks } from "./contextualize";
import { embedDocuments, resolveEmbeddings } from "./embeddings";
import { extractPdf } from "./extract";
import { parseDoc, type ParserStyle } from "./parse";

export interface IngestInput {
  pdfPath: string;
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl?: string | null;
  force?: boolean;
  /**
   * Skip the per-block Haiku contextualization step. Useful for fast dev
   * iteration on the parser. Without contextualization the embedding step
   * still runs, against raw block text.
   */
  noContextualize?: boolean;
  /**
   * Heading-detection profile. Defaults to "irs". FTB-published docs (e.g.
   * Schedule CA instructions) need "ftb" for their en-dash inline-body
   * convention. See `ParserStyle` in `./parse`.
   */
  parserStyle?: ParserStyle;
}

export interface IngestResult {
  docId: string;
  sha256: string;
  totalPages: number;
  totalChars: number;
  sectionCount: number;
  blockCount: number;
  canonicalTextPath: string;
  replaced: boolean;
  contextualized: boolean;
  embedded: boolean;
  /**
   * True when the on-disk PDF's sha matches the existing ref_documents row,
   * so we returned without re-running extract / contextualize / embed. In
   * that case the other result fields come from the existing row.
   */
  skipped: boolean;
}

async function shaOfFile(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

/*
 * Sha-skip result. Section/block counts need a query we do not run here;
 * callers that care can run the search smoke test. Return -1 to make
 * this loud.
 */
function skippedResult(existing: NonNullable<Awaited<ReturnType<typeof getDocument>>>): IngestResult {
  return {
    docId: existing.docId,
    sha256: existing.sha256,
    totalPages: existing.totalPages,
    totalChars: existing.totalChars,
    sectionCount: -1,
    blockCount: -1,
    canonicalTextPath: existing.canonicalTextPath,
    replaced: false,
    contextualized: false,
    embedded: false,
    skipped: true,
  };
}

/*
 * Contextual Retrieval: a per-block Haiku summary, prepended before
 * embedding/FTS. We pass the SECTION text (not the whole doc) as the
 * cached prefix because large reference docs exceed Haiku's 200k context
 * window. Cache-by-section keeps the per-call discount within a section
 * and scales to any doc size. Mutates the blocks in place.
 */
async function contextualizeBlocks(
  documentTitle: string,
  canonicalText: string,
  sections: RefSection[],
  blocks: RefBlock[],
): Promise<void> {
  const start = Date.now();
  const sectionTextById = new Map<string, string>();
  const sectionHeadingById = new Map<string, string>();
  for (const s of sections) {
    sectionTextById.set(s.sectionId, canonicalText.slice(s.charStart, s.charEnd));
    sectionHeadingById.set(s.sectionId, s.heading);
  }

  const summarized = await summarizeBlocks({
    documentTitle,
    blocks: blocks.map((b) => {
      const sectionText = b.sectionId ? (sectionTextById.get(b.sectionId) ?? b.text) : b.text;
      const sectionHeading = b.sectionId ? (sectionHeadingById.get(b.sectionId) ?? null) : null;
      return {
        blockId: b.blockId,
        text: b.text,
        sectionHeading,
        sectionText,
      };
    }),
    concurrency: 5,
    onProgress: (done, total) => {
      if (done === 1 || done % 25 === 0 || done === total) {
        console.log(`  contextualizing ${done}/${total} blocks…`);
      }
    },
  });
  const byId = new Map(summarized.map((s) => [s.blockId, s]));
  for (const b of blocks) {
    const s = byId.get(b.blockId);
    if (!s) continue;
    b.contextualSummary = s.summary;
    b.contextualizedText = s.contextualizedText;
    b.blockTextSha1 = s.blockTextSha1;
  }
  console.log(`  contextualization done in ${Math.round((Date.now() - start) / 1000)}s`);
}

/*
 * Embed the contextualized text (summary + raw text) via local Ollama.
 * Fails soft: on an embed failure (e.g. Ollama not running) rows keep
 * NULL embeddings, retrieval runs FTS-only, and
 * `npm run corpus -- reembed` finishes the job once Ollama is up.
 */
async function embedBlocks(blocks: RefBlock[]): Promise<boolean> {
  try {
    const embedCfg = resolveEmbeddings();
    const start = Date.now();
    const inputs = blocks.map((b) => b.contextualizedText ?? b.text);
    const vectors = await embedDocuments(embedCfg, inputs, (done, total) =>
      console.log(`  embedding ${done}/${total} blocks… (${embedCfg.id})`),
    );
    await setBlockEmbeddings(
      blocks.map((b, i) => ({ blockId: b.blockId, embedding: vectors[i] })),
      { embeddingModel: embedCfg.id },
    );
    console.log(`  embedding done in ${Math.round((Date.now() - start) / 1000)}s`);
    return true;
  } catch (err) {
    console.warn(
      `  (embedding skipped — ${err instanceof Error ? err.message : String(err)}\n` +
        `   retrieval will be FTS-only; run \`npm run corpus -- reembed\` once Ollama is up)`,
    );
    return false;
  }
}

/*
 * Write the document + rows now, before embedding. A crash in the embed
 * step then cannot lose the contextual summaries we just paid Haiku to
 * generate; embeddings update in place afterward.
 */
async function persistParsedDoc(
  input: IngestInput,
  extracted: Awaited<ReturnType<typeof extractPdf>>,
  pdfPath: string,
  canonicalTextPath: string,
  rows: { pages: RefPage[]; sections: RefSection[]; blocks: RefBlock[] },
): Promise<void> {
  await writeDocument({
    document: {
      docId: input.docId,
      title: input.title,
      publisher: input.publisher,
      taxYear: input.taxYear,
      sourcePath: pdfPath,
      sourceUrl: input.sourceUrl ?? null,
      sha256: extracted.sha256,
      totalPages: extracted.totalPages,
      totalChars: extracted.canonicalText.length,
      canonicalTextPath,
    },
    ...rows,
  });
}

/* Parse the extracted text and stamp docId onto every corpus row. */
function parseToRows(
  input: IngestInput,
  extracted: Awaited<ReturnType<typeof extractPdf>>,
): { pages: RefPage[]; sections: RefSection[]; blocks: RefBlock[] } {
  const { sections: parsedSections, blocks: parsedBlocks } = parseDoc(
    extracted.canonicalText,
    extracted.pages,
    { docId: input.docId, style: input.parserStyle },
  );
  return {
    pages: extracted.pages.map((p) => ({
      docId: input.docId,
      pageNum: p.pageNum,
      charStart: p.charStart,
      charEnd: p.charEnd,
    })),
    sections: parsedSections.map((s) => ({ docId: input.docId, ...s })),
    blocks: parsedBlocks.map((b) => ({ docId: input.docId, ...b })),
  };
}

export async function ingestRefDoc(input: IngestInput): Promise<IngestResult> {
  const pdfPath = resolve(input.pdfPath);
  /*
   * Canonical text colocates with its source PDF: forms/<…>/instructions.pdf
   * → forms/<…>/instructions.canonical.txt.
   */
  const canonicalTextPath = pdfPath.replace(/\.pdf$/i, ".canonical.txt");

  /*
   * Sha-skip: hash the file before any expensive step. If the existing
   * row's sha matches and the caller did not pass --force, there is
   * nothing to do. This makes `corpus sync` cheap to run on every dev tick.
   */
  const fileSha = await shaOfFile(pdfPath);
  const existing = await getDocument(input.docId);
  if (existing && existing.sha256 === fileSha && !input.force) {
    console.log(`  ${input.docId}: sha unchanged (${fileSha.slice(0, 12)}…), skipping ingest`);
    return skippedResult(existing);
  }

  const extracted = await extractPdf(pdfPath);

  let replaced = false;
  if (existing) {
    await deleteDocument(input.docId);
    replaced = true;
  }

  await mkdir(dirname(canonicalTextPath), { recursive: true });
  await writeFile(canonicalTextPath, extracted.canonicalText, "utf8");

  const { pages, sections, blocks } = parseToRows(input, extracted);

  if (!input.noContextualize) {
    await contextualizeBlocks(input.title, extracted.canonicalText, sections, blocks);
  } else {
    /*
     * Still hash the text so a future re-ingest that does run
     * summarization has something to compare against.
     */
    for (const b of blocks) b.blockTextSha1 = sha1(b.text);
  }

  await persistParsedDoc(input, extracted, pdfPath, canonicalTextPath, {
    pages,
    sections,
    blocks,
  });

  const embedded = await embedBlocks(blocks);

  return {
    docId: input.docId,
    sha256: extracted.sha256,
    totalPages: extracted.totalPages,
    totalChars: extracted.canonicalText.length,
    sectionCount: sections.length,
    blockCount: blocks.length,
    canonicalTextPath,
    replaced,
    contextualized: !input.noContextualize,
    embedded,
    skipped: false,
  };
}
