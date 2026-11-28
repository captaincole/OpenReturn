/*
 * Form 8941: the credit for small employer health insurance premiums of the
 * taxpayer's own employees (section 45R). One fact per return: a sole
 * proprietor with two businesses treats them "as a single employer" and "will
 * file one Form 8941 for both businesses" (irs-8941-inst-2025::sec::eligible-small-employers::b03).
 * The taxpayer states every amount from the payroll and the premium invoices;
 * no information return holds them.
 *
 * The employees are Worksheet 1's rows (irs-8941-inst-2025::sec::worksheet-1-information-needed-to::b01):
 * only "individuals considered employees", so never the owner, a partner, a
 * more-than-2% S corporation shareholder or their family members
 * (column-a-individuals-considered::b02). Each one's coverage is Worksheet 4's
 * row (worksheet-4-information-needed-to::b01).
 *
 * A credit passed through on a Schedule K-1 is not this fact: the K-1 holds
 * it (box 15 or box 13, code BA), and Form 8941 line 15 shows it. A taxpayer
 * whose only credit is from a K-1 files no Form 8941 (general-instructions::b02).
 *
 * The deduction for the premiums goes down by the credit
 * (premium-deduction-reduced::b01): Schedule C line 14 of the business
 * (activitiesOnReturn.ts) or Schedule F line 15 of the farm (farm.ts).
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The two columns of the average premium tables: "Employee-Only" and
 * "Dependent, Family, etc."; "Family coverage includes any coverage other than
 * employee-only coverage" (irs-8941-inst-2025::sec::column-a-enrolled-individuals::b03).
 */
export type HealthCoverageTier = "employee_only" | "family";

/* One plan an employee is enrolled in under the qualifying arrangement. */
export interface EmployeeHealthCoverage {
  tier: HealthCoverageTier;
  /* Worksheet 4 column (b): what the employer paid for it in the tax year, not the employee's salary reductions (employer-premiums-paid::b02), and not a state subsidy paid to the insurer (the next field). */
  employerPremiumsPaid: number;
  /*
   * A state premium subsidy paid directly to the insurer for this plan in the
   * tax year: "treat the subsidy amount as an amount you paid for employee
   * health insurance coverage" (irs-8941-inst-2025::sec::employer-premiums-paid::b01),
   * so it is in column (b), and it is also in line 10 (state-premium-subsidy-and-tax::b01).
   * Absent or 0 with none. A subsidy paid to the employer, or a state tax
   * credit, is in stateSubsidiesAndCredits only.
   */
  stateSubsidyPaidToInsurer?: number;
  /* The plan's total premium for a full year of this coverage (employer and employee parts), the rate column (c) scales (column-a-enrolled-individuals::b03, ::b04). */
  annualPremium: number;
}

/* One row of Worksheet 1. */
export interface HealthCreditEmployee {
  /* Column (a): the name or other identifying information. */
  name: string;
  /* Column (b) before the 2,080-hour limit. */
  hoursOfService: number;
  /* Column (c): wages subject to social security and Medicare tax withholding, with no wage base limit (column-a-individuals-considered::b08). */
  wages: number;
  /* Seasonal labor for 120 or fewer days in the tax year: no hours and no wages, but the premiums count (::b04). */
  seasonal?: boolean;
  /* The plans the employee is enrolled in (Worksheet 4); empty or absent when not enrolled. */
  coverage?: EmployeeHealthCoverage[];
}

export interface SmallEmployerHealthCreditFactValue {
  /* The Schedule C business (`business.<id>`) or farm (`farm.<id>`) that deducts the premiums. */
  activityKey: string;
  /* Line A: premiums for coverage through a SHOP Marketplace, or the county exception (irs-8941-inst-2025::sec::line-a::b01). */
  shopCoverage: boolean;
  /* Line A: the Marketplace identifier, if any. */
  marketplaceIdentifier?: string;
  /* Line B: the EIN used for the employment taxes, when it differs from the identifying number. */
  employmentTaxEin?: string;
  /* Line C: a return for a tax year from 2014 to 2023 had a Form 8941 with line A "Yes" and line 12 above 0 (line-c::b01). */
  creditClaimedBefore2024: boolean;
  employees: HealthCreditEmployee[];
  /*
   * The average premium for the small group market in the rating area where
   * the employees enroll, generally the county of the primary business address,
   * from the tables at the end of the instructions (column-a-enrolled-individuals::b02, ::b03).
   */
  averagePremium: { employeeOnly: number; family: number };
  /* Line 10: state premium subsidies paid to the employer and state tax credits available for the premiums of line 4; 0 with none. The engine adds each plan's stateSubsidyPaidToInsurer to line 10, so it is not stated here again. */
  stateSubsidiesAndCredits: number;
}

export interface SmallEmployerHealthCreditFact {
  key: string;
  value: SmallEmployerHealthCreditFactValue;
}

const HEALTH_CREDIT_CATEGORY = "self_employment";
export const SMALL_EMPLOYER_HEALTH_CREDIT_KEY = "small_employer_health_credit";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isAmount = (value: unknown): boolean => isNumber(value) && value >= 0;
const isText = (value: unknown): boolean => typeof value === "string" && value.trim() !== "";
const isOptionalText = (value: unknown): boolean => value === undefined || isText(value);

function isCoverage(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    (value.tier === "employee_only" || value.tier === "family") &&
    isAmount(value.employerPremiumsPaid) &&
    (value.stateSubsidyPaidToInsurer === undefined || isAmount(value.stateSubsidyPaidToInsurer)) &&
    isNumber(value.annualPremium) &&
    value.annualPremium > 0
  );
}

function isEmployee(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isText(value.name) &&
    isAmount(value.hoursOfService) &&
    isAmount(value.wages) &&
    (value.seasonal === undefined || typeof value.seasonal === "boolean") &&
    (value.coverage === undefined ||
      (Array.isArray(value.coverage) && value.coverage.every(isCoverage)))
  );
}

function isAveragePremium(value: unknown): boolean {
  return isRecord(value) && isAmount(value.employeeOnly) && isAmount(value.family);
}

function isHealthCredit(value: unknown): value is SmallEmployerHealthCreditFactValue {
  if (!isRecord(value)) return false;
  return (
    isText(value.activityKey) &&
    typeof value.shopCoverage === "boolean" &&
    isOptionalText(value.marketplaceIdentifier) &&
    isOptionalText(value.employmentTaxEin) &&
    typeof value.creditClaimedBefore2024 === "boolean" &&
    Array.isArray(value.employees) &&
    value.employees.every(isEmployee) &&
    isAveragePremium(value.averagePremium) &&
    isAmount(value.stateSubsidiesAndCredits)
  );
}

/* The return's small employer health credit fact; malformed when its shape is wrong (Cade records it again). */
export function readSmallEmployerHealthCreditFact(facts: ReadonlyArray<FactRow>): {
  fact?: SmallEmployerHealthCreditFact;
  malformed: boolean;
} {
  const row = facts.find(
    (each) =>
      each.category === HEALTH_CREDIT_CATEGORY && each.key === SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
  );
  if (row === undefined) return { malformed: false };
  if (!isHealthCredit(row.value)) return { malformed: true };
  return { fact: { key: row.key, value: row.value }, malformed: false };
}
