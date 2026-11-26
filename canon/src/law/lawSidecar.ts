import { SOURCES_ROOT } from "@openreturn/sources";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { isPublishedDate } from "../refdocs/published";

/*
 * A law sidecar is law.meta.json, not *.meta.json under the corpus names, so
 * the corpus walk never sees it. It pins one release point of a US Code
 * title; the zip sits next to it as law.zip (gitignored, law.db stores it).
 */

export interface LawSidecar {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  sha256: string;
  format: "uslm";
  /** The OLRC release point, "119-73": the Public Law the text runs through. */
  releasePoint: string;
  published: string | null;
}

export interface LawEntry {
  sidecar: LawSidecar;
  sidecarPath: string;
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
  'needs docId, title, publisher, sha256 and releasePoint as text, format "uslm", and published as YYYY-MM[-DD]';

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

export function coerceLawSidecar(value: unknown): LawSidecar | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const required = [
    record.docId,
    record.title,
    record.publisher,
    record.sha256,
    record.releasePoint,
  ];
  if (!required.every(isText) || record.format !== "uslm") return null;
  if (record.published !== undefined && !isPublishedDate(record.published)) return null;
  return {
    docId: record.docId as string,
    title: record.title as string,
    publisher: record.publisher as string,
    taxYear: typeof record.taxYear === "number" ? record.taxYear : null,
    sourceUrl: isText(record.sourceUrl) ? record.sourceUrl : null,
    sha256: record.sha256 as string,
    format: "uslm",
    releasePoint: record.releasePoint as string,
    published: isPublishedDate(record.published) ? record.published : null,
  };
}
