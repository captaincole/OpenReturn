/*
 * Form 8881 (Rev. December 2025): pure arithmetic for the lines the
 * taxpayer's own plan fills. The dollar amounts and rates are printed on the
 * form (irs-8881-face-2025) or stated in its instructions (irs-8881-inst-2025).
 * Lines 7, 10 and 14 (the K-1 credits) and the totals 8, 11 and 15 are in
 * totals.ts.
 */

import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

/* "you must have had no more than 100 employees who received at least $5,000 of compensation" (section-1-small-employer-pension-plan::b01). */
export const SMALL_EMPLOYER_LIMIT = 100;
/* Line 2: "Employers with 1–50 employees enter the amount from line 1. Employers with 51–100 employees enter 50% (0.50) of line 1" (face-part-i::b01). */
export const FULL_CREDIT_EMPLOYEES = 50;
export const LARGER_EMPLOYER_RATE = 0.5;
/* Line 3: "x $250"; line 4: "the greater of $500 or the amount from line 3 (Do not enter more than $5,000)" (face-part-i::b01). */
export const PER_ELIGIBLE_EMPLOYEE = 250;
export const STARTUP_CREDIT_FLOOR = 500;
export const STARTUP_CREDIT_CEILING = 5_000;
/* "for the first credit year and each of the following 2 tax years. No credit is allowed for any other tax year" (section-1-small-employer-pension-plan::b01). */
export const STARTUP_CREDIT_YEARS = 3;

/* "the first tax year during which the plan becomes effective ... and the succeeding 4 tax years" (section-2-small-employer-contributions::b01). */
export const CONTRIBUTION_CREDIT_YEARS = 5;
/* Line 6b (ii) and (iii): wages "in excess of $105,000"; contributions "of more than $1,000" (face-part-i::b01). */
export const WAGE_LIMIT = 105_000;
export const LINE_6B_CONTRIBUTION_LIMIT = 1_000;
/*
 * Line 6c: the most included for one employee, by the year of the plan (line-6c::b01).
 *
 * DECISION (2026-11-27, by the author): the third year includes up to $1,334,
 * as printed. Text A: "The employer contribution credit is subject to a $1,000
 * limit per employee after taking into account the percentage that applies on
 * Line 6g" (irs-8881-inst-2025::sec::line-6c::b01). Text B, the same block:
 * "If this is treated as the third year of the plan, do not include
 * contributions of more than $1,334 per employee", and $1,334 x 75% is
 * $1,000.50. The engine follows the printed amount: the form's arithmetic wins
 * over a sentence it breaks by 50 cents (docs/rule-decisions.md).
 */
export const LINE_6C_CAP_BY_PLAN_YEAR: ReadonlyArray<number> = [1_000, 1_000, 1_334, 2_000, 4_000];
/* Line 6g: "first or second year ... line 6f"; third 75%; fourth 50%; fifth 25% (face-part-i::b02, ::b03). */
export const APPLICABLE_PERCENTAGE_BY_PLAN_YEAR: ReadonlyArray<number> = [1, 1, 0.75, 0.5, 0.25];
/* Line 6e(1): "Subtract 50 (50.0)"; 6e(2): "Multiply line 6e(1) by 2% (0.02)" (face-part-i::b02). */
export const PHASE_IN_EMPLOYEES = 50;
export const PHASE_IN_HUNDREDTHS_PER_EMPLOYEE = 2;
const HUNDREDTHS = 100;

/* Line 9: "Enter $500 if an auto-enrollment option is provided" (face-part-ii::b01), for 3 tax years (how-to-figure-the-credit::b01). */
export const AUTO_ENROLLMENT_CREDIT = 500;
export const AUTO_ENROLLMENT_CREDIT_YEARS = 3;

/* Line 12: "x $200"; line 13: "Do not enter more than $300 per employee" (face-part-iii::b01). */
export const PER_MILITARY_SPOUSE = 200;
export const MILITARY_SPOUSE_CONTRIBUTION_LIMIT = 300;
/* "limited to 3 successive tax years of the employer" (how-to-figure-the-credit-2::b01; line-12::b01). */
export const MILITARY_SPOUSE_CREDIT_YEARS = 3;

/* A year of a credit period counts from 1 (the first credit year) to its last year. */
const inPeriod = (year: number, years: number) => year >= 1 && year <= years;

/* Section 1 as the plan fact states it. */
export interface StartupCostsInput {
  /* 1 for the first credit year, 2 and 3 for the following two. */
  creditYear: number;
  /* Line A: employees paid at least $5,000 in the tax year before the first credit year (specific-instructions::b01). */
  employeesBeforeFirstCreditYear: number;
  /* Line 1: qualified startup costs paid or incurred in 2025. */
  qualifiedCosts: number;
  /* Line 3: non-highly compensated employees eligible to participate in 2025 (line-3::b01). */
  eligibleNonHighlyCompensated: number;
}

export interface Section1Lines {
  lineA: number;
  line1: number;
  line2: number;
  line3Employees: number;
  line3: number;
  line4: number;
  line5: number;
}

/*
 * Lines A to 5; undefined outside the 3 credit years, for an employer with
 * more than 100 employees, or for a plan with no non-highly compensated
 * employee on line 3. Such a plan is not an eligible employer plan: it needs
 * "at least one employee eligible to participate who is not a highly
 * compensated employee" (section-1-small-employer-pension-plan::b02), so an
 * owner-only plan gets no startup costs credit, not line 4's $500.
 */
export function section1Of(input: StartupCostsInput): Section1Lines | undefined {
  const lineA = input.employeesBeforeFirstCreditYear;
  if (
    !inPeriod(input.creditYear, STARTUP_CREDIT_YEARS) ||
    lineA > SMALL_EMPLOYER_LIMIT ||
    input.eligibleNonHighlyCompensated < 1
  ) {
    return undefined;
  }
  const line1 = roundDollars(input.qualifiedCosts);
  // Line 2: "The computation must be based on the number of employees entered on line A" (line-2::b01).
  const line2 = lineA <= FULL_CREDIT_EMPLOYEES ? line1 : roundDollars(line1 * LARGER_EMPLOYER_RATE);
  const line3 = input.eligibleNonHighlyCompensated * PER_ELIGIBLE_EMPLOYEE;
  const line4 = Math.min(STARTUP_CREDIT_CEILING, Math.max(STARTUP_CREDIT_FLOOR, line3));
  const line5 = Math.min(line2, line4);
  return {
    lineA,
    line1,
    line2,
    line3Employees: input.eligibleNonHighlyCompensated,
    line3,
    line4,
    line5,
  };
}

/* One employee's employer contributions (no elective deferrals) and section 3121(a) wages for 2025. */
export interface EmployeeContribution {
  contributions: number;
  wages: number;
}

export interface ContributionsInput {
  /* 1 for the tax year the plan became effective, up to 5. */
  planYear: number;
  /* Line 6a: employees in the tax year before 2025 (line-6a::b01). */
  precedingYearEmployees: number;
  employees: ReadonlyArray<EmployeeContribution>;
}

/* Line 6e: the phase-in for an employer with more than 50 employees on line 6a. */
export interface Line6e {
  excessEmployees: number;
  /* Line 6e(2) in hundredths: 10 excess employees is 20 (0.20). */
  reductionHundredths: number;
  reduction: number;
  afterReduction: number;
}

export interface Section2Lines {
  line6a: number;
  line6b?: number;
  line6c: number;
  line6d: number;
  line6e?: Line6e;
  line6f: number;
  line6g: number;
}

const withinWageLimit = (employee: EmployeeContribution) => employee.wages <= WAGE_LIMIT;
const aboveLine6bLimit = (employee: EmployeeContribution) =>
  employee.contributions > LINE_6B_CONTRIBUTION_LIMIT;

/* Line 6e: "(1) Subtract 50 ... (2) Multiply line 6e(1) by 2% ... (3) Multiply line 6e(2) by line 6d (4) Subtract line 6e(3) from line 6d" (face-part-i::b02). */
export function line6eOf(line6a: number, line6d: number): Line6e | undefined {
  if (line6a <= PHASE_IN_EMPLOYEES) return undefined;
  const excessEmployees = line6a - PHASE_IN_EMPLOYEES;
  const reductionHundredths = excessEmployees * PHASE_IN_HUNDREDTHS_PER_EMPLOYEE;
  const reduction = roundDollars((line6d * reductionHundredths) / HUNDREDTHS);
  // An employer with more than 100 employees on line 6a would subtract more than line 6d: the credit is 0, never below.
  return {
    excessEmployees,
    reductionHundredths,
    reduction,
    afterReduction: atLeast(0, line6d - reduction),
  };
}

/* Lines 6a to 6g; undefined after the fifth year of the plan. */
export function section2Of(input: ContributionsInput): Section2Lines | undefined {
  if (!inPeriod(input.planYear, CONTRIBUTION_CREDIT_YEARS)) return undefined;
  const counted = input.employees.filter(withinWageLimit);
  // Line 6b keeps the cents of each employee and rounds the total (CLAUDE.md, whole-dollar rounding).
  const small = counted.filter((employee) => !aboveLine6bLimit(employee));
  const line6b = roundDollars(sumOrBlank(...small.map((employee) => employee.contributions)));
  // Line 6c: each employee above $1,000, up to the year's amount (line-6c::b01), then "add the amounts together" (::b02).
  const cap = LINE_6C_CAP_BY_PLAN_YEAR[input.planYear - 1];
  const large = counted.filter(aboveLine6bLimit);
  const line6c = roundDollars(
    sum(...large.map((employee) => Math.min(employee.contributions, cap))),
  );
  const line6d = (line6b ?? 0) + line6c;
  const line6e = line6eOf(input.precedingYearEmployees, line6d);
  const line6f = line6e ? line6e.afterReduction : line6d;
  const percentage = APPLICABLE_PERCENTAGE_BY_PLAN_YEAR[input.planYear - 1];
  return {
    line6a: input.precedingYearEmployees,
    line6b,
    line6c,
    line6d,
    line6e,
    line6f,
    line6g: roundDollars(line6f * percentage),
  };
}

/* Line 6e(2) as the form prints it: "0.20" for 20 hundredths, "1.00" for 100. */
export function line6e2Text(hundredths: number): string {
  const whole = (hundredths - (hundredths % HUNDREDTHS)) / HUNDREDTHS;
  return `${whole}.${String(hundredths % HUNDREDTHS).padStart(2, "0")}`;
}

/* Line 9: $500 in the first credit year and the 2 years after it; blank otherwise. */
export const line9Of = (creditYear: number | undefined): number | undefined =>
  creditYear !== undefined && inPeriod(creditYear, AUTO_ENROLLMENT_CREDIT_YEARS)
    ? AUTO_ENROLLMENT_CREDIT
    : undefined;

/* One military spouse employee in the plan. */
export interface MilitarySpouseInput {
  /* 1 for the tax year the employee began participating in the eligible plan, 2 and 3 for the next two. */
  participationYear: number;
  /* Employer contributions for 2025 on the employee's behalf, not elective deferrals (line-13::b01). */
  contributions: number;
}

export interface Part3Lines {
  line12Employees: number;
  line12: number;
  line13: number;
}

/*
 * Lines 12 and 13; undefined with no spouse in the 3-year period, or for an
 * employer with more than 100 employees in 2024: "You can't claim the credit
 * if you had more than 100 employees in the preceding tax year" (face-part-iii::b01).
 */
export function part3Of(
  spouses: ReadonlyArray<MilitarySpouseInput>,
  precedingYearEmployees: number,
): Part3Lines | undefined {
  if (precedingYearEmployees > SMALL_EMPLOYER_LIMIT) return undefined;
  const counted = spouses.filter((spouse) =>
    inPeriod(spouse.participationYear, MILITARY_SPOUSE_CREDIT_YEARS),
  );
  if (counted.length === 0) return undefined;
  const limited = counted.map((spouse) =>
    Math.min(atLeast(0, spouse.contributions), MILITARY_SPOUSE_CONTRIBUTION_LIMIT),
  );
  return {
    line12Employees: counted.length,
    line12: counted.length * PER_MILITARY_SPOUSE,
    line13: roundDollars(sum(...limited)),
  };
}

/* The plan's own lines: blank sections are undefined. */
export interface OwnPlanLines {
  section1?: Section1Lines;
  section2?: Section2Lines;
  line9?: number;
  part3?: Part3Lines;
}

/* The credits the plan's own lines give, by Form 3800 Part III line: 1j (lines 5 and 6g), 1dd (line 9), 1ee (lines 12 and 13). */
export function ownCredits(lines: OwnPlanLines): {
  partI: number;
  partII: number;
  partIII: number;
} {
  return {
    partI: sum(lines.section1?.line5, lines.section2?.line6g),
    partII: lines.line9 ?? 0,
    partIII: sum(lines.part3?.line12, lines.part3?.line13),
  };
}
