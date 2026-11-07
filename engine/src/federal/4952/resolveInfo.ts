import {
  INVESTMENT_INTEREST_KEYS,
  isDividendFactKey,
  isInterestFactKey,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  missingInputs,
  num,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form4952FilingInfo } from "./filingInfo.js";

/*
 * irs-4952-form-2025::sec::who-must-file::b01: an individual files Form 4952 to
 * deduct investment interest expense, except when interest and ordinary
 * dividends less qualified dividends exceed the expense, there are no other
 * investment expenses, and there is no carryover from last year. With no
 * expense and no carryover there is nothing to deduct.
 */
export function resolve4952Info(inputs: ResolverInputs): Form4952FilingInfo {
  const answers = {
    expensePaid: num(inputs, INVESTMENT_INTEREST_KEYS.expensePaid),
    disallowedCarryover: num(inputs, INVESTMENT_INTEREST_KEYS.disallowedCarryover),
    electedQualifiedDividendsAndGain: num(
      inputs,
      INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
    ),
    investmentExpenses: num(inputs, INVESTMENT_INTEREST_KEYS.investmentExpenses),
  };
  const interest = sumInvestmentBox(inputs, "box1", isInterestFactKey);
  const ordinaryDividends = sumInvestmentBox(inputs, "box1a", isDividendFactKey);
  const qualifiedDividends = sumInvestmentBox(inputs, "box1b", isDividendFactKey);
  const expense = sum(answers.expensePaid, answers.disallowedCarryover);
  const hasExpense = (answers.expensePaid ?? 0) > 0 || (answers.disallowedCarryover ?? 0) > 0;
  const exception =
    sum(interest, ordinaryDividends, -qualifiedDividends) > expense &&
    (answers.investmentExpenses ?? 0) === 0 &&
    (answers.disallowedCarryover ?? 0) === 0;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4952",
    fallbacks: [
      {
        rule: `fallback: investment interest expense $${expense} to deduct (${hasExpense}) and the Who Must File exception does not apply (${!exception})`,
        value: hasExpense && !exception,
        triggeredByFactKeys: [
          INVESTMENT_INTEREST_KEYS.expensePaid,
          INVESTMENT_INTEREST_KEYS.disallowedCarryover,
        ],
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-4952": resolution },
    /* The election (line 4g) and other expenses (line 5) are answers; 0 is an answer. */
    missingInputs: {
      "form-4952": files
        ? missingInputs({
            [INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain]:
              answers.electedQualifiedDividendsAndGain,
            [INVESTMENT_INTEREST_KEYS.investmentExpenses]: answers.investmentExpenses,
          })
        : [],
    },
    investmentInterestPaid: answers.expensePaid,
    disallowedInterestCarryover: answers.disallowedCarryover,
    electedQualifiedDividendsAndGain: answers.electedQualifiedDividendsAndGain,
    investmentExpenses: answers.investmentExpenses,
    grossInvestmentIncome: sum(interest, ordinaryDividends),
    qualifiedDividends,
  };
}
