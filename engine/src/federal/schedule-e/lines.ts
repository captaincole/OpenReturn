/*
 * Part I lines 3–21, one set per column. Hand-written (MANUAL EDIT): the
 * bindings spread partIColumnBindings for columns A–C.
 */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import type { RentalExpenses, RentalFactValue } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import type { PropertyColumn, ScheduleEFilingInfo } from "./filingInfo.js";
import type { ScheduleE } from "./types.js";

type Fn = (f: FormAccessor<ScheduleE>, info: ScheduleEFilingInfo) => unknown;
export type PartIBindings = Partial<{
  [K in keyof ScheduleE]: BindingFn<ScheduleE, ScheduleEFilingInfo, K>;
}>;

/* irs-1040se-inst-2025::sec::line-2::b02: used as a home above the greater of 14 days or 10% of fair rental days. */
const HOME_PERSONAL_USE_DAYS = 14;
const HOME_PERSONAL_USE_SHARE = 0.1;
/* A home rented fewer than 15 days reports no rent and no expenses (line-2::b02). */
const MIN_HOME_RENTAL_DAYS = 15;

type ExpenseKey = Exclude<keyof RentalExpenses, "otherDescription">;

/* Lines 5–19: the fieldId's line part, and the fact's amount. */
const EXPENSE_LINES: ReadonlyArray<readonly [string, ExpenseKey]> = [
  ["5_advertising", "advertising"],
  ["6_auto_and_travel", "autoAndTravel"],
  ["7_cleaning_and_maintenance", "cleaningAndMaintenance"],
  ["8_commissions", "commissions"],
  ["9_insurance", "insurance"],
  ["10_legal_professional_fees", "legalAndProfessional"],
  ["11_management_fees", "managementFees"],
  ["12_mortgage_interest", "mortgageInterest"],
  ["13_other_interest", "otherInterest"],
  ["14_repairs", "repairs"],
  ["15_supplies", "supplies"],
  ["16_taxes", "taxes"],
  ["17_utilities", "utilities"],
  ["18_depreciation_or_depletion", "depreciationOrDepletion"],
  ["19_other", "other"],
];

const isRealEstate = (property: RentalFactValue) => property.propertyType !== "royalties";

function usedAsHome(property: RentalFactValue): boolean | undefined {
  const { personalUseDays, fairRentalDays } = property;
  if (personalUseDays === 0) return false;
  if (personalUseDays === undefined || fairRentalDays === undefined) return undefined;
  return (
    personalUseDays > Math.max(HOME_PERSONAL_USE_DAYS, HOME_PERSONAL_USE_SHARE * fairRentalDays)
  );
}

/* Line 3 waits on line 2's days: a home rented under 15 days is not reported. */
function rentsReported(property: RentalFactValue): boolean {
  if (!isRealEstate(property)) return true;
  const home = usedAsHome(property);
  if (home === undefined) return false;
  return !home || (property.fairRentalDays ?? 0) >= MIN_HOME_RENTAL_DAYS;
}

/*
 * Personal-use days need the expenses split by days (line-2::b03) and, for a home,
 * Pub. 527's limits; the fact does not say whether the stated amounts are split.
 */
function expensesAsStated(property: RentalFactValue): boolean {
  return !isRealEstate(property) || property.personalUseDays === 0;
}

/* Real estate whose line 2 personal-use days the fact does not state. */
export function personalUseUnknown(property: RentalFactValue): boolean {
  return isRealEstate(property) && property.personalUseDays === undefined;
}

const rents = (property: RentalFactValue) =>
  rentsReported(property) ? roundDollars(property.rentsReceived) : undefined;

const expense = (property: RentalFactValue, key: ExpenseKey) =>
  expensesAsStated(property) ? roundDollars(property.expenses?.[key]) : undefined;

// Line 20 adds the rounded lines 5–19.
function totalExpenses(property: RentalFactValue) {
  if (!expensesAsStated(property)) return undefined;
  return sumOrBlank(...EXPENSE_LINES.map(([, key]) => expense(property, key)));
}

/* Line 3 and 4 less line 20, before the at-risk rules; undefined when blank or blocked. */
export function netIncomeOrLoss(property: RentalFactValue): number | undefined {
  if (!rentsReported(property) || !expensesAsStated(property)) return undefined;
  const income = sumOrBlank(rents(property), roundDollars(property.royaltiesReceived));
  const expenses = totalExpenses(property);
  if (income === undefined && expenses === undefined) return undefined;
  return sum(income) - sum(expenses);
}

/*
 * irs-1040se-inst-2025::sec::line-21::b01: with amounts not at risk, Form 6198
 * figures the loss (not modeled), so a loss waits on allInvestmentAtRisk.
 */
function incomeOrLoss(property: RentalFactValue): number | undefined {
  const net = netIncomeOrLoss(property);
  if (net === undefined || net >= 0) return net;
  return property.allInvestmentAtRisk === true ? net : undefined;
}

// One "Other (list)" box serves all three columns; several are labeled by column.
export function otherExpenseDescription(info: ScheduleEFilingInfo) {
  const others = (info.rentalProperties ?? []).filter(
    (property) => (property.value.expenses?.other ?? 0) > 0,
  );
  if (others.length === 0) return undefined;
  if (others.some((property) => !property.value.expenses?.otherDescription)) return undefined;
  if (others.length === 1) return others[0].value.expenses?.otherDescription;
  return others
    .map(
      (property) =>
        `${property.column.toUpperCase()}: ${property.value.expenses?.otherDescription}`,
    )
    .join("; ");
}

/* Lines 3–21 for one column; an empty column stays blank. */
export function partIColumnBindings(column: PropertyColumn): PartIBindings {
  const amount =
    (line: (property: RentalFactValue) => number | undefined): Fn =>
    (_, info) => {
      const property = info.rentalProperties?.find((entry) => entry.column === column)?.value;
      return property ? line(property) : undefined;
    };
  const out: Record<string, Fn> = {
    [`0.line.3_rents_received_${column}`]: amount(rents),
    [`0.line.4_royalties_received_${column}`]: amount((property) =>
      roundDollars(property.royaltiesReceived),
    ),
    [`0.line.20_total_expenses_${column}`]: amount(totalExpenses),
    [`0.line.21_income_or_loss_${column}`]: amount(incomeOrLoss),
  };
  for (const [line, key] of EXPENSE_LINES) {
    out[`0.line.${line}_${column}`] = amount((property) => expense(property, key));
  }
  return out as PartIBindings;
}
