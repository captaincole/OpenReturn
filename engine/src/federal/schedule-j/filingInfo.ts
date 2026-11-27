import type { FarmIncomeAveragingFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { BaseYear } from "./baseYears.js";

/* What the lines need from the facts: the election and the three base years. */
export interface ScheduleJAnswers {
  election: FarmIncomeAveragingFactValue;
  /* 2022, 2023, 2024: lines 5 to 16 and 19 to 21. */
  baseYears: BaseYear[];
}

export interface ScheduleJFilingInfo extends BaseFilingInfo {
  /* Undefined when Schedule J does not file, or while an answer is missing (missingInputs). */
  scheduleJ?: ScheduleJAnswers;
}
