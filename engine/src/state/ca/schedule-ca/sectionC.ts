/*
 * Schedule CA (540) Part I, Section B line 3 and Section C lines 11, 15 and 18,
 * column A from federal Schedule 1 (line 26 in bindings.ts adds them). Column A copies the federal lines
 * (ca-540-sched-ca-inst-2025::sec::section-a-line-1a-through-line-7a-and-section-b-line-1-through-line-9a::b01,
 * ca-540-sched-ca-inst-2025::sec::section-c-line-11-through-line-18-and-line-20-through-line-25::b01);
 * each is blank when the federal line is blank.
 */

import type { FormSpec } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

export const sectionCBindings: Bindings = {
  "0.line.b3_federal": (form) => numberOrBlank(form["schedule-1.0.line.3"]),
  "2.line.c11_federal": (form) => numberOrBlank(form["schedule-1.1.line.11"]),
  /*
   * "California law does not conform to federal law regarding educator expenses.
   * Enter the amount from line 11, column A on line 11, column B"
   * (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b01).
   */
  "2.line.c11_subtractions": (form) => numberOrBlank(form["2.line.c11_federal"]),
  "2.line.c15_federal": (form) => numberOrBlank(form["schedule-1.1.line.15"]),
  // California conforms on line 18: no column B or C (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b01).
  "2.line.c18_federal": (form) => numberOrBlank(form["schedule-1.1.line.18"]),
};
