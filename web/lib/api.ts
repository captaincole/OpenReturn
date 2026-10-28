import { agentUrl } from "@/lib/agentBase";
import { authHeaders } from "@/lib/auth";

export type PlanItemStatus = "todo" | "doing" | "done";

export interface PlanItem {
  id: string;
  title: string;
  status: PlanItemStatus;
  note?: string;
}

/* Keep in sync by hand with EvaluatedFormSummary in cade/src/mastra/tools/caseState.ts. */
export interface FormSummary {
  formId: string;
  jurisdiction: string;
  displayName: string;
  title: string;
  mustFile:
    | { ok: true; value: boolean; rationale: string }
    | { ok: false; reason: string; missingDecisionKey: string | null };
  fieldCount: number;
  blockedFieldCount: number;
  unsupportedFieldCount: number;
  blockers: Array<{
    fieldId: string;
    reason: string;
    missingDecisionKey: string | null;
    missingFactKeys: string[] | null;
  }>;
}

export interface CaseState {
  taxpayerFirstName: string | null;
  authEmail: string | null;
  plan: PlanItem[];
  factCount: number;
  decisionCount: number;
  pendingDecisions: string[];
  pendingFacts: string[];
  forms: FormSummary[];
  /** null while anything is pending. A null field = the line is blank on the form. */
  money: {
    totalWages: number | null;
    federalAgi: number | null;
    federalTaxableIncome: number | null;
    federalTax: number | null;
    federalWithholding: number | null;
    federalRefund: number | null;
    federalOwed: number | null;
    stateTax: number | null;
    stateWithholding: number | null;
    stateRefund: number | null;
    stateOwed: number | null;
  } | null;
  documents: {
    form1040Url: string | null;
    form540Url: string | null;
    sidecarUrl: string | null;
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function fetchState(): Promise<CaseState> {
  const res = await fetch(agentUrl("/app/state"), { headers: await authHeaders() });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
  return res.json();
}

export async function resetSession(): Promise<void> {
  const res = await fetch(agentUrl("/app/session/reset"), {
    method: "POST",
    headers: await authHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
}

export interface CreatedFiling {
  filing: { id: string; taxYear: number; status: string };
  created: boolean;
}

export async function createFiling(taxYear: number): Promise<CreatedFiling> {
  const headers = await authHeaders();
  const res = await fetch(agentUrl("/app/filings"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ taxYear }),
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create filing failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function deleteFiling(filingId: string): Promise<void> {
  const res = await fetch(agentUrl(`/app/filings/${filingId}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Delete filing failed (${res.status}): ${text}`);
  }
}
