/*
 * Schedule P (540NR) reads Part I the way Schedule P (540) does (the Schedule
 * P slots below, which Schedule P (540)'s resolver fills on every return), the
 * forms this return needs that the engine figures for Form 540 only (Form
 * 540NR's slot), and one stated California amount of its own.
 */

import type { Form540NRFilingInfo } from "../540nr/filingInfo.js";
import type { SchedulePFilingInfo } from "../schedule-p/filingInfo.js";

export interface ScheduleP540NRFilingInfo
  extends SchedulePFilingInfo, Pick<Form540NRFilingInfo, "formsNeededOnly540"> {
  /** Part II line 29d: the California part of the ISO spread (ca_540nr.amt_california_amount.iso_exercise_spread). */
  isoCaliforniaSpread?: number;
}
