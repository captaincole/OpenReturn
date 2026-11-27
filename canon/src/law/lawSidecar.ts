import { SOURCES_ROOT } from "@openreturn/sources";
import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { isPublishedDate } from "../refdocs/published";

/*
 * A law sidecar is law.meta.json, not *.meta.json under the corpus names, so
 * the corpus walk never sees it. It pins one release of a law document:
 * the Code as one zip (law.zip next to it), the regulations as one file per
 * CFR part, each pinned by its own sha256 (the files sit next to it, and
 * law.db stores them zipped as one blob), California's code as one zip cut
 * from the Legislature's session archive (caExtract.ts). All are gitignored.
 */

export type LawFormat = "uslm" | "ecfr" | "caml";

/** One downloaded file of a document published in parts. */
export interface LawSourceFile {
  /** The file's name next to the sidecar and inside the stored zip. */
  file: string;
  sourceUrl: string;
  sha256: string;
}

export interface LawSidecar {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  /** The zip's sha256; for a document in parts, one hash of the parts' hashes (partsSha256). */
  sha256: string;
  format: LawFormat;
  /**
   * Where the text runs through: an OLRC release point ("119-73"), an eCFR
   * date ("2025-12-31"), or the date of California's session archive ("2026-11-22").
   */
  releasePoint: string;
  published: string | null;
  /** The parts of an "ecfr" document, in order; empty for the others. */
  files: LawSourceFile[];
}

export interface LawEntry {
  sidecar: LawSidecar;
  sidecarPath: string;
  /** law.zip next to the sidecar: the Code's release zip, California's extract, or the parts zipped as law.db stores them. */
  zipPath: string;
  /** For messages and the stored source_path: relative to sources/. */
  zipRelPath: string;
}

const SIDECAR_FILE = "law.meta.json";
const ZIP_FILE = "law.zip";

export async function walkLaw(sourcesRoot: string = SOURCES_ROOT): Promise<LawEntry[]> {
  const root = resolve(sourcesRoot);
  const paths = await findSidecars(root);
  return Promise.all(paths.map((path) => loadEntry(root, path)));
}

async function findSidecars(dir: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return findSidecars(full);
      return Promise.resolve(entry.name === SIDECAR_FILE ? [full] : []);
    }),
  );
  return nested.flat().sort();
}

async function loadEntry(root: string, sidecarPath: string): Promise<LawEntry> {
  const sidecar = coerceLawSidecar(JSON.parse(await readFile(sidecarPath, "utf8")));
  if (!sidecar) throw new Error(`${relative(root, sidecarPath)}: ${SIDECAR_RULE}`);
  const zipPath = join(dirname(sidecarPath), ZIP_FILE);
  return { sidecar, sidecarPath, zipPath, zipRelPath: relative(root, zipPath) };
}

const SIDECAR_RULE =
  'needs docId, title, publisher and releasePoint as text, published as YYYY-MM[-DD], and either format "uslm" or "caml" with a sha256, or format "ecfr" with files (each file, sourceUrl and sha256)';

/* One zip, pinned by its sha256: the Code's release, or California's extract. */
const ONE_ZIP_FORMATS = new Set(["uslm", "caml"]);

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

export function coerceLawSidecar(value: unknown): LawSidecar | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const required = [record.docId, record.title, record.publisher, record.releasePoint];
  if (!required.every(isText)) return null;
  if (record.published !== undefined && !isPublishedDate(record.published)) return null;
  const pinned = pinOf(record);
  if (!pinned) return null;
  return {
    docId: record.docId as string,
    title: record.title as string,
    publisher: record.publisher as string,
    taxYear: typeof record.taxYear === "number" ? record.taxYear : null,
    sourceUrl: isText(record.sourceUrl) ? record.sourceUrl : null,
    releasePoint: record.releasePoint as string,
    published: isPublishedDate(record.published) ? record.published : null,
    ...pinned,
  };
}

type Pin = Pick<LawSidecar, "format" | "sha256" | "files">;

function pinOf(record: Record<string, unknown>): Pin | null {
  if (ONE_ZIP_FORMATS.has(record.format as string)) {
    const format = record.format as "uslm" | "caml";
    return isText(record.sha256) ? { format, sha256: record.sha256, files: [] } : null;
  }
  if (record.format !== "ecfr" || !Array.isArray(record.files)) return null;
  const files = record.files.map(coerceFile);
  if (files.length === 0 || files.some((file) => file === null)) return null;
  const parts = files as LawSourceFile[];
  return { format: "ecfr", sha256: partsSha256(parts), files: parts };
}

function coerceFile(value: unknown): LawSourceFile | null {
  if (!value || typeof value !== "object") return null;
  const { file, sourceUrl, sha256 } = value as Record<string, unknown>;
  if (!isText(file) || !isText(sourceUrl) || !isText(sha256)) return null;
  return { file, sourceUrl, sha256 };
}

/** One hash for a document in parts: the sha256 of "file sha256" lines, in order. A change to any part changes it. */
export const partsSha256 = (files: LawSourceFile[]): string =>
  createHash("sha256")
    .update(files.map((file) => `${file.file} ${file.sha256}\n`).join(""))
    .digest("hex");
