import { SOURCES_ROOT } from "@summa/sources";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { SourceFormat } from "../mastra/db/corpusStore";
import type { ParserStyle } from "./parse";

/*
 * Walks the @summa/sources tree (packages/sources/<year>/…) for corpus
 * sidecars: instructions.meta.json (form instructions, under forms/) and
 * publication.meta.json (an IRS/FTB publication, under publications/).
 * The sidecars are committed; their source files are not. A source file
 * is a PDF, or for "format": "html" a cleaned publisher web page
 * (refdocs/html/cleanFtb.ts), saved beside the sidecar as
 * instructions.pdf / instructions.html (publication.* likewise). A sidecar
 * is the source of truth for docId/title/publisher/taxYear/sourceUrl and
 * the source file's sha256, so `corpus status` needs no file on disk and
 * `corpus sync` fetches one only when it has to ingest
 * (refdocs/fetchSource.ts).
 *
 * A malformed sidecar, or a source file with no sidecar, is reported as
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
  /** sha256 of the source file: the corpus document's identity. */
  sha256: string;
  /** "pdf" unless the sidecar says "html". */
  format: SourceFormat;
  /*
   * Heading-detection style. The sidecar may set "parserStyle"
   * explicitly; otherwise it follows the publisher (FTB → "ftb").
   */
  parserStyle: ParserStyle;
}

export interface CorpusEntry {
  sourcePath: string; // absolute; the file may not be on disk (see sourceOnDisk)
  sourceRelPath: string; // relative to the sources root, for display
  sidecarPath: string; // absolute
  sidecar: RefDocSidecar;
  sourceOnDisk: boolean;
}

export interface WalkResult {
  entries: CorpusEntry[];
  unconfigured: { sourcePath: string; sourceRelPath: string; reason: string }[];
}

const SOURCE_FILE = /^(instructions|publication)\.(pdf|html|meta\.json)$/;

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
  const sources = new Set(files.filter((f) => !f.endsWith(".meta.json")));

  const entries: CorpusEntry[] = [];
  const unconfigured: WalkResult["unconfigured"] = [];

  for (const sidecarPath of files.filter((f) => f.endsWith(".meta.json"))) {
    const loaded = await loadSidecar(sidecarPath);
    const ext = typeof loaded === "string" ? "pdf" : loaded.format;
    const sourcePath = sidecarPath.replace(/\.meta\.json$/, `.${ext}`);
    const sourceRelPath = relative(root, sourcePath);
    if (typeof loaded === "string") {
      unconfigured.push({ sourcePath, sourceRelPath, reason: loaded });
    } else {
      entries.push({
        sourcePath,
        sourceRelPath,
        sidecarPath,
        sidecar: loaded,
        sourceOnDisk: sources.has(sourcePath),
      });
    }
    // A leftover file in the other format (a document that moved to HTML) is not an error.
    for (const other of ["pdf", "html"])
      sources.delete(sidecarPath.replace(/\.meta\.json$/, `.${other}`));
  }
  for (const sourcePath of sources) {
    unconfigured.push({
      sourcePath,
      sourceRelPath: relative(root, sourcePath),
      reason: "no sidecar",
    });
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
    coerceSidecar(parsed) ??
    "sidecar missing required fields (docId, title, publisher, sha256), or format is not pdf/html"
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
  if (o.format !== undefined && o.format !== "pdf" && o.format !== "html") return null;
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
    format: o.format === "html" ? "html" : "pdf",
    parserStyle,
  };
}
