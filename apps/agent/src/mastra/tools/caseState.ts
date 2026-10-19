import { createTool } from "@mastra/core/tools";
import type { BaseFormField, EngineDerivation, EvaluatedForm } from "@summa/engine";
import { pendingInputs, type EngineFiling, type EvaluatedScenario } from "@summa/engine";
import { z } from "zod";
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
  /** Required inputs this form still needs (fact or decision keys). */
  missingInputs: string[];
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
 * Money convenience fields — federal from 1040, state from 540. A line is
 * null when it is blank on the form (for example "amount you owe" on a
 * refund). Never 0 as a stand-in: a real $0 must stay distinct from blank.
 */
function extractMoney(
  form1040: EvaluatedForm<BaseFormField>,
  form540: EvaluatedForm<BaseFormField>,
) {
  return {
    totalWages: numericField(form1040.fields, "form-1040.line.1z"),
    federalAgi: numericField(form1040.fields, "form-1040.line.11a"),
    federalTaxableIncome: numericField(form1040.fields, "form-1040.line.15"),
    federalTax: numericField(form1040.fields, "form-1040.line.24"),
    federalWithholding: numericField(form1040.fields, "form-1040.line.25a"),
    federalRefund: numericField(form1040.fields, "form-1040.line.34"),
    federalOwed: numericField(form1040.fields, "form-1040.line.37"),
    stateTax: numericField(form540.fields, "form-540.line.64_total_tax"),
    stateWithholding: numericField(form540.fields, "form-540.line.71_ca_income_tax_withheld"),
    stateRefund: numericField(form540.fields, "form-540.line.115_refund_or_no_amount_due"),
    stateOwed: numericField(form540.fields, "form-540.line.111_amount_you_owe"),
  };
}

export function buildCaseStateForScenario(scenario: EvaluatedScenario) {
  const { forms, facts, decisions, filingInfo, authEmail } = scenario;
  const form1040 = forms.get("form-1040")!;
  const form540 = forms.get("form-540")!;

  const summaries: EvaluatedFormSummary[] = [summarizeForm(form1040), summarizeForm(form540)];

  const { pendingDecisions, pendingFacts } = pendingInputs(scenario);

  return {
    summaries,
    pendingDecisions,
    pendingFacts,
    /*
     * Null while anything is pending. A form still computes with a missing
     * input and shows a wrong but plausible number (no filing status → zero
     * tax), so nothing here is final until both lists are empty.
     */
    money:
      pendingDecisions.length === 0 && pendingFacts.length === 0
        ? extractMoney(form1040, form540)
        : null,
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
    missingInputs: form.missingInputs,
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

/* A money line, or null when the line is blank on the form. */
const moneyLine = z
  .number()
  .nullable()
  .describe("null = blank on the form. Never read null as $0.");

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
    money: z
      .object({
        totalWages: moneyLine,
        federalAgi: moneyLine,
        federalTaxableIncome: moneyLine,
        federalTax: moneyLine,
        federalWithholding: moneyLine,
        federalRefund: moneyLine,
        federalOwed: moneyLine,
        stateTax: moneyLine,
        stateWithholding: moneyLine,
        stateRefund: moneyLine,
        stateOwed: moneyLine,
      })
      .nullable()
      .describe(
        "null while pendingDecisions or pendingFacts has entries: the values are not final.",
      ),
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
