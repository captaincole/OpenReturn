/*
 * MANUAL EDIT: lines 8d and 24j, the federal Form 2555 amounts. California
 * does not allow them: line 8d, "Enter in column C, as a positive number, the
 * amount excluded from federal income on federal Schedule 1 (Form 1040), line
 * 8d" (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b02); line 24j, "If
 * you claimed the foreign housing deduction for federal purposes, enter the
 * amount from column A in column B"
 * (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b07). Column A
 * copies federal Schedule 1. Without Form 2555 each line keeps its reason.
 */

import type { FormSpec } from "../../../defineForm.js";
import { files2555 } from "../../../federal/2555/results.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const LINE_8D_FEDERAL =
  "Foreign earned income exclusion from federal Form 2555 line 45. No foreign income scenario or Form 2555 fact ingestion path exists. CA does not allow the federal foreign earned income exclusion, so this amount also requires a column C addition on line 8d.";
const LINE_8D_ADDITIONS =
  "Column C additions for foreign earned income exclusion (Form 2555) — CA does not conform for certain combat-zone contractors, but no fact/decision ingestion path exists for Form 2555 scenarios yet.";
const LINE_24J_FEDERAL =
  "Housing deduction from Form 2555 (foreign housing exclusion) requires a foreign-income ingestion path we have not yet built; no foreign-income scenario exists.";
const LINE_24J_SUBTRACTIONS =
  "Form 2555 housing deduction (line 24j) col B — no scenario modeled yet.";

export const foreignExclusionBindings: Bindings = {
  "1.line.b8d_federal": (form, info) =>
    files2555(info) ? numberOrBlank(form["schedule-1.0.line.8d"]) : unsupported(LINE_8D_FEDERAL),
  "1.line.b8d_additions": (form, info) =>
    files2555(info) ? numberOrBlank(form["1.line.b8d_federal"]) : unsupported(LINE_8D_ADDITIONS),
  "3.line.c24j_federal": (form, info) =>
    files2555(info) ? numberOrBlank(form["schedule-1.1.line.24j"]) : unsupported(LINE_24J_FEDERAL),
  "3.line.c24j_subtractions": (form, info) =>
    files2555(info)
      ? numberOrBlank(form["3.line.c24j_federal"])
      : unsupported(LINE_24J_SUBTRACTIONS),
};
