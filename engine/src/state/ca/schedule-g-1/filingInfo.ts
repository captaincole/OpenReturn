import type { CaLumpSumDistributionFactValue } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Unsupported } from "../../../types.js";
import type { ScheduleG1Inputs } from "./lines.js";

/* One Schedule G-1: the Part I answers and the inputs its lines read. */
export interface ScheduleG1Figures {
  answers: CaLumpSumDistributionFactValue;
  inputs: ScheduleG1Inputs;
}

export interface ScheduleG1FilingInfo extends BaseFilingInfo {
  /*
   * Undefined while the schedule does not file or an answer waits (the form's
   * missingInputs lists it); unsupported for a case the engine does not model.
   */
  scheduleG1?: ScheduleG1Figures | Unsupported;
  /* Schedule CA line 5b, column B: the part of federal line 5b that Schedule G-1 taxes. */
  scheduleG1CaSubtraction?: number | Unsupported;
}
