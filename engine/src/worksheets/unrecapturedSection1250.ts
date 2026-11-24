/*
 * The Unrecaptured Section 1250 Gain Worksheet—Line 19 of the Schedule D
 * instructions (irs-1040sd-inst-2025::sec::unrecaptured-section-1250-gain-worksheet-line-19::b01–b04).
 * Line 18 goes on Schedule D line 19. Every input is whole dollars.
 */

import { atLeast, sum } from "../money.js";

/* One section 1250 property in Form 4797 Part III that sends gain to Part I. */
export interface Section1250Property {
  line22: number;
  line24: number;
  line26g: number;
}

export interface Unrecaptured1250Inputs {
  /* Form 4797 line 7, when it is a gain; else undefined (lines 1–9 are skipped). */
  form4797Line7Gain?: number;
  /* Form 4797 line 8, when entered. */
  form4797Line8?: number;
  section1250Properties: Section1250Property[];
  /* Line 4: Form 6252 installment sales of trade or business property. */
  installmentSales: number;
  /* Line 5: "unrecaptured section 1250 gain" on a K-1 from a partnership or an S corporation. */
  partnershipOrSCorporation: number;
  /* Line 10: the sale of an interest in a partnership. */
  partnershipInterestSale: number;
  /* Line 11: a K-1 from an estate or trust, Form 1099-DIV box 2b, Form 2439 or a Form 1099-R. */
  reportedOnStatements: number;
  /* Line 12: section 1250 property held more than 1 year with no entry in Form 4797 Part I. */
  notInPartI: number;
  /* Line 14: lines 1–4 of the 28% Rate Gain Worksheet, or 0. */
  rate28Gain: number;
  /* Line 15: the loss on Schedule D line 7, as a positive amount; 0 for a gain. */
  scheduleDLine7Loss: number;
  /* Line 16: Schedule D line 14 (and a Form 1041 K-1 box 11 code D), positive. */
  longTermLossCarryover: number;
}

export interface Unrecaptured1250Result {
  line3: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line13: number;
  line17: number;
  line18: number;
}

/*
 * Lines 1–3 for each property, the line 3 amounts added (lines-1-through-3::b01):
 * the smaller of Form 4797 line 22 or line 24, less line 26g.
 */
export function line3Total(properties: ReadonlyArray<Section1250Property>): number {
  return sum(
    ...properties.map((each) => atLeast(0, Math.min(each.line22, each.line24) - each.line26g)),
  );
}

export function unrecapturedSection1250Gain(
  inputs: Unrecaptured1250Inputs,
): Unrecaptured1250Result {
  // "If you aren't reporting a gain on Form 4797, line 7, skip lines 1 through 9 and go to line 10."
  const reportsGain = inputs.form4797Line7Gain !== undefined && inputs.form4797Line7Gain > 0;
  const line3 = reportsGain ? line3Total(inputs.section1250Properties) : 0;
  const line6 = reportsGain
    ? line3 + inputs.installmentSales + inputs.partnershipOrSCorporation
    : 0;
  const line7 = reportsGain ? Math.min(line6, inputs.form4797Line7Gain ?? 0) : 0;
  const line8 = reportsGain ? (inputs.form4797Line8 ?? 0) : 0;
  const line9 = atLeast(0, line7 - line8);
  const line13 =
    line9 + inputs.partnershipInterestSale + inputs.reportedOnStatements + inputs.notInPartI;
  // Line 17: lines 14 through 16 combined, a (loss) entered as a positive amount.
  const line17 = atLeast(
    0,
    inputs.scheduleDLine7Loss + inputs.longTermLossCarryover - inputs.rate28Gain,
  );
  return { line3, line6, line7, line8, line9, line13, line17, line18: atLeast(0, line13 - line17) };
}
