import { evaluateScenario } from "@openreturn/engine";
import {
  ALL_JURISDICTIONS,
  inTableOrder,
  jurisdictionOfEngineForm,
  type Jurisdiction,
} from "../../canon/jurisdictions";

/*
 * The jurisdictions a decision's review searches. Code decides from the
 * decision key; the model never names a jurisdiction. In order:
 *
 * 1. A key in DECISION_JURISDICTIONS: the list there. Each row says which forms read the key.
 * 2. A key that starts with a prefix in PREFIX_JURISDICTIONS.
 * 3. A form's must-file key (decisions.scope.must_file_<form>): the jurisdiction of that
 *    form. The engine says which form each key belongs to (FilingInfo.mustFile) and the
 *    jurisdiction of each form (EvaluatedForm.jurisdiction), so a new form needs no row.
 * 4. Any other key: every jurisdiction. Cade's model may record a key that no form reads.
 *
 * tests/unit/mastra/workflows/reviewJurisdictions.test.ts finds every decision key written in
 * Cade's and the engine's source, and fails when one gets the default with no row here.
 */

const FEDERAL: readonly Jurisdiction[] = ["federal"];
const CA: readonly Jurisdiction[] = ["CA"];
const ALL = ALL_JURISDICTIONS;

export const DECISION_JURISDICTIONS: Readonly<Record<string, readonly Jurisdiction[]>> = {
  // Form 1040 and Form 540 both read the filing status.
  "decisions.scope.filing_status": ALL,
  // The example key in record-ai-decision's description. No form reads it.
  "decisions.filing_status_eligibility": ALL,
  // Residency is a California question: Forms 540, 3514 and 3800 (CA) read it.
  "decisions.scope.ca_residency": CA,
  "decisions.ca_residency": CA,
  /* Federal forms (Schedule A, 6251, 8379, the QBI forms) and California forms (Schedule P, Form 3800) read it. */
  "decisions.itemize_vs_standard": ALL,
  /* A federal form that also files when only California itemizes: California starts from it (deductions/closing.ts). */
  "decisions.scope.must_file_schedule_a": ALL,
  // Read only by federal Schedule A (line 5a).
  "decisions.itemized.elect_general_sales_tax": FEDERAL,
  // Read only by federal Schedule B.
  "decisions.rounding.schedule_b": FEDERAL,
  "decisions.scope.has_foreign_financial_account": FEDERAL,
  "decisions.scope.has_foreign_trust": FEDERAL,
  // The digital asset question on Form 1040.
  "decisions.scope.has_digital_assets": FEDERAL,
  // Files Form 8949 and Schedule D when no trade is recorded yet.
  "decisions.scope.has_reportable_sales": FEDERAL,
  "decisions.refund.refund_full_overpayment_federal": FEDERAL,
  "decisions.refund.refund_full_overpayment_ca": CA,
  // Form 540 lines: the mailing address and use tax.
  "decisions.scope.mailing_same_as_principal_residence": CA,
  "decisions.scope.use_tax_zero_reason": CA,
};

export const PREFIX_JURISDICTIONS: readonly {
  prefix: string;
  jurisdictions: readonly Jurisdiction[];
}[] = [
  // The Form 8949 box of one trade (engine/src/facts/kinds/trade.ts).
  { prefix: "decisions.trade.", jurisdictions: FEDERAL },
  // An expense named in the deductions conversation can count on either return.
  { prefix: "decisions.deductions.named.", jurisdictions: ALL },
];

const mustFileByYear = new Map<number, Map<string, Jurisdiction[]>>();

/*
 * Each form's must-file key and its jurisdiction, from one evaluation with no facts
 * (every form resolves its must-file key with no input). Pure, so it runs once a year.
 * A tax year the engine cannot evaluate gets no map: every key falls to the default.
 */
export function mustFileJurisdictions(taxYear: number): Map<string, Jurisdiction[]> {
  const cached = mustFileByYear.get(taxYear);
  if (cached) return cached;
  const byKey = new Map<string, Jurisdiction[]>();
  try {
    const scenario = evaluateScenario({
      filing: { id: "decision-jurisdictions", taxYear },
      facts: [],
      decisions: [],
    });
    for (const [formId, resolution] of Object.entries(scenario.filingInfo.mustFile ?? {})) {
      const form = scenario.forms.get(formId);
      const jurisdiction = form && jurisdictionOfEngineForm(form.jurisdiction);
      // A form of a jurisdiction Cade's table lacks: every jurisdiction.
      const found = jurisdiction ? [jurisdiction] : [...ALL];
      byKey.set(
        resolution.decisionKey,
        inTableOrder([...(byKey.get(resolution.decisionKey) ?? []), ...found]),
      );
    }
  } catch {
    /* no map: the default applies */
  }
  mustFileByYear.set(taxYear, byKey);
  return byKey;
}

export type JurisdictionRule = "table" | "prefix" | "form" | "default";

/** The jurisdictions to search for a decision, and which rule gave them. */
export function decisionJurisdictions(
  decisionKey: string,
  taxYear: number,
): { jurisdictions: Jurisdiction[]; rule: JurisdictionRule } {
  const listed = DECISION_JURISDICTIONS[decisionKey];
  if (listed) return { jurisdictions: [...listed], rule: "table" };
  const prefixed = PREFIX_JURISDICTIONS.find((entry) => decisionKey.startsWith(entry.prefix));
  if (prefixed) return { jurisdictions: [...prefixed.jurisdictions], rule: "prefix" };
  const form = mustFileJurisdictions(taxYear).get(decisionKey);
  if (form) return { jurisdictions: [...form], rule: "form" };
  return { jurisdictions: [...ALL], rule: "default" };
}
