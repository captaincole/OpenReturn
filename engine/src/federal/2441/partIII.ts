/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * Form 2441 Part III, lines 12 to 31: dependent care benefits. The part is
 * completed only with benefits (irs-2441-inst-2025::sec::purpose-of-form::b01);
 * with none, every line stays blank.
 */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import { atLeast, roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form2441FilingInfo } from "./filingInfo.js";
import {
  claimsCredit,
  earnedIncomeWithoutBenefits,
  expenseLimit,
  expensesPaid,
  hasBenefits,
} from "./lines.js";
import type { Form2441 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form2441]: BindingFn<Form2441, Form2441FilingInfo, K> }>;
type Form = FormAccessor<Form2441>;

/* Line 21 (irs-2441-inst-2025::sec::line-21::b01): the most a plan can exclude. */
const EXCLUSION_LIMIT = 5_000;
const MFS_SPOUSE_INCOME_EXCLUSION_LIMIT = 2_500;

const BENEFITS_IN_WAGES =
  "W-2 box 10 benefits over the plan's exclusion limit are not modeled: the excess is also in box 1 wages, and line 12 leaves it out.";
const PLAN_LIMIT_OF_SEVERAL_PLANS =
  "A plan limit under $5,000 with box 10 on two or more W-2s is not modeled: one limit fact cannot describe each employer's plan.";
const TAXABLE_BENEFITS_IN_COLUMN_D =
  "With taxable benefits (line 26), column (d) leaves out only the benefits on line 28, and the qualifying-person facts record expenses net of all benefits.";
export const SPOUSE_EARNED_INCOME =
  "Married filing separately and not treated as unmarried: the spouse's earned income (line 19) has no fact.";

function partIII<T>(info: Form2441FilingInfo, line: () => T): T | undefined {
  return hasBenefits(info) ? line() : undefined;
}

/* Lines 27 to 31 also need the credit in Part II (irs-2441-inst-2025::sec::lines-27-through-31::b01). */
function creditLines<T>(info: Form2441FilingInfo, line: () => T): T | undefined {
  return hasBenefits(info) && claimsCredit(info) === true ? line() : undefined;
}

/* The lines' values, or undefined while any line is blank. */
function filledLines(...values: unknown[]): number[] | undefined {
  return values.every((value) => typeof value === "number") ? (values as number[]) : undefined;
}

/*
 * MANUAL EDIT: line 21 (irs-2441-inst-2025::sec::line-21::b01) names one plan's
 * limit, capped at $5,000. With box 10 on two or more W-2s (two plans), one
 * limit fact under $5,000 cannot say which plan it is, so it is unsupported.
 */
function planLimit(info: Form2441FilingInfo): number | Unsupported | undefined {
  const limit = roundDollars(info.dependentCarePlanExclusionLimit);
  if (limit === undefined) return undefined;
  if (limit >= EXCLUSION_LIMIT) return EXCLUSION_LIMIT;
  const plans = (info.dependentCareBenefitsByW2 ?? []).length;
  return plans > 1 ? unsupported(PLAN_LIMIT_OF_SEVERAL_PLANS) : limit;
}

/*
 * MANUAL EDIT: line 12 (irs-2441-inst-2025::sec::line-12::b01) reads W-2 box 10
 * only; no fact records benefits from the taxpayer's own sole proprietorship
 * or partnership. Each employer puts its box 10 over its plan's limit in box 1
 * (irs-pub-503-2025::sec::dependent-care-benefits::b03), so each W-2 is tested
 * on its own; the total over $5,000 is line 21's to cap.
 */
function line12(info: Form2441FilingInfo): number | Unsupported {
  const limit = planLimit(info) ?? EXCLUSION_LIMIT;
  if (typeof limit !== "number") return limit;
  const overLimit = (info.dependentCareBenefitsByW2 ?? []).some((box10) => box10 > limit);
  return overLimit ? unsupported(BENEFITS_IN_WAGES) : roundDollars(info.dependentCareBenefits ?? 0);
}

/* MANUAL EDIT: line 19 (irs-2441-inst-2025::sec::line-19::b01): MFS takes line 18 only when treated as unmarried. */
function line19(form: Form, info: Form2441FilingInfo): number | Unsupported | undefined {
  if (info.filingStatus === "married_filing_separately") {
    const unmarried = info.dependentCareMfsTreatedAsUnmarried;
    if (unmarried === undefined) return undefined;
    return unmarried ? form["1.line.18_earned_income"] : unsupported(SPOUSE_EARNED_INCOME);
  }
  const income = earnedIncomeWithoutBenefits(form, info);
  if (income === undefined || "unsupported" in income) return income;
  return income.spouse;
}

/*
 * MANUAL EDIT: line 21 is $2,500 when MFS enters the spouse's earned income on
 * line 19 (the form's text), else $5,000; no more than the plan allows.
 */
function line21(info: Form2441FilingInfo): number | Unsupported | undefined {
  const limit = planLimit(info);
  if (limit === undefined || typeof limit !== "number") return limit;
  if (info.filingStatus === undefined) return undefined;
  if (info.filingStatus !== "married_filing_separately") return limit;
  const unmarried = info.dependentCareMfsTreatedAsUnmarried;
  if (unmarried === undefined) return undefined;
  return unmarried ? limit : Math.min(MFS_SPOUSE_INCOME_EXCLUSION_LIMIT, limit);
}

/* MANUAL EDIT: line 25: with "No" on line 22, the smaller of 20 and 21; else that less line 24. */
function line25(form: Form): number | undefined {
  const lines = filledLines(
    form["1.line.20_smallest_line_17_19"],
    form["1.line.21_maximum_exclusion"],
    form["1.line.24_deductible_benefits"],
  );
  if (lines === undefined) return undefined;
  const [line20, line21, line24] = lines;
  const smaller = Math.min(line20, line21);
  return form["1.line.22_no"] === true ? smaller : atLeast(0, smaller - line24);
}

/* Lines 12 to 17. */
function benefitBindings(): Bindings {
  return {
    "1.line.12_benefits_received": (_, info) => partIII(info, () => line12(info)),
    "1.line.13_grace_period_carryover": (_, info) =>
      partIII(info, () => roundDollars(info.dependentCareGracePeriodCarryover)),
    "1.line.14_forfeited_or_carried_forward": (_, info) =>
      partIII(info, () => roundDollars(info.dependentCareBenefitsForfeited)),
    "1.line.15_combined_benefits": (form) => {
      const lines = filledLines(
        form["1.line.12_benefits_received"],
        form["1.line.13_grace_period_carryover"],
        form["1.line.14_forfeited_or_carried_forward"],
      );
      if (lines === undefined) return undefined;
      const [line12Amount, line13, line14] = lines;
      return line12Amount + line13 - line14;
    },
    "1.line.16_qualified_expenses": (_, info) =>
      partIII(info, () => roundDollars(info.dependentCareExpensesIncurred)),
    "1.line.17_smaller_line_15_16": (form) => {
      const lines = filledLines(
        form["1.line.15_combined_benefits"],
        form["1.line.16_qualified_expenses"],
      );
      return lines === undefined ? undefined : Math.min(...lines);
    },
  };
}

/* Lines 18 to 26. */
function exclusionBindings(): Bindings {
  return {
    "1.line.18_earned_income": (form, info) =>
      partIII(info, () => {
        const income = earnedIncomeWithoutBenefits(form, info);
        if (income === undefined || "unsupported" in income) return income;
        return income.yours;
      }),
    "1.line.19_spouse_earned_income": (form, info) => partIII(info, () => line19(form, info)),
    "1.line.20_smallest_line_17_19": (form) => {
      const lines = filledLines(
        form["1.line.17_smaller_line_15_16"],
        form["1.line.18_earned_income"],
        form["1.line.19_spouse_earned_income"],
      );
      return lines === undefined ? undefined : atLeast(0, Math.min(...lines));
    },
    "1.line.21_maximum_exclusion": (_, info) => partIII(info, () => line21(info)),
    // MANUAL EDIT: line 12 reads only W-2s (employer plans), so nothing on it is from the taxpayer's own business.
    "1.line.22_no": (_, info) => partIII(info, () => true),
    "1.line.22_yes": (_, info) => partIII(info, () => false),
    "1.line.22_amount": (_, info) => partIII(info, () => 0),
    "1.line.23_line_15_minus_22": (form) => {
      const lines = filledLines(form["1.line.15_combined_benefits"], form["1.line.22_amount"]);
      return lines === undefined ? undefined : lines[0] - lines[1];
    },
    "1.line.24_deductible_benefits": (form) => {
      const lines = filledLines(
        form["1.line.20_smallest_line_17_19"],
        form["1.line.21_maximum_exclusion"],
        form["1.line.22_amount"],
      );
      return lines === undefined ? undefined : Math.min(...lines);
    },
    "1.line.25_excluded_benefits": (form) => line25(form),
    "1.line.26_taxable_benefits": (form) => {
      const lines = filledLines(
        form["1.line.23_line_15_minus_22"],
        form["1.line.25_excluded_benefits"],
      );
      return lines === undefined ? undefined : atLeast(0, lines[0] - lines[1]);
    },
  };
}

/* Lines 27 to 31: the credit's expense limit after excluded benefits. */
function creditLimitBindings(): Bindings {
  return {
    "1.line.27_expense_limit": (_, info) =>
      creditLines(info, () => expenseLimit((info.dependentCarePersons ?? []).length)),
    "1.line.28_add_lines_24_25": (form, info) =>
      creditLines(info, () => {
        const lines = filledLines(
          form["1.line.24_deductible_benefits"],
          form["1.line.25_excluded_benefits"],
        );
        return lines === undefined ? undefined : lines[0] + lines[1];
      }),
    // MANUAL EDIT: "If zero or less, stop. You can't take the credit": 0 here, lines 30 and 31 blank.
    "1.line.29_line_27_minus_28": (form) => {
      const lines = filledLines(form["1.line.27_expense_limit"], form["1.line.28_add_lines_24_25"]);
      return lines === undefined ? undefined : atLeast(0, lines[0] - lines[1]);
    },
    /*
     * MANUAL EDIT: column (d) leaves out the benefits on line 28 (irs-2441-inst-2025::sec::line-2::b03).
     * The person facts are net of all benefits, which is the same only while line 26 is 0.
     */
    "1.line.30_line_2_col_d_total": (form, info) => {
      const line29 = form["1.line.29_line_27_minus_28"];
      if (line29 === undefined || line29 <= 0) return undefined;
      const line26 = form["1.line.26_taxable_benefits"];
      if (typeof line26 === "number" && line26 > 0)
        return unsupported(TAXABLE_BENEFITS_IN_COLUMN_D);
      return expensesPaid(info);
    },
    "1.line.31_smaller_line_29_30": (form) => {
      const lines = filledLines(
        form["1.line.29_line_27_minus_28"],
        form["1.line.30_line_2_col_d_total"],
      );
      return lines === undefined ? undefined : Math.min(...lines);
    },
  };
}

export function partIIIBindings(): Bindings {
  return { ...benefitBindings(), ...exclusionBindings(), ...creditLimitBindings() };
}
