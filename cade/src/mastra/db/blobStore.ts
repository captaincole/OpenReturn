import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * No storage-layer ACL: callers must check filing membership first.
 * Set DOCUMENTS_PATH: the module-relative default resolves differently in Mastra's bundle.
 */

const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); // …/src/mastra/db
const DEFAULT_ROOT = resolve(MODULE_DIR, "../../../.data/documents");

export function documentsRoot(): string {
  return process.env.DOCUMENTS_PATH ? resolve(process.env.DOCUMENTS_PATH) : DEFAULT_ROOT;
}

/* A `..` segment must never escape the documents root. */
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

export async function deleteFilingBlobs(filingId: string): Promise<void> {
  await rm(safeJoin(filingId), { recursive: true, force: true });
}
