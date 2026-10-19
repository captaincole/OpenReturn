/*
 * Support check: does the engine cover this return at all? It runs
 * before the comparison. A return that uses inputs or forms the engine
 * does not model will differ for that reason alone, and that is not a
 * rounding or rule bug.
 *
 * Rounding styles (decisions.rounding.*) are not decisions: they come
 * from Scenario.preparer.rounding, so one in decisions.ts is flagged.
 *
 * Four kinds of issue:
 *   - unknown_fact / unknown_decision: a key the engine never reads.
 *     Usually a typo in facts.ts or decisions.ts; fix the input.
 *   - out_of_scope: a supported key with an answer the engine does not
 *     model (part-year resident, foreign trust, …).
 *   - form_not_modeled: the filed return includes a form the engine
 *     does not compute.
 *
 * Fact keys carry payer and account names, so issues print a masked key
 * (account.<name>.k1), never the key itself.
 */

import {
  HOME_ENERGY_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  HSA_COVERAGE_KEYS,
  PRIOR_YEAR_KEYS,
  SPOUSE_KEYS,
  isDividendFact,
  isEnergyInvoiceFact,
  isHouseholdEmployeeFact,
  isHsaDistributionFact,
  isInterestFact,
  isMiscIncomeFact,
  isReportedBasisFact,
  isRetirementDistributionFact,
  isSocialSecurityFact,
  isTradeFact,
  isW2Fact,
} from "../../src/engine/facts/index.js";
import type { TaxFactRow } from "../../src/mastra/db/taxFacts.js";
import type { Scenario } from "../../tests/types.js";

export interface SupportIssue {
  kind: "unknown_fact" | "unknown_decision" | "out_of_scope" | "form_not_modeled";
  subject: string;
  detail: string;
}

const DOCUMENT_FACTS = [
  isW2Fact,
  isInterestFact,
  isDividendFact,
  isMiscIncomeFact,
  isTradeFact,
  isReportedBasisFact,
  isRetirementDistributionFact,
  isHsaDistributionFact,
  isSocialSecurityFact,
  isHouseholdEmployeeFact,
  isEnergyInvoiceFact,
];

/*
 * Single-value facts the resolvers read (filingInfoResolvers.ts,
 * resolverInputs.ts). support.test.ts fails when a resolver reads a key
 * that is missing here.
 */
export const SIMPLE_FACT_KEYS = new Set<string>([
  ...Object.values(HSA_COVERAGE_KEYS),
  ...Object.values(PRIOR_YEAR_KEYS),
  ...Object.values(HOUSEHOLD_EMPLOYMENT_KEYS),
  ...Object.values(HOME_ENERGY_KEYS),
  SPOUSE_KEYS.livedApartAllYear,
  SPOUSE_KEYS.itemizesSeparately,
  "prior_year.ca_agi",
  "medical.expenses_total",
  "mortgage.interest_form_1098",
  "mortgage.interest_not_form_1098",
  "mortgage.points_not_form_1098",
  "state_local_tax.estimated_payments",
  "state_local_tax.personal_property",
  "state_local_tax.real_estate",
  "charitable.cash",
  "charitable.noncash",
  "charitable.carryover",
  "investment_income.investment_interest_expense",
  "health_coverage.full_year_mec",
  "use_tax.owed_amount",
  "dependents.more_than_four_dependents",
]);

const DECISION_KEYS = new Set<string>([
  "decisions.itemize_vs_standard",
  "decisions.itemized.elect_general_sales_tax",
  "decisions.refund.refund_full_overpayment_ca",
  "decisions.refund.refund_full_overpayment_federal",
  "decisions.scope.ca_residency",
  "decisions.scope.filing_status",
  "decisions.scope.has_digital_assets",
  "decisions.scope.has_foreign_financial_account",
  "decisions.scope.has_foreign_trust",
  "decisions.scope.has_reportable_sales",
  "decisions.scope.mailing_same_as_principal_residence",
  "decisions.scope.main_home_us_over_half_year",
  "decisions.scope.use_tax_zero_reason",
]);
const DECISION_PATTERNS = [
  /^decisions\.scope\.must_file_[a-z0-9_]+$/,
  /^decisions\.trade\.[^.]+\.form_8949_box$/,
];

/* Supported keys whose answer the engine does not model. */
const OUT_OF_SCOPE: { key: string; supported: (v: unknown) => boolean; detail: string }[] = [
  {
    key: "decisions.scope.filing_status",
    supported: (v) => v === "single" || v === "married_filing_separately",
    detail: "Only single filers are tested (married filing separately: one unverified scenario).",
  },
  {
    key: "decisions.scope.ca_residency",
    supported: (v) => v === "full_year",
    detail: "Part-year and nonresident California returns (540NR) are not modeled.",
  },
  {
    key: "decisions.scope.has_foreign_financial_account",
    supported: (v) => v !== true,
    detail: "Foreign accounts: FBAR and Form 8938 are not modeled.",
  },
  {
    key: "decisions.scope.has_foreign_trust",
    supported: (v) => v !== true,
    detail: "Foreign trusts: Form 3520 is not modeled.",
  },
];

/** account.<name>.k1 — never print a payer or account name. */
export function maskKey(key: string): string {
  return key
    .replace(/^(account|employer|payer)\.[^.]+/, "$1.<name>")
    .replace(/\.trades\.[^.]+/, ".trades.<id>")
    .replace(/^decisions\.trade\.[^.]+/, "decisions.trade.<id>");
}

function isKnownFact(f: TaxFactRow): boolean {
  if (f.key.startsWith("identity.")) return true;
  return SIMPLE_FACT_KEYS.has(f.key) || DOCUMENT_FACTS.some((is) => is(f));
}

function isKnownDecision(key: string): boolean {
  return DECISION_KEYS.has(key) || DECISION_PATTERNS.some((re) => re.test(key));
}

/** `modeledForms`: form ids the engine computes (registered with bindings). */
export function checkSupport(s: Scenario, modeledForms: Set<string>): SupportIssue[] {
  const issues: SupportIssue[] = [];
  const unknownFacts = new Set(s.facts.filter((f) => !isKnownFact(f)).map((f) => maskKey(f.key)));
  for (const key of unknownFacts) {
    issues.push({
      kind: "unknown_fact",
      subject: key,
      detail: "The engine does not read this fact.",
    });
  }
  for (const d of s.decisions) {
    if (!isKnownDecision(d.decisionKey)) {
      issues.push({
        kind: "unknown_decision",
        subject: maskKey(d.decisionKey),
        detail: "The engine does not read this decision.",
      });
    }
    const rule = OUT_OF_SCOPE.find((r) => r.key === d.decisionKey);
    if (rule && !rule.supported(d.decision)) {
      issues.push({ kind: "out_of_scope", subject: d.decisionKey, detail: rule.detail });
    }
  }
  for (const f of s.forms) {
    const filled = Object.keys(f.expected.engineFields).length;
    if (filled > 0 && !modeledForms.has(f.formId)) {
      issues.push({
        kind: "form_not_modeled",
        subject: f.formId,
        detail: `The return fills ${filled} line(s) on it.`,
      });
    }
  }
  return issues;
}
