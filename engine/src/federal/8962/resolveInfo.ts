import {
  MARKETPLACE_MONTHS,
  PREMIUM_TAX_CREDIT_KEYS,
  getDependentFacts,
  getMarketplaceCoverageFacts,
  rowShowsCoverage,
  type MarketplaceCoverageAmounts,
  type MarketplaceCoverageFactValue,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8962FilingInfo } from "./filingInfo.js";

const COLUMNS = ["enrollmentPremium", "slcspPremium", "advancePayment"] as const;

/* Each column added over the rows; a column blank in every row stays blank. */
function addRows(
  rows: ReadonlyArray<MarketplaceCoverageAmounts | undefined>,
): MarketplaceCoverageAmounts {
  const out: MarketplaceCoverageAmounts = {};
  for (const column of COLUMNS) {
    const amounts = rows.map((row) => row?.[column]).filter((amount) => amount !== undefined);
    if (amounts.length > 0) out[column] = sum(...amounts);
  }
  return out;
}

const sameEveryMonth = (statement: MarketplaceCoverageFactValue): boolean =>
  statement.months.length === MARKETPLACE_MONTHS &&
  statement.months.every(
    (month) =>
      month.enrollmentPremium !== undefined &&
      month.enrollmentPremium === statement.months[0].enrollmentPremium &&
      month.slcspPremium === statement.months[0].slcspPremium,
  );

/*
 * irs-8962-inst-2025::sec::who-must-file::b01: file Form 8962 when APTC was
 * paid (any Form 1095-A column C amount) or when taking the PTC. Taking the
 * PTC with no APTC is the taxpayer's choice: decisions.scope.must_file_8962.
 */
export function resolve8962Info(inputs: ResolverInputs): Form8962FilingInfo {
  const statements = getMarketplaceCoverageFacts(inputs.facts).map((fact) => fact.value);
  const annual = addRows(statements.map((statement) => statement.annualTotals));
  const monthly = Array.from({ length: MARKETPLACE_MONTHS }, (_, index) =>
    addRows(statements.map((statement) => statement.months[index])),
  );
  const monthlyCounts = Array.from(
    { length: MARKETPLACE_MONTHS },
    // The column (b) rules are per month (lines 12–23).
    (_, index) =>
      statements.filter((statement) => rowShowsCoverage(statement.months[index])).length,
  );
  const aptcPaid =
    (annual.advancePayment ?? 0) > 0 || monthly.some((month) => (month.advancePayment ?? 0) > 0);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8962",
    fallbacks: [{ rule: "fallback: Form 1095-A column C shows APTC", value: aptcPaid }],
  });
  const mfsException = inputs.factByKey.get(PREMIUM_TAX_CREDIT_KEYS.mfsException);
  const allocates = inputs.factByKey.get(PREMIUM_TAX_CREDIT_KEYS.allocatesPolicyOrMarriageCalc);
  const files = resolution.value === true;
  const mfs = filingStatusOf(inputs) === "married_filing_separately";
  return {
    mustFile: { "form-8962": resolution },
    missingInputs: {
      "form-8962": files
        ? missingInputs({
            [PREMIUM_TAX_CREDIT_KEYS.allocatesPolicyOrMarriageCalc]: allocates,
            ...(mfs ? { [PREMIUM_TAX_CREDIT_KEYS.mfsException]: mfsException } : {}),
          })
        : [],
    },
    ptcMfsException: typeof mfsException === "boolean" ? mfsException : undefined,
    ptcAllocatesPolicyOrMarriageCalc: typeof allocates === "boolean" ? allocates : undefined,
    marketplaceStatementCount: statements.length,
    marketplaceAnnualTotals: statements.length > 0 ? annual : undefined,
    marketplaceMonthlyTotals: statements.length > 0 ? monthly : undefined,
    marketplaceMonthlyStatementCounts: statements.length > 0 ? monthlyCounts : undefined,
    marketplaceSameEveryMonth: statements.length > 0 ? statements.every(sameEveryMonth) : undefined,
    dependentCount: getDependentFacts(inputs.facts).length,
  };
}
