import { authHeaders } from "@/lib/auth";
import { agentUrl } from "@/lib/agentBase";

/*
 * Browser-side client for the agent's /app routes. Every call goes
 * through the same-origin /api/agent proxy (lib/agentBase.ts). fetchState
 * runs the case engine on the agent side. resetSession wipes the user's
 * rows and deletes the Mastra threads on the agent side.
 *
 * Activity polling lives in lib/activity.ts (the /api/activity Route
 * Handler), not here.
 */

export type PlanItemStatus = "todo" | "doing" | "done";

export interface PlanItem {
  id: string;
  title: string;
  status: PlanItemStatus;
  note?: string;
}

/*
 * Per-form summary. It mirrors the agent-side EvaluatedFormSummary in
 * apps/agent/src/mastra/tools/caseState.ts. Keep the two in sync by hand
 * until the apps share a types package.
 */
export interface FormSummary {
  formId: string;
  jurisdiction: string;
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
  money: {
    totalWages: number;
    federalAgi: number;
    federalTaxableIncome: number;
    federalTax: number;
    federalWithholding: number;
    federalRefund: number;
    federalOwed: number;
    stateTax: number;
    stateWithholding: number;
    stateRefund: number;
    stateOwed: number;
  };
  documents: {
    form1040Url: string | null;
    form540Url: string | null;
    sidecarUrl: string | null;
  };
}

/**
 * Coarse progress signal, rendered on the return home page: the fraction
 * of forms whose must-file question is decided AND, if filing, whose
 * non-unsupported fields have all resolved. With only 1040 + 540 in the
 * catalog the granularity is 0% / 50% / 100%. That is fine. The UX
 * intent is "are we close to hand-off".
 */
export function computeOverallPct(forms: FormSummary[]): number {
  if (forms.length === 0) return 0;
  const computed = forms.filter(
    (f) => f.mustFile.ok && (f.mustFile.value === false || f.blockedFieldCount === 0),
  ).length;
  return Math.round((computed / forms.length) * 100);
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
