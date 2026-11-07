import {
  INVESTMENT_INTEREST_KEYS,
  isDividendFactKey,
  isInterestFactKey,
} from "../../../facts/index.js";
import { resolve4952Info } from "../../../federal/4952/resolveInfo.js";
import { sum } from "../../../money.js";
import {
  missingInputs,
  num,
  onlyInterestOrDividendIncome,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3526FilingInfo } from "./filingInfo.js";

/*
 * ca-3526-inst-2025::sec::b-who-must-file::b01: an individual who claims a
 * deduction for investment interest expense files form FTB 3526, except when all
 * of these hold: the only investment income was interest or dividends, there are
 * no other deductible expenses connected with it, the expense is not more than
 * the investment income, and there is no disallowed expense from 2024. The
 * exception only waives the filing: the California deduction is still figured
 * on the form, and Schedule CA Part II line 9 takes the difference from the
 * federal deduction (ca-3526-inst-2025::sec::line-10::b01), so the form is
 * completed whenever federal Form 4952 files. While an answer the exception
 * needs is missing, the form files and asks, as Form 4952 does.
 *
 * California's income has no qualified-dividend split and excludes U.S.
 * obligation interest (1099-INT box 3), which California does not tax.
 */
export function resolve3526Info(inputs: ResolverInputs): Form3526FilingInfo {
  const expensePaid = num(inputs, INVESTMENT_INTEREST_KEYS.expensePaid);
  const caCarryover = num(inputs, INVESTMENT_INTEREST_KEYS.caDisallowedCarryover);
  const investmentExpenses = num(inputs, INVESTMENT_INTEREST_KEYS.investmentExpenses);
  const interest = sumInvestmentBox(inputs, "box1", isInterestFactKey);
  const dividends = sumInvestmentBox(inputs, "box1a", isDividendFactKey);
  const caGrossInvestmentIncome = sum(interest, dividends);
  const expense = sum(expensePaid, caCarryover);
  const hasExpense = expense > 0;
  const exception =
    onlyInterestOrDividendIncome(inputs) &&
    investmentExpenses === 0 &&
    caCarryover === 0 &&
    expense <= caGrossInvestmentIncome;
  const federalFiles = resolve4952Info(inputs).mustFile?.["form-4952"]?.value === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3526",
    fallbacks: [
      {
        rule: `fallback: investment interest expense $${expense} to deduct (${hasExpense}); the Who Must File exception does not apply (${!exception}) or federal Form 4952 files (${federalFiles})`,
        value: hasExpense && (!exception || federalFiles),
        triggeredByFactKeys: [
          INVESTMENT_INTEREST_KEYS.expensePaid,
          INVESTMENT_INTEREST_KEYS.caDisallowedCarryover,
        ],
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-3526": resolution },
    /* The California carryover is its own answer (last year's FTB 3526 line 7); 0 is an answer. */
    missingInputs: {
      "form-3526": files
        ? missingInputs({ [INVESTMENT_INTEREST_KEYS.caDisallowedCarryover]: caCarryover })
        : [],
    },
    caDisallowedInterestCarryover: caCarryover,
    caGrossInvestmentIncome,
    /* The California election is optional: no question is raised when it is absent. */
    caElectedNetCapitalGain: num(inputs, INVESTMENT_INTEREST_KEYS.caElectedNetCapitalGain),
  };
}
