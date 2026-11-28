/*
 * Form 8835 line 14: "On a separate Form 8835, enter 'Credits From
 * Pass-Through Entities' on line 2a of Part I and report your total
 * distributive share of the renewable electricity production credit from
 * partnerships, S corporations, estates, and trusts from: Schedule K-1 (Form
 * 1065) ... box 15 (code AB); Schedule K-1 (Form 1120-S) ... box 13 (code AB);
 * Schedule K-1 (Form 1041) ... box 13 (code J); and Form 1099-PATR ... box 12"
 * (irs-8835-inst-2025::sec::line-14::b01).
 *
 * - Partnership and S corporation K-1s: the code AB items (passThrough box
 *   tables, detail renewable_electricity_production), already Form 3800
 *   sources of their own on line 1f (3800/k1Credits.ts).
 * - An estate or trust K-1, box 13 code J: "The fiduciary must provide you
 *   with a statement showing the amount of credit to report on Form 8835,
 *   line 14 (including the allocation ... for production during the 4-year
 *   period ...)" (irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b02).
 *   The trust table has no route for it, so line 14 is a gap.
 * - Any other notice (a Form 1099-PATR box 12, a K-1 stated by hand): a stated
 *   Form 3800 line 1f or 4e credit from Form 8835 that names its pass-through
 *   entity (passThroughEin), as Form 8586 line 4 takes them.
 *
 * Each K-1 rounds before line 14 adds, as Form 8586 line 4 and Form 8846 line
 * 5 do (rule-decisions rows A96 and A109): line 14 then equals the rows Form
 * 3800 Part V lists for each entity.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { Cell } from "../3800/cells.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";

/* Form 3800 Part III lines 4e and 1f and their source as a fact names it (3800/rows.ts). */
export const FIRST_FOUR_YEARS_LINE = "4e";
export const LATER_YEARS_LINE = "1f";
export const SOURCE_FORM = "8835 Part II";
const FORM_3800_LINES: ReadonlyArray<string> = [FIRST_FOUR_YEARS_LINE, LATER_YEARS_LINE];

/* The K-1 detail of code AB (passThrough/partnershipBoxes.ts, sCorporationBoxes.ts) and code J (trustBoxes.ts). */
export const K1_RENEWABLE_ELECTRICITY_DETAIL = "renewable_electricity_production";

const K1_AMOUNT_GAP =
  "A Schedule K-1 renewable electricity production credit (code AB) has no amount, so line 14 is not known.";
const TRUST_GAP = (names: string[]) =>
  `The K-1 of ${names.join(", ")} (Form 1041) has a renewable electricity production credit (box 13 code J), which the fiduciary's statement splits between the 4-year period and later production (irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b02); the engine does not route an estate's or trust's credits yet.`;

/* A stated Form 3800 credit from Form 8835: a pass-through notice when it names its entity. */
export const isStatedForm8835Credit = (value: { line: string; sourceForm: string }) =>
  FORM_3800_LINES.includes(value.line) && value.sourceForm === SOURCE_FORM;

/* The estates and trusts on the return whose K-1 has the credit. */
function trustsWithCredit(inputs: ResolverInputs): string[] {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint)
    .entities.filter(
      (entity) =>
        entity.form === "1041" &&
        entity.items.some(
          (item) => item.detail === K1_RENEWABLE_ELECTRICITY_DETAIL && (item.amount ?? 0) !== 0,
        ),
    )
    .map((entity) => entity.name);
}

/* Line 14, or its gap; blank with no pass-through credit. */
export function passThroughCreditOf(inputs: ResolverInputs): Cell {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_RENEWABLE_ELECTRICITY_DETAIL,
  );
  if (k1.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  const trusts = trustsWithCredit(inputs);
  if (trusts.length > 0) return unsupported(TRUST_GAP(trusts));
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) => isStatedForm8835Credit(value) && value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}
