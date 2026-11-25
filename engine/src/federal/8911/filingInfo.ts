import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ScheduleALines } from "./lines.js";

/* One Schedule A (Form 8911): a property that qualifies, its lines once every answer is in. */
export interface RefuelingScheduleA {
  factKey: string;
  /* Undefined while line 13 or line 17 waits on an answer. */
  lines?: ScheduleALines;
}

export interface Form8911FilingInfo extends BaseFilingInfo {
  /* The Schedules A: each property placed in service in 2025 in an eligible census tract that may claim a part of the credit. */
  refuelingSchedulesA?: RefuelingScheduleA[];
  /* Line 2: the code AO credits of the Schedules K-1 (Form 1065 box 15, Form 1120-S box 13), cents kept; undefined with none. */
  refuelingK1Credit?: number;
}
