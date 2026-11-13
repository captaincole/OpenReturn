/*
 * Rounding styles come from Scenario.preparer.rounding, so a decisions.rounding.*
 * entry in decisions.ts is flagged as unknown.
 * PRIVACY: fact keys carry payer and account names, so issues print a masked key.
 */

import {
  AMT_KEYS,
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_EITC_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  CA_PAYMENT_KEYS,
  DEPENDENT_CARE_KEYS,
  EDUCATOR_EXPENSE_KEYS,
  EIC_KEYS,
  ELDERLY_OR_DISABLED_KEYS,
  GAMBLING_KEYS,
  HEAD_OF_HOUSEHOLD_KEYS,
  HOME_ENERGY_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  HSA_COVERAGE_KEYS,
  INVESTMENT_INTEREST_KEYS,
  MORTGAGE_KEYS,
  NET_INVESTMENT_INCOME_KEYS,
  OTHER_INCOME_KEYS,
  PREMIUM_TAX_CREDIT_KEYS,
  PRIOR_YEAR_KEYS,
  RENTAL_KEYS,
  SPOUSE_KEYS,
  STUDENT_LOAN_KEYS,
  isBusinessFactKey,
  isCasualtyEventFactKey,
  isDependentCareProviderFactKey,
  isDependentCareQualifyingPersonFactKey,
  isDependentFact,
  isDisabilityBeforeMinimumRetirementAgeKey,
  isDividendFact,
  isEnergyInvoiceFact,
  isGamblingWinningsFactKey,
  isHouseholdEmployeeFact,
  isHsaDistributionFact,
  isInterestFact,
  isMarketplaceCoverageFactKey,
  isMiscIncomeFact,
  isNonemployeeCompensationFactKey,
  isPaymentTransactionsFactKey,
  isRentalFactKey,
  isReportedBasisFact,
  isRetirementDistributionFact,
  isSocialSecurityFact,
  isStatedQuantityFact,
  isStudentLoanInterestFactKey,
  isTradeFact,
  isW2Fact,
  makeTraditionalIraFactKey,
} from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows.js";
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
  isStatedQuantityFact,
  isReportedBasisFact,
  isRetirementDistributionFact,
  isHsaDistributionFact,
  isSocialSecurityFact,
  isHouseholdEmployeeFact,
  isEnergyInvoiceFact,
  isDependentFact,
  (fact: TaxFactRow) => isGamblingWinningsFactKey(fact.key),
  (fact: TaxFactRow) => isPaymentTransactionsFactKey(fact.key),
  (fact: TaxFactRow) => isNonemployeeCompensationFactKey(fact.key),
  (fact: TaxFactRow) => isBusinessFactKey(fact.key),
  (fact: TaxFactRow) => isRentalFactKey(fact.key),
  (fact: TaxFactRow) => isMarketplaceCoverageFactKey(fact.key),
  (fact: TaxFactRow) => isCasualtyEventFactKey(fact.key),
  (fact: TaxFactRow) => isDisabilityBeforeMinimumRetirementAgeKey(fact.key),
  (fact: TaxFactRow) => isDependentCareProviderFactKey(fact.key),
  (fact: TaxFactRow) => isDependentCareQualifyingPersonFactKey(fact.key),
  (fact: TaxFactRow) => isStudentLoanInterestFactKey(fact.key),
];

/* support.test.ts fails when a resolver reads a key that is missing here. */
export const SIMPLE_FACT_KEYS = new Set<string>([
  ...Object.values(HSA_COVERAGE_KEYS),
  ...Object.values(PRIOR_YEAR_KEYS),
  ...Object.values(HOUSEHOLD_EMPLOYMENT_KEYS),
  ...Object.values(HOME_ENERGY_KEYS),
  ...Object.values(INVESTMENT_INTEREST_KEYS),
  ...Object.values(AMT_KEYS),
  ...Object.values(CA_MISC_DEDUCTION_KEYS),
  ...Object.values(CAPITAL_LOSS_CARRYOVER_KEYS),
  ...Object.values(RENTAL_KEYS),
  ...Object.values(PREMIUM_TAX_CREDIT_KEYS),
  ...Object.values(NET_INVESTMENT_INCOME_KEYS),
  GAMBLING_KEYS.winningsNotOnW2G,
  GAMBLING_KEYS.losses,
  ...Object.values(EIC_KEYS),
  ...Object.values(CA_EITC_KEYS),
  ...Object.values(ELDERLY_OR_DISABLED_KEYS),
  ...Object.values(DEPENDENT_CARE_KEYS),
  ...Object.values(OTHER_INCOME_KEYS),
  ...Object.values(EDUCATOR_EXPENSE_KEYS),
  ...Object.values(CA_PAYMENT_KEYS),
  ...Object.values(HEAD_OF_HOUSEHOLD_KEYS),
  ...Object.values(STUDENT_LOAN_KEYS),
  SPOUSE_KEYS.livedApartAllYear,
  SPOUSE_KEYS.livedApartLastSixMonths,
  SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
  SPOUSE_KEYS.itemizesSeparately,
  makeTraditionalIraFactKey("taxpayer"),
  makeTraditionalIraFactKey("spouse"),
  "prior_year.ca_agi",
  "medical.expenses_total",
  ...Object.values(MORTGAGE_KEYS),
  "state_local_tax.allocable_to_investment_income",
  "state_local_tax.estimated_payments",
  "state_local_tax.general_sales_tax",
  "state_local_tax.personal_property",
  "state_local_tax.real_estate",
  "charitable.cash",
  "charitable.noncash",
  "charitable.carryover",
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

const OUT_OF_SCOPE: { key: string; supported: (v: unknown) => boolean; detail: string }[] = [
  {
    key: "decisions.scope.filing_status",
    supported: (value) =>
      value === "single" ||
      value === "married_filing_separately" ||
      value === "married_filing_jointly" ||
      value === "head_of_household" ||
      value === "qualifying_surviving_spouse",
    detail:
      "Filing statuses other than single, married filing jointly or separately, head of household and qualifying surviving spouse are not modeled.",
  },
  {
    key: "decisions.scope.ca_residency",
    supported: (value) => value === "full_year",
    detail: "Part-year and nonresident California returns (540NR) are not modeled.",
  },
  {
    key: "decisions.scope.has_foreign_financial_account",
    supported: (value) => value !== true,
    detail: "Foreign accounts: FBAR and Form 8938 are not modeled.",
  },
  {
    key: "decisions.scope.has_foreign_trust",
    supported: (value) => value !== true,
    detail: "Foreign trusts: Form 3520 is not modeled.",
  },
];

export function maskKey(key: string): string {
  return key
    .replace(/^(account|employer|payer)\.[^.]+/, "$1.<name>")
    .replace(/\.trades\.[^.]+/, ".trades.<id>")
    .replace(/^decisions\.trade\.[^.]+/, "decisions.trade.<id>");
}

function isKnownFact(fact: TaxFactRow): boolean {
  if (fact.key.startsWith("identity.")) return true;
  return SIMPLE_FACT_KEYS.has(fact.key) || DOCUMENT_FACTS.some((is) => is(fact));
}

function isKnownDecision(key: string): boolean {
  return DECISION_KEYS.has(key) || DECISION_PATTERNS.some((re) => re.test(key));
}

export function checkSupport(scenario: Scenario, modeledForms: Set<string>): SupportIssue[] {
  const issues: SupportIssue[] = [];
  const unknownFacts = new Set(
    scenario.facts.filter((fact) => !isKnownFact(fact)).map((fact) => maskKey(fact.key)),
  );
  for (const key of unknownFacts) {
    issues.push({
      kind: "unknown_fact",
      subject: key,
      detail: "The engine does not read this fact.",
    });
  }
  for (const decision of scenario.decisions) {
    if (!isKnownDecision(decision.decisionKey)) {
      issues.push({
        kind: "unknown_decision",
        subject: maskKey(decision.decisionKey),
        detail: "The engine does not read this decision.",
      });
    }
    const rule = OUT_OF_SCOPE.find((entry) => entry.key === decision.decisionKey);
    if (rule && !rule.supported(decision.decision)) {
      issues.push({ kind: "out_of_scope", subject: decision.decisionKey, detail: rule.detail });
    }
  }
  for (const form of scenario.forms) {
    const filled = Object.keys(form.expected.engineFields).length;
    if (filled > 0 && !modeledForms.has(form.formId)) {
      issues.push({
        kind: "form_not_modeled",
        subject: form.formId,
        detail: `The return fills ${filled} line(s) on it.`,
      });
    }
  }
  return issues;
}
