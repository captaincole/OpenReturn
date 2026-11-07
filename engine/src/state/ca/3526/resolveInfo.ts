import {
  INVESTMENT_INTEREST_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  isTradeFact,
} from "../../../facts/index.js";
import type { TaxFactRow } from "../../../facts/rows.js";
import { sum } from "../../../money.js";
import {
  factsInCategory,
  num,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3526FilingInfo } from "./filingInfo.js";

const CA_ELECTED_NET_CAPITAL_GAIN = "investment_interest.ca_elected_net_capital_gain";

/*
 * ca-3526-inst-2025::sec::b-who-must-file::b01: an individual who claims a
 * deduction for investment interest expense files form FTB 3526, except when all
 * of these hold: the only investment income was interest or dividends, there are
 * no other deductible expenses connected with it, the expense is not more than
 * the investment income, and there is no disallowed expense from 2024. The
 * answers are the Form 4952 answers (the same facts); "only interest or
 * dividends" means no sale of investment property (no trade facts) and no capital
 * gain distributions. While an answer the exception needs is missing, the form
 * files and asks, as Form 4952 does.
 */
export function resolve3526Info(inputs: ResolverInputs): Form3526FilingInfo {
  const expensePaid = num(inputs, INVESTMENT_INTEREST_KEYS.expensePaid);
  const carryover = num(inputs, INVESTMENT_INTEREST_KEYS.disallowedCarryover);
  const investmentExpenses = num(inputs, INVESTMENT_INTEREST_KEYS.investmentExpenses);
  const interest = sum(
    sumInvestmentBox(inputs, "box1", isInterestFactKey),
    sumInvestmentBox(inputs, "box3", isInterestFactKey),
  );
  const dividends = sumInvestmentBox(inputs, "box1a", isDividendFactKey);
  const capitalGainDistributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  const trades = (factsInCategory(inputs, "investment_income") as TaxFactRow[]).filter(isTradeFact);
  const onlyInterestOrDividends = trades.length === 0 && capitalGainDistributions === 0;
  const expense = sum(expensePaid, carryover);
  const hasExpense = expense > 0;
  const exception =
    onlyInterestOrDividends &&
    investmentExpenses === 0 &&
    carryover === 0 &&
    expense <= sum(interest, dividends);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3526",
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
  return {
    mustFile: { "form-3526": resolution },
    /* The California election is optional: no question is raised when it is absent. */
    caElectedNetCapitalGain: num(inputs, CA_ELECTED_NET_CAPITAL_GAIN),
  };
}
