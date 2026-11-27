/*
 * Line 7: "Advanced manufacturing production credit from partnerships, S
 * corporations, estates, and trusts", on a separate Form 7207
 * (irs-7207-inst-2025::sec::line-7::b01):
 *
 * - a partnership K-1, box 15 code V, and an S corporation K-1, box 13 code
 *   V: the business_credit items with this detail (passThrough box tables),
 *   which Form 3800 line 1b also takes as its own K-1 sources
 *   (3800/k1Credits.ts), each with its entity's EIN;
 * - an estate or trust K-1, box 13 code D: the trust table has no route for
 *   it yet (passThrough/routing.ts), so the K-1 is a gap here;
 * - any other notice of the credit: a stated Form 3800 line 1b credit that
 *   names its pass-through entity (passThroughEin), as Form 8586 line 4 does.
 *
 * Each K-1 rounds before line 7 adds, so line 7 equals the K-1 rows of Form
 * 3800 line 1b: the rule Form 8586 line 4 follows (8586/passThroughCredits.ts).
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";

/* Form 3800 Part III line 1b, Form 7207 (3800/rows.ts). */
export const FORM_3800_LINE = "1b";
const SOURCE_FORM = "7207";

/* The detail of box 15 / box 13 code V and of a trust K-1's box 13 code D (passThrough box tables). */
export const ADVANCED_MANUFACTURING_DETAIL = "advanced_manufacturing_production";

const K1_AMOUNT_GAP =
  "A Schedule K-1 advanced manufacturing production credit (code V) has no amount, so line 7 is not known.";
const TRUST_GAP = (names: string[]) =>
  `The K-1 of ${names.join(", ")} (Form 1041) has an advanced manufacturing production credit (box 13 code D). The engine does not route an estate's or trust's credits to Form 3800 yet.`;

function trustsWithCredit(inputs: ResolverInputs): string[] {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint)
    .entities.filter(
      (entity) =>
        entity.form === "1041" &&
        entity.items.some(
          (item) => item.detail === ADVANCED_MANUFACTURING_DETAIL && (item.amount ?? 0) !== 0,
        ),
    )
    .map((entity) => entity.name);
}

/* Line 7, or its gap; blank with no credit from a pass-through entity. */
export function passThroughCreditOf(inputs: ResolverInputs): number | Unsupported | undefined {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === ADVANCED_MANUFACTURING_DETAIL,
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
    ...k1.map(({ item }) => roundDollars(item.amount ?? 0)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}
