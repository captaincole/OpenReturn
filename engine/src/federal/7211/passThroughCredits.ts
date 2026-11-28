/*
 * Form 7211 line 10: "On a separate Form 7211, enter 'Credits From
 * Pass-Through Entities' on line 2a of Part I, and report your total
 * distributive share of the clean electricity production credit" from a
 * partnership K-1 box 15 code W, an S corporation K-1 box 13 code W, an estate
 * or trust K-1 box 13 code E, and Form 1099-PATR box 12
 * (irs-7211-inst-2025::sec::line-10::b01).
 *
 * - The partnership and S corporation codes are passThrough items with the
 *   detail clean_electricity_production, routed to Form 3800.
 * - The trust table names code E with the same detail, but routes no credit
 *   yet (passThrough/routing.ts), so a trust's credit is a gap here, as on
 *   Form 8586 line 4.
 * - Any other notice of the credit (Form 1099-PATR box 12): a stated Form 3800
 *   line 1gg credit that names its pass-through entity (passThroughEin).
 *
 * Each one rounds before line 10 adds: the DECISION of Form 8586 line 4
 * (8586/passThroughCredits.ts), applied the same way, since each is its own
 * whole-dollar row of Form 3800 line 1gg.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { Cell } from "../3800/cells.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";

export const FORM_3800_LINE = "1gg";
export const SOURCE_FORM = "7211 Part II";
/* The detail of code W (passThrough/partnershipBoxes.ts, sCorporationBoxes.ts) and of a trust's code E (trustBoxes.ts). */
export const K1_DETAIL = "clean_electricity_production";

const K1_AMOUNT_GAP =
  "A Schedule K-1 clean electricity production credit (code W) has no amount, so line 10 is not known.";
const TRUST_GAP = (names: string[]) =>
  `The K-1 of ${names.join(", ")} (Form 1041) has a clean electricity production credit (box 13 code E). The engine does not route an estate's or trust's credits yet.`;

/* The estates and trusts on the return whose K-1 has the credit. */
function trustsWithCredit(inputs: ResolverInputs): string[] {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint)
    .entities.filter(
      (entity) =>
        entity.form === "1041" &&
        entity.items.some((item) => item.detail === K1_DETAIL && (item.amount ?? 0) !== 0),
    )
    .map((entity) => entity.name);
}

/* Line 10, or its gap; blank with no pass-through credit. */
export function passThroughCreditOf(inputs: ResolverInputs): Cell {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_DETAIL,
  );
  if (k1.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  const trusts = trustsWithCredit(inputs);
  if (trusts.length > 0) return unsupported(TRUST_GAP(trusts));
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      value.line === FORM_3800_LINE &&
      value.sourceForm === SOURCE_FORM &&
      value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}
