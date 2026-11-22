import { defineForm } from "../../defineForm.js";
import { numberOrBlank, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { mortgageCreditGap } from "../8396/creditGap.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { creditGap, LINE_12_ID } from "../8880/credit.js";
import { personalCredit } from "../8936/credit.js";
import type { Schedule3FilingInfo } from "./filingInfo.js";
import type { Schedule3 } from "./types.js";

const NO_SCENARIO = "No scenario uses this credit or payment yet.";
const FORM_3800_GAP =
  "Form 3800 files, and line 6a takes its general business credit; Form 3800 has no rules in the engine.";

export function register(): void {
  defineForm<Schedule3, Schedule3FilingInfo>("schedule-3", {
    bindings: {
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Form 2441 line 11 ("Also enter ... on Schedule 3 (Form 1040), line 2").
      "0.line.2": (form) => numberOrBlank(form["form-2441.0.line.11_dependent_care_credit"]),
      // MANUAL EDIT: Schedule R line 22 ("Also enter this amount on Schedule 3 (Form 1040), line 6d").
      "0.line.6d": (form) => numberOrBlank(form["schedule-r.1.line.22_credit"]),
      // MANUAL EDIT: Form 8839 line 18 ("here and on Schedule 3 (Form 1040), line 6c"); no 8839, the old reason.
      "0.line.6c": (form, info) => {
        const received = line6cFrom8839(form, info);
        return received === undefined ? unsupported(NO_SCENARIO) : received.value;
      },
      /*
       * MANUAL EDIT: Form 8396 line 9 ("Also include this amount on Schedule 3 (Form 1040), line 6g").
       * When line 9 is an engine gap, so is this line, with the same reason.
       */
      "0.line.6g": (form, info) => {
        const gap = mortgageCreditGap(form, info);
        if (gap !== undefined) return unsupported(gap);
        return numberOrBlank(form["form-8396.0.line.9_current_year_mortgage_interest_credit"]);
      },
      /*
       * MANUAL EDIT: Form 8880 line 12 ("here and on Schedule 3 (Form 1040), line 4",
       * irs-8880-form-2025::sec::omb-no-1545-0074::b03). Blank when no credit; a gap
       * in Form 8880 stays a gap here.
       */
      "0.line.4": (form, info) => numberOrBlank(form[LINE_12_ID]) ?? creditGap(form, info),
      /*
       * MANUAL EDIT: the general business credit from Form 3800 (irs-1040-inst-2025::sec::line-6a::b01).
       * While Form 3800 files (a Form 8936 business credit turns it on), the gap names it.
       */
      "0.line.6a": (_, info) =>
        unsupported(info.mustFile?.["form-3800"]?.value === true ? FORM_3800_GAP : NO_SCENARIO),
      /*
       * MANUAL EDIT: Form 8936 line 13 ("here and on Schedule 3 (Form 1040), line 6f")
       * and line 18 ("... line 6m"); irs-1040-inst-2025::sec::line-6f::b01, line-6m::b01.
       */
      "0.line.6f": (form, info) => personalCredit(form, info, "III"),
      "0.line.6m": (form, info) => personalCredit(form, info, "IV"),
      "0.line.5b": (form) => {
        const value = form["form-5695.3.line.32"];
        return typeof value === "number" ? value : undefined;
      },
      "0.line.7": (form) => {
        const parts = [
          form["0.line.6a"],
          form["0.line.6b"],
          form["0.line.6c"],
          form["0.line.6d"],
          form["0.line.6f"],
          form["0.line.6g"],
          form["0.line.6h"],
          form["0.line.6i"],
          form["0.line.6j"],
          form["0.line.6k"],
          form["0.line.6l"],
          form["0.line.6m"],
          form["0.line.6z_amount"],
        ];
        return parts.every((part) => part === undefined) ? undefined : sum(...parts);
      },
      "0.line.8": (form) => {
        const parts = [
          form["0.line.1"],
          form["0.line.2"],
          form["0.line.3"],
          form["0.line.4"],
          form["0.line.5a"],
          form["0.line.5b"],
          form["0.line.7"],
        ];
        return parts.every((part) => part === undefined) ? undefined : sum(...parts);
      },
    },

    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "0.line.1": "Foreign tax credit (Form 1116): no scenario has foreign tax paid yet.",
      "0.line.3": "Education credits (Form 8863): no scenario yet.",
      "0.line.5a": "Residential clean energy credit (Form 5695 Part I) is not modeled.",
      "0.line.6b": NO_SCENARIO,
      "0.line.6e": "Reserved for future use.",
      "0.line.6h": NO_SCENARIO,
      "0.line.6i": NO_SCENARIO,
      "0.line.6j": NO_SCENARIO,
      "0.line.6k": NO_SCENARIO,
      "0.line.6l": NO_SCENARIO,
      "0.line.6z_description": NO_SCENARIO,
      "0.line.6z_amount": NO_SCENARIO,
      "0.line.9":
        "Net premium tax credit: Form 8962 line 26 is computed, but this line is not bound to it yet.",
      "0.line.10": "Extension payment: no estimated or extension payment facts yet.",
      "0.line.11":
        "Excess social security tax withheld (two or more employers): no scenario reaches the wage base yet.",
      "0.line.12": NO_SCENARIO,
      "0.line.13a": NO_SCENARIO,
      "0.line.13b": NO_SCENARIO,
      "0.line.13c": NO_SCENARIO,
      "0.line.13d": NO_SCENARIO,
      "0.line.13z_description": NO_SCENARIO,
      "0.line.13z_amount": NO_SCENARIO,
      "0.line.14": "Total of lines 13a–13z, which are not modeled.",
      "0.line.15": "Total of lines 9–14, which are not modeled.",
    },
  });
}
