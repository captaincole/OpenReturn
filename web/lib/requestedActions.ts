export type RequestedActionKind = "upload" | "confirm" | "decide";
export type RequestedActionStatus = "open" | "processing" | "resolved" | "skipped" | "dismissed";

export interface RequestedAction {
  id: string;
  taxYear: number;
  kind: RequestedActionKind;
  title: string;
  detail: string | null;
  documentType: string | null;
  acceptPattern: string | null;
  status: RequestedActionStatus;
  resolvedDocumentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function fetchOpenActions(taxYear: number): Promise<RequestedAction[]> {
  const res = await fetch(`/api/requested-actions?year=${taxYear}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`requested actions: ${res.status}`);
  return (await res.json()) as RequestedAction[];
}

/* The card stays visible as "processing" until Cade dismisses it after ingest. */
export async function markActionProcessing(actionId: string, documentId: string): Promise<void> {
  const res = await fetch(`/api/requested-actions/${encodeURIComponent(actionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "processing", documentId }),
  });
  if (!res.ok) throw new Error(`mark action processing: ${res.status}`);
}

export async function skipAction(actionId: string): Promise<void> {
  const res = await fetch(`/api/requested-actions/${encodeURIComponent(actionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "skipped" }),
  });
  if (!res.ok) throw new Error(`skip action: ${res.status}`);
}
