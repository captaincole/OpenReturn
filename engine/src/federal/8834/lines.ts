/*
 * Form 8834 (Rev. October 2024), lines 2 to 7: pure arithmetic. The form has
 * no yearly amounts or rates: the credit is the passive credit allowed (line
 * 1), limited to the regular tax left after the credits that come before it,
 * less the tentative minimum tax.
 */

import { atLeast, sumOrBlank } from "../../money.js";

export interface NetRegularTaxLines {
  /* Line 2: Form 1040 line 16 and Schedule 2 line 1z. */
  line2: number;
  /* Line 3a: the foreign tax credit; blank with none. */
  line3a?: number;
  /* Line 3b: certain allowable credits; blank with none. */
  line3b?: number;
  /* Line 3c: "Add lines 3a and 3b". */
  line3c: number;
  /* Line 4: "Subtract line 3c from line 2. If zero or less, enter -0-". */
  line4: number;
}

/* Lines 2 to 4 (irs-8834-form-2025::sec::face-page-1::b01, ::b02). */
export function netRegularTaxLines(
  line2: number,
  line3a: number | undefined,
  line3b: number | undefined,
): NetRegularTaxLines {
  const line3c = sumOrBlank(line3a, line3b) ?? 0;
  return { line2, line3a, line3b, line3c, line4: atLeast(0, line2 - line3c) };
}

export interface TaxLimitLines extends NetRegularTaxLines {
  /* Lines 5 and 6: blank when line 4 is 0 ("enter -0- here and on line 7"). */
  line5?: number;
  line6?: number;
}

/* Line 4 at 0 skips lines 5 and 6: "If zero or less, enter -0- here and on line 7" (face-page-1::b02). */
export const skipsToLine7 = (net: NetRegularTaxLines) => net.line4 === 0;

/* Line 6: "Subtract line 5 from line 4. If zero or less, enter -0- here and on line 7" (face-page-1::b02). */
export function taxLimitLines(net: NetRegularTaxLines, line5: number): TaxLimitLines {
  if (skipsToLine7(net)) return net;
  return { ...net, line5, line6: atLeast(0, net.line4 - line5) };
}

/*
 * Line 7: "Enter the smaller of line 1 or line 6"; -0- when line 4 or line 6
 * is zero (face-page-1::b02). What line 6 leaves of line 1 "is lost. The
 * unused or excess credit can't be carried back or forward to other tax
 * years" (irs-8834-form-2025::sec::line-7::b01).
 */
export function line7Of(line1: number, limit: TaxLimitLines): number {
  return limit.line6 === undefined ? 0 : Math.min(line1, limit.line6);
}
