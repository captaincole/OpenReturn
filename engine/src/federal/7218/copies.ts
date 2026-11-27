/*
 * The copies of Form 7218 a return files: one for each qualified facility
 * ("File a separate Form 7218 for each qualified facility",
 * irs-7218-inst-2025::sec::how-to-claim-the-credit::b02), then one separate
 * form for the credits from pass-through entities: "On a separate Form 7218
 * enter 'Credits from Pass-Through Entities' on line 2a of Part I and report
 * your total distributive share" (part-ii-clean-aviation-and::b01).
 *
 * The pass-through credits are a K-1's box 15 code X (Form 1065), box 13
 * code X (Form 1120-S) or box 13 code L (Form 1041), and a stated Form 3800
 * line 1q credit that names its entity's EIN (a cooperative's Form 1099-PATR
 * box 12). Form 3800 keeps each as its own line 1q source (3800/sources.ts),
 * so this copy only prints their total and adds nothing to Form 3800.
 */

import {
  getCleanFuelFacilityFacts,
  getGeneralBusinessCreditFacts,
  type CleanFuelFacilityFact,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Unsupported } from "../../types.js";
import { addCells } from "../3800/cells.js";
import { k1CreditAmount } from "../3800/k1Credits.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { PART_II_FIELDS, type Cells } from "./cells.js";
import { line3Of } from "./lines.js";
import { partIOf, passThroughPartI } from "./partI.js";
import { partIIIOf } from "./partIII.js";

/* The Form 3800 Part III line of the credit (irs-7218-face-2025::sec::face-part-ii::b01, line 3). */
export const FORM_3800_LINE = "1q";
/* The K-1 detail of a clean fuel production credit (passThrough box tables). */
export const K1_DETAIL = "clean_fuel_production";
export const PASS_THROUGH_COPY = "pass_through";

export interface Form7218Copy {
  /* The facility fact, or PASS_THROUGH_COPY for the separate form. */
  key: string;
  cells: Cells;
  /* Line 3, the amount for Form 3800 line 1q; undefined while the copy waits. */
  line3?: number | Unsupported;
  waiting: boolean;
}

/* A qualified facility: no section 45V, 45Q or 48(a)(15) credit for it this year (qualified-facility::b01). */
export const qualifiedFacilities = (inputs: ResolverInputs): CleanFuelFacilityFact[] =>
  getCleanFuelFacilityFacts(inputs.facts).filter((fact) => !fact.value.otherFacilityCreditAllowed);

/* One facility's Form 7218: Part I, Part III, and Part II lines 1 and 3 (line 2 is on the separate form). */
export function facilityCopy(fact: CleanFuelFacilityFact): Form7218Copy {
  const partIII = partIIIOf(fact.value);
  const line25 = partIII.line25;
  const line3 = typeof line25 === "number" ? line3Of(line25, 0) : line25;
  const cells: Cells = {
    ...partIOf(fact.value, partIII.provisional),
    ...partIII.cells,
    [PART_II_FIELDS.line1]: line25,
    [PART_II_FIELDS.line3]: line3,
  };
  return { key: fact.key, cells, line3, waiting: partIII.waiting };
}

/* The pass-through credits' total (line 2), or undefined with none. */
export function passThroughCreditOf(inputs: ResolverInputs): number | Unsupported | undefined {
  const fromK1 = k1EntitiesWithRoute(inputs, "form_3800")
    .filter((received) => received.item.detail === K1_DETAIL)
    .map((received) => k1CreditAmount(received.item.detail, received.item.amount));
  const stated = getGeneralBusinessCreditFacts(inputs.facts)
    .filter(({ value }) => value.line === FORM_3800_LINE && value.passThroughEin !== undefined)
    .map(({ value }) => roundDollars(value.amount));
  return addCells(...fromK1, ...stated);
}

/* The separate form for the pass-through credits, or undefined with none. */
export function passThroughCopy(inputs: ResolverInputs): Form7218Copy | undefined {
  const line2 = passThroughCreditOf(inputs);
  if (line2 === undefined) return undefined;
  const line3 = typeof line2 === "number" ? line3Of(0, line2) : line2;
  const cells: Cells = {
    ...passThroughPartI(),
    [PART_II_FIELDS.line2]: line2,
    [PART_II_FIELDS.line3]: line3,
  };
  return { key: PASS_THROUGH_COPY, cells, waiting: false };
}
