import {
  GAMBLING_KEYS,
  businessesOnReturn,
  getGamblingWinningsFacts,
  isDividendFactKey,
  isHsaDistributionFactKey,
  isInterestFactKey,
  isMiscIncomeFactKey,
  isRetirementDistributionFactKey,
  isSocialSecurityFactKey,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import {
  factsInCategory,
  num,
  sumInvestmentBox,
  sumW2Box,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { netReceipts, tentativeProfit } from "../schedule-c/lines.js";

/* 1040 line 6b: at most 85% of social security benefits is taxable. */
const MAX_TAXABLE_SOCIAL_SECURITY = 0.85;

/*
 * An upper bound on MAGI from the income facts, for Form 8960's Who Must File
 * (irs-8960-inst-2025::sec::who-must-file::b01). It adds every income item and
 * subtracts no adjustment (the SE tax deduction, HSA, IRA), and it counts a
 * business at line 29 (or line 3 plus line 6 while line 29 is open) and a sale
 * at proceeds less known basis. So it can file a Form 8960 that owes $0, but it
 * does not miss one. Income with no facts (rents, K-1s, alimony) is not counted.
 */
export function magiUpperBound(inputs: ResolverInputs, joint: boolean): number {
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const retirement = inputs.facts.filter(
    (fact) => fact.category === "retirement" && isRetirementDistributionFactKey(fact.key),
  );
  const socialSecurity = inputs.facts.filter(
    (fact) => fact.category === "retirement" && isSocialSecurityFactKey(fact.key),
  );
  const misc = factsInCategory(inputs, "other").filter((row) => isMiscIncomeFactKey(row.key));
  // Taxable HSA distributions reach AGI through Form 8889 line 16 and Schedule 1 line 8f.
  const hsaDistributions = inputs.facts.filter((fact) => isHsaDistributionFactKey(fact.key));
  const tradeGain = sum(
    ...inputs.trades.boxed.map(({ trade, basis }) =>
      sum(trade.proceeds, -(basis ?? 0), trade.adjustmentAmount),
    ),
  );
  return sum(
    sumW2Box(inputs, "box1"),
    sumInvestmentBox(inputs, "box1", isInterestFactKey),
    sumInvestmentBox(inputs, "box3", isInterestFactKey),
    sumInvestmentBox(inputs, "box1a", isDividendFactKey),
    sumInvestmentBox(inputs, "box2a", isDividendFactKey),
    atLeast(0, tradeGain),
    ...businesses.map(({ value }) =>
      atLeast(0, tentativeProfit(value) ?? sum(netReceipts(value), value.otherIncome)),
    ),
    ...getGamblingWinningsFacts(inputs.facts).map((w2g) => w2g.box1),
    num(inputs, GAMBLING_KEYS.winningsNotOnW2G),
    ...misc.map((row) => (row.value as Record<string, unknown>).box3),
    ...retirement.map(({ value }) => {
      const distribution = value as RetirementDistributionFactValue;
      return distribution.box2a ?? distribution.box1;
    }),
    ...hsaDistributions.map(({ value }) => (value as { box1?: unknown }).box1),
    ...socialSecurity.map(({ value }) =>
      atLeast(0, (value as SocialSecurityFactValue).box5 * MAX_TAXABLE_SOCIAL_SECURITY),
    ),
  );
}

/*
 * Line 4b: every Schedule C business has line G "Yes", so its income is nonpassive.
 * Who Must File asks for investment income: an interest, dividend or sale fact
 * (category investment_income), or a business without line G "Yes" (passive).
 * This gate is stricter than who-must-file::b01, which states the MAGI test
 * alone: without investment income the tax is $0, and the gate keeps a $0
 * Form 8960 off high-wage returns. A person decides whether to drop it.
 * Mixed businesses (some line G "No") need no per-business line 4b: a business
 * without "Yes" leaves Schedule C line 31, so Schedule 1 line 3 and line 4a, blank.
 */
export function investmentSignals(
  inputs: ResolverInputs,
  joint: boolean,
): {
  scheduleCNonpassive: boolean;
  hasInvestment: boolean;
} {
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const scheduleCNonpassive =
    businesses.length > 0 && businesses.every(({ value }) => value.materiallyParticipated === true);
  const hasInvestment =
    inputs.facts.some((fact) => fact.category === "investment_income") ||
    (businesses.length > 0 && !scheduleCNonpassive);
  return { scheduleCNonpassive, hasInvestment };
}
