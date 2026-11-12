import { SPOUSE_KEYS, isDividendFactKey } from "../../facts/index.js";
import type { MustFileResolution } from "../../filingInfo.js";
import { bornBeforeJan2_1961, filingStatusOf } from "../../filingInfoResolvers.js";
import { atLeast, sum } from "../../money.js";
import {
  factsInCategory,
  resolveMustFile,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { standardDeduction } from "../1040/deductions.js";
import { magiUpperBound } from "../8960/mustFile.js";
import { scheduleCOpen } from "../schedule-c/resolveInfo.js";
import { QBI_LIMITS } from "./lines.js";
import { qbiBusinesses, rentalsWithoutQbiAnswer } from "./resolveInfo.js";

/*
 * Form 8995 or Form 8995-A: the one rule for which of them figures the QBI
 * deduction. Both resolvers call qbiMustFile.
 */

export type QbiForm = "form-8995" | "form-8995-a";

/* Standard Deduction Worksheet for Dependents, line 2: earned income plus $450, at least $1,350. */
const DEPENDENT_EARNED_INCOME_ADDITION = 450;
const DEPENDENT_MINIMUM_STANDARD_DEDUCTION = 1350;

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
 * The part of line 12e that is certain before evaluation. Only a "standard"
 * decision counts: an itemizer's Schedule A total is figured at evaluation and
 * can be below the standard deduction
 * (irs-1040sa-inst-2025::sec::total-itemized-deductions::b01).
 * Unknown ages count as not 65; an unknown MFS spouse answer counts as itemizing
 * (zero, irs-1040-inst-2025::sec::exception-1-dependent-line-12a-if::b01). The
 * engine has no fact for being someone's dependent, so the amount is also capped
 * by the dependents' worksheet line 2 with W-2 box 1 as earned income
 * (irs-1040-inst-2025::sec::line-16::b03): the bound counts the same wages and no
 * business loss, so any earned income it misses it also overstates in income.
 */
function certainStandardDeduction(inputs: ResolverInputs): number {
  if (inputs.decisionByKey.get("decisions.itemize_vs_standard") !== "standard") return 0;
  const filingStatus = filingStatusOf(inputs);
  const full = standardDeduction({
    filingStatus,
    spouseItemizesSeparately:
      (inputs.factByKey.get(SPOUSE_KEYS.itemizesSeparately) as boolean | undefined) ?? true,
    taxpayerBornBeforeJan2_1961: bornBeforeJan2_1961(text(inputs, "identity.dob")) ?? false,
    spouseBornBeforeJan2_1961: bornBeforeJan2_1961(text(inputs, SPOUSE_KEYS.dob)) ?? false,
  });
  const dependentFloor = atLeast(
    DEPENDENT_MINIMUM_STANDARD_DEDUCTION,
    sum(sumW2Box(inputs, "box1"), DEPENDENT_EARNED_INCOME_ADDITION),
  );
  return full === undefined ? 0 : Math.min(full, dependentFloor);
}

/*
 * irs-8995-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995 when the
 * return has QBI or REIT dividends, taxable income before the QBI deduction is
 * at or below the threshold, and the taxpayer is not a cooperative patron;
 * otherwise Form 8995-A. That income is 1040 line 11a less lines 12e and 13b
 * (irs-8995-inst-2025::sec::line-11::b01). The resolver cannot read those lines,
 * so it tests an upper bound: MAGI's upper bound (magiUpperBound) less the
 * certain standard deduction. The bound still overstates by the Schedule 1
 * adjustments (the deductible part of SE tax, HSA, IRA), line 13b, an itemizer's
 * Schedule A total, business losses, the age increase when a birth date is
 * unknown, and the dependent cap on low wages; in that band Form 8995-A files,
 * which at or below the threshold gives the Form 8995 result
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b01). The engine
 * reads no Form 1099-PATR, so no taxpayer is a patron. An unknown filing status
 * counts a spouse's income, subtracts no deduction and tests the lowest
 * threshold. Form 8995-A asks the W-2 wage and property answers by the same test.
 */
export function qbiIncomeMayExceedThreshold(inputs: ResolverInputs): boolean {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const threshold = (status && QBI_LIMITS[status]?.threshold) || QBI_LIMITS.single.threshold;
  return sum(magiUpperBound(inputs, joint), -certainStandardDeduction(inputs)) > threshold;
}

export function qbiFormByIncome(inputs: ResolverInputs): QbiForm {
  return qbiIncomeMayExceedThreshold(inputs) ? "form-8995-a" : "form-8995";
}

/*
 * The must-file answer for one of the two forms. Any Schedule C business, and a
 * rental the taxpayer calls a trade or business, is QBI. While Schedule C, or a
 * rental's QBI answer with no business, is open only REIT dividends can say yes,
 * and nothing can say no. An explicit must-file decision for the other form takes
 * the deduction there.
 */
export function qbiMustFile(inputs: ResolverInputs, form: QbiForm): MustFileResolution {
  const reit = qualifiedReitDividends(inputs) ?? 0;
  const { businesses, malformedKeys } = qbiBusinesses(inputs);
  const businessKeys = [...businesses.map((business) => business.factKey), ...malformedKeys];
  const other: QbiForm = form === "form-8995" ? "form-8995-a" : "form-8995";
  const here =
    qbiFormByIncome(inputs) === form && inputs.decisionByKey.get(EXPLICIT_KEYS[other]) !== true;
  const choice = `${form} by the upper bound on taxable income before the QBI deduction and no ${EXPLICIT_KEYS[other]} (${here})`;
  const reitFallback = {
    rule: `fallback: section 199A dividends $${reit} > 0; ${choice}`,
    value: reit > 0 && here,
  };
  const businessFallback = {
    rule: `fallback: a Schedule C business or a QBI rental (qualified business income); ${choice}`,
    value: businessKeys.length > 0 && here,
    triggeredByFactKeys: businessKeys,
  };
  const unanswered = rentalsWithoutQbiAnswer(inputs);
  const open = scheduleCOpen(inputs) || (unanswered.length > 0 && businessKeys.length === 0);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: EXPLICIT_KEYS[form],
    fallbacks: open ? (reit > 0 ? [reitFallback] : []) : [reitFallback, businessFallback],
  });
}
