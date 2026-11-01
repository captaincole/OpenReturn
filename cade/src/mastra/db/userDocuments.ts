import type { InValue, Row } from "@libsql/client";
import {
  asJson,
  asNumOrNull,
  asStr,
  asStrOrNull,
  ensureAppSchema,
  getAppDb,
  nowIso,
  type Scope,
} from "./appDb";
import { writeBlob } from "./blobStore";

/*
 * Callers must verify filing access (requireUserContext) first: there is no storage-layer ACL.
 * Each generate run writes new files, so old chat links keep the version they were made from.
 */

export type Category = "drafts" | "finals" | "uploads";

export interface UserDocumentRow {
  id: string;
  userId: string;
  category: Category;
  scenario: string | null;
  filename: string;
  storagePath: string;
  sizeBytes: number | null;
  mimeType: string | null;
  expiresAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

function rowToDocument(row: Row): UserDocumentRow {
  return {
    id: asStr(row.id),
    userId: asStr(row.user_id),
    category: asStr(row.category) as Category,
    scenario: asStrOrNull(row.scenario),
    filename: asStr(row.filename),
    storagePath: asStr(row.storage_path),
    sizeBytes: asNumOrNull(row.size_bytes),
    mimeType: asStrOrNull(row.mime_type),
    expiresAt: asStrOrNull(row.expires_at),
    createdAt: asStr(row.created_at),
    metadata: asJson(row.metadata) as Record<string, unknown> | null,
  };
}

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(): string {
  const time = Date.now();
  let timeStr = "";
  let remaining = time;
  for (let i = 9; i >= 0; i--) {
    timeStr = ULID_ALPHABET[remaining % 32] + timeStr;
    remaining = Math.floor(remaining / 32);
  }
  let randStr = "";
  for (let i = 0; i < 16; i++) {
    randStr += ULID_ALPHABET[Math.floor(Math.random() * 32)];
  }
  return timeStr + randStr;
}

function buildStoragePath(
  filingId: string,
  category: Category,
  baseSlug: string,
  extension: string,
): string {
  const safeExt = extension.startsWith(".") ? extension.slice(1) : extension;
  return `${filingId}/${category}/${baseSlug}-${ulid()}.${safeExt}`;
}

export interface CreateDocumentInput {
  userId: string;
  filingId: string;
  category: Category;
  scenario?: string | null;
  filename: string;
  storageSlug: string;
  extension: string;
  bytes: Buffer | Uint8Array;
  mimeType: string;
  expiresInDays?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateDocumentResult {
  id: string;
  storagePath: string;
}

/*
 * Bytes BEFORE the row: a failed insert leaves a cheap orphan file. The reverse order
 * leaves a row that points at missing bytes, a broken download link.
 */
export async function createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult> {
  await ensureAppSchema();
  const storagePath = buildStoragePath(
    input.filingId,
    input.category,
    input.storageSlug,
    input.extension,
  );

  await writeBlob(storagePath, input.bytes);

  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
    : null;

  const id = crypto.randomUUID();
  await getAppDb().execute({
    sql: `INSERT INTO user_documents
            (id, user_id, filing_id, category, scenario, filename, storage_path,
             size_bytes, mime_type, expires_at, created_at, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.userId,
      input.filingId,
      input.category,
      input.scenario ?? null,
      input.filename,
      storagePath,
      input.bytes.byteLength,
      input.mimeType,
      expiresAt,
      nowIso(),
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  });

  return { id, storagePath };
}

export interface ListDocumentsOpts {
  category?: Category;
  scenario?: string | null;
  formId?: string;
  taxYear?: number;
  limit?: number;
}

export async function listDocuments(
  scope: Scope,
  opts: ListDocumentsOpts = {},
): Promise<UserDocumentRow[]> {
  await ensureAppSchema();
  const conds: string[] = ["filing_id = ?"];
  const args: InValue[] = [scope.filingId];
  if (opts.category) {
    conds.push("category = ?");
    args.push(opts.category);
  }
  if (opts.scenario !== undefined) {
    if (opts.scenario === null) conds.push("scenario IS NULL");
    else {
      conds.push("scenario = ?");
      args.push(opts.scenario);
    }
  }
  if (opts.formId) {
    conds.push(`json_extract(metadata, '$.formId') = ?`);
    args.push(opts.formId);
  }
  if (opts.taxYear !== undefined) {
    /* metadata.taxYear is a JSON number: compare a number, not a string. */
    conds.push(`json_extract(metadata, '$.taxYear') = ?`);
    args.push(opts.taxYear);
  }
  args.push(Math.min(opts.limit ?? 100, 500));
  const res = await getAppDb().execute({
    sql: `SELECT * FROM user_documents WHERE ${conds.join(" AND ")}
          ORDER BY created_at DESC LIMIT ?`,
    args,
  });
  return res.rows.map(rowToDocument);
}
