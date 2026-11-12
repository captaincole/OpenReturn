import { businessesOnReturn, isDividendFactKey } from "../../facts/index.js";
import type { MustFileResolution } from "../../filingInfo.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { magiUpperBound } from "../8960/mustFile.js";
import { QBI_LIMITS } from "../8995-a/lines.js";
import { scheduleCOpen } from "../schedule-c/resolveInfo.js";

/*
 * Form 8995 or Form 8995-A: the one rule for which of them figures the QBI
 * deduction. Both resolvers call qbiMustFile.
 */

export type QbiForm = "form-8995" | "form-8995-a";

const EXPLICIT_KEYS: Record<QbiForm, string> = {
  "form-8995": "decisions.scope.must_file_8995",
  "form-8995-a": "decisions.scope.must_file_8995_a",
};

/* Qualified REIT dividends: 1099-DIV box 5, cents kept. Undefined with no 1099-DIV. */
export function qualifiedReitDividends(inputs: ResolverInputs): number | undefined {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  return divs.length > 0
    ? sum(...divs.map((row) => (row.value as { box5?: unknown }).box5))
    : undefined;
}

/*
 * irs-8995-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995 when the
 * return has QBI or REIT dividends, taxable income before the QBI deduction is
 * at or below the threshold, and the taxpayer is not a cooperative patron;
 * otherwise Form 8995-A. The resolver cannot read taxable income, so it tests
 * MAGI's upper bound (magiUpperBound), which taxable income before the
 * deduction cannot exceed. Above it Form 8995-A files, which at or below the
 * threshold gives the Form 8995 result
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b01). The engine
 * reads no Form 1099-PATR, so no taxpayer is a patron. An unknown filing status
 * counts a spouse's income and tests the lowest threshold.
 */
export function qbiFormByIncome(inputs: ResolverInputs): QbiForm {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const threshold = (status && QBI_LIMITS[status]?.threshold) || QBI_LIMITS.single.threshold;
  return magiUpperBound(inputs, joint) <= threshold ? "form-8995" : "form-8995-a";
}

/*
 * The must-file answer for one of the two forms. Any Schedule C business is
 * QBI. While Schedule C is open only REIT dividends can say yes, and nothing can
 * say no. An explicit must-file decision for the other form takes the
 * deduction there.
 */
export function qbiMustFile(inputs: ResolverInputs, form: QbiForm): MustFileResolution {
  const reit = qualifiedReitDividends(inputs) ?? 0;
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    filingStatusOf(inputs) === "married_filing_jointly",
  );
  const businessKeys = [...businesses.map((business) => business.key), ...malformedKeys];
  const other: QbiForm = form === "form-8995" ? "form-8995-a" : "form-8995";
  const here =
    qbiFormByIncome(inputs) === form && inputs.decisionByKey.get(EXPLICIT_KEYS[other]) !== true;
  const choice = `${form} by the MAGI upper bound and no ${EXPLICIT_KEYS[other]} (${here})`;
  const reitFallback = {
    rule: `fallback: section 199A dividends $${reit} > 0; ${choice}`,
    value: reit > 0 && here,
  };
  const businessFallback = {
    rule: `fallback: a Schedule C business (qualified business income); ${choice}`,
    value: businessKeys.length > 0 && here,
    triggeredByFactKeys: businessKeys,
  };
  const open = scheduleCOpen(inputs);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: EXPLICIT_KEYS[form],
    fallbacks: open ? (reit > 0 ? [reitFallback] : []) : [reitFallback, businessFallback],
  });
}
