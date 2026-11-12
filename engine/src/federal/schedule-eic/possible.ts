/*
 * Whether the EIC is still possible from facts alone: the one test Schedule
 * EIC's must-file and the line 27a questions share. Resolvers cannot read form
 * lines, so each test uses a lower bound from facts, and a bound that cannot
 * be figured keeps the EIC possible. Each bound adds the lines as the form
 * rounds them (each line to the dollar, then added), so it is never above
 * the line it bounds. A lower bound errs toward filing and
 * asking: it can ask a filer whom line 27a then stops, but it does not miss one
 * the steps would credit. Line 27a itself reads the lines (credit.ts).
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  HSA_COVERAGE_KEYS,
  RENTAL_KEYS,
  businessesOnReturn,
  isInterestFactKey,
  readRentalFacts,
  rentalsOnReturn,
  type RentalFactValue,
} from "../../facts/index.js";
import { filingStatusOf, resolveScheduleBInfo } from "../../filingInfoResolvers.js";
import { roundDollars, sum } from "../../money.js";
import { num, sumInvestmentBox, sumW2Box, type ResolverInputs } from "../../resolverInputs.js";
import { resolve8889Info } from "../8889/resolveInfo.js";
import { booleanFact, isPassiveActivity, spousePropertiesOnReturn } from "../rentals/passive.js";
import { resolveSchedule8812Info } from "../schedule-8812/resolveInfo.js";
import type { PayerAmount } from "../schedule-b/filingInfo.js";
import { tentativeProfit } from "../schedule-c/lines.js";
import { netIncomeOrLoss } from "../schedule-e/lines.js";
import { INVESTMENT_INCOME_LIMIT } from "./credit.js";
import { eicIncomeLimit } from "./limits.js";
import { incomeMayBeNonpassive, mixesRentsAndRoyalties } from "./worksheet1.js";

// Schedule D line 21: a net capital loss enters line 7a as at most $3,000 ($1,500 MFS).
const CAPITAL_LOSS_LIMIT = 3_000;
const CAPITAL_LOSS_LIMIT_MFS = 1_500;

/*
 * The least each business adds to earned income and AGI: Schedule C line 31
 * is at least line 29 when line 29 is a loss (line 30 by the simplified method
 * is 0 then, and the at-risk and passive rules can only shrink this year's
 * loss), and a profit counts as 0 (it is more than the half of SE tax it
 * brings). Suspended passive losses freed on a disposition and at-risk
 * carryovers could lower line 31 further; no fact records them and the
 * engine's line 31 leaves them out, so the bound holds for the line it fills. Worksheet
 * B lines 1e and 2c go below 0 only through these losses
 * (irs-1040-inst-2025::sec::bworksheet-2025-eic-line-27a::b01, ::b02).
 * Undefined while line 29 is unknown (cost of goods sold is not modeled), or a
 * business fact is malformed: then the loss has no bound.
 */
function businessFloor(inputs: ResolverInputs, joint: boolean): number | undefined {
  const { businesses, malformedKeys } = businessesOnReturn(inputs.facts, joint);
  if (malformedKeys.length > 0) return undefined;
  const lines29 = businesses.map((business) => tentativeProfit(business.value));
  if (lines29.some((line29) => line29 === undefined)) return undefined;
  return sum(...lines29.map((line29) => Math.min(0, line29!)));
}

/*
 * A payer line's least amount (1040 line 2b or 3b): the payers' total rounded,
 * or with Schedule B under the sum_rounded_rows style, the rounded rows added
 * (payerTotal in schedule-b/bindings.ts). The smaller holds either way.
 */
function payerLineFloor(payers: PayerAmount[]): number {
  const roundedTotal = roundDollars(sum(...payers.map((payer) => payer.amount)));
  const roundedRows = sum(...payers.map((payer) => roundDollars(payer.amount)));
  return Math.min(roundedTotal, roundedRows);
}

/* Lines 1a, 2a, 2b and 3b as the form rounds them, at their least. */
function incomeLines(inputs: ResolverInputs) {
  const { interestPayers, dividendPayers } = resolveScheduleBInfo(inputs);
  return {
    line1a: roundDollars(sumW2Box(inputs, "box1")),
    line2a: roundDollars(sumInvestmentBox(inputs, "box8", isInterestFactKey)),
    line2b: payerLineFloor(interestPayers ?? []),
    line3b: payerLineFloor(dividendPayers ?? []),
  };
}

/*
 * Step 2's investment income (lines 2a + 2b + 3b + 7a, a loss on 7a as 0) is
 * at least lines 2a, 2b and 3b: Schedule B line 3 (Form 8815) is not modeled,
 * so line 2b subtracts nothing. Pub. 596 Worksheet 1 line 14 adds lines 10 and
 * 13, each at least 0, to the same lines (worksheet1.ts).
 */
function investmentIncomeFloor(inputs: ResolverInputs): number {
  const { line2a, line2b, line3b } = incomeLines(inputs);
  return sum(line2a, line2b, line3b);
}

/* Line 7a's least amount: 0 with no sale and no carryover, else the Schedule D line 21 limit. */
function capitalFloor(inputs: ResolverInputs): number {
  const carryover = Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).some(
    (key) => (num(inputs, key) ?? 0) > 0,
  );
  if (inputs.trades.factKeys.length === 0 && !carryover) return 0;
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  return -(separate ? CAPITAL_LOSS_LIMIT_MFS : CAPITAL_LOSS_LIMIT);
}

/*
 * Form 8889 line 13, the HSA deduction (Schedule 1 line 13), is at most the
 * taxpayer's own contributions (line 2, rounded). Undefined while the form may
 * file and the contributions are not known.
 */
function hsaDeductionCeiling(inputs: ResolverInputs): number | undefined {
  const own = num(inputs, HSA_COVERAGE_KEYS.ownContributions);
  if (own !== undefined) return roundDollars(own);
  return resolve8889Info(inputs).mustFile?.["form-8889"]?.value === false ? 0 : undefined;
}

/* Line 21 waits on a real estate property's personal-use days unless they are 0 (schedule-e/lines.ts). */
const personalUseOpen = (value: RentalFactValue) =>
  value.propertyType !== "royalties" && value.personalUseDays !== 0;

/*
 * Schedule 1 line 5's least amount: Schedule E line 41, which is line 26 (the
 * engine fills no Part II–IV line). Each property adds at least its line 21
 * loss (a profit counts as 0) less its prior-year unallowed loss, the most
 * Form 8582 can free with it; the at-risk and passive rules only shrink a loss.
 * Every property counts, a spouse's on a separate return too: a share of a
 * loss is no lower than the whole. Undefined while a rental fact is malformed
 * or a line 21 waits on personal-use days: then the loss has no bound.
 */
function rentalFloor(inputs: ResolverInputs): number | undefined {
  const { properties, malformedKeys } = readRentalFacts(inputs.facts);
  if (malformedKeys.length > 0) return undefined;
  if (properties.some(({ value }) => personalUseOpen(value))) return undefined;
  return sum(
    ...properties.map(
      ({ value }) =>
        Math.min(0, netIncomeOrLoss(value) ?? 0) - roundDollars(value.priorYearUnallowedLoss ?? 0),
    ),
  );
}

/*
 * Line 11b's least amount: W-2 box 1 (line 1a), the taxable interest and
 * ordinary dividends (lines 2b and 3b), line 7a's least, each business's
 * least and the rentals' least (Schedule 1 line 5), less the most the
 * adjustments can be. Other income only adds, and is left out. Of Schedule 1
 * Part II the engine fills line 13 (HSA) and line 15 (half of SE tax, covered
 * by counting a profit as 0); a new adjustment line, or an income line that can
 * be negative, must be counted here, or this bound is no longer a lower bound.
 */
function agiFloor(inputs: ResolverInputs, joint: boolean): number | undefined {
  const businesses = businessFloor(inputs, joint);
  const rentals = rentalFloor(inputs);
  const hsa = hsaDeductionCeiling(inputs);
  if (businesses === undefined || rentals === undefined || hsa === undefined) return undefined;
  const { line1a, line2b, line3b } = incomeLines(inputs);
  return sum(line1a, line2b, line3b, capitalFloor(inputs), businesses, rentals, -hsa);
}

/*
 * A Schedule E property with royalties and rents, or a passive rental whose
 * income may be nonpassive, makes Worksheet 1 a gap that no answer settles
 * (worksheet1.ts): line 27a reports it, and nothing is asked. A self-rental is
 * no gap: its net income is left out, and income over a prior-year loss waits
 * while Schedule E asks for the property again.
 */
function worksheet1Gap(inputs: ResolverInputs): boolean {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const { properties } = rentalsOnReturn(inputs.facts, joint);
  const professional = booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional));
  return properties.some(
    ({ value }) =>
      mixesRentsAndRoyalties(value) ||
      incomeMayBeNonpassive(value, isPassiveActivity(value, professional), netIncomeOrLoss(value)),
  );
}

/*
 * The EIC is still possible for this many children with valid SSNs unless the
 * facts show a step stops it:
 * - no W-2 wages, no combat pay (W-2 box 12 code Q, which line 27a reports as
 *   a gap) and no business: earned income is 0 (Worksheet A line 2 or
 *   Worksheet B line 4b);
 * - Step 1, question 1: line 11b at or above the limit
 *   (irs-1040-inst-2025::sec::all-filers::b01);
 * - Step 2: investment income over $11,950, or a Worksheet 1 gap;
 * - Step 5 or Worksheet B line 5: earned income (at least the wages plus each
 *   business's least) at or above the limit
 *   (irs-1040-inst-2025::sec::no-continue-7::b01, ::bworksheet-2025-eic-line-27a::b03).
 *   Schedule E is not earned income: Step 5 starts from line 1z
 *   (irs-1040-inst-2025::sec::step-5::b01) and Worksheet B adds only
 *   self-employment (::bworksheet-2025-eic-line-27a::b01, ::b02).
 */
export function eicMayApply(inputs: ResolverInputs, children: number): boolean {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const { line1a } = incomeLines(inputs);
  const { businesses, malformedKeys } = businessesOnReturn(inputs.facts, joint);
  const combatPay = resolveSchedule8812Info(inputs).w2NontaxableCombatPay !== undefined;
  const noBusiness = businesses.length === 0 && malformedKeys.length === 0;
  if (line1a <= 0 && !combatPay && noBusiness) return false;
  const limit = eicIncomeLimit(children, joint);
  const agi = agiFloor(inputs, joint);
  if (agi !== undefined && agi >= limit) return false;
  if (investmentIncomeFloor(inputs) > INVESTMENT_INCOME_LIMIT) return false;
  if (worksheet1Gap(inputs)) return false;
  const businessLeast = businessFloor(inputs, joint);
  return businessLeast === undefined || line1a + businessLeast < limit;
}
