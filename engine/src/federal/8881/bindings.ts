/*
 * Form 8881, the credits for a small employer's retirement plan, for an
 * individual whose own Schedule C business or Schedule F farm sponsors the
 * plan. Every line reads only facts (resolveInfo.ts, plan.ts, lines.ts);
 * lines 8, 11 and 15 go to Form 3800 Part III lines 1j, 1dd and 1ee
 * (federal/8881/sources.ts).
 */

import { defineForm } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { isGap } from "../3800/cells.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8881FilingInfo } from "./filingInfo.js";
import {
  line6e2Text,
  type Line6e,
  type OwnPlanLines,
  type Part3Lines,
  type Section1Lines,
  type Section2Lines,
} from "./lines.js";
import { partTotal, type Amount } from "./totals.js";
import type { Form8881 } from "./types.js";

type Info = Form8881FilingInfo;

/* One of the plan's own lines, or the gap of all of them; blank with no plan. */
function own<T>(
  info: Info,
  pick: (lines: OwnPlanLines) => T | undefined,
): T | Unsupported | undefined {
  const lines = info.smallEmployerPlan?.own;
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

const section1 = (info: Info, pick: (lines: Section1Lines) => number) =>
  own(info, (lines) => (lines.section1 ? pick(lines.section1) : undefined));
const section2 = (info: Info, pick: (lines: Section2Lines) => number | undefined) =>
  own(info, (lines) => (lines.section2 ? pick(lines.section2) : undefined));
const line6e = <T>(info: Info, pick: (lines: Line6e) => T) =>
  own(info, (lines) => (lines.section2?.line6e ? pick(lines.section2.line6e) : undefined));
const part3 = (info: Info, pick: (lines: Part3Lines) => number) =>
  own(info, (lines) => (lines.part3 ? pick(lines.part3) : undefined));

const line5 = (info: Info): Amount => section1(info, (lines) => lines.line5);
const line6g = (info: Info): Amount => section2(info, (lines) => lines.line6g);
const line9 = (info: Info): Amount => own(info, (lines) => lines.line9);
const line12 = (info: Info): Amount => part3(info, (lines) => lines.line12);
const line13 = (info: Info): Amount => part3(info, (lines) => lines.line13);

export function register(): void {
  defineForm<Form8881, Info>("form-8881", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // Section 1, lines A to 5 (lines.ts section1Of).
      "0.line.a_qualifying_employees": (_, info) => section1(info, (lines) => lines.lineA),
      "0.line.1_qualified_startup_costs": (_, info) => section1(info, (lines) => lines.line1),
      "0.line.2_startup_costs_by_employer_size": (_, info) =>
        section1(info, (lines) => lines.line2),
      "0.line.3_eligible_employees": (_, info) => section1(info, (lines) => lines.line3Employees),
      "0.line.3_multiply_eligible_employees_by_250": (_, info) =>
        section1(info, (lines) => lines.line3),
      "0.line.4_greater_of_500_or_3": (_, info) => section1(info, (lines) => lines.line4),
      "0.line.5_smaller_of_2_or_4": (_, info) => line5(info),
      // Section 2, lines 6a to 6g (lines.ts section2Of); line 6e only with more than 50 employees on line 6a.
      "0.line.6a_preceding_year_employees": (_, info) => section2(info, (lines) => lines.line6a),
      "0.line.6b_employer_contributions": (_, info) => section2(info, (lines) => lines.line6b),
      "0.line.6c_contributions_over_1000": (_, info) => section2(info, (lines) => lines.line6c),
      "0.line.6d_add_lines": (_, info) => section2(info, (lines) => lines.line6d),
      "0.line.6e_1_subtract_50_from_6a": (_, info) =>
        line6e(info, (lines) => lines.excessEmployees),
      "0.line.6e_2_multiply_6e_1_by_2_percent": (_, info) =>
        line6e(info, (lines) => line6e2Text(lines.reductionHundredths)),
      "0.line.6e_3_multiply_6e_2_by_6d": (_, info) => line6e(info, (lines) => lines.reduction),
      "0.line.6e_4_subtract_6e_3_from_6d": (_, info) =>
        line6e(info, (lines) => lines.afterReduction),
      "0.line.6f_contributions_after_phaseout": (_, info) =>
        section2(info, (lines) => lines.line6f),
      "0.line.6g_applicable_percentage_amount": (_, info) => line6g(info),
      // Section 3 and Parts II and III: the K-1 lines (totals.ts) and the totals.
      "0.line.7_credit_from_partnerships_s_corps": (_, info) => info.smallEmployerPlan?.line7,
      "0.line.8_total_part_i_credits": (_, info) =>
        partTotal(line5(info), line6g(info), info.smallEmployerPlan?.line7),
      "0.line.9_auto_enrollment_credit": (_, info) => line9(info),
      "0.line.10_auto_enrollment_from_partnerships_s_corps": (_, info) =>
        info.smallEmployerPlan?.line10,
      "0.line.11_total_auto_enrollment_credit": (_, info) =>
        partTotal(line9(info), info.smallEmployerPlan?.line10),
      "0.line.12_military_spouse_employees": (_, info) =>
        part3(info, (lines) => lines.line12Employees),
      "0.line.12_multiply_military_spouses_by_200": (_, info) => line12(info),
      "0.line.13_military_spouse_contributions": (_, info) => line13(info),
      "0.line.14_military_spouse_from_partnerships_s_corps": (_, info) =>
        info.smallEmployerPlan?.line14,
      "0.line.15_total_military_spouse_credit": (_, info) =>
        partTotal(line12(info), line13(info), info.smallEmployerPlan?.line14),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
