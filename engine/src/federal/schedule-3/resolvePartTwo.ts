/*
 * The resolver side of Schedule 3 lines 10 and 11: the amounts in whole
 * dollars, from the facts alone, so that Schedule 3 and Form 1040 line 31 both
 * read them from the filing info (partTwo.ts).
 */

import { ESTIMATED_TAX_KEYS, isW2FactKey, type W2FactValue } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { factsInCategory, num, w2Owner, type ResolverInputs } from "../../resolverInputs.js";
import { excessSocialSecurityOf, type ExcessSocialSecurity } from "./excessSocialSecurity.js";
import type { Schedule3PartTwoInfo } from "./filingInfo.js";

const UNPLACED_W2_GAP =
  "A W-2 on this joint return names neither spouse, and line 11 is figured separately for each spouse (irs-1040-inst-2025::sec::line-11-2::b01).";

const PEOPLE = ["taxpayer", "spouse"] as const;

/* Line 10: the payment with an extension (irs-1040-inst-2025::sec::line-10-4::b01); undefined with none. */
function extensionPayment(inputs: ResolverInputs): number | undefined {
  const paid = num(inputs, ESTIMATED_TAX_KEYS.extensionPayment);
  return paid !== undefined && paid > 0 ? roundDollars(paid) : undefined;
}

/*
 * Line 11: each person's excess, then the two added and rounded once, as a
 * document sum (CLAUDE.md, whole-dollar rounding). A W-2 that no spouse owns
 * is a gap only when the W-2s could give an excess: taken as one person's,
 * they have one.
 */
function excessSocialSecurity(inputs: ResolverInputs): ExcessSocialSecurity {
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue);
  if (w2s.some((w2) => w2Owner(inputs, w2) === undefined)) {
    const together = excessSocialSecurityOf(w2s);
    return "amount" in together && together.amount === 0 ? together : { gap: UNPLACED_W2_GAP };
  }
  const people = PEOPLE.map((person) =>
    excessSocialSecurityOf(w2s.filter((w2) => w2Owner(inputs, w2) === person)),
  );
  const gap = people.find((person) => "gap" in person);
  if (gap !== undefined) return gap;
  return { amount: sum(...people.map((person) => ("amount" in person ? person.amount : 0))) };
}

export function resolveSchedule3PartTwo(inputs: ResolverInputs): Schedule3PartTwoInfo {
  const excess = excessSocialSecurity(inputs);
  const amount = "amount" in excess ? roundDollars(excess.amount) : 0;
  return {
    schedule3ExtensionPayment: extensionPayment(inputs),
    schedule3ExcessSocialSecurity: amount > 0 ? amount : undefined,
    schedule3ExcessSocialSecurityGap: "gap" in excess ? excess.gap : undefined,
  };
}
