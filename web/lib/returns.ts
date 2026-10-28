/*
 * Client-safe: AppShell imports it. The URL slug is the year: one filing
 * per user per tax year. `realDataAvailable` is always true now.
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
 * Must match the agent's appState route. Keyed by year, not filing UUID, so
 * a reset that recreates the filing keeps the same thread.
 */
export function threadIdFor(userId: string, returnId: string): string {
  return `${userId}::${returnId}`;
}
