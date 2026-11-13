/*
 * Schedule CA (540) Part I, Section B line 3 and Section C, column A from federal
 * Schedule 1. Column A copies the federal lines
 * (ca-540-sched-ca-inst-2025::sec::section-a-line-1a-through-line-7a-and-section-b-line-1-through-line-9a::b01,
 * ca-540-sched-ca-inst-2025::sec::section-c-line-11-through-line-18-and-line-20-through-line-25::b01);
 * each is blank when the federal line is blank.
 */

import type { FormAccessor, FormSpec } from "../../../defineForm.js";
import { numberOrBlank, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

/*
 * Line 13 (the HSA deduction) has no column A binding yet. While federal Schedule 1
 * line 13 is above 0, line 26 would leave it out, so line 26 waits for a person.
 */
function hsaDeductionNotCarried(form: FormAccessor<ScheduleCa>) {
  const hsaDeduction = numberOrBlank(form["schedule-1.1.line.13"]);
  return hsaDeduction !== undefined && hsaDeduction > 0
    ? unsupported(
        "Line 13 (the HSA deduction) is not carried to Schedule CA yet; line 26 needs it.",
      )
    : undefined;
}

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
  // "Add line 11 through line 23 and line 25" (ca-540-sched-ca-inst-2025::sec::line-26::b01).
  "3.line.c26_federal": (form) =>
    hsaDeductionNotCarried(form) ??
    sumOrBlank(
      form["2.line.c11_federal"],
      form["2.line.c12_federal"],
      form["2.line.c13_federal"],
      form["2.line.c14_federal"],
      form["2.line.c15_federal"],
      form["2.line.c16_federal"],
      form["2.line.c17_federal"],
      form["2.line.c18_federal"],
      form["2.line.c19a_federal"],
      form["2.line.c20_federal"],
      form["2.line.c21_federal"],
      form["2.line.c23_federal"],
      form["3.line.c25_federal"],
    ),
  "3.line.c26_subtractions": (form) =>
    hsaDeductionNotCarried(form) ??
    sumOrBlank(
      form["2.line.c11_subtractions"],
      form["2.line.c12_subtractions"],
      form["2.line.c13_subtractions"],
      form["2.line.c15_subtractions"],
      form["2.line.c17_subtractions"],
      form["2.line.c20_subtractions"],
      form["3.line.c25_subtractions"],
    ),
};
