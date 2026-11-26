/*
 * "Complete and attach as many copies of Part III as needed" and "a Part IV
 * for each bond you held or bond credits received from a pass-through entity"
 * (irs-8912-inst-2025::sec::part-iii-bond-credit-s-reported-to-you-on::b01,
 * ::part-iv-bonds-credits-from-bonds-held-by-you::b01). The first copy is the
 * whole form; each later copy appends pages 2 and 3 only. Copy n prints Part
 * III rows 20n to 20n + 19 and the nth Part IV.
 */

import type { Form8912Inputs } from "./filingInfo.js";
import { PART_III_ROWS } from "./lines.js";

/* The copies the form needs: enough for every Part III row and one for each Part IV, at least one. */
export function form8912CopyCount(inputs: Form8912Inputs | undefined): number {
  if (inputs === undefined) return 1;
  let partIIICopies = 0;
  while (partIIICopies * PART_III_ROWS < inputs.partIII.length) partIIICopies += 1;
  return Math.max(1, partIIICopies, inputs.partIV.length);
}
