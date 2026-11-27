/*
 * Form 8586 line 4: "Low-income housing credit from partnerships, S
 * corporations, estates, and trusts" (irs-8586-form-2025::sec::face-page-1::b01).
 *
 * - A partnership K-1, box 15 codes C and D: "Any allowable low-income housing
 *   credit reported using code C or D is reported on Form 8586, line 4; or Form
 *   3800, Part III, line 4d" (irs-1065k1-inst-2025::sec::box-15-credits::b02).
 * - An S corporation K-1, box 13 codes C and D: the same
 *   (irs-1120sk1-inst-2025::sec::box-13-credits::b02).
 * - An estate or trust K-1, box 13 code C: "Report this amount on Form 8586,
 *   line 4" (irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b01).
 *   The trust table has no route for it yet (passThrough/routing.ts), so the
 *   K-1 is a gap on Schedule E line 41, and here too.
 * - Any other notice of the credit: a stated Form 3800 line 4d credit that
 *   names its pass-through entity (passThroughEin), as Form 5884 line 3 does.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before line 4 adds.
 * Text A, the Form 1040 instructions: "If you have to add two or more amounts
 * to figure the amount to enter on a line, include cents when adding the
 * amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 5: "report this amount on Form 3800, Part III, line 4d"
 * (irs-8586-form-2025::sec::face-page-1::b01), where an aggregate "from more
 * than one pass-through entity" is broken down "by the EIN of the pass-through
 * entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01), one whole-dollar
 * amount for each K-1. The engine follows text B, as Form 8846 line 5 does
 * (row A96), so line 4 equals the K-1 rows of Form 3800 line 4d.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { Cell } from "../3800/cells.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";

export const FORM_3800_LINE = "4d";
const SOURCE_FORM = "8586";

/* The K-1 details of codes C and D (passThrough/partnershipBoxes.ts, sCorporationBoxes.ts). */
export const K1_LOW_INCOME_HOUSING_DETAILS: ReadonlyArray<string> = [
  "low_income_housing_42j5",
  "low_income_housing_other",
];
/* The detail of an estate or trust K-1's box 13 code C (passThrough/trustBoxes.ts). */
const TRUST_DETAIL = "low_income_housing";

const K1_AMOUNT_GAP =
  "A Schedule K-1 low-income housing credit (code C or D) has no amount, so line 4 is not known.";
const TRUST_GAP = (names: string[]) =>
  `The K-1 of ${names.join(", ")} (Form 1041) has a low-income housing credit (box 13 code C). The engine does not route an estate's or trust's credits yet, and the instructions do not say whether a beneficiary's share is a passive activity credit for Form 8582-CR (irs-8582cr-inst-2025::sec::material-participation::b06).`;

/* The estates and trusts on the return whose K-1 has a low-income housing credit. */
function trustsWithCredit(inputs: ResolverInputs): string[] {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint)
    .entities.filter(
      (entity) =>
        entity.form === "1041" &&
        entity.items.some((item) => item.detail === TRUST_DETAIL && (item.amount ?? 0) !== 0),
    )
    .map((entity) => entity.name);
}

/* Line 4, or its gap; blank with no pass-through credit. */
export function passThroughCreditOf(inputs: ResolverInputs): Cell {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(({ item }) =>
    K1_LOW_INCOME_HOUSING_DETAILS.includes(item.detail ?? ""),
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
