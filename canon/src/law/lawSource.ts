import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getDocumentSource } from "../db/corpusFiles";
import { fetchBytes, sha256 } from "../refdocs/fetchSource";
import { lawLibraryOfId } from "./lawLibrary";
import type { LawEntry, LawSourceFile } from "./lawSidecar";
import { readZip } from "./unzip";
import { writeZip } from "./zipWrite";

/*
 * The release zip: on disk next to the sidecar, else the copy in the law
 * file, else the sourceUrl. The sha256 is checked every time. A copy from the law file
 * or the web is written to disk, so the next sync reads it from there.
 * California's extract has no URL of its own: when it is missing,
 * missingCaExtract says how to make it.
 */
export async function ensureLawZip(entry: LawEntry): Promise<Uint8Array> {
  if (existsSync(entry.zipPath)) return fromDisk(entry);
  const stored = await getDocumentSource(entry.sidecar.docId, lawLibraryOfId(entry.sidecar.docId));
  const pinned = stored && sha256(stored) === entry.sidecar.sha256 ? stored : null;
  const zip =
    pinned ?? (entry.sidecar.format === "caml" ? missingCaExtract(entry) : await download(entry));
  await mkdir(dirname(entry.zipPath), { recursive: true });
  await writeFile(entry.zipPath, zip);
  return zip;
}

async function fromDisk(entry: LawEntry): Promise<Uint8Array> {
  const local = new Uint8Array(await readFile(entry.zipPath));
  if (sha256(local) === entry.sidecar.sha256) return local;
  if (entry.sidecar.format === "caml")
    throw new Error(
      `${entry.zipRelPath} does not match its sidecar sha256: it was cut from a newer archive. To move to it, set sha256 and releasePoint in the sidecar to what \`law extract-ca\` printed. To keep the pinned text, delete the file and run \`law fetch\`.`,
    );
  throw new Error(
    `${entry.zipRelPath} does not match its sidecar sha256. Update the sidecar for a new release point, or delete the file to fetch it again.`,
  );
}

/*
 * The Legislature's archive is a rolling file of about 1.3 GB, so the
 * sidecar pins the extract, not the archive. Without the extract on disk
 * or in ca.db, a person downloads the archive and cuts it again.
 */
function missingCaExtract({ sidecar, zipRelPath }: LawEntry): never {
  throw new Error(
    [
      `${zipRelPath} is not on disk, and ca.db has no copy with the sidecar's sha256.`,
      `  Install the prebuilt ca.db (\`npm run corpus -- law fetch --jurisdiction CA\`), or make the extract:`,
      `  1. Download ${sidecar.sourceUrl ?? "the session archive"} (about 1.3 GB) to a folder of its own.`,
      "  2. Run `npm run corpus -- law extract-ca <path of the zip>`.",
      `  The extract matches the pin only if the archive still holds the text of ${sidecar.releasePoint}; if not, the command prints the new sha256 and date for the sidecar.`,
    ].join("\n"),
  );
}

async function download({ sidecar, zipRelPath }: LawEntry): Promise<Uint8Array> {
  if (!sidecar.sourceUrl)
    throw new Error(
      `${zipRelPath} is not on disk or in its law file, and its sidecar has no sourceUrl`,
    );
  console.log(`  downloading ${sidecar.sourceUrl}`);
  const zip = await fetchBytes(sidecar.sourceUrl);
  const got = sha256(zip);
  if (got !== sidecar.sha256)
    throw new Error(
      `${sidecar.sourceUrl} served a different file (sha256 ${got.slice(0, 12)}…, sidecar ${sidecar.sha256.slice(0, 12)}…)`,
    );
  return zip;
}

/** The parts of a document published in several files, in sidecar order, and the zip the law file stores. */
export interface LawParts {
  files: Array<{ file: string; data: Uint8Array }>;
  zip: Uint8Array;
}

// eCFR answers automated clients; a plain name, nothing that names the person or project.
const PART_FETCH_HEADERS = { "user-agent": "research-client" };

/*
 * Each part: on disk next to the sidecar, else in the zip the law file stores,
 * else its sourceUrl. Each one's sha256 is checked; a part from the law file or
 * the web is written to disk.
 */
export async function ensureLawParts(entry: LawEntry): Promise<LawParts> {
  const stored = await getDocumentSource(entry.sidecar.docId, lawLibraryOfId(entry.sidecar.docId));
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
