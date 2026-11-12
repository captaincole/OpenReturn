/* Form 2441 Part II helpers: whether the credit applies, earned income, the line 8 decimal. */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, stepsOf, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form2441FilingInfo } from "./filingInfo.js";
import type { Form2441 } from "./types.js";

/*
 * Line 8 table (irs-pub-503-2025::sec::randall-s-reduced-dollar-limit::b01):
 * 35% through $15,000 of AGI, one point less for each $2,000 or part over it,
 * and 20% over $43,000.
 */
const TOP_CREDIT_PERCENT = 35;
const BOTTOM_CREDIT_PERCENT = 20;
const TOP_PERCENT_AGI_LIMIT = 15_000;
const PERCENT_STEP_AGI = 2_000;

/* Lines 3 and 27 (irs-pub-503-2025::sec::dollar-limit::b01): the yearly dollar limit. */
const ONE_PERSON_EXPENSE_LIMIT = 3_000;
const TWO_OR_MORE_PERSONS_EXPENSE_LIMIT = 6_000;

/* Form 1040 line 1 without line 1e, which comes from line 26. */
const LINE_1_WITHOUT_BENEFITS = [
  "form-1040.line.1a",
  "form-1040.line.1b",
  "form-1040.line.1c",
  "form-1040.line.1d",
  "form-1040.line.1f",
  "form-1040.line.1g",
  "form-1040.line.1h_amount",
];

export const DEEMED_INCOME =
  "Deemed earned income of $250 or $500 a month for a spouse who was a student or disabled (line B) is not modeled.";
const JOINT_SELF_EMPLOYMENT =
  "Splitting self-employment earnings (Schedule C or Schedule SE) between spouses on a joint return is not modeled.";
const JOINT_OTHER_EARNED_INCOME =
  "On a joint return only W-2 wages and line 1h disability pensions are split by spouse; another Form 1040 line 1 amount is not.";

/* The line 8 table's percent for an AGI (line 7). */
export function creditPercent(agi: number): number {
  const steps = stepsOf(atLeast(0, agi - TOP_PERCENT_AGI_LIMIT), PERCENT_STEP_AGI);
  return Math.max(BOTTOM_CREDIT_PERCENT, TOP_CREDIT_PERCENT - steps);
}

/* The dollar limit for the qualifying persons on line 2. */
export function expenseLimit(personCount: number): number {
  return personCount > 1 ? TWO_OR_MORE_PERSONS_EXPENSE_LIMIT : ONE_PERSON_EXPENSE_LIMIT;
}

/* Line 2 column (d), every qualifying person: line 3 and line 30. */
export function expensesPaid(info: Form2441FilingInfo): number {
  return sum(
    ...(info.dependentCarePersons ?? []).map((person) => roundDollars(person.expensesPaid)),
  );
}

/* Part III applies with W-2 box 10 dependent care benefits. */
export function hasBenefits(info: Form2441FilingInfo): boolean {
  return (info.dependentCareBenefits ?? 0) > 0;
}

/*
 * Part II applies with a qualifying person's expenses. Married filing
 * separately takes the credit only when treated as unmarried (line A,
 * irs-2441-inst-2025::sec::married-persons-filing-separately::b01). Undefined while an answer waits.
 */
export function claimsCredit(info: Form2441FilingInfo): boolean | undefined {
  const hasExpenses = (info.dependentCarePersons ?? []).some((person) => person.expensesPaid > 0);
  if (!hasExpenses) return false;
  if (info.filingStatus === undefined) return undefined;
  if (info.filingStatus !== "married_filing_separately") return true;
  return info.dependentCareMfsTreatedAsUnmarried;
}

export interface EarnedIncome {
  yours: number;
  spouse: number;
}

/*
 * Lines 4 and 5 (irs-2441-inst-2025::sec::lines-4-and-5::b01): Form 1040 line 1z,
 * plus net earnings from self-employment. A statutory employee's Schedule C, an
 * optional SE method, church income, Form 2555 and combat pay are unsupported on
 * the lines this reads.
 */
export function earnedIncome(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
): EarnedIncome | Unsupported | undefined {
  return earnedIncomeFrom(form, info, numberOrBlank(form["form-1040.line.1z"]));
}

/*
 * MANUAL EDIT: lines 18 and 19 leave out dependent care benefits
 * (irs-2441-inst-2025::sec::line-18::b01): line 1z less line 1e, the taxable
 * benefits. Summed line by line, as line 1z would loop back through line 26.
 */
export function earnedIncomeWithoutBenefits(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
): EarnedIncome | Unsupported | undefined {
  return earnedIncomeFrom(form, info, sum(...LINE_1_WITHOUT_BENEFITS.map((id) => form[id])));
}

function earnedIncomeFrom(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
  line1: number | undefined,
): EarnedIncome | Unsupported | undefined {
  if (line1 === undefined || info.filingStatus === undefined) return undefined;
  if (info.filingStatus !== "married_filing_jointly") {
    const selfEmployment = selfEmploymentEarnings(form, info);
    if (selfEmployment === undefined) return undefined;
    const yours = line1 + selfEmployment;
    return { yours, spouse: yours };
  }
  return jointEarnedIncome(form, info, line1);
}

/*
 * MANUAL EDIT: Schedule SE line 3 less Schedule 1 line 15; with no Schedule SE,
 * the Schedule C profit or loss on Schedule 1 line 3, even under $400
 * (irs-pub-503-2025::sec::earned-income-limit::b02), and a loss reduces earned
 * income (irs-2441-inst-2025::sec::lines-4-and-5::b02). Undefined while either waits.
 */
function selfEmploymentEarnings(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
): number | undefined {
  const scheduleSE = numberOrBlank(form["schedule-se.0.line.3"]);
  if (scheduleSE !== undefined) return scheduleSE - sum(form["schedule-1.1.line.15"]);
  if (info.hasBusiness !== true) return 0;
  if (info.qbiScheduleSEFiled !== false) return undefined;
  return numberOrBlank(form["schedule-1.0.line.3"]);
}

/*
 * Each spouse's own earned income: their W-2 wages and line 1h disability pensions.
 * MANUAL EDIT: line 1z must equal lines 1a and 1h, so taxable dependent care
 * benefits (line 1e, from line 26) make lines 4 and 5 unsupported on a joint return.
 */
function jointEarnedIncome(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
  line1: number,
): EarnedIncome | Unsupported | undefined {
  const studentOrDisabled = info.dependentCareStudentOrDisabledSpouse;
  if (studentOrDisabled === undefined) return undefined;
  if (studentOrDisabled) return unsupported(DEEMED_INCOME);
  if (info.hasBusiness === true || form["schedule-se.0.line.3"] !== undefined) {
    return unsupported(JOINT_SELF_EMPLOYMENT);
  }
  if (line1 !== sum(form["form-1040.line.1a"], form["form-1040.line.1h_amount"])) {
    return unsupported(JOINT_OTHER_EARNED_INCOME);
  }
  const amounts = [
    info.dependentCareTaxpayerW2Wages,
    info.dependentCareTaxpayerDisabilityWages,
    info.dependentCareSpouseW2Wages,
    info.dependentCareSpouseDisabilityWages,
  ];
  if (amounts.includes(undefined)) return undefined;
  const [yourWages, yourPensions, spouseWages, spousePensions] = amounts;
  return {
    yours: roundDollars(sum(yourWages, yourPensions)),
    spouse: roundDollars(sum(spouseWages, spousePensions)),
  };
}
