import { SOURCES_ROOT } from "@openreturn/sources";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { setDocumentSource } from "../db/corpusFiles";
import {
  deleteDocument,
  getDocument,
  setBlockEmbeddings,
  writeDocument,
  type RefBlock,
  type RefPage,
  type RefSection,
  type SourceFormat,
} from "../db/corpusStore";
import { sha1, summarizeBlocks } from "./contextualize";
import { embedDocuments, resolveEmbeddings } from "./embeddings";
import { extractPdf, pdfPublished, type PageSlice } from "./extract";
import { parseHtmlDoc } from "./html/parseHtml";
import { parseDoc, type ParsedDoc, type ParserStyle } from "./parse";

export interface IngestInput {
  sourcePath: string;
  format?: SourceFormat;
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl?: string | null;
  published?: string | null;
  force?: boolean;
  /** Skips the paid Haiku step; embeddings then use the raw block text. */
  noContextualize?: boolean;
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
  skipped: boolean;
}

async function shaOfFile(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

// Counts are -1: they need a query this path does not run.
function skippedResult(
  existing: NonNullable<Awaited<ReturnType<typeof getDocument>>>,
): IngestResult {
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
 * The cached prefix is the section, not the whole doc: large docs exceed
 * Haiku's 200k context. Mutates the blocks in place.
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
  for (const section of sections) {
    sectionTextById.set(section.sectionId, canonicalText.slice(section.charStart, section.charEnd));
    sectionHeadingById.set(section.sectionId, section.heading);
  }

  const summarized = await summarizeBlocks({
    documentTitle,
    blocks: blocks.map((block) => {
      const sectionText = block.sectionId
        ? (sectionTextById.get(block.sectionId) ?? block.text)
        : block.text;
      const sectionHeading = block.sectionId
        ? (sectionHeadingById.get(block.sectionId) ?? null)
        : null;
      return {
        blockId: block.blockId,
        text: block.text,
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
  const byId = new Map(summarized.map((summary) => [summary.blockId, summary]));
  for (const block of blocks) {
    const summary = byId.get(block.blockId);
    if (!summary) continue;
    block.contextualSummary = summary.summary;
    block.contextualizedText = summary.contextualizedText;
    block.blockTextSha1 = summary.blockTextSha1;
  }
  console.log(`  contextualization done in ${Math.round((Date.now() - start) / 1000)}s`);
}

// Fails soft: rows keep NULL embeddings and `corpus reembed` finishes later.
async function embedBlocks(blocks: RefBlock[]): Promise<boolean> {
  try {
    const embedCfg = resolveEmbeddings();
    const start = Date.now();
    const inputs = blocks.map((block) => block.contextualizedText ?? block.text);
    const vectors = await embedDocuments(embedCfg, inputs, (done, total) =>
      console.log(`  embedding ${done}/${total} blocks… (${embedCfg.id})`),
    );
    await setBlockEmbeddings(
      blocks.map((block, i) => ({ blockId: block.blockId, embedding: vectors[i] })),
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

// corpus.db ships publicly, so it must not carry a machine's absolute paths.
function recordedPath(path: string): string {
  const rel = relative(SOURCES_ROOT, path);
  return rel.startsWith("..") ? basename(path) : rel;
}

interface ExtractedDoc extends ParsedDoc {
  sha256: string;
  canonicalText: string;
  pages: PageSlice[];
  totalPages: number;
  published: string | null;
}

async function extractSource(input: IngestInput, path: string): Promise<ExtractedDoc> {
  if (input.format === "html") {
    const bytes = await readFile(path);
    const parsed = parseHtmlDoc(bytes.toString("utf8"), input.docId);
    const length = parsed.canonicalText.length;
    return {
      ...parsed,
      published: null, // the sidecar's, if the page shows one
      sha256: createHash("sha256").update(bytes).digest("hex"),
      pages: [{ pageNum: 1, charStart: 0, charEnd: length }],
      totalPages: 1,
    };
  }
  const extracted = await extractPdf(path);
  const parsed = parseDoc(extracted.canonicalText, extracted.pages, {
    docId: input.docId,
    style: input.parserStyle,
  });
  return { ...extracted, ...parsed, published: await pdfPublished(await readFile(path)) };
}

async function persistParsedDoc(
  input: IngestInput,
  extracted: ExtractedDoc,
  sourcePath: string,
  canonicalTextPath: string,
  rows: { pages: RefPage[]; sections: RefSection[]; blocks: RefBlock[] },
): Promise<void> {
  await writeDocument({
    document: {
      docId: input.docId,
      title: input.title,
      publisher: input.publisher,
      taxYear: input.taxYear,
      sourcePath: recordedPath(sourcePath),
      sourceUrl: input.sourceUrl ?? null,
      sha256: extracted.sha256,
      totalPages: extracted.totalPages,
      totalChars: extracted.canonicalText.length,
      canonicalTextPath: recordedPath(canonicalTextPath),
      format: input.format ?? "pdf",
      published: input.published ?? extracted.published,
    },
    ...rows,
  });
}

function toRows(
  docId: string,
  extracted: ExtractedDoc,
): { pages: RefPage[]; sections: RefSection[]; blocks: RefBlock[] } {
  return {
    pages: extracted.pages.map((page) => ({ docId, ...page })),
    sections: extracted.sections.map((section) => ({ docId, ...section })),
    blocks: extracted.blocks.map((block) => ({ docId, ...block })),
  };
}

export async function ingestRefDoc(input: IngestInput): Promise<IngestResult> {
  const sourcePath = resolve(input.sourcePath);
  // A gitignored debugging aid; corpus.db holds the text the corpus uses.
  const canonicalTextPath = sourcePath.replace(/\.(pdf|html)$/i, ".canonical.txt");

  // Hash before any paid step, so an unchanged file costs nothing.
  const fileSha = await shaOfFile(sourcePath);
  const existing = await getDocument(input.docId);
  if (existing && existing.sha256 === fileSha && !input.force) {
    console.log(`  ${input.docId}: sha unchanged (${fileSha.slice(0, 12)}…), skipping ingest`);
    return skippedResult(existing);
  }

  const extracted = await extractSource(input, sourcePath);

  let replaced = false;
  if (existing) {
    await deleteDocument(input.docId);
    replaced = true;
  }

  await mkdir(dirname(canonicalTextPath), { recursive: true });
  await writeFile(canonicalTextPath, extracted.canonicalText, "utf8");

  const { pages, sections, blocks } = toRows(input.docId, extracted);

  if (!input.noContextualize) {
    await contextualizeBlocks(input.title, extracted.canonicalText, sections, blocks);
  } else {
    for (const block of blocks) block.blockTextSha1 = sha1(block.text);
  }

  // Write rows before embedding: an embed failure then keeps the Haiku summaries.
  await persistParsedDoc(input, extracted, sourcePath, canonicalTextPath, {
    pages,
    sections,
    blocks,
  });
  await setDocumentSource(input.docId, new Uint8Array(await readFile(sourcePath)));

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
