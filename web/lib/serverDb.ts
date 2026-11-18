import type { ActivityItem } from "@/lib/activity";
import type { RequestedAction } from "@/lib/requestedActions";
import type { TaxReturn } from "@/lib/returns";
import { createClient, type Client, type Row } from "@libsql/client";
import { resolve } from "node:path";

/*
 * SERVER-ONLY. No RLS: every query scopes explicitly by userId / filingId.
 * Callers must verify the user's session (lib/localAuth.ts) before they call in.
 * The users themselves are in lib/userStore.ts.
 */

const DEFAULT_APP_DB = resolve(process.cwd(), "../cade/.data/app.db");

let cached: Client | null = null;

export function appDb(): Client {
  if (cached) return cached;
  const path = process.env.APP_DB_PATH ? resolve(process.env.APP_DB_PATH) : DEFAULT_APP_DB;
  cached = createClient({ url: `file:${path}` });
  return cached;
}

const str = (value: unknown): string => (value == null ? "" : String(value));
const strOrNull = (value: unknown): string | null => (value == null ? null : String(value));
const num = (value: unknown): number => (value == null ? 0 : Number(value));
const json = (value: unknown): unknown => (value == null ? null : JSON.parse(String(value)));

export interface FilingRow {
  id: string;
  taxYear: number;
  status: string;
}

function rowToReturn(row: Row): TaxReturn {
  const status = str(row.status);
  return {
    id: String(num(row.tax_year)),
    year: num(row.tax_year),
    filingId: str(row.id),
    label: `${num(row.tax_year)} Return`,
    state: status === "filed" ? "filed" : "active",
    realDataAvailable: true,
    status,
  };
}

export async function listOwnerReturns(userId: string): Promise<TaxReturn[]> {
  const res = await appDb().execute({
    sql: `SELECT f.id, f.tax_year, f.status
          FROM filings f JOIN filing_members m ON m.filing_id = f.id
          WHERE m.user_id = ? AND m.role = 'owner' AND m.revoked_at IS NULL
          ORDER BY f.tax_year DESC`,
    args: [userId],
  });
  return res.rows.map(rowToReturn);
}

function textOfFact(value: unknown): string | null {
  try {
    const parsed: unknown = JSON.parse(String(value));
    return typeof parsed === "string" && parsed.trim() ? parsed.trim() : null;
  } catch {
    return null;
  }
}

/* The taxpayer's first name, once Cade has recorded it on any of the user's filings. */
export async function latestTaxpayerFirstName(userId: string): Promise<string | null> {
  const res = await appDb().execute({
    sql: `SELECT fact_value FROM tax_facts
          WHERE user_id = ? AND fact_key = 'identity.name.first'
          ORDER BY created_at DESC LIMIT 1`,
    args: [userId],
  });
  return res.rows[0] ? textOfFact(res.rows[0].fact_value) : null;
}

export async function getOwnerReturnByYear(
  userId: string,
  taxYear: number,
): Promise<TaxReturn | null> {
  const res = await appDb().execute({
    sql: `SELECT f.id, f.tax_year, f.status
          FROM filings f JOIN filing_members m ON m.filing_id = f.id
          WHERE m.user_id = ? AND m.role = 'owner' AND m.revoked_at IS NULL
            AND f.tax_year = ? LIMIT 1`,
    args: [userId, taxYear],
  });
  return res.rows[0] ? rowToReturn(res.rows[0]) : null;
}

export async function getOwnerFilingForYear(userId: string, taxYear: number): Promise<FilingRow> {
  const ret = await getOwnerReturnByYear(userId, taxYear);
  if (!ret) throw new Error(`No owner filing found for tax_year=${taxYear}.`);
  return { id: ret.filingId, taxYear: ret.year, status: ret.status };
}

/** The RLS replacement: run it before any read of a filing the caller does not own outright. */
export async function hasMembership(filingId: string, userId: string): Promise<boolean> {
  const res = await appDb().execute({
    sql: `SELECT 1 FROM filing_members
          WHERE filing_id = ? AND user_id = ? AND revoked_at IS NULL LIMIT 1`,
    args: [filingId, userId],
  });
  return res.rows.length > 0;
}

export async function fetchActivityItems(
  userId: string,
  taxYear: number,
  limit = 50,
): Promise<ActivityItem[]> {
  const safeLimit = Math.min(limit, 200);
  const [facts, decisions] = await Promise.all([
    appDb().execute({
      sql: `SELECT id, created_at, fact_key, category, fact_value, source_note
            FROM tax_facts WHERE user_id = ? AND tax_year = ?
            ORDER BY created_at DESC LIMIT ?`,
      args: [userId, taxYear, safeLimit],
    }),
    appDb().execute({
      sql: `SELECT id, created_at, decision_key, decision, rationale,
                   supporting_fact_keys, confidence, verdict, verdict_reason, source_note
            FROM ai_decisions WHERE user_id = ? AND tax_year = ?
            ORDER BY created_at DESC LIMIT ?`,
      args: [userId, taxYear, safeLimit],
    }),
  ]);

  const factItems: ActivityItem[] = facts.rows.map((row) => ({
    kind: "fact" as const,
    id: str(row.id),
    createdAt: str(row.created_at),
    title: str(row.fact_key),
    category: str(row.category),
    value: json(row.fact_value),
    sourceNote: strOrNull(row.source_note),
  }));
  const decisionItems: ActivityItem[] = decisions.rows.map((row) => {
    const supporting = json(row.supporting_fact_keys);
    return {
      kind: "decision" as const,
      id: str(row.id),
      createdAt: str(row.created_at),
      title: str(row.decision_key),
      value: json(row.decision),
      sourceNote: strOrNull(row.source_note),
      rationale: strOrNull(row.rationale) ?? undefined,
      supportingFactKeys: Array.isArray(supporting) ? (supporting as string[]) : undefined,
      confidence: (strOrNull(row.confidence) as ActivityItem["confidence"]) ?? undefined,
      verdict: (strOrNull(row.verdict) as ActivityItem["verdict"]) ?? null,
      verdictReason: strOrNull(row.verdict_reason),
    };
  });

  return [...factItems, ...decisionItems]
    .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
    .slice(0, safeLimit);
}

function rowToAction(row: Row): RequestedAction {
  return {
    id: str(row.id),
    taxYear: num(row.tax_year),
    conversation: str(row.conversation) as RequestedAction["conversation"],
    kind: str(row.kind) as RequestedAction["kind"],
    title: str(row.title),
    detail: strOrNull(row.detail),
    documentType: strOrNull(row.document_type),
    acceptPattern: strOrNull(row.accept_pattern),
    status: str(row.status) as RequestedAction["status"],
    resolvedDocumentId: strOrNull(row.resolved_document_id),
    createdAt: str(row.created_at),
    resolvedAt: strOrNull(row.resolved_at),
  };
}

/* The cards one conversation shows: each request records the conversation that made it. */
export async function fetchOpenActions(
  userId: string,
  taxYear: number,
  conversation: RequestedAction["conversation"],
): Promise<RequestedAction[]> {
  const res = await appDb().execute({
    sql: `SELECT * FROM requested_actions
          WHERE user_id = ? AND tax_year = ? AND conversation = ?
            AND status IN ('open','processing')
          ORDER BY created_at DESC`,
    args: [userId, taxYear, conversation],
  });
  return res.rows.map(rowToAction);
}

export async function markActionProcessing(
  userId: string,
  actionId: string,
  documentId: string,
): Promise<void> {
  await appDb().execute({
    sql: `UPDATE requested_actions
          SET status = 'processing', resolved_document_id = ?
          WHERE id = ? AND user_id = ?`,
    args: [documentId, actionId, userId],
  });
}

export async function skipAction(userId: string, actionId: string): Promise<void> {
  await appDb().execute({
    sql: `UPDATE requested_actions
          SET status = 'skipped', resolved_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [new Date().toISOString(), actionId, userId],
  });
}

export interface DocumentLookup {
  id: string;
  filingId: string;
  storagePath: string;
  filename: string;
  mimeType: string | null;
}

export async function getDocumentById(id: string): Promise<DocumentLookup | null> {
  const res = await appDb().execute({
    sql: `SELECT id, filing_id, storage_path, filename, mime_type
          FROM user_documents WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: str(row.id),
    filingId: str(row.filing_id),
    storagePath: str(row.storage_path),
    filename: str(row.filename),
    mimeType: strOrNull(row.mime_type),
  };
}

export interface UploadListRow {
  id: string;
  filename: string;
  created_at: string;
  mime_type: string | null;
  size_bytes: number | null;
}

export async function listUploads(filingId: string): Promise<UploadListRow[]> {
  const res = await appDb().execute({
    sql: `SELECT id, filename, created_at, mime_type, size_bytes
          FROM user_documents WHERE filing_id = ? AND category = 'uploads'
          ORDER BY created_at DESC`,
    args: [filingId],
  });
  return res.rows.map((row) => ({
    id: str(row.id),
    filename: str(row.filename),
    created_at: str(row.created_at),
    mime_type: strOrNull(row.mime_type),
    size_bytes: row.size_bytes == null ? null : num(row.size_bytes),
  }));
}

export interface DraftListRow {
  id: string;
  filename: string;
  created_at: string;
  mime_type: string | null;
  size_bytes: number | null;
  metadata: Record<string, unknown> | null;
}

export async function listDrafts(filingId: string): Promise<DraftListRow[]> {
  const res = await appDb().execute({
    sql: `SELECT id, filename, created_at, mime_type, size_bytes, metadata
          FROM user_documents WHERE filing_id = ? AND category = 'drafts'
          ORDER BY created_at DESC`,
    args: [filingId],
  });
  return res.rows.map((row) => ({
    id: str(row.id),
    filename: str(row.filename),
    created_at: str(row.created_at),
    mime_type: strOrNull(row.mime_type),
    size_bytes: row.size_bytes == null ? null : num(row.size_bytes),
    metadata: json(row.metadata) as Record<string, unknown> | null,
  }));
}

export async function insertUploadedDocument(args: {
  userId: string;
  filingId: string;
  filename: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  await appDb().execute({
    sql: `INSERT INTO user_documents
            (id, user_id, filing_id, category, filename, storage_path,
             size_bytes, mime_type, created_at)
          VALUES (?, ?, ?, 'uploads', ?, ?, ?, ?, ?)`,
    args: [
      id,
      args.userId,
      args.filingId,
      args.filename,
      args.storagePath,
      args.sizeBytes,
      args.mimeType,
      new Date().toISOString(),
    ],
  });
  return id;
}
