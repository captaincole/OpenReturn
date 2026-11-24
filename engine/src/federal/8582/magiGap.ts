/*
 * Form 8582 line 6 (modified AGI) is a gap on a return that needs it and has a
 * Schedule K-1. Line 6 is used only in Part II, when Part IV's rental real
 * estate with active participation has a loss (line 1d) and line 3 is a loss
 * (irs-8582-inst-2025::sec::part-ii-special-allowance-for-rental::b01). magi.ts
 * builds line 6 from AGI's parts and does not yet count every K-1 amount the
 * way irs-8582-inst-2025::sec::line-6::b01 asks (QUESTIONS.md item 43), so
 * line 6, the lines that read it (7 to 9, 11, Parts VI to VIII) and Schedule
 * E's allowed rental loss are this gap rather than an amount from a blank.
 * A return with no K-1, or with no Part IV loss, is unchanged.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { FieldReader } from "./allocation.js";

export const MAGI_WITH_K1_GAP =
  "Modified adjusted gross income (Form 8582 line 6) is not modeled for a return with both a rental real estate loss that takes the special allowance and a Schedule K-1.";

/* What the gap reads besides Form 8582's lines: the K-1s and the MFS caution's answers. */
export interface MagiGapInfo {
  passThroughEntities?: ReadonlyArray<unknown>;
  filingStatus?: string;
  livedApartFromSpouseAllYear?: boolean;
}

/* The gap, or undefined when line 6 is not needed or the return has no K-1. */
export function magiWithK1Gap(read: FieldReader, info: MagiGapInfo): Unsupported | undefined {
  if ((info.passThroughEntities ?? []).length === 0) return undefined;
  const line3 = numberOrBlank(read("form-8582.0.line.3_combined"));
  const line1d = numberOrBlank(read("form-8582.0.line.1d_rental_combined"));
  if (line3 === undefined || line3 >= 0 || (line1d ?? 0) >= 0) return undefined;
  // MFS spouses who lived together at any time skip Part II (part-ii-special-allowance-for-rental::b01).
  const mfs = info.filingStatus === "married_filing_separately";
  if (mfs && info.livedApartFromSpouseAllYear !== true) return undefined;
  return unsupported(MAGI_WITH_K1_GAP);
}
