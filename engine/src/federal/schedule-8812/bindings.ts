/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, stepsOf, sum } from "../../money.js";
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

// MANUAL EDIT: line 16b, "x $1,700" for each qualifying child.
const ADDITIONAL_CREDIT_PER_CHILD = 1_700;
// Line 19: "Subtract $2,500 from the amount on line 18a".
const EARNED_INCOME_FLOOR = 2_500;
// Line 20: "Multiply the amount on line 19 by 15% (0.15)".
const EARNED_INCOME_RATE = 0.15;
// Line 20 Next: "On line 16b, is the amount $5,100 or more?"
const PART_II_B_MINIMUM = 5_100;

type Form = FormAccessor<Schedule8812>;
type Bindings = Partial<{
  [K in keyof Schedule8812]: BindingFn<Schedule8812, Schedule8812FilingInfo, K>;
}>;

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
      ...partIIABindings(),
      ...partIIBBindings(),
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

/*
 * MANUAL EDIT: Part II-A (irs-1040s8-inst-2025::sec::part-ii-a-additional-child-tax-credit::b01)
 * opens when line 12 is more than line 14; otherwise the part stays blank. A
 * Form 2555 filer cannot claim it, but Form 2555 has no fact kind (line 2b).
 */
function partIIABindings(): Bindings {
  return {
    "1.line.16a_line12_minus_line14": (form) => {
      const line12 = form["0.line.12_credit_after_phaseout"];
      const line14 = form["0.line.14_child_tax_credit_and_other_dependents"];
      if (line12 === undefined || line14 === undefined) return undefined;
      return line12 > line14 ? line12 - line14 : undefined;
    },
    // The same count as line 4.
    "1.line.16b_qualifying_children_count": (form) =>
      form["1.line.16a_line12_minus_line14"] === undefined
        ? undefined
        : form["0.line.4_qualifying_children_under_17"],
    "1.line.16b_qualifying_children_times_1700": (form) => {
      const count = form["1.line.16b_qualifying_children_count"];
      return count === undefined ? undefined : count * ADDITIONAL_CREDIT_PER_CHILD;
    },
    "1.line.17_smaller_of_16a_16b": (form) => {
      if (!partIIAOpen(form)) return undefined;
      return Math.min(
        sum(form["1.line.16a_line12_minus_line14"]),
        sum(form["1.line.16b_qualifying_children_times_1700"]),
      );
    },
    "1.line.18a_earned_income": (form) => (partIIAOpen(form) ? earnedIncome(form) : undefined),
    "1.line.18b_nontaxable_combat_pay": (form, info) =>
      partIIAOpen(form) ? roundDollars(info.w2NontaxableCombatPay) : undefined,
    "1.line.19_line18a_more_than_2500_no": (form) => {
      const answer = line18aMoreThanFloor(form);
      return answer === undefined ? undefined : !answer;
    },
    "1.line.19_line18a_more_than_2500_yes": (form) => line18aMoreThanFloor(form),
    // "No. Leave line 19 blank".
    "1.line.19_earned_income_over_2500": (form) =>
      line18aMoreThanFloor(form)
        ? sum(form["1.line.18a_earned_income"]) - EARNED_INCOME_FLOOR
        : undefined,
    // "No ... enter -0- on line 20".
    "1.line.20_line19_times_15_percent": (form) => {
      const answer = line18aMoreThanFloor(form);
      if (answer === undefined) return undefined;
      return answer
        ? roundDollars(sum(form["1.line.19_earned_income_over_2500"]) * EARNED_INCOME_RATE)
        : 0;
    },
    "1.line.20_line16b_at_least_5100_no": (form) => {
      const answer = line16bAtLeastPartIIBMinimum(form);
      return answer === undefined ? undefined : !answer;
    },
    "1.line.20_line16b_at_least_5100_yes": (form) => line16bAtLeastPartIIBMinimum(form),
    "1.line.27_additional_child_tax_credit": (form) => {
      const partIIB = completesPartIIB(form);
      if (partIIB === undefined) return undefined;
      const line17 = sum(form["1.line.17_smaller_of_16a_16b"]);
      const line20Or26 = partIIB
        ? form["1.line.26_larger_of_line20_line25"]
        : form["1.line.20_line19_times_15_percent"];
      return line20Or26 === undefined ? undefined : Math.min(line17, line20Or26);
    },
  };
}

// MANUAL EDIT: Part II-B lines stay blank when line 20 Next skips the part.
function partIIBBindings(): Bindings {
  return {
    /*
     * The Additional Medicare Tax and RRTA Tax Worksheet: W-2 boxes 4 and 6,
     * plus Form 8959 line 7, less Form 8959 line 22, plus half of Form 8959
     * line 13. Without Form 8959 it is boxes 4 and 6. Tier 1 RRTA has no fact.
     */
    "1.line.21_withheld_ss_medicare_taxes": (form, info) => {
      if (completesPartIIB(form) !== true) return undefined;
      const line22Of8959 = sum(
        form["form-8959.0.line.22_additional_medicare_tax_withholding_wages"],
      );
      return roundDollars(
        sum(
          info.w2SocialSecurityTaxWithheld,
          info.w2MedicareTaxWithheld,
          form["form-8959.0.line.7_additional_medicare_tax_wages"],
          sum(form["form-8959.0.line.13_additional_medicare_tax_se"]) / 2,
        ) - line22Of8959,
      );
    },
    "1.line.22_schedule_1_and_2_taxes": (form) =>
      completesPartIIB(form) === true
        ? sum(
            form["schedule-1.1.line.15"],
            form["schedule-2.0.line.5_ss_medicare_tax_unreported_tips"],
            form["schedule-2.0.line.6_uncollected_ss_medicare_tax_wages"],
            form["schedule-2.0.line.13_uncollected_ss_medicare_rrta_tax_w2"],
          )
        : undefined,
    "1.line.23_total_lines_21_22": (form) =>
      completesPartIIB(form) === true
        ? sum(
            form["1.line.21_withheld_ss_medicare_taxes"],
            form["1.line.22_schedule_1_and_2_taxes"],
          )
        : undefined,
    // Waits for Form 1040 line 27a (the EIC), only on this branch.
    "1.line.24_eic_and_schedule_3_line_11": (form) => {
      if (completesPartIIB(form) !== true) return undefined;
      const line27a = numberOrBlank(form["form-1040.line.27a"]);
      if (line27a === undefined) return undefined;
      return sum(line27a, form["schedule-3.0.line.11"]);
    },
    "1.line.25_line23_minus_line24": (form) => {
      const line23 = form["1.line.23_total_lines_21_22"];
      const line24 = form["1.line.24_eic_and_schedule_3_line_11"];
      if (line23 === undefined || line24 === undefined) return undefined;
      return atLeast(0, line23 - line24);
    },
    "1.line.26_larger_of_line20_line25": (form) => {
      const line25 = form["1.line.25_line23_minus_line24"];
      if (line25 === undefined) return undefined;
      return Math.max(sum(form["1.line.20_line19_times_15_percent"]), line25);
    },
  };
}

// Line 16b: "If zero, stop here; you cannot claim the additional child tax credit."
function partIIAOpen(form: Form): boolean {
  return sum(form["1.line.16b_qualifying_children_times_1700"]) > 0;
}

/*
 * MANUAL EDIT: line 18a, the Earned Income Chart (irs-1040s8-inst-2025::sec::earned-income-chart-line-18a::b01):
 * with no self-employment, EIC Step 5 and the Earned Income Worksheet both give
 * Form 1040 line 1z plus all nontaxable combat pay (no line 1i election fact),
 * less Medicaid waiver payments (Schedule 1 line 8s, unsupported). With a
 * Schedule C or SE the worksheets differ and are not drafted, so the line waits.
 */
function earnedIncome(form: Form): number | undefined {
  const selfEmployed =
    numberOrBlank(form["schedule-c.0.line.31"]) !== undefined ||
    numberOrBlank(form["schedule-se.0.line.3"]) !== undefined;
  const line1z = numberOrBlank(form["form-1040.line.1z"]);
  if (selfEmployed || line1z === undefined) return undefined;
  return atLeast(0, sum(line1z, form["1.line.18b_nontaxable_combat_pay"]));
}

// Line 19: "Is the amount on line 18a more than $2,500?"
function line18aMoreThanFloor(form: Form): boolean | undefined {
  const line18a = form["1.line.18a_earned_income"];
  return line18a === undefined ? undefined : line18a > EARNED_INCOME_FLOOR;
}

// Line 20 Next: "On line 16b, is the amount $5,100 or more?"
function line16bAtLeastPartIIBMinimum(form: Form): boolean | undefined {
  if (!partIIAOpen(form)) return undefined;
  return sum(form["1.line.16b_qualifying_children_times_1700"]) >= PART_II_B_MINIMUM;
}

/*
 * Line 20 Next: Part II-B applies when line 16b is $5,100 or more and line 20
 * is less than line 17. A bona fide resident of Puerto Rico also completes it,
 * but residence there has no fact.
 */
function completesPartIIB(form: Form): boolean | undefined {
  const atLeastMinimum = line16bAtLeastPartIIBMinimum(form);
  const line17 = form["1.line.17_smaller_of_16a_16b"];
  const line20 = form["1.line.20_line19_times_15_percent"];
  if (atLeastMinimum === undefined || line17 === undefined || line20 === undefined) {
    return undefined;
  }
  return atLeastMinimum && line20 < line17;
}
