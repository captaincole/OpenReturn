import { SOURCES_ROOT } from "@openreturn/sources";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { SourceFormat } from "../db/corpusStore";
import type { ParserStyle } from "./parse";
import { isPublishedDate } from "./published";

/*
 * A malformed sidecar, or a source file with no sidecar, is `unconfigured`,
 * not skipped: it is almost always a mistake.
 */

export interface RefDocSidecar {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  sha256: string;
  format: SourceFormat;
  parserStyle: ParserStyle;
  /** null → derived from the source file. */
  published: string | null;
}

export interface CorpusEntry {
  sourcePath: string;
  sourceRelPath: string;
  sidecarPath: string;
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
  const sources = new Set(files.filter((file) => !file.endsWith(".meta.json")));

  const entries: CorpusEntry[] = [];
  const unconfigured: WalkResult["unconfigured"] = [];

  for (const sidecarPath of files.filter((file) => file.endsWith(".meta.json"))) {
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

/* Returns the sidecar, or the reason it is unusable. */
async function loadSidecar(sidecarPath: string): Promise<RefDocSidecar | string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(sidecarPath, "utf8"));
  } catch (err) {
    return `sidecar unreadable: ${(err as Error).message}`;
  }
  return (
    coerceSidecar(parsed) ??
    "sidecar missing required fields (docId, title, publisher, sha256), format is not pdf/html, or published is not YYYY-MM[-DD]"
  );
}

function coerceSidecar(value: unknown): RefDocSidecar | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.docId !== "string" ||
    typeof record.title !== "string" ||
    typeof record.publisher !== "string" ||
    typeof record.sha256 !== "string"
  ) {
    return null;
  }
  if (record.format !== undefined && record.format !== "pdf" && record.format !== "html")
    return null;
  if (record.published !== undefined && !isPublishedDate(record.published)) return null;
  const taxYear = typeof record.taxYear === "number" ? record.taxYear : null;
  const sourceUrl = typeof record.sourceUrl === "string" ? record.sourceUrl : null;
  const parserStyle: ParserStyle =
    record.parserStyle === "irs" || record.parserStyle === "ftb"
      ? record.parserStyle
      : record.publisher === "FTB"
        ? "ftb"
        : "irs";
  return {
    docId: record.docId,
    title: record.title,
    publisher: record.publisher,
    taxYear,
    sourceUrl,
    sha256: record.sha256,
    format: record.format === "html" ? "html" : "pdf",
    parserStyle,
    published: isPublishedDate(record.published) ? record.published : null,
  };
}
