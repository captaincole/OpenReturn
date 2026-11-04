/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import type { Schedule1AFilingInfo } from "./filingInfo.js";
import type { FormSchedule1A } from "./types.js";

// Part V (irs-1040-inst-2025::sec::part-v::b02): $6,000 per person, reduced 6% above the MAGI threshold.
const SENIOR_AMOUNT = 6000;
const SENIOR_PHASEOUT_RATE = 0.06;
const SENIOR_THRESHOLD = 75000;
const SENIOR_THRESHOLD_MFJ = 150000;

const NO_TIPS =
  "No fact or decision says which tips are qualified tips (a listed tipped occupation), so Part II never applies.";
const NO_OVERTIME =
  "No fact records qualified overtime compensation (the FLSA premium over the regular rate), so Part III never applies.";
const NO_CAR_LOAN =
  "No fact records qualified passenger vehicle loan interest or the vehicle's VIN, so Part IV never applies.";

interface SeniorClaims {
  you: boolean;
  spouse: boolean;
}

/*
 * Lines 36a/36b: born before January 2, 1961 with a valid SSN; a married filer
 * must file jointly (part-v::b01). No fact says an SSN is "valid for
 * employment", so a present SSN counts as valid. Undefined while an answer is missing.
 */
function seniorClaims(info: Schedule1AFilingInfo): SeniorClaims | undefined {
  const status = info.filingStatus;
  if (!status || info.taxpayerBornBeforeJan2_1961 === undefined) return undefined;
  if (status === "married_filing_separately") return { you: false, spouse: false };
  const joint = status === "married_filing_jointly";
  if (joint && info.spouseBornBeforeJan2_1961 === undefined) return undefined;
  const you = info.taxpayerBornBeforeJan2_1961;
  const spouse = joint && info.spouseBornBeforeJan2_1961 === true;
  if ((you && !info.taxpayerSSN) || (spouse && !info.spouseSSN)) return undefined;
  return { you, spouse };
}

// Part V is filled only for a qualifying person (part-v::b01).
function partVApplies(info: Schedule1AFilingInfo): boolean | undefined {
  const claims = seniorClaims(info);
  return claims && (claims.you || claims.spouse);
}

export function register(): void {
  defineForm<FormSchedule1A, Schedule1AFilingInfo>("schedule-1-a", {
    bindings: {
      // No combined-name fact; concatenate first + last, as on the other schedules.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.line.1_agi_form_1040": (form) => {
        const agi = form["form-1040.line.11b"];
        return typeof agi === "number" ? agi : undefined;
      },
      // Part I: complete lines 2a–2e only with Puerto Rico, Form 2555 or Form 4563 exclusions.
      "0.line.2e_total_excluded_income": (form) => {
        const parts = [
          form["0.line.2a_puerto_rico_excluded_income"],
          form["0.line.2b_form_2555_line_45"],
          form["0.line.2c_form_2555_line_50"],
          form["0.line.2d_form_4563_line_15"],
        ];
        return parts.some((part) => typeof part === "number") ? sum(...parts) : undefined;
      },
      // Without exclusions, line 3 is Form 1040 line 11b and line 2e stays blank.
      "0.line.3_modified_agi": (form) => {
        const line1 = form["0.line.1_agi_form_1040"];
        if (typeof line1 !== "number") return undefined;
        return sum(line1, form["0.line.2e_total_excluded_income"]);
      },
      "1.line.31_magi_from_line_3": (form, info) => {
        const line3 = form["0.line.3_modified_agi"];
        return partVApplies(info) && typeof line3 === "number" ? line3 : undefined;
      },
      "1.line.32_senior_threshold": (_, info) => {
        if (!partVApplies(info)) return undefined;
        return info.filingStatus === "married_filing_jointly"
          ? SENIOR_THRESHOLD_MFJ
          : SENIOR_THRESHOLD;
      },
      // MANUAL EDIT: line 33 has no floor; "if zero or less" only routes to line 35.
      "1.line.33_magi_over_threshold": (form) => {
        const line31 = form["1.line.31_magi_from_line_3"];
        const line32 = form["1.line.32_senior_threshold"];
        if (typeof line31 !== "number" || typeof line32 !== "number") return undefined;
        return line31 - line32;
      },
      // MANUAL EDIT: blank when line 33 is zero or less (the form skips to line 35).
      "1.line.34_senior_phaseout": (form) => {
        const line33 = form["1.line.33_magi_over_threshold"];
        if (typeof line33 !== "number" || line33 <= 0) return undefined;
        return roundDollars(line33 * SENIOR_PHASEOUT_RATE);
      },
      "1.line.35_senior_amount_per_person": (form) => {
        const line31 = form["1.line.31_magi_from_line_3"];
        const line32 = form["1.line.32_senior_threshold"];
        if (typeof line31 !== "number" || typeof line32 !== "number") return undefined;
        if (line31 - line32 <= 0) return SENIOR_AMOUNT;
        return atLeast(0, SENIOR_AMOUNT - sum(form["1.line.34_senior_phaseout"]));
      },
      "1.line.36a_senior_deduction_you": (form, info) =>
        seniorClaims(info)?.you ? form["1.line.35_senior_amount_per_person"] : undefined,
      "1.line.36b_senior_deduction_spouse": (form, info) =>
        seniorClaims(info)?.spouse ? form["1.line.35_senior_amount_per_person"] : undefined,
      "1.line.37_enhanced_senior_deduction": (form) => {
        const lines = [
          form["1.line.36a_senior_deduction_you"],
          form["1.line.36b_senior_deduction_spouse"],
        ];
        return lines.some((line) => typeof line === "number") ? sum(...lines) : undefined;
      },
      // An unfilled part adds nothing; blank when no part is filled.
      "1.line.38_total_additional_deductions": (form) => {
        const parts = [
          form["0.line.13_qualified_tips_deduction"],
          form["0.line.21_qualified_overtime_deduction"],
          form["1.line.30_car_loan_interest_deduction"],
          form["1.line.37_enhanced_senior_deduction"],
        ];
        return parts.some((part) => typeof part === "number") ? sum(...parts) : undefined;
      },
    },

    unsupported: {
      "0.line.2a_puerto_rico_excluded_income":
        "No fact records Puerto Rico income that a bona fide resident excluded.",
      "0.line.2b_form_2555_line_45":
        "No Form 2555 foreign earned income exclusion facts or scenario exist yet.",
      "0.line.2c_form_2555_line_50":
        "No Form 2555 foreign housing deduction facts or scenario exist yet.",
      "0.line.2d_form_4563_line_15":
        "No Form 4563 American Samoa income exclusion facts or scenario exist yet.",
      // Parts II–IV: fill each part only if it applies (part-ii::b02, part-iii::b01, part-iv::b01).
      "0.line.4a_tips_form_w2_box_7": NO_TIPS,
      "0.line.4b_tips_form_4137": NO_TIPS,
      "0.line.4c_employee_qualified_tips": NO_TIPS,
      "0.line.5_business_qualified_tips": NO_TIPS,
      "0.line.6_total_qualified_tips": NO_TIPS,
      "0.line.7_tips_capped_25000": NO_TIPS,
      "0.line.8_modified_agi_tips": NO_TIPS,
      "0.line.9_tips_magi_threshold": NO_TIPS,
      "0.line.10_tips_magi_excess": NO_TIPS,
      "0.line.11_tips_excess_thousands": NO_TIPS,
      "0.line.12_tips_phaseout_reduction": NO_TIPS,
      "0.line.13_qualified_tips_deduction": NO_TIPS,
      "0.line.14a_overtime_form_w2_box_1": NO_OVERTIME,
      "0.line.14b_overtime_form_1099": NO_OVERTIME,
      "0.line.14c_total_qualified_overtime": NO_OVERTIME,
      "0.line.15_overtime_capped": NO_OVERTIME,
      "0.line.16_modified_agi_overtime": NO_OVERTIME,
      "0.line.17_overtime_magi_threshold": NO_OVERTIME,
      "0.line.18_overtime_magi_excess": NO_OVERTIME,
      "0.line.19_overtime_excess_thousands": NO_OVERTIME,
      "0.line.20_overtime_phaseout_reduction": NO_OVERTIME,
      "0.line.21_qualified_overtime_deduction": NO_OVERTIME,
      "1.line.22a_vehicle_vin_col_i": NO_CAR_LOAN,
      "1.line.22a_interest_deducted_elsewhere_col_ii": NO_CAR_LOAN,
      "1.line.22a_interest_schedule_1a_col_iii": NO_CAR_LOAN,
      "1.line.22b_vehicle_vin_col_i": NO_CAR_LOAN,
      "1.line.22b_interest_deducted_elsewhere_col_ii": NO_CAR_LOAN,
      "1.line.22b_interest_schedule_1a_col_iii": NO_CAR_LOAN,
      "1.line.23_total_car_loan_interest": NO_CAR_LOAN,
      "1.line.24_car_interest_capped": NO_CAR_LOAN,
      "1.line.25_magi_from_line_3": NO_CAR_LOAN,
      "1.line.26_car_interest_threshold": NO_CAR_LOAN,
      "1.line.27_magi_over_threshold": NO_CAR_LOAN,
      "1.line.28_thousands_over_threshold": NO_CAR_LOAN,
      "1.line.29_car_interest_phaseout": NO_CAR_LOAN,
      "1.line.30_car_loan_interest_deduction": NO_CAR_LOAN,
    },
  });
}
