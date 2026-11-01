import type { FilingStatus } from "../../values.js";

/* Line 21: a loss on line 16, limited to $3,000 ($1,500 MFS). */
export function allowableLoss(
  line16: number | undefined,
  filingStatus: FilingStatus | undefined,
): number | undefined {
  if (line16 === undefined || line16 >= 0 || !filingStatus) return undefined;
  const cap = filingStatus === "married_filing_separately" ? 1500 : 3000;
  return Math.max(line16, -cap);
}

/* Form 1040 line 7a: line 16 if it is a gain, line 21 if it is a loss. */
export const form1040Line7a = (line16: number, line21: number | undefined): number | undefined =>
  line16 >= 0 ? line16 : line21;
