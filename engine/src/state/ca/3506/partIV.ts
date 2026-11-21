/*
 * FTB 3506 Part IV, lines 13 to 33: dependent care benefits. The lines copy
 * federal Form 2441 Part III ("For all other lines ... get federal Form 2441",
 * ca-3506-inst-2025::sec::line-17::b01), so lines 13, 19, 20 and 22 use the
 * Form 2441 rules. With no benefits every line stays blank.
 */

import type { BindingFn } from "../../../defineForm.js";
import { earnedIncomeWithoutBenefits } from "../../../federal/2441/lines.js";
import {
  SPOUSE_EARNED_INCOME,
  benefitsReceived,
  maximumExclusion,
} from "../../../federal/2441/partIII.js";
import { numberOrBlank, roundDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3506FilingInfo } from "./filingInfo.js";
import {
  NONRESIDENT_EARNED_INCOME,
  columnETotal,
  creditClaimed,
  filesNonresidentReturn,
  filledLines,
  receivedBenefits,
  type Form,
} from "./gates.js";
import * as line from "./lines.js";
import type { Form3506 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3506]: BindingFn<Form3506, Form3506FilingInfo, K> }>;

const TAXABLE_BENEFITS_IN_COLUMN_E =
  "With taxable benefits (line 27), column (e) would hold the expenses paid with them, and the qualifying-person facts record expenses net of all benefits.";

function partIV<T>(info: Form3506FilingInfo, value: () => T): T | undefined {
  return receivedBenefits(info) ? value() : undefined;
}

/* Lines 28 to 33 also need the credit in Part III ("If zero or less, stop", line 30). */
function creditLines<T>(info: Form3506FilingInfo, value: () => T): T | undefined {
  return receivedBenefits(info) && creditClaimed(info) === true ? value() : undefined;
}

/* Lines 31 to 33 only when line 30 is more than zero. */
const line30Positive = (form: Form) =>
  (numberOrBlank(form["1.line.30_limit_minus_benefits"]) ?? 0) > 0;

/* Line 19 and 20: earned income without the benefits (Form 2441 lines 18 and 19). */
function earnedIncome(form: Form, info: Form3506FilingInfo, whose: "yours" | "spouse") {
  if (filesNonresidentReturn(info)) return unsupported(NONRESIDENT_EARNED_INCOME);
  const income = earnedIncomeWithoutBenefits(form, info);
  if (income === undefined || "unsupported" in income) return income;
  return income[whose];
}

/*
 * Line 20 (ca-3506-inst-2025::sec::line-20::b01): married filing separately and
 * meeting Section E item 1, the amount from line 19; not meeting it, the
 * spouse's earned income, which has no fact.
 */
function line20(form: Form, info: Form3506FilingInfo): number | Unsupported | undefined {
  if (info.filingStatus !== "married_filing_separately") return earnedIncome(form, info, "spouse");
  const unmarried = info.dependentCareMfsTreatedAsUnmarried;
  if (unmarried === undefined) return undefined;
  return unmarried
    ? numberOrBlank(form["1.line.19_your_earned_income"])
    : unsupported(SPOUSE_EARNED_INCOME);
}

/* Lines 13 to 18: the benefits and the expenses incurred. */
function benefitBindings(): Bindings {
  return {
    // ca-3506-inst-2025::sec::line-13::b01: W-2 box 10, less any box 10 amount in box 1 wages.
    "1.line.13_dependent_care_benefits_received": (_, info) =>
      partIV(info, () => benefitsReceived(info)),
    // ca-3506-inst-2025::sec::line-14::b01: "the amount from federal Form 2441, line 13".
    "1.line.14_carryover_used_grace_period": (_, info) =>
      partIV(info, () => roundDollars(info.dependentCareGracePeriodCarryover)),
    // ca-3506-inst-2025::sec::line-15::b01: the flexible spending amount forfeited.
    "1.line.15_forfeited_or_carried_forward": (_, info) =>
      partIV(info, () => roundDollars(info.dependentCareBenefitsForfeited)),
    "1.line.16_combined_benefits": (form) => {
      const lines = filledLines(
        form["1.line.13_dependent_care_benefits_received"],
        form["1.line.14_carryover_used_grace_period"],
        form["1.line.15_forfeited_or_carried_forward"],
      );
      return lines === undefined ? undefined : line.line16(lines[0], lines[1], lines[2]);
    },
    // ca-3506-inst-2025::sec::line-17::b01: every qualified expense incurred in 2025, whenever paid.
    "1.line.17_qualified_expenses_incurred": (_, info) =>
      partIV(info, () => roundDollars(info.dependentCareExpensesIncurred)),
    "1.line.18_smaller_of_line_16_or_17": (form) => {
      const lines = filledLines(
        form["1.line.16_combined_benefits"],
        form["1.line.17_qualified_expenses_incurred"],
      );
      return lines === undefined ? undefined : line.line18(lines[0], lines[1]);
    },
  };
}

/* Lines 19 to 27: the exclusion. */
function exclusionBindings(): Bindings {
  return {
    "1.line.19_your_earned_income": (form, info) =>
      partIV(info, () => earnedIncome(form, info, "yours")),
    "1.line.20_spouse_earned_income": (form, info) => partIV(info, () => line20(form, info)),
    "1.line.21_smallest_of_line_18_19_20": (form) => {
      const lines = filledLines(
        form["1.line.18_smaller_of_line_16_or_17"],
        form["1.line.19_your_earned_income"],
        form["1.line.20_spouse_earned_income"],
      );
      return lines === undefined ? undefined : line.line21(lines[0], lines[1], lines[2]);
    },
    // Line 22 (the form; ca-3506-inst-2025::sec::line-20::b01): $5,000, $2,500 for MFS with the spouse's income on line 20, at most the plan's limit.
    "1.line.22_exclusion_limit": (_, info) => partIV(info, () => maximumExclusion(info)),
    // Line 13 reads only W-2s (employer plans), so nothing on it is from the taxpayer's own business.
    "1.line.23_benefits_from_own_business": (_, info) => partIV(info, () => 0),
    "1.line.24_line_16_minus_line_23": (form) => {
      const lines = filledLines(
        form["1.line.16_combined_benefits"],
        form["1.line.23_benefits_from_own_business"],
      );
      return lines === undefined ? undefined : line.line24(lines[0], lines[1]);
    },
    "1.line.25_deductible_benefits": (form) => {
      const lines = filledLines(
        form["1.line.21_smallest_of_line_18_19_20"],
        form["1.line.22_exclusion_limit"],
        form["1.line.23_benefits_from_own_business"],
      );
      return lines === undefined ? undefined : line.line25(lines[0], lines[1], lines[2]);
    },
    "1.line.26_excluded_benefits": (form) => {
      const lines = filledLines(
        form["1.line.21_smallest_of_line_18_19_20"],
        form["1.line.22_exclusion_limit"],
        form["1.line.25_deductible_benefits"],
      );
      return lines === undefined ? undefined : line.line26(lines[0], lines[1], lines[2]);
    },
    "1.line.27_taxable_benefits": (form) => {
      const lines = filledLines(
        form["1.line.24_line_16_minus_line_23"],
        form["1.line.26_excluded_benefits"],
      );
      return lines === undefined ? undefined : line.line27(lines[0], lines[1]);
    },
  };
}

/* Lines 28 to 33: the credit's dollar limit after the benefits. */
function creditLimitBindings(): Bindings {
  return {
    "1.line.28_expense_limit": (_, info) =>
      creditLines(info, () => line.dollarLimit((info.caCarePersons ?? []).length)),
    "1.line.29_deductible_plus_excluded_benefits": (form, info) =>
      creditLines(info, () => {
        const lines = filledLines(
          form["1.line.25_deductible_benefits"],
          form["1.line.26_excluded_benefits"],
        );
        return lines === undefined ? undefined : line.line29(lines[0], lines[1]);
      }),
    "1.line.30_limit_minus_benefits": (form) => {
      const lines = filledLines(
        form["1.line.28_expense_limit"],
        form["1.line.29_deductible_plus_excluded_benefits"],
      );
      return lines === undefined ? undefined : line.line30(lines[0], lines[1]);
    },
    "1.line.31_total_column_e_expenses": (form, info) => {
      if (!line30Positive(form)) return undefined;
      const taxable = numberOrBlank(form["1.line.27_taxable_benefits"]) ?? 0;
      return taxable > 0 ? unsupported(TAXABLE_BENEFITS_IN_COLUMN_E) : columnETotal(info);
    },
    // "Enter the amount from your federal Form 2441, Part III, line 31" (the form).
    "1.line.32_federal_form_2441_line_31": (form) =>
      line30Positive(form)
        ? numberOrBlank(form["form-2441.1.line.31_smaller_line_29_30"])
        : undefined,
    "1.line.33_smallest_of_line_30_31_32": (form) => {
      const lines = filledLines(
        form["1.line.30_limit_minus_benefits"],
        form["1.line.31_total_column_e_expenses"],
        form["1.line.32_federal_form_2441_line_31"],
      );
      return lines === undefined || lines[0] <= 0
        ? undefined
        : line.line33(lines[0], lines[1], lines[2]);
    },
  };
}

export function partIVBindings(): Bindings {
  return { ...benefitBindings(), ...exclusionBindings(), ...creditLimitBindings() };
}
