/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { atLeast, roundDollars, stepsOf, sum } from "../../money.js";
import { SSN } from "../../values.js";
import type { Schedule8812FilingInfo } from "./filingInfo.js";
import type { Schedule8812 } from "./types.js";

// Line 5: the maximum CTC for each qualifying child ("CTC amount increased").
const CHILD_TAX_CREDIT_PER_CHILD = 2_200;
// Line 7: the credit for each other dependent.
const OTHER_DEPENDENT_CREDIT = 500;
// Line 9: "Married filing jointly –$400,000 • All other filing statuses –$200,000".
const PHASEOUT_THRESHOLD_MFJ = 400_000;
const PHASEOUT_THRESHOLD_OTHER = 200_000;
// Line 10: the excess rounds up to "the next multiple of $1,000".
const PHASEOUT_STEP = 1_000;
// Line 11: "Multiply line 10 by 5% (0.05)".
const PHASEOUT_RATE = 0.05;

export function register(): void {
  defineForm<Schedule8812, Schedule8812FilingInfo>("schedule-8812", {
    bindings: {
      // No combined-name fact; concatenate first + last. The MFJ spouse name is not modeled.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.line.1_form_1040_line_11a": (form) => {
        const line11a = form["form-1040.line.11a"];
        return typeof line11a === "number" ? line11a : undefined;
      },
      // A subtotal stays blank, not "0", when every addend is blank.
      "0.line.2d_total_excluded_income": (form) => {
        const line2a = form["0.line.2a_puerto_rico_income_excluded"];
        const line2b = form["0.line.2b_form_2555_lines_45_50"];
        const line2c = form["0.line.2c_form_4563_line_15"];
        if (line2a === undefined && line2b === undefined && line2c === undefined) return undefined;
        return sum(line2a, line2b, line2c);
      },
      "0.line.3_modified_agi": (form) => {
        const line1 = form["0.line.1_form_1040_line_11a"];
        if (line1 === undefined) return undefined;
        return sum(line1, form["0.line.2d_total_excluded_income"]);
      },
      "0.line.4_qualifying_children_under_17": (_, info) => info.childTaxCreditCount,
      "0.line.5_qualifying_children_times_2200": (form) => {
        const line4 = form["0.line.4_qualifying_children_under_17"];
        if (line4 === undefined) return undefined;
        return line4 * CHILD_TAX_CREDIT_PER_CHILD;
      },
      "0.line.6_other_dependents": (_, info) => info.otherDependentCount,
      "0.line.7_other_dependents_times_500": (form) => {
        const line6 = form["0.line.6_other_dependents"];
        if (line6 === undefined) return undefined;
        return line6 * OTHER_DEPENDENT_CREDIT;
      },
      "0.line.8_total_credit_before_limit": (form) => {
        const line5 = form["0.line.5_qualifying_children_times_2200"];
        const line7 = form["0.line.7_other_dependents_times_500"];
        if (line5 === undefined && line7 === undefined) return undefined;
        return sum(line5, line7);
      },
      "0.line.9_filing_status_threshold": (_, info) => {
        if (info.filingStatus === undefined) return undefined;
        return info.filingStatus === "married_filing_jointly"
          ? PHASEOUT_THRESHOLD_MFJ
          : PHASEOUT_THRESHOLD_OTHER;
      },
      // "If more than zero and not a multiple of $1,000, enter the next multiple of $1,000."
      "0.line.10_excess_over_threshold": (form) => {
        const line3 = form["0.line.3_modified_agi"];
        const line9 = form["0.line.9_filing_status_threshold"];
        if (line3 === undefined || line9 === undefined) return undefined;
        const excess = atLeast(0, line3 - line9);
        return stepsOf(excess, PHASEOUT_STEP) * PHASEOUT_STEP;
      },
      "0.line.11_phaseout_amount": (form) => {
        const line10 = form["0.line.10_excess_over_threshold"];
        if (line10 === undefined) return undefined;
        return roundDollars(line10 * PHASEOUT_RATE);
      },
      // "No" stops the schedule: no CTC or ODC, so the credit is 0 for Form 1040 line 19.
      "0.line.12_credit_after_phaseout": (form) => {
        const line8 = form["0.line.8_total_credit_before_limit"];
        const line11 = form["0.line.11_phaseout_amount"];
        if (line8 === undefined || line11 === undefined) return undefined;
        return line8 > line11 ? line8 - line11 : 0;
      },
      "0.line.12_line8_more_than_line11_no": (form) => {
        const answer = line8MoreThanLine11(form);
        return answer === undefined ? undefined : !answer;
      },
      "0.line.12_line8_more_than_line11_yes": (form) => line8MoreThanLine11(form),
      /*
       * Credit Limit Worksheet A: Form 1040 line 18 minus the Schedule 3 credits
       * it lists (lines 1, 2, 3, 4, 5b, 6d, 6f, 6l, 6m). Its line 4 is Credit
       * Limit Worksheet B, which applies only with a Form 8396, 8839, 5695 Part I
       * or 8859 credit (Schedule 3 lines 5a, 6c, 6g, 6h). Those lines are
       * unsupported today, so line 4 is -0-; the line waits if one ever fills.
       */
      "0.line.13_credit_limit_worksheet_a": (form) => {
        const line18 = form["form-1040.line.18"];
        if (typeof line18 !== "number") return undefined;
        const worksheetB = [
          form["schedule-3.0.line.5a"],
          form["schedule-3.0.line.6c"],
          form["schedule-3.0.line.6g"],
          form["schedule-3.0.line.6h"],
        ].some((credit) => typeof credit === "number" && credit > 0);
        if (worksheetB && sum(form["0.line.4_qualifying_children_under_17"]) > 0) return undefined;
        const credits = sum(
          form["schedule-3.0.line.1"],
          form["schedule-3.0.line.2"],
          form["schedule-3.0.line.3"],
          form["schedule-3.0.line.4"],
          form["schedule-3.0.line.5b"],
          form["schedule-3.0.line.6d"],
          form["schedule-3.0.line.6f"],
          form["schedule-3.0.line.6l"],
          form["schedule-3.0.line.6m"],
        );
        return line18 - credits;
      },
      "0.line.14_child_tax_credit_and_other_dependents": (form) => {
        const line12 = form["0.line.12_credit_after_phaseout"];
        const line13 = form["0.line.13_credit_limit_worksheet_a"];
        if (line12 === undefined || line13 === undefined) return undefined;
        return Math.min(line12, line13);
      },
    },

    unsupported: {
      "0.line.2a_puerto_rico_income_excluded":
        "Income excluded as a bona fide resident of Puerto Rico has no fact kind.",
      "0.line.2b_form_2555_lines_45_50":
        "The foreign earned income and housing exclusions (Form 2555) have no fact kind.",
      "0.line.2c_form_4563_line_15":
        "The American Samoa income exclusion (Form 4563) has no fact kind.",
    },

    // This SSN widget (text, maxLength 11) keeps the dashes; the 1040 comb widget strips them.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}

// Line 12: "Is the amount on line 8 more than the amount on line 11?"
function line8MoreThanLine11(form: FormAccessor<Schedule8812>): boolean | undefined {
  const line8 = form["0.line.8_total_credit_before_limit"];
  const line11 = form["0.line.11_phaseout_amount"];
  if (line8 === undefined || line11 === undefined) return undefined;
  return line8 > line11;
}
