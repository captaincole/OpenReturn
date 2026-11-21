import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  GAMBLING_KEYS,
  businessesOnReturn,
  getGamblingWinningsFacts,
  getGovernmentPaymentsFacts,
  getLtcBenefitsFacts,
  getSection1256Facts,
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
import { line1Row } from "../6781/lines.js";
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
  // Taxable HSA and MSA distributions reach AGI through Schedule 1 lines 8f and 8e (Forms 8889, 8853).
  const hsaDistributions = inputs.facts.filter((fact) => isHsaDistributionFactKey(fact.key));
  const tradeGain = sum(
    ...inputs.trades.boxed.map(({ trade, basis }) =>
      sum(trade.proceeds, -(basis ?? 0), trade.adjustmentAmount),
    ),
  );
  // Form 6781 Part I reaches line 7a through Schedule D lines 4 and 11.
  const section1256Gain = sum(
    ...getSection1256Facts(inputs.facts).map((fact) => line1Row(fact).amount),
  );
  return sum(
    sumW2Box(inputs, "box1"),
    sumInvestmentBox(inputs, "box1", isInterestFactKey),
    sumInvestmentBox(inputs, "box3", isInterestFactKey),
    sumInvestmentBox(inputs, "box1a", isDividendFactKey),
    sumInvestmentBox(inputs, "box2a", isDividendFactKey),
    atLeast(0, tradeGain),
    atLeast(0, section1256Gain),
    ...businesses.map(({ value }) =>
      atLeast(0, tentativeProfit(value) ?? sum(netReceipts(value), value.otherIncome)),
    ),
    ...getGamblingWinningsFacts(inputs.facts).map((w2g) => w2g.box1),
    num(inputs, GAMBLING_KEYS.winningsNotOnW2G),
    // Unemployment compensation reaches AGI through Schedule 1 line 7.
    ...getGovernmentPaymentsFacts(inputs.facts).map((form) => form.box1),
    ...misc.map((row) => (row.value as Record<string, unknown>).box3),
    ...retirement.map(({ value }) => {
      const distribution = value as RetirementDistributionFactValue;
      return distribution.box2a ?? distribution.box1;
    }),
    ...hsaDistributions.map(({ value }) => (value as { box1?: unknown }).box1),
    // Form 8853 line 26 (Schedule 1 line 8e) is at most the per diem payments of 1099-LTC boxes 1 and 2.
    ...getLtcBenefitsFacts(inputs.facts)
      .filter(({ value }) => value.box3 === "per_diem")
      .flatMap(({ value }) => [value.box1, value.box2]),
    ...socialSecurity.map(({ value }) =>
      atLeast(0, (value as SocialSecurityFactValue).box5 * MAX_TAXABLE_SOCIAL_SECURITY),
    ),
  );
}

/*
 * Line 4b: every Schedule C business has line G "Yes", so its income is nonpassive.
 * Who Must File asks for investment income: an interest, dividend or sale fact
 * (category investment_income), a capital loss carried over from last year
 * (it reaches line 5a through 1040 line 7a), a section 1256 contract (Form 6781, the same
 * way), or a business without line G "Yes" (passive).
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
  const carryover = Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).some(
    (key) => (num(inputs, key) ?? 0) > 0,
  );
  const hasInvestment =
    inputs.facts.some((fact) => fact.category === "investment_income") ||
    carryover ||
    getSection1256Facts(inputs.facts).length > 0 ||
    (businesses.length > 0 && !scheduleCNonpassive);
  return { scheduleCNonpassive, hasInvestment };
}
