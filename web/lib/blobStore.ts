import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

/*
 * SERVER-ONLY. Mirrors cade/src/mastra/db/blobStore.ts (same layout). No
 * ACL here: callers must run the serverDb membership check first.
 */

const DEFAULT_ROOT = resolve(process.cwd(), "../cade/.data/documents");

export function documentsRoot(): string {
  return process.env.DOCUMENTS_PATH ? resolve(process.env.DOCUMENTS_PATH) : DEFAULT_ROOT;
}

/* Paths come from our own rows, but a `..` segment must never escape the root. */
function safeJoin(storagePath: string): string {
  const root = documentsRoot();
  const full = resolve(join(root, storagePath));
  if (!full.startsWith(root + sep)) {
    throw new Error(`invalid storage path: ${storagePath}`);
  }
  return full;
}

export async function writeBlob(storagePath: string, bytes: Buffer | Uint8Array): Promise<void> {
  const full = safeJoin(storagePath);
  // Owner-only: these are tax documents.
  await mkdir(dirname(full), { recursive: true, mode: 0o700 });
  await writeFile(full, bytes, { mode: 0o600 });
}

export async function readBlob(storagePath: string): Promise<Buffer> {
  return readFile(safeJoin(storagePath));
}

export async function deleteBlob(storagePath: string): Promise<void> {
  await unlink(safeJoin(storagePath)).catch(() => {});
}
