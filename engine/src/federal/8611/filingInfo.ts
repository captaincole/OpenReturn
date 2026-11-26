import type { LowIncomeHousingBuilding } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Line2Worksheet, OwnPartLines, RecaptureLines } from "./lines.js";

/*
 * One Form 8611: one building's recapture (irs-8611-form-2025::sec::face-page-1::b01).
 * A building the owner figures has `own` (lines 1 to 7); a K-1's recapture has
 * line8. Lines 16 and 17 are a section 42(j)(5) partnership's and stay blank.
 */
export interface Form8611Copy {
  /* Items C to F; absent while the building fact waits. */
  building?: LowIncomeHousingBuilding;
  own?: OwnPartLines;
  /* The Line 2 Worksheet, printed when exactly one prior year has one. */
  worksheet?: Line2Worksheet;
  line8?: number;
  /* The K-1 recapture is from a section 42(j)(5) partnership: line 11 is 0 (line-11::b01). */
  section42j5?: boolean;
  recapture?: RecaptureLines;
  /* The fact keys this copy waits on: its lines are blank. */
  waitingOn?: string[];
  /* This line and every later one are unsupported, for this reason (0: the whole form). */
  gap?: { fromLine: number; reason: string };
}

export interface Form8611FilingInfo extends BaseFilingInfo {
  /* One Form 8611 for each building fact that recaptures and each K-1 recapture, in that order. */
  form8611Copies?: ReadonlyArray<Form8611Copy>;
  /* The copy being evaluated (federal/index.ts copies); absent means the first. */
  form8611CopyIndex?: number;
}
