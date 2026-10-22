import { SOURCES_ROOT } from "@summa/sources";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { ParserStyle } from "./parse";

/*
 * Walks the @summa/sources tree (packages/sources/<year>/…) for corpus
 * sidecars: instructions.meta.json (form instructions, under forms/) and
 * publication.meta.json (an IRS/FTB publication, under publications/).
 * The sidecars are committed; their PDFs are not. A sidecar is the source
 * of truth for docId/title/publisher/taxYear/sourceUrl and the PDF's
 * sha256, so `corpus status` needs no PDF on disk and `corpus sync`
 * downloads one only when it has to ingest (refdocs/fetchSource.ts).
 *
 * A malformed sidecar, or a PDF with no sidecar, is reported as
 * `unconfigured`, not skipped: it is almost always a mistake. blank.pdf
 * files (fillable form templates) are ignored; the engine renders into
 * them, the corpus does not ingest them.
 */

export interface RefDocSidecar {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  /** sha256 of the source PDF: the corpus document's identity. */
  sha256: string;
  /*
   * Heading-detection style. The sidecar may set "parserStyle"
   * explicitly; otherwise it follows the publisher (FTB → "ftb").
   */
  parserStyle: ParserStyle;
}

export interface CorpusEntry {
  pdfPath: string; // absolute; the PDF may not be on disk (see pdfOnDisk)
  pdfRelPath: string; // relative to the sources root, for display
  sidecarPath: string; // absolute
  sidecar: RefDocSidecar;
  pdfOnDisk: boolean;
}

export interface WalkResult {
  entries: CorpusEntry[];
  unconfigured: { pdfPath: string; pdfRelPath: string; reason: string }[];
}

const SOURCE_FILE = /^(instructions|publication)\.(pdf|meta\.json)$/;

async function walkSourceFiles(dir: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkSourceFiles(full)));
    else if (entry.isFile() && SOURCE_FILE.test(entry.name)) out.push(full);
  }
  return out;
}

export async function walkCorpus(sourcesRoot: string = SOURCES_ROOT): Promise<WalkResult> {
  const root = resolve(sourcesRoot);
  const files = await walkSourceFiles(root);
  const pdfs = new Set(files.filter((f) => f.endsWith(".pdf")));

  const entries: CorpusEntry[] = [];
  const unconfigured: WalkResult["unconfigured"] = [];

  for (const sidecarPath of files.filter((f) => f.endsWith(".meta.json"))) {
    const pdfPath = sidecarPath.replace(/\.meta\.json$/, ".pdf");
    const pdfRelPath = relative(root, pdfPath);
    const loaded = await loadSidecar(sidecarPath);
    if (typeof loaded === "string") {
      unconfigured.push({ pdfPath, pdfRelPath, reason: loaded });
    } else {
      entries.push({
        pdfPath,
        pdfRelPath,
        sidecarPath,
        sidecar: loaded,
        pdfOnDisk: pdfs.has(pdfPath),
      });
    }
    pdfs.delete(pdfPath);
  }
  for (const pdfPath of pdfs) {
    unconfigured.push({ pdfPath, pdfRelPath: relative(root, pdfPath), reason: "no sidecar" });
  }

  return { entries, unconfigured };
}

/* The parsed sidecar, or the reason it is unusable (shown by `corpus status`). */
async function loadSidecar(sidecarPath: string): Promise<RefDocSidecar | string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(sidecarPath, "utf8"));
  } catch (e) {
    return `sidecar unreadable: ${(e as Error).message}`;
  }
  return (
    coerceSidecar(parsed) ?? "sidecar missing required fields (docId, title, publisher, sha256)"
  );
}

function coerceSidecar(v: unknown): RefDocSidecar | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.docId !== "string" ||
    typeof o.title !== "string" ||
    typeof o.publisher !== "string" ||
    typeof o.sha256 !== "string"
  ) {
    return null;
  }
  const taxYear = typeof o.taxYear === "number" ? o.taxYear : null;
  const sourceUrl = typeof o.sourceUrl === "string" ? o.sourceUrl : null;
  const parserStyle: ParserStyle =
    o.parserStyle === "irs" || o.parserStyle === "ftb"
      ? o.parserStyle
      : o.publisher === "FTB"
        ? "ftb"
        : "irs";
  return {
    docId: o.docId,
    title: o.title,
    publisher: o.publisher,
    taxYear,
    sourceUrl,
    sha256: o.sha256,
    parserStyle,
  };
}
