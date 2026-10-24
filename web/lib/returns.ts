/*
 * TaxReturn type + the thread-id convention. The filings queries that
 * lived here (listOwnerReturns / getOwnerReturnByYear) moved to
 * lib/serverDb.ts because they read the server-only libsql app DB. This
 * module stays client-safe: AppShell (a client component) imports
 * threadIdFor and the TaxReturn type.
 *
 * The URL slug stays the year string (e.g. "2025") because each user has
 * at most one filing per tax_year today. The agent's appState route also
 * keys threads and draft lookups by year. The TaxReturn carries the
 * filing UUID for callers that need it (e.g. deleteFiling in TopBar).
 *
 * `realDataAvailable` stays on the type because AppShell, ChatPane, and
 * the return workspace page still branch on it. In the query-based world every TaxReturn is real, so the
 * field is always `true`.
 */

export type ReturnState = "active" | "filed";

export interface TaxReturn {
  id: string;
  year: number;
  filingId: string;
  label: string;
  state: ReturnState;
  realDataAvailable: boolean;
  status: string;
}

/*
 * Deterministic per-user + per-return thread ID. It must match the format
 * in the agent's appState route (no shared package yet — keep in sync).
 * The key is the year, not the filing UUID, so a reset that
 * wipes-and-recreates the filing keeps a stable conversation thread.
 */
export function threadIdFor(userId: string, returnId: string): string {
  return `${userId}::${returnId}`;
}
