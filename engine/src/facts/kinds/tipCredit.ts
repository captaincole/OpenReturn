/*
 * Form 8846: the credit for the employer social security and Medicare taxes a
 * business paid on its employees' tips (irs-8846-form-2025::sec::purpose-of-form::b01).
 * One fact per Schedule C business that had tipped employees, holding the
 * amounts from its payroll records. No information return reports them: the
 * owner states them, as the instructions say the employer figures them
 * ("Figure the amount of tips included on line 1 that are not creditable for
 * each employee on a monthly basis", irs-8846-form-2025::sec::line-2::b01).
 *
 * A credit from a partnership or S corporation is not a fact of this kind: it
 * is the K-1's box 15 or box 13 code N (federal/passThrough), which Form 3800
 * line 4f and Form 8846 line 5 read.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The two kinds of business the credit covers (irs-8846-form-2025::sec::who-should-file::b01):
 * food or beverage service where tipping is customary, and barbering and hair
 * care, nail care, esthetics, or body and spa treatment where it is (from 2025).
 */
export type TipCreditBusinessKind = "food_or_beverage" | "beauty_service";

/*
 * One employee's month in which the wages (excluding tips) were less than the
 * hours times the minimum rate of line 2 ($5.15 food or beverage, $7.25 beauty
 * service). A month paid at that rate or more needs no row: its amount is zero
 * (irs-8846-form-2025::sec::line-2::b01).
 */
export interface TipCreditBelowRateMonth {
  /* The employee's name as the payroll records show it. */
  employee: string;
  /* 1 to 12. */
  month: number;
  hoursWorked: number;
  /* Wages paid for the month, tips left out. */
  wagesExcludingTips: number;
  /* The tips the employee received in the month (part of tipsReceived). */
  tips: number;
}

export interface TipCreditFactValue {
  /* The Schedule C business (`business.<id>`) that employed the tipped employees and deducts their employer taxes. */
  businessKey: string;
  kind: TipCreditBusinessKind;
  /*
   * Line 1: the tips the employees received for the services above, on which
   * the business paid or incurred employer social security and Medicare taxes
   * in 2025 (irs-8846-form-2025::sec::line-1::b01).
   */
  tipsReceived: number;
  /* Line 2: every employee month paid below the rate. An empty list: every employee was paid at least the rate. */
  belowRateMonths: TipCreditBelowRateMonth[];
  /*
   * The line 4 box: a tipped employee's 2025 wages and tips together exceeded
   * the social security wage base of $176,100 (irs-8846-form-2025::sec::line-4::b01).
   */
  employeeOverWageBase: boolean;
  /*
   * Line 4's separate computation: the tips of line 3 that were subject only
   * to the 1.45% Medicare tax because the employee had passed the wage base.
   * Needed when employeeOverWageBase is true; ignored otherwise.
   */
  tipsSubjectOnlyToMedicare?: number;
  /*
   * Section 45B(d): the owner elects not to claim the credit for 2025
   * ("You can claim or elect not to claim the credit", purpose-of-form::b01).
   * Form 8846 does not file for this business and its deduction stays whole.
   */
  electNotToClaim?: boolean;
}

export interface TipCreditFact {
  key: string;
  value: TipCreditFactValue;
}

const TIP_CREDIT_CATEGORY = "self_employment";
const TIP_CREDIT_PREFIX = "tip_credit.";

export function makeTipCreditFactKey(businessId: string): string {
  return `${TIP_CREDIT_PREFIX}${businessId}`;
}

export function isTipCreditFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === TIP_CREDIT_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isMonthNumber = (value: unknown): boolean =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12;

function isBelowRateMonth(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const month = value as Record<string, unknown>;
  return (
    typeof month.employee === "string" &&
    isMonthNumber(month.month) &&
    isAmount(month.hoursWorked) &&
    isAmount(month.wagesExcludingTips) &&
    isAmount(month.tips)
  );
}

function isTipCredit(value: unknown): value is TipCreditFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fact = value as Record<string, unknown>;
  return (
    typeof fact.businessKey === "string" &&
    (fact.kind === "food_or_beverage" || fact.kind === "beauty_service") &&
    isAmount(fact.tipsReceived) &&
    Array.isArray(fact.belowRateMonths) &&
    fact.belowRateMonths.every(isBelowRateMonth) &&
    typeof fact.employeeOverWageBase === "boolean" &&
    (fact.tipsSubjectOnlyToMedicare === undefined || isAmount(fact.tipsSubjectOnlyToMedicare)) &&
    (fact.electNotToClaim === undefined || typeof fact.electNotToClaim === "boolean")
  );
}

/* Every tip credit fact, in the order recorded; a malformed one is left out and listed. */
export function readTipCreditFacts(facts: ReadonlyArray<FactRow>): {
  credits: TipCreditFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === TIP_CREDIT_CATEGORY && isTipCreditFactKey(row.key),
  );
  return {
    credits: rows
      .filter((row) => isTipCredit(row.value))
      .map((row) => ({ key: row.key, value: row.value as TipCreditFactValue })),
    malformedKeys: rows.filter((row) => !isTipCredit(row.value)).map((row) => row.key),
  };
}
