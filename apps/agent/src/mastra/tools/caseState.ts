import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { EngineFiling, EvaluatedScenario } from "../../engine";
import type { BaseFormField, EngineDerivation, EvaluatedForm } from "../../engine/types";
import type { Scope } from "../db/appDb";
import { resolveOwnerFilingForYear } from "../db/filings";
import { loadAndEvaluateScenario } from "../loadScenario";
import { requireUserContext } from "./userContext";

/*
 * Live case state for Luca. Runs the form engine against the current fact
 * and decision state and returns:
 *   - summaries for Form 1040 and CA 540 (mustFile result, line count,
 *     blockers)
 *   - aggregated pending decisions (unique decisionKeys any form is blocked on)
 *   - convenience money fields pulled from specific Form 1040 / CA 540 lines
 *   - the most recent AI decisions for activity-feed display
 *
 * Luca calls this at the start of every turn to learn:
 *   - which forms are required, computed, or blocked
 *   - which scope decisions or facts are still missing (= what to ask next)
 *   - the current refund/owed picture, when computed
 */

type EvaluatedFormSummary = {
  formId: string;
  jurisdiction: string;
  title: string;
  mustFile:
    | { ok: true; value: boolean; rationale: string }
    | { ok: false; reason: string; missingDecisionKey: string | null };
  /**
   * Engine-derivation provenance for the must-file determination. Lets the
   * UI / sidecar show WHY a form is filed even when no AI decision was
   * recorded (e.g. Schedule D gates on trade-fact presence).
   */
  mustFileDerivation: EngineDerivation | null;
  fieldCount: number;
  blockedFieldCount: number;
  unsupportedFieldCount: number;
  blockers: Array<{
    fieldId: string;
    reason: string;
    missingDecisionKey: string | null;
    missingFactKeys: string[] | null;
  }>;
};

/*
 * Exported so server routes (appState.ts) can run the same computation
 * outside the Mastra tool surface. Thin wrapper over the engine's
 * evaluateScenario. Adds the summary, money, and pendingFacts derivations
 * on top of the raw engine output.
 */
export async function buildCaseState(
  userId: string,
  year: number,
  authEmail: string | null = null,
) {
  const filingRow = await resolveOwnerFilingForYear(userId, year);
  const filing: EngineFiling = { id: filingRow.id, taxYear: filingRow.taxYear };
  const scope: Scope = { userId, filingId: filingRow.id };
  return buildCaseStateForScenario(await loadAndEvaluateScenario(scope, filing, authEmail));
}

/*
 * Variant that takes a filing identity directly, for callers that are not
 * the filing owner (the owner resolver would throw for them). The caller
 * must verify read access (filing_members membership) BEFORE it invokes
 * this; the function trusts its inputs. No in-repo callers today — the CPA
 * review route that used it was removed.
 */
export async function buildCaseStateForFiling(
  scope: Scope,
  taxYear: number,
  authEmail: string | null = null,
) {
  const filing: EngineFiling = { id: scope.filingId, taxYear };
  return buildCaseStateForScenario(await loadAndEvaluateScenario(scope, filing, authEmail));
}

/*
 * Aggregate unique pending decisions and facts across all blockers,
 * including mustFile blockers. Luca asks the user about these.
 */
function collectPending(summaries: EvaluatedFormSummary[]): {
  pendingDecisions: Set<string>;
  pendingFacts: Set<string>;
} {
  const pendingDecisions = new Set<string>();
  const pendingFacts = new Set<string>();
  for (const s of summaries) {
    if (!s.mustFile.ok && s.mustFile.missingDecisionKey) {
      pendingDecisions.add(s.mustFile.missingDecisionKey);
    }
    for (const b of s.blockers) {
      if (b.missingDecisionKey) pendingDecisions.add(b.missingDecisionKey);
      for (const f of b.missingFactKeys ?? []) pendingFacts.add(f);
    }
  }
  return { pendingDecisions, pendingFacts };
}

/*
 * Identity gaps surface as pendingFacts. We check the RESOLVED filingInfo
 * slot, not raw fact presence. A fact with the right key but the wrong
 * value shape (e.g. identity.phone written as an object) would pass a
 * raw-presence gate even though the resolver cannot read it. With
 * filingInfo, pendingFacts reflects exactly what the engine consumes.
 * identity.email is intentionally NOT in this list — it is a courtesy
 * field that Luca auto-fills from authEmail at doc-generation time.
 */
function addPendingIdentityFacts(
  filingInfo: EvaluatedScenario["filingInfo"],
  pendingFacts: Set<string>,
): void {
  const requiredSlots: Array<[string, unknown]> = [
    ["identity.name.first", filingInfo.taxpayerFirstName],
    ["identity.name.last", filingInfo.taxpayerLastName],
    ["identity.ssn", filingInfo.taxpayerSSN],
    ["identity.dob", filingInfo.taxpayerDateOfBirth],
    ["identity.address.street", filingInfo.homeAddressLine1],
    ["identity.address.city", filingInfo.homeAddressCity],
    ["identity.address.state", filingInfo.homeAddressState],
    ["identity.address.zip", filingInfo.homeAddressZip],
    ["identity.occupation", filingInfo.taxpayerOccupation],
    ["identity.phone", filingInfo.taxpayerPhone],
  ];
  for (const [key, value] of requiredSlots) {
    if (!value) pendingFacts.add(key);
  }
}

/* Money convenience fields — federal from 1040, state from 540. */
function extractMoney(
  form1040: EvaluatedForm<BaseFormField>,
  form540: EvaluatedForm<BaseFormField>,
) {
  return {
    totalWages: numericField(form1040.fields, "form-1040.line.1z") ?? 0,
    federalAgi: numericField(form1040.fields, "form-1040.line.11") ?? 0,
    federalTaxableIncome: numericField(form1040.fields, "form-1040.line.15") ?? 0,
    federalTax: numericField(form1040.fields, "form-1040.line.24") ?? 0,
    federalWithholding: numericField(form1040.fields, "form-1040.line.25a") ?? 0,
    federalRefund: numericField(form1040.fields, "form-1040.line.34") ?? 0,
    federalOwed: numericField(form1040.fields, "form-1040.line.37") ?? 0,
    stateTax: numericField(form540.fields, "form-540.line.64_total_tax") ?? 0,
    stateWithholding: numericField(form540.fields, "form-540.line.71_ca_income_tax_withheld") ?? 0,
    stateRefund: numericField(form540.fields, "form-540.line.115_refund_or_no_amount_due") ?? 0,
    stateOwed: numericField(form540.fields, "form-540.line.111_amount_you_owe") ?? 0,
  };
}

export function buildCaseStateForScenario(scenario: EvaluatedScenario) {
  const { forms, facts, decisions, filingInfo, authEmail } = scenario;
  const form1040 = forms.get("form-1040")!;
  const form540 = forms.get("form-540")!;

  const summaries: EvaluatedFormSummary[] = [summarizeForm(form1040), summarizeForm(form540)];

  const { pendingDecisions, pendingFacts } = collectPending(summaries);
  addPendingIdentityFacts(filingInfo, pendingFacts);

  return {
    summaries,
    pendingDecisions: Array.from(pendingDecisions).sort(),
    pendingFacts: Array.from(pendingFacts).sort(),
    money: extractMoney(form1040, form540),
    factCount: facts.length,
    decisionRows: decisions,
    authEmail,
    /*
     * The resolved filing info. The web app reads identity bits from it
     * (e.g. taxpayer first name for the header greeting) without another
     * DB query.
     */
    filingInfo,
    /*
     * Raw evaluated forms, for downstream rollups like the Filing Status
     * panel that need every field, not just blockers.
     */
    evaluatedForms: [form1040, form540],
  };
}

function summarizeForm(form: EvaluatedForm<BaseFormField>): EvaluatedFormSummary {
  /*
   * Unsupported fields are engine gaps, not user-input gaps. They do not
   * count as blockers and do not aggregate into pending questions.
   */
  const blockers = form.fields
    .filter((l) => !l.result.ok && !l.result.unsupported)
    .map((l) => {
      const r = l.result as Extract<typeof l.result, { ok: false }>;
      return {
        fieldId: l.fieldId,
        reason: r.reason,
        missingDecisionKey: r.missingDecisionKey ?? null,
        missingFactKeys: r.missingFactKeys ?? null,
      };
    });
  const unsupportedFieldCount = form.fields.filter(
    (l) => !l.result.ok && l.result.unsupported,
  ).length;
  return {
    formId: form.formId,
    jurisdiction: form.jurisdiction,
    title: form.title,
    mustFile: form.mustFile.ok
      ? { ok: true, value: form.mustFile.value, rationale: form.mustFile.rationale }
      : {
          ok: false,
          reason: form.mustFile.reason,
          missingDecisionKey: form.mustFile.missingDecisionKey ?? null,
        },
    mustFileDerivation: form.mustFileDerivation ?? null,
    fieldCount: form.fields.length,
    blockedFieldCount: blockers.length,
    unsupportedFieldCount,
    blockers,
  };
}

/*
 * Look up a numeric field by its fieldId. Fields are heterogeneous (text,
 * numeric, single_select), so we filter on result type.
 */
function numericField(fields: readonly BaseFormField[], fieldId: string): number | null {
  const field = fields.find((f) => f.fieldId === fieldId);
  if (!field || !field.result.ok) return null;
  const v = field.result.value;
  return typeof v === "number" ? v : null;
}

export const getCaseState = createTool({
  id: "get-case-state",
  description:
    "Returns live case state: per-form summaries (must-file + line count + blockers), aggregated pending decisions and missing facts across all forms, and money convenience fields (wages, AGI, tax, withholding, refund/owed). Call at the start of every turn to know what's required, what's blocked, and what to ask next. The user is identified automatically — pass only the tax year.",
  inputSchema: z.object({
    year: z.number().int().describe("Tax year (e.g. 2025)"),
  }),
  outputSchema: z.object({
    forms: z.array(z.any()),
    pendingDecisions: z.array(z.string()),
    pendingFacts: z.array(z.string()),
    money: z.object({
      totalWages: z.number(),
      federalAgi: z.number(),
      federalTaxableIncome: z.number(),
      federalTax: z.number(),
      federalWithholding: z.number(),
      federalRefund: z.number(),
      federalOwed: z.number(),
      stateTax: z.number(),
      stateWithholding: z.number(),
      stateRefund: z.number(),
      stateOwed: z.number(),
    }),
    factCount: z.number(),
    /**
     * Account email. Luca records it as identity.email at doc-gen time
     * after he confirms it with the user.
     */
    authEmail: z.string().nullable(),
    aiDecisions: z.array(
      z.object({
        id: z.string(),
        decisionKey: z.string(),
        decision: z.any(),
        rationale: z.string(),
        supportingFactKeys: z.array(z.string()),
        confidence: z.string(),
        dissentingConsiderations: z.string().nullable(),
        authorityCitations: z.any().nullable(),
        createdAt: z.string(),
      }),
    ),
  }),
  execute: async (_input, context) => {
    const { scope, filingId, taxYear, authEmail: jwtEmail } = await requireUserContext(context);
    /*
     * requireUserContext already resolved the active filing. Skip the extra
     * resolveOwnerFilingForYear call that buildCaseState would make.
     */
    const scenario = await loadAndEvaluateScenario(scope, { id: filingId, taxYear }, jwtEmail);
    const { summaries, pendingDecisions, pendingFacts, money, factCount, decisionRows, authEmail } =
      buildCaseStateForScenario(scenario);

    return {
      forms: summaries,
      pendingDecisions,
      pendingFacts,
      money,
      factCount,
      authEmail,
      aiDecisions: decisionRows.map((d) => ({
        id: d.id,
        decisionKey: d.decisionKey,
        decision: d.decision,
        rationale: d.rationale,
        supportingFactKeys: d.supportingFactKeys,
        confidence: d.confidence,
        dissentingConsiderations: d.dissentingConsiderations,
        authorityCitations: d.authorityCitations,
        createdAt: d.createdAt,
      })),
    };
  },
});
