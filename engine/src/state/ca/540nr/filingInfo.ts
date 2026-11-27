/*
 * Form 540NR reads most of its values the way Form 540 does (the Form 540
 * slots below), and three of its own.
 */

import type { Form540FilingInfo } from "../540/filingInfo.js";

export interface Form540NRFilingInfo extends Form540FilingInfo {
  /*
   * The California forms this return needs that the engine figures for Form 540
   * only (californiaForms.ts); a line that takes one is a named gap. Undefined
   * when Form 540NR does not file.
   */
  formsNeededOnly540?: string[];
  /* Line 12: W-2 box 16 of the W-2s whose box 15 names California or no state. */
  w2CaliforniaWages?: number;
  /* Line 81: W-2 box 17 of the same W-2s, plus the other forms' California withholding. */
  californiaTaxWithheld?: number;
}
