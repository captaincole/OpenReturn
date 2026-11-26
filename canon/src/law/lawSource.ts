import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getDocumentSource } from "../db/corpusFiles";
import { fetchBytes, sha256 } from "../refdocs/fetchSource";
import type { LawEntry } from "./lawSidecar";

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
