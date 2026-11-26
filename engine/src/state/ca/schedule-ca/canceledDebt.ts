/*
 * Schedule CA (540) line 8c, cancellation of debt. Column A copies federal
 * Schedule 1 line 8c. Column C adds back the federal exclusion of qualified
 * principal residence indebtedness (Form 982 line 1e): "California law does not
 * conform to federal law regarding the exclusion of income from discharge of
 * indebtedness from the disposition of your principal residence occurring after
 * December 31, 2017. Enter the amount of discharge on line 8c, column C"
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01). The engine adds
 * the whole line 1e amount, with or without a sale of the home (QUESTIONS.md in
 * federal/982).
 *
 * With no line 1e amount, column C keeps its earlier reason: the other item
 * of the line, employer payments of student loans (line-8-other-income::b02),
 * has no fact yet.
 */

import type { FormSpec } from "../../../defineForm.js";
import { numberOrBlank, roundDollars } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const STUDENT_LOAN_PAYMENTS_GAP =
  "Line 8c column C also adds employer payments of a student loan that federal law excludes (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b02); no fact holds them yet.";

export const canceledDebtBindings: Bindings = {
  "1.line.b8c_federal": (form) => {
    const amount = numberOrBlank(form["schedule-1.0.line.8c"]);
    return amount === 0 ? undefined : amount;
  },
  "1.line.b8c_additions": (_, info) => {
    if (info.form982Gap) return unsupported(info.form982Gap);
    const excluded = info.principalResidenceExclusion ?? 0;
    return excluded > 0 ? roundDollars(excluded) : unsupported(STUDENT_LOAN_PAYMENTS_GAP);
  },
};
