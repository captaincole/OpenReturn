/* Schedule CA (540) line 7a columns B and C, from Schedule D (540). FTB 3461 line 3 reads them too. */

import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";

/* MANUAL EDIT: line 7a columns B and C with no Schedule D (540), as before it had rules. */
export const LINE_7A_SUBTRACTIONS_GAP =
  "CA vs. federal capital gain adjustments (e.g. differences in depreciation recapture, installment sale basis, or CA-only exclusions) require Schedule D CA-specific computations or FTB 3885A data we have not ingested yet.";
export const LINE_7A_ADDITIONS_GAP =
  "CA vs. federal capital gain additions (e.g. CA-only gain recognition differences) require Schedule D CA-specific computations we have not ingested yet.";

/*
 * MANUAL EDIT: line 7a column B takes Schedule D (540) line 12a and column C
 * line 12b (ca-540-sched-d-inst-2025::sec::line-12a::b01, ::line-12b::b01;
 * ca-540-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01). With no
 * Schedule D (540), the column stays unsupported: the engine finds no
 * California difference, but it models only some of them.
 */
export function scheduleDCaAdjustment(
  form: Record<string, unknown>,
  info: ScheduleCaFilingInfo,
  line: "12a" | "12b",
  noScheduleD: string,
) {
  if (info.mustFile?.["schedule-d-ca"]?.value !== true) return unsupported(noScheduleD);
  const gap = info.scheduleDCaFigures?.gap;
  if (gap !== undefined) return unsupported(gap);
  return numberOrBlank(form[`schedule-d-ca.3.line.${line}`]);
}
