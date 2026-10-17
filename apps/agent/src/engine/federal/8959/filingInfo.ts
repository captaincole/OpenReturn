/*
 * Form8959FilingInfo — Form 8959 (Additional Medicare Tax) specific
 * slots layered on top of BaseFilingInfo.
 *
 * Most 8959 inputs already live elsewhere:
 *   - Medicare wages (W-2 box 5): resolveFilingInfo sums them in the
 *     same pattern as w2WagesTotal / w2FederalWithholding. This file
 *     only adds the parallel box-5 slot.
 *   - Medicare tax withheld (W-2 box 6): likewise.
 *   - The filing-status threshold ($200k single / $250k MFJ / $125k
 *     MFS) is derived inside the binding from info.filingStatus, not
 *     stored as a slot. It is a pure lookup with no per-form variation.
 *
 * Self-employment and RRTA inputs (lines 8/14) stay unsupported until a
 * scenario with those facts exists.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../values.js";

export interface Form8959FilingInfo extends BaseFilingInfo {
  /** Sum of W-2 Box 5 (Medicare wages and tips) across all employers. */
  w2MedicareWagesTotal?: Money;

  /** Sum of W-2 Box 6 (Medicare tax withheld) across all employers. */
  w2MedicareTaxWithheld?: Money;
}
