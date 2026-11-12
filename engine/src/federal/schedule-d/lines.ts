import type { FilingStatus } from "../../values.js";

const LOSS_LIMIT = 3000;
const LOSS_LIMIT_MFS = 1500;

/*
 * Line 21: a loss on line 16, limited to $3,000 ($1,500 MFS). The form prints
 * it in parentheses, so the value is positive.
 */
export function allowableLoss(
  line16: number | undefined,
  filingStatus: FilingStatus | undefined,
): number | undefined {
  if (line16 === undefined || line16 >= 0 || !filingStatus) return undefined;
  const cap = filingStatus === "married_filing_separately" ? LOSS_LIMIT_MFS : LOSS_LIMIT;
  return Math.min(-line16, cap);
}

/* Form 1040 line 7a: line 16 if it is a gain, the (loss) on line 21 if line 16 is a loss. */
export function form1040Line7a(line16: number, line21: number | undefined): number | undefined {
  if (line16 >= 0) return line16;
  return line21 === undefined ? undefined : -line21;
}
