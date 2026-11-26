/*
 * Form 3800 Parts I and II: pure arithmetic on the lines the form prints
 * (irs-3800-face-2025::sec::face-part-i::b01, face-part-ii::b01, ::b02,
 * face-part-ii-2::b01 to ::b04). Each line is a Cell: a gap in a line it reads
 * makes it a gap too. A blank line counts 0.
 */

import { atLeast, roundDollars } from "../../money.js";
import {
  addCells,
  figure,
  greaterOf,
  smallerOf,
  subtractedAtLeastZero,
  totalOf,
  type Cell,
} from "./cells.js";

/* Line 13: "Enter 25% (0.25) of the excess, if any, of line 12 ... over $25,000" (face-part-ii::b02). */
export const NET_REGULAR_TAX_RATE = 0.25;
export const NET_REGULAR_TAX_FLOOR = 25_000;
/* Line 18: "Multiply line 14 by 75% (0.75)" (face-part-ii-2::b01). */
export const EMPOWERMENT_ZONE_TMT_RATE = 0.75;

export interface PartILines {
  line1: Cell;
  line2: Cell;
  line3: Cell;
  line4: Cell;
  line5: Cell;
  line6: Cell;
}

/* Line 6: "Add lines 1, 3, 4, and 5" (face-part-i::b01). */
export function partI(lines: Omit<PartILines, "line6">): PartILines {
  return { ...lines, line6: totalOf(lines.line1, lines.line3, lines.line4, lines.line5) };
}

export interface TaxInputs {
  line7: number;
  line8: Cell;
  line10a: Cell;
  line10b: Cell;
  /* Form 6251 line 9; a gap when Form 6251 does not file. */
  line14: Cell;
}

export interface SectionALines {
  line7: number;
  line8: Cell;
  line9: Cell;
  line10a: Cell;
  line10b: Cell;
  line10c: Cell;
  line11: Cell;
  line12: Cell;
  line13: Cell;
  line14: Cell;
  line15: Cell;
  line16: Cell;
  line17: Cell;
}

/* Line 13: 25% of line 12 over $25,000, nearest dollar. */
export const line13Of = (line12: number) =>
  roundDollars(NET_REGULAR_TAX_RATE * atLeast(0, line12 - NET_REGULAR_TAX_FLOOR));

/*
 * Lines 7–17. Line 11: "If zero, skip lines 12 through 15 and enter -0- on line
 * 16". Line 17 is the smaller of line 6 and line 16; with line 6 at 0 it is 0
 * whatever line 16 holds, so a missing Form 6251 does not stop it.
 */
export function sectionA(tax: TaxInputs, line6: Cell): SectionALines {
  const line9 = totalOf(tax.line7, tax.line8);
  const line10c = addCells(tax.line10a, tax.line10b);
  const line11 = subtractedAtLeastZero(line9, line10c);
  const line12 = subtractedAtLeastZero(tax.line7, line10c);
  const line13 = figure(line13Of, line12);
  const line15 = greaterOf(line13, tax.line14);
  const skip = line11 === 0;
  const line16 = skip ? 0 : subtractedAtLeastZero(line11, line15);
  const line17 = line6 === 0 || line6 === undefined ? 0 : smallerOf(line6, line16);
  return {
    ...tax,
    line9,
    line10c,
    line11,
    line12: skip ? undefined : line12,
    line13: skip ? undefined : line13,
    line14: skip ? undefined : tax.line14,
    line15: skip ? undefined : line15,
    line16,
    line17,
  };
}

export interface SectionBInputs {
  line22: Cell;
  line23: Cell;
  line24: Cell;
}

export interface SectionBLines extends SectionBInputs {
  line18: Cell;
  line19: Cell;
  line20: Cell;
  line21: Cell;
  line25: Cell;
  line26: Cell;
}

/*
 * Lines 18–26. "If you are not required to report any amounts on line 22 or
 * line 24 below, skip lines 18 through 25 and enter -0- on line 26"
 * (face-part-ii-2::b01).
 */
export function sectionB(
  sectionALines: SectionALines,
  tmt: Cell,
  inputs: SectionBInputs,
): SectionBLines {
  const none = { line18: undefined, line19: undefined, line20: undefined, line21: undefined };
  if (inputs.line22 === undefined && inputs.line24 === undefined && inputs.line23 === undefined) {
    return { ...none, ...inputs, line25: undefined, line26: 0 };
  }
  const line13 = sectionALines.line13 ?? figure(line13Of, sectionALines.line12);
  const line18 = figure((value) => roundDollars(value * EMPOWERMENT_ZONE_TMT_RATE), tmt);
  const line19 = greaterOf(line13, line18);
  const line20 = subtractedAtLeastZero(sectionALines.line11, line19);
  const line21 = subtractedAtLeastZero(line20, sectionALines.line17);
  const line25 = addCells(inputs.line22, inputs.line24);
  const line26 = smallerOf(line21, line25);
  return { ...inputs, line18, line19, line20, line21, line25, line26 };
}

export interface SectionCInputs {
  line30: Cell;
  line32: Cell;
  line33: Cell;
  line34: Cell;
  line35: Cell;
}

export interface SectionCLines extends SectionCInputs {
  line27: Cell;
  line28: Cell;
  line29: Cell;
  line36: Cell;
  line37: Cell;
  line38: Cell;
}

/* Lines 27–38 (face-part-ii-2::b02 to ::b04). Line 31 is reserved. */
export function sectionC(
  sectionALines: SectionALines,
  sectionBLines: SectionBLines,
  inputs: SectionCInputs,
): SectionCLines {
  const line27 = subtractedAtLeastZero(sectionALines.line11, sectionALines.line13 ?? 0);
  const line28 = totalOf(sectionALines.line17, sectionBLines.line26);
  const line29 = subtractedAtLeastZero(line27, line28);
  const line36 = totalOf(inputs.line30, inputs.line33, inputs.line34, inputs.line35);
  const line37 = smallerOf(line29, line36);
  const line38 = totalOf(line28, line37);
  return { ...inputs, line27, line28, line29, line36, line37, line38 };
}

/* The tier limits that split the allowed credit among rows: lines 17, 26 and 37. */
export interface TierLimits {
  general: Cell;
  empowerment: Cell;
  specified: Cell;
}

export const tierLimitsOf = (
  sectionALines: SectionALines,
  sectionBLines: SectionBLines,
  sectionCLines: SectionCLines,
): TierLimits => ({
  general: sectionALines.line17,
  empowerment: sectionBLines.line26,
  specified: sectionCLines.line37,
});
