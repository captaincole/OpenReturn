/*
 * Schedule D (540NR): "Full-year nonresidents or part-year residents report
 * gains and losses as if they were full-year residents for the entire year
 * using California amounts. Therefore, all gains and losses must be reported"
 * (ca-540nr-sched-d-inst-2025::sec::purpose::b01). So the lines are Schedule D
 * (540)'s on the same sales: the arithmetic is in ../schedule-d-ca/lines.ts,
 * and each rule here names the 540NR block that says the same.
 *
 * - Line 1, columns (b) to (e): ::line-1::b01 to ::line-1::b04 (California basis).
 * - Line 3: ::line-3-capital-gain-distributions::b01 (1099-DIV box 2a, no Form 2439).
 * - Line 6: ::line-6-california-capital-loss-carryover-from-2024::b01, "recalculate
 *   those losses as if you had been a resident for all prior years" (a stated fact).
 * - Line 8: ::line-8-net-gain-or-loss::b01, a loss as a negative number.
 * - Line 9: ::line-9::b01, the smaller of the loss and $3,000 ($1,500 married/RDP
 *   filing separately): LOSS_LIMIT and LOSS_LIMIT_SEPARATE of ../schedule-d-ca/lines.ts.
 * - Lines 12a and 12b: ::line-12a::b01 and ::line-12b::b01 with their four examples.
 */

import {
  scheduleDCaFigures,
  type ScheduleDCaFigures,
  type ScheduleDCaInputs,
} from "../schedule-d-ca/lines.js";

export interface ScheduleD540NRFigures extends ScheduleDCaFigures {
  /*
   * Line 2's reason when a Schedule K-1 sends federal Schedule D a capital gain
   * or loss: the line takes the California Schedule K-1 amount. Undefined: no
   * K-1 capital item on the return, so the line is blank.
   */
  line2Gap?: string;
}

/*
 * Lines 1 to 9 and 11 (the resident schedule's arithmetic), with the gap of an
 * amount on the federal return that line 1 or line 2 cannot carry: such an
 * amount is in line 10 (Form 1040 line 7a), so lines 4 to 12b would differ by it.
 */
export function withSourceGaps(
  figures: ScheduleDCaFigures,
  sourcesGap: string | undefined,
  line2Gap: string | undefined,
): ScheduleD540NRFigures {
  return { ...figures, gap: sourcesGap ?? figures.gap, line2Gap };
}

/* The lines from the schedule's inputs (the blind check and the unit tests call it). */
export function scheduleD540NRLines(
  inputs: ScheduleDCaInputs,
  sourcesGap?: string,
  line2Gap?: string,
): ScheduleD540NRFigures {
  return withSourceGaps(scheduleDCaFigures(inputs), sourcesGap, line2Gap);
}
