import type { FormAccessor } from "../../defineForm.js";
import { atLeast, sum } from "../../money.js";
import { isSelfRentalNetIncome } from "../rentals/passive.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8960 } from "./types.js";

/* irs-8960-inst-2025::sec::application-to-individuals::b01: line 14 and Who Must File. Not indexed. */
export const NIIT_THRESHOLDS: Record<string, number> = {
  single: 200000,
  head_of_household: 200000,
  married_filing_jointly: 250000,
  qualifying_surviving_spouse: 250000,
  married_filing_separately: 125000,
};

/* Line 12: the form says "If zero or less, enter -0-". */
export const netInvestmentIncome = (
  line8: number | undefined,
  line11: number | undefined,
): number => atLeast(0, sum(line8, line11 === undefined ? 0 : -line11));

/*
 * Line 4b (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01,
 * ::b02): a rental that is not passive (a real estate professional who materially
 * participated) or a nonpassive royalty. Undefined while an answer is missing.
 */
function nonpassive(property: RentalProperty): boolean | undefined {
  if (property.value.propertyType !== "royalties") {
    return property.passive === undefined ? undefined : !property.passive;
  }
  const activity = property.value.royaltyActivity;
  return activity === undefined ? undefined : activity === "nonpassive";
}

/*
 * The property also rises to a section 162 trade or business (b01, b02), for a rental
 * and a royalty alike. Not the QBI answer: Rev. Proc. 2019-38's safe harbor is section 199A only.
 */
function section162Nonpassive(property: RentalProperty): boolean | undefined {
  const isNonpassive = nonpassive(property);
  if (isNonpassive !== true) return isNonpassive;
  return property.value.tradeOrBusiness;
}

/* Nonpassive properties whose section 162 answer is missing: Cade asks for the property again. */
export function rentalsWithoutTradeOrBusinessAnswer(properties: RentalProperty[]): string[] {
  return properties
    .filter((property) => nonpassive(property) === true)
    .filter((property) => property.value.tradeOrBusiness === undefined)
    .map((property) => property.factKey);
}

/*
 * Line 4b: each section 162 nonpassive property's Schedule E amount as it reaches
 * Schedule 1 line 5 (line 21 income, or the line 22 deductible loss), income as a
 * negative and loss as a positive (b01). A self-rental's recharacterized net income
 * counts with no section 162 answer: it is treated as derived in the ordinary course
 * of a trade or business (irs-8960-inst-2025::sec::special-rules-for-certain-rental-income::b01,
 * ::b02; b02, item 2). No fact marks a lessee business that trades financial
 * instruments or commodities (special-rules-for-certain-rental-income::b02).
 * Undefined while an answer or a line waits.
 */
export function nonpassiveRentalAdjustments(
  form: FormAccessor<Form8960>,
  properties: RentalProperty[],
): number[] | undefined {
  const adjustments: number[] = [];
  for (const property of properties) {
    const line21 = form[`schedule-e.0.line.21_income_or_loss_${property.column}`];
    const income = typeof line21 === "number" ? line21 : undefined;
    // A passive self-rental only: a nonpassive one keeps the section 162 answer.
    const recharacterized =
      property.passive === true ? isSelfRentalNetIncome(property.value, income) : false;
    if (recharacterized === undefined) return undefined;
    const counts = recharacterized || section162Nonpassive(property);
    if (counts === undefined) return undefined;
    if (!counts) continue;
    // A prior-year loss allowed this year (b01, last bullet; a self-rental's too) is not modeled.
    if ((property.value.priorYearUnallowedLoss ?? 0) > 0) return undefined;
    if (income === undefined) return undefined;
    // A royalty has no line 22 (irs-1040se-inst-2025::sec::line-22::b01): its loss is on line 21.
    if (income >= 0 || property.value.propertyType === "royalties") {
      adjustments.push(0 - income);
      continue;
    }
    const loss = form[`schedule-e.0.line.22_deductible_loss_${property.column}`];
    if (typeof loss !== "number") return undefined;
    adjustments.push(loss);
  }
  return adjustments;
}
