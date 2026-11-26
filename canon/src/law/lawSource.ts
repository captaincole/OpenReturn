import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getDocumentSource } from "../db/corpusFiles";
import { fetchBytes, sha256 } from "../refdocs/fetchSource";
import type { LawEntry, LawSourceFile } from "./lawSidecar";
import { readZip } from "./unzip";
import { writeZip } from "./zipWrite";

/*
 * The release zip: on disk next to the sidecar, else the copy in law.db,
 * else the sourceUrl. The sha256 is checked every time. A copy from law.db
 * or the web is written to disk, so the next sync reads it from there.
 */
export async function ensureLawZip(entry: LawEntry): Promise<Uint8Array> {
  if (existsSync(entry.zipPath)) return fromDisk(entry);
  const stored = await getDocumentSource(entry.sidecar.docId, "law");
  const zip = stored && sha256(stored) === entry.sidecar.sha256 ? stored : await download(entry);
  await mkdir(dirname(entry.zipPath), { recursive: true });
  await writeFile(entry.zipPath, zip);
  return zip;
}

async function fromDisk(entry: LawEntry): Promise<Uint8Array> {
  const local = new Uint8Array(await readFile(entry.zipPath));
  if (sha256(local) === entry.sidecar.sha256) return local;
  throw new Error(
    `${entry.zipRelPath} does not match its sidecar sha256. Update the sidecar for a new release point, or delete the file to fetch it again.`,
  );
}

async function download({ sidecar, zipRelPath }: LawEntry): Promise<Uint8Array> {
  if (!sidecar.sourceUrl)
    throw new Error(`${zipRelPath} is not on disk or in law.db, and its sidecar has no sourceUrl`);
  console.log(`  downloading ${sidecar.sourceUrl}`);
  const zip = await fetchBytes(sidecar.sourceUrl);
  const got = sha256(zip);
  if (got !== sidecar.sha256)
    throw new Error(
      `${sidecar.sourceUrl} served a different file (sha256 ${got.slice(0, 12)}…, sidecar ${sidecar.sha256.slice(0, 12)}…)`,
    );
  return zip;
}

/** The parts of a document published in several files, in sidecar order, and the zip law.db stores. */
export interface LawParts {
  files: Array<{ file: string; data: Uint8Array }>;
  zip: Uint8Array;
}

// eCFR answers automated clients; a plain name, nothing that names the person or project.
const PART_FETCH_HEADERS = { "user-agent": "research-client" };

/*
 * Each part: on disk next to the sidecar, else in the zip law.db stores,
 * else its sourceUrl. Each one's sha256 is checked; a part from law.db or
 * the web is written to disk.
 */
export async function ensureLawParts(entry: LawEntry): Promise<LawParts> {
  const stored = await getDocumentSource(entry.sidecar.docId, "law");
  const inStore = new Map((stored ? readZip(stored) : []).map((file) => [file.name, file.data]));
  const files = [];
  for (const part of entry.sidecar.files) {
    const path = join(dirname(entry.sidecarPath), part.file);
    files.push({ file: part.file, data: await partBytes(path, part, inStore.get(part.file)) });
  }
  return { files, zip: writeZip(files.map(({ file, data }) => ({ name: file, data }))) };
}

async function partBytes(
  path: string,
  part: LawSourceFile,
  stored: Uint8Array | undefined,
): Promise<Uint8Array> {
  if (existsSync(path)) {
    const local = new Uint8Array(await readFile(path));
    if (sha256(local) === part.sha256) return local;
    throw new Error(
      `${part.file} does not match its sidecar sha256. Update the sidecar for a new date, or delete the file to fetch it again.`,
    );
  }
  const data = stored && sha256(stored) === part.sha256 ? stored : await downloadPart(part);
  await writeFile(path, data);
  return data;
}

async function downloadPart(part: LawSourceFile): Promise<Uint8Array> {
  console.log(`  downloading ${part.sourceUrl}`);
  const res = await fetch(part.sourceUrl, { headers: PART_FETCH_HEADERS });
  if (!res.ok) throw new Error(`download failed (${res.status}): ${part.sourceUrl}`);
  const data = new Uint8Array(await res.arrayBuffer());
  const got = sha256(data);
  if (got !== part.sha256)
    throw new Error(
      `${part.sourceUrl} served a different file (sha256 ${got.slice(0, 12)}…, sidecar ${part.sha256.slice(0, 12)}…)`,
    );
  return data;
}
