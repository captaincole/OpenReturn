/*
 * Requested actions: what Cade asks the taxpayer to do outside the chat. The
 * web app shows each as a card. Today there is one kind, a document to upload.
 * Each row records the conversation that made it, and the web app shows the
 * card next to that conversation only.
 */

import type { Conversation } from "../threads";
import { asStr, ensureAppSchema, getAppDb, nowIso, type Scope } from "./appDb";

/* A card the taxpayer still sees: not uploaded yet, or uploaded and not read yet. */
const WAITING = `status IN ('open','processing')`;

const UPLOAD_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export interface UploadRequest {
  conversation: Conversation;
  taxYear: number;
  documentType: string;
  title: string;
  detail: string;
}

/* One waiting card per document in a conversation: a repeat call returns that card. */
export async function requestUpload(
  scope: Scope,
  request: UploadRequest,
): Promise<{ id: string; requested: boolean }> {
  await ensureAppSchema();
  const db = getAppDb();
  const existing = await db.execute({
    sql: `SELECT id FROM requested_actions
          WHERE filing_id = ? AND user_id = ? AND conversation = ?
            AND lower(document_type) = lower(?) AND ${WAITING}
          ORDER BY created_at DESC LIMIT 1`,
    args: [scope.filingId, scope.userId, request.conversation, request.documentType],
  });
  if (existing.rows.length > 0) return { id: asStr(existing.rows[0].id), requested: false };

  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO requested_actions
            (id, user_id, filing_id, tax_year, conversation, kind, title, detail,
             document_type, accept_pattern, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'upload', ?, ?, ?, ?, 'open', ?)`,
    args: [
      id,
      scope.userId,
      scope.filingId,
      request.taxYear,
      request.conversation,
      request.title,
      request.detail,
      request.documentType,
      UPLOAD_ACCEPT,
      nowIso(),
    ],
  });
  return { id, requested: true };
}

/*
 * The document is in. Both conversations read its facts, so its waiting cards
 * close in both. Returns how many cards closed.
 */
export async function resolveUploads(scope: Scope, documentType: string): Promise<number> {
  await ensureAppSchema();
  const res = await getAppDb().execute({
    sql: `UPDATE requested_actions SET status = 'resolved', resolved_at = ?
          WHERE filing_id = ? AND user_id = ?
            AND lower(document_type) = lower(?) AND ${WAITING}`,
    args: [nowIso(), scope.filingId, scope.userId, documentType],
  });
  return res.rowsAffected;
}

/* The conversation no longer needs what it asked for. Returns how many cards closed. */
export async function dismissRequests(scope: Scope, conversation: Conversation): Promise<number> {
  await ensureAppSchema();
  const res = await getAppDb().execute({
    sql: `UPDATE requested_actions SET status = 'dismissed', resolved_at = ?
          WHERE filing_id = ? AND user_id = ? AND conversation = ? AND ${WAITING}`,
    args: [nowIso(), scope.filingId, scope.userId, conversation],
  });
  return res.rowsAffected;
}
