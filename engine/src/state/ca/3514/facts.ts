/*
 * The amounts FTB 3514 takes from the documents: Part IV's wages (line 13),
 * the W-2 boxes lines 15, 17 and 23a test, and the business lines 18a–18e
 * name. Each is a pure function of the resolver's facts.
 */

import {
  businessesOnReturn,
  isW2FactKey,
  type BusinessFactValue,
  type W2FactValue,
} from "../../../facts/index.js";
import {
  disabilityAnswersComplete,
  disabilityPensions,
  disabilityWages,
} from "../../../federal/1040/disabilityPensions.js";
import { netProfit } from "../../../federal/schedule-c/lines.js";
import { sum } from "../../../money.js";
import { factsInCategory, type ResolverInputs } from "../../../resolverInputs.js";
import type { CaEitcBusiness } from "./filingInfo.js";

// W-2 box 12 code Q: nontaxable combat pay.
const COMBAT_PAY_CODE = "Q";
// W-2 box 12 code II: Medicaid waiver payments excluded from income.
const MEDICAID_WAIVER_CODE = "II";

export function w2Facts(inputs: ResolverInputs): W2FactValue[] {
  return factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue);
}

/* A W-2 whose box 15 is California: its box 16 wages were subject to California withholding. */
export const isCaliforniaW2 = (w2: W2FactValue) => w2.box15?.trim().toUpperCase() === "CA";

/*
 * Line 13 (ca-3514-inst-2025::sec::line-13::b01): "the total amount of your
 * California wages from your federal Form(s) W-2 ... box 16", plus a
 * disability payment on a 1099-R with code 3 before the minimum retirement
 * age. Undefined while a disability pension's age answer is missing. Medicaid
 * waiver and IHSS payments have no fact kind, and clergy wages are not modeled.
 */
export function caEitcWages(inputs: ResolverInputs): number | undefined {
  const pensions = disabilityPensions(inputs);
  if (!disabilityAnswersComplete(pensions)) return undefined;
  const boxes16 = w2Facts(inputs)
    .filter(isCaliforniaW2)
    .map((w2) => w2.box16);
  return sum(...boxes16, pensions.length > 0 ? disabilityWages(pensions) : 0);
}

/* W-2 box 11 on the California W-2s: line 15's nonqualified plan pension "may be shown" there. */
export function nonqualifiedPlanBox11(inputs: ResolverInputs): number {
  return sum(
    ...w2Facts(inputs)
      .filter(isCaliforniaW2)
      .map((w2) => w2.box11),
  );
}

/* A W-2 box 12 code's amounts on any W-2; undefined when no W-2 reports the code. */
function box12Code(inputs: ResolverInputs, code: string): number | undefined {
  const entries = w2Facts(inputs)
    .flatMap((w2) => w2.box12 ?? [])
    .filter((entry) => entry.code.trim().toUpperCase() === code);
  return entries.length === 0 ? undefined : sum(...entries.map((entry) => entry.amount));
}

/* W-2 box 12 code Q: nontaxable combat pay (line 17's election). */
export const combatPay = (inputs: ResolverInputs) => box12Code(inputs, COMBAT_PAY_CODE);

/* W-2 box 12 code II: Medicaid waiver payments excluded from income (lines 13 and 14). */
export const medicaidWaiverPayments = (inputs: ResolverInputs) =>
  box12Code(inputs, MEDICAID_WAIVER_CODE);

/* Line 23a's "Wages not subject to California withholding": box 1 of the W-2s with no California box 15. */
export function wagesOutsideCalifornia(inputs: ResolverInputs): number {
  return sum(
    ...w2Facts(inputs)
      .filter((w2) => !isCaliforniaW2(w2))
      .map((w2) => w2.box1),
  );
}

const businessLines = (business: BusinessFactValue): CaEitcBusiness => ({
  name: business.name,
  street: business.address?.street,
  city: business.address?.city,
  state: business.address?.state,
  zip: business.address?.zip,
  code: business.code,
});

/*
 * Lines 18a–18e (ca-3514-inst-2025::sec::worksheet-3::b01): "If you have
 * multiple businesses, use the information from the schedule with the largest
 * net profit (loss)". Schedule C line 31 decides; undefined while a line 31 is
 * blank, or with no business.
 */
export function largestBusiness(
  inputs: ResolverInputs,
  joint: boolean,
): CaEitcBusiness | undefined {
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const values = businesses.map((business) => business.value);
  const profits = values.map((value) => netProfit(value, values));
  if (values.length === 0 || profits.includes(undefined)) return undefined;
  const best = profits.indexOf(Math.max(...(profits as number[])));
  return businessLines(values[best]!);
}
