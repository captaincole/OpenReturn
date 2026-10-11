import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

/*
 * SERVER-ONLY filesystem store for document bytes. It is the web-side
 * mirror of apps/agent/src/mastra/db/blobStore.ts: same directory, same
 * {filingId}/{category}/{slug}-{ulid}.{ext} layout, no shared package
 * yet. It replaces the Supabase Storage bucket and the interim
 * service-role client. There is no storage-layer ACL — route handlers
 * run serverDb membership checks before any call here.
 */

const DEFAULT_ROOT = resolve(process.cwd(), "../agent/.data/documents");

export function documentsRoot(): string {
  return process.env.DOCUMENTS_PATH ? resolve(process.env.DOCUMENTS_PATH) : DEFAULT_ROOT;
}

/*
 * Storage paths come from our own DB rows. Resolve defensively anyway:
 * a `..` segment must never escape the documents root.
 */
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
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function readBlob(storagePath: string): Promise<Buffer> {
  return readFile(safeJoin(storagePath));
}

/** Best-effort delete. A missing file is fine (already gone). */
export async function deleteBlob(storagePath: string): Promise<void> {
  await unlink(safeJoin(storagePath)).catch(() => {});
}
