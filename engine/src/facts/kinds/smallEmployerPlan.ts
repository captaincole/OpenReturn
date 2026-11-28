/*
 * Form 8881: the retirement plan of the taxpayer's own business or farm, as
 * the taxpayer states it from the plan's records and the payroll. The fact is
 * the claim: the taxpayer states only the credits the plan qualifies for (an
 * eligible employer, no plan for the same employees in the 3 years before, a
 * non-highly compensated employee who can join). "You may elect, however, to
 * have section 45E not apply ... by not claiming it" (irs-8881-inst-2025::sec::part-i::b01).
 *
 * One fact for the return: "All eligible employer plans of the same employer
 * are treated as one eligible employer plan" (section-1-small-employer-pension-plan::b02).
 * A second fact makes both malformed, so Cade asks again.
 *
 * The employer deducts the startup costs less line 5 and the contributions
 * less line 6g (no-deduction-allowed-for-credit-amount::b01, -2::b01);
 * smallEmployerPlanReductions gives the amounts, and businessesOnReturn and
 * farmsOnReturn take them off the activity's expense lines. A credit from a
 * partnership or S corporation is a K-1 box, not this fact.
 */

import {
  section1Of,
  section2Of,
  type EmployeeContribution,
  type MilitarySpouseInput,
  type StartupCostsInput,
} from "../../federal/8881/lines.js";
import { atLeast } from "../../money.js";
import type { BusinessExpenses } from "./business.js";
import type { FarmExpenses } from "./farm.js";

type FactRow = { key: string; value: unknown; category: string };

export interface PlanStartupCosts extends StartupCostsInput {
  /* The activity's expense field that holds the startup costs, which line 5 reduces. */
  deductedOn: keyof BusinessExpenses | keyof FarmExpenses;
}

export interface PlanContributions {
  /* 1 for the tax year the plan became effective for the employer, up to 5. */
  planYear: number;
  /* Each employee who received employer contributions in 2025. The owner's own contributions (Schedule 1 line 16) are not listed. */
  employees: EmployeeContribution[];
}

export interface SmallEmployerPlanFactValue {
  /* The plan's name, for the taxpayer's records; no line prints it. */
  name: string;
  /* The fact key of the business ("business.<id>") or farm ("farm.<id>") that sponsors the plan and deducts its costs. */
  activityKey: string;
  /*
   * Employees in 2024 who received at least $5,000 of compensation: line 6a and
   * Part III's limit. Needed with contributions or military spouses.
   *
   * DECISION (2026-11-27, by the author): line 6a counts the employees paid at
   * least $5,000. Text A: "Enter the number of your employees during the tax
   * year preceding the tax year for which the credit is claimed"
   * (irs-8881-inst-2025::sec::line-6a::b01), with no pay test. Text B: an
   * eligible employer has "no more than 100 employees who received at least
   * $5,000 of compensation" (section-2-small-employer-contributions::b01), and
   * the Part III limit is the same count (how-to-figure-the-credit-2::b01).
   * One count serves line 6a and Part III, the one the instructions define;
   * section 45E(f)(4) counts employees "under the rules of subsection (c)".
   */
  precedingYearEmployees?: number;
  /* Section 1, the startup costs credit. */
  startupCosts?: PlanStartupCosts;
  /* Section 2, the employer contributions credit. */
  contributions?: PlanContributions;
  /* Part II: 1 for the first tax year the plan included an automatic contribution arrangement, 2 and 3 after it. */
  autoEnrollmentCreditYear?: number;
  /* Part III: each military spouse employee in the plan in 2025 (not highly compensated). */
  militarySpouses?: MilitarySpouseInput[];
}

export interface SmallEmployerPlanFact {
  key: string;
  value: SmallEmployerPlanFactValue;
}

const PLAN_CATEGORY = "self_employment";
const PLAN_PREFIX = "small_employer_plan.";
const BUSINESS_PREFIX = "business.";
const FARM_PREFIX = "farm.";

export function makeSmallEmployerPlanFactKey(slug: string): string {
  return `${PLAN_PREFIX}${slug}`;
}

export function isSmallEmployerPlanFactKey(key: string): boolean {
  const slug = key.slice(PLAN_PREFIX.length);
  return key.startsWith(PLAN_PREFIX) && slug !== "" && !slug.includes(".");
}

// prettier-ignore
const BUSINESS_EXPENSE_FIELDS: ReadonlyArray<keyof BusinessExpenses> = [
  "advertising", "commissionsAndFees", "contractLabor", "employeeBenefitPrograms", "insurance",
  "legalAndProfessional", "office", "pensionAndProfitSharing", "supplies", "taxesAndLicenses",
  "utilities",
];
// prettier-ignore
const FARM_EXPENSE_FIELDS: ReadonlyArray<keyof FarmExpenses> = [
  "customHire", "employeeBenefitPrograms", "insurance", "pensionAndProfitSharing", "supplies",
  "taxes", "utilities",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const isCount = (value: unknown): value is number => Number.isInteger(value) && isAmount(value);
const isYear = (value: unknown): boolean => isCount(value) && (value as number) >= 1;
const isListOf = (value: unknown, check: (entry: Record<string, unknown>) => boolean): boolean =>
  Array.isArray(value) && value.every((entry) => isRecord(entry) && check(entry));

/* The expense fields the startup costs can sit in, by the kind of activity. */
const expenseFieldsOf = (activityKey: string): ReadonlyArray<string> => {
  if (activityKey.startsWith(BUSINESS_PREFIX)) return BUSINESS_EXPENSE_FIELDS;
  return activityKey.startsWith(FARM_PREFIX) ? FARM_EXPENSE_FIELDS : [];
};

function isStartupCosts(value: unknown, activityKey: string): boolean {
  if (value === undefined) return true;
  return (
    isRecord(value) &&
    isYear(value.creditYear) &&
    isCount(value.employeesBeforeFirstCreditYear) &&
    isAmount(value.qualifiedCosts) &&
    isCount(value.eligibleNonHighlyCompensated) &&
    expenseFieldsOf(activityKey).includes(value.deductedOn as string)
  );
}

const isEmployeeContribution = (entry: Record<string, unknown>) =>
  isAmount(entry.contributions) && isAmount(entry.wages);

const isContributions = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) && isYear(value.planYear) && isListOf(value.employees, isEmployeeContribution));

const isMilitarySpouse = (entry: Record<string, unknown>) =>
  isYear(entry.participationYear) && isAmount(entry.contributions);

/* Line 6a and Part III need the 2024 employee count. */
const countWhenNeeded = (fields: Record<string, unknown>) =>
  fields.contributions === undefined && fields.militarySpouses === undefined
    ? fields.precedingYearEmployees === undefined || isCount(fields.precedingYearEmployees)
    : isCount(fields.precedingYearEmployees);

function isPlan(value: unknown): value is SmallEmployerPlanFactValue {
  if (!isRecord(value) || typeof value.activityKey !== "string") return false;
  return (
    typeof value.name === "string" &&
    countWhenNeeded(value) &&
    isStartupCosts(value.startupCosts, value.activityKey) &&
    isContributions(value.contributions) &&
    (value.autoEnrollmentCreditYear === undefined || isYear(value.autoEnrollmentCreditYear)) &&
    (value.militarySpouses === undefined || isListOf(value.militarySpouses, isMilitarySpouse))
  );
}

/* The plan fact whose fields check; every key is malformed when it does not, or when there are two. */
export function readSmallEmployerPlans(facts: ReadonlyArray<FactRow>): {
  plans: SmallEmployerPlanFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === PLAN_CATEGORY && isSmallEmployerPlanFactKey(row.key),
  );
  if (rows.length > 1) return { plans: [], malformedKeys: rows.map((row) => row.key) };
  return {
    plans: rows
      .filter((row) => isPlan(row.value))
      .map((row) => ({ key: row.key, value: row.value as SmallEmployerPlanFactValue })),
    malformedKeys: rows.filter((row) => !isPlan(row.value)).map((row) => row.key),
  };
}

/* The amounts each expense field of one activity is lowered by. */
export type ExpenseReductions = Readonly<Record<string, number>>;

/*
 * The plan's activity and its reductions: "You must reduce your otherwise
 * allowable deduction for startup costs by the credit amount on line 5"
 * (no-deduction-allowed-for-credit-amount::b01) and "your other allowable
 * deduction for employer contributions by the credit amount on Line 6g"
 * (no-deduction-allowed-for-credit-amount-2::b01): Schedule C line 19 or
 * Schedule F line 23. The credits before any Form 3800 limit. Parts II and
 * III lower no deduction: sections 45T and 45AA have no such rule.
 */
export function smallEmployerPlanReductions(
  facts: ReadonlyArray<FactRow>,
): Map<string, ExpenseReductions> {
  const plan = readSmallEmployerPlans(facts).plans[0]?.value;
  if (plan === undefined) return new Map();
  const startup = plan.startupCosts ? section1Of(plan.startupCosts)?.line5 : undefined;
  const contributions =
    plan.contributions && plan.precedingYearEmployees !== undefined
      ? section2Of({ ...plan.contributions, precedingYearEmployees: plan.precedingYearEmployees })
          ?.line6g
      : undefined;
  const reductions: Record<string, number> = {};
  if (startup && plan.startupCosts) reductions[plan.startupCosts.deductedOn] = startup;
  if (contributions) {
    reductions.pensionAndProfitSharing = (reductions.pensionAndProfitSharing ?? 0) + contributions;
  }
  return Object.keys(reductions).length > 0 ? new Map([[plan.activityKey, reductions]]) : new Map();
}

/* The expenses with each stated field lowered, never below 0. A field the activity does not state has nothing to lower. */
export function reducedExpenses<T extends object>(
  expenses: T | undefined,
  reductions: ExpenseReductions | undefined,
): T | undefined {
  if (expenses === undefined || reductions === undefined) return expenses;
  const stated = expenses as Record<string, unknown>;
  const lowered = Object.entries(reductions).flatMap(([field, amount]) => {
    const value = stated[field];
    return typeof value === "number" ? [[field, atLeast(0, value - amount)]] : [];
  });
  return { ...expenses, ...Object.fromEntries(lowered) };
}
