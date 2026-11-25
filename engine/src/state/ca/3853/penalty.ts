/*
 * FTB 3853 from the return: the applicable household income (Step 3), the
 * Part II test, each member's month codes and the Individual Shared
 * Responsibility Penalty (Part IV line 1). FTB 3853 and Form 540 line 92 read
 * them the same way: `read` takes a full field id. Each result is a value,
 * undefined (blank, or waiting for an answer), or unsupported(reason).
 */

import {
  makeChildInvestmentIncomeFactKey,
  type CaAffordabilityTest,
} from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { monthCodes } from "./codes.js";
import type { Ca3853Member, Form3853FilingInfo } from "./filingInfo.js";
import {
  MONTHS_IN_YEAR,
  affordabilityThreshold,
  annualizedContribution,
  applicableHouseholdIncome,
  filingThresholds,
  ftb3803ChildMagi,
  isUnaffordable,
  marketplaceAnnualContribution,
  type FilingThresholds,
  type ThresholdStatus,
} from "./lines.js";

export type ReadField = (fieldId: string) => unknown;
export type Ca3853Info = BaseFilingInfo & Pick<Form3853FilingInfo, "ca3853" | "form3803Children">;
type Result<T> = T | Unsupported | undefined;

export const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && (value as Unsupported).unsupported === true;

export const files3853 = (info: BaseFilingInfo) => info.mustFile?.["form-3853"]?.value === true;

export const NOT_FORM_540 = unsupported(
  "FTB 3853 is figured from Form 540 line 17; a Form 540NR filer's household income (Form 540NR line 17) is not computed by the engine.",
);
const MARRIED_SEPARATELY = unsupported(
  "A married filer filing separately: the Do I Have to File? chart combines both spouses' income (ca-3853-inst-2025::sec::california-gross-income::b01), and the engine does not settle the threshold for one spouse's household.",
);
const SURVIVING_SPOUSE_NO_DEPENDENT = unsupported(
  "The Do I Have to File? chart has no qualifying surviving spouse column with no dependents (ca-3853-inst-2025::sec::california-gross-income::b01).",
);
export const TAX_EXEMPT_INTEREST_UNKNOWN =
  "California tax-exempt interest (Step 3 question 2) needs Schedule CA (540) line 2a and line 2b columns B and C, which the engine does not compute yet.";
const FTB_3803_CHILD_GAP = unsupported(
  "A child's FTB 3803 is not figured (ca-3803 gap), so the child's MAGI (Step 3 question 6) is not known.",
);

export interface HouseholdIncome {
  /* Exact, or a floor when California tax-exempt interest is not known (it is never below 0). */
  amount: number;
  exact: boolean;
  caAgi: number;
  /* Part I line 1: Form 540 line 17 plus California tax-exempt interest; undefined when not exact. */
  returnMagi?: number;
}

/* A member's own MAGI: `printed` in Part I, `counted` in the household income (Step 3 questions 4 to 6). */
export function memberIncome(
  person: Ca3853Member,
  info: Ca3853Info,
): Result<{ printed?: number; counted: number }> {
  if (person.kind === "taxpayer" || person.kind === "spouse") return { counted: 0 };
  const onFtb3803 = info.mustFile?.["form-3803"]?.value === true && person.dependentSlug;
  if (onFtb3803) {
    const key = makeChildInvestmentIncomeFactKey(person.dependentSlug ?? "");
    const child = info.form3803Children?.find((each) => each.factKey === key);
    if (child !== undefined) {
      if (child.lines === undefined)
        return child.gap === undefined ? undefined : FTB_3803_CHILD_GAP;
      const { magi, counted } = ftb3803ChildMagi(child.lines.line1b ?? 0, child.lines.line4);
      return { printed: magi, counted: counted ? magi : 0 };
    }
  }
  const coverage = person.coverage;
  if (coverage?.requiredToFile === undefined) return undefined;
  if (!coverage.requiredToFile) return { printed: coverage.magi, counted: 0 };
  return coverage.magi === undefined
    ? undefined
    : { printed: coverage.magi, counted: coverage.magi };
}

/* Step 3 question 2: 0 with no tax-exempt or U.S. obligation interest; undefined (not known) otherwise. */
function caTaxExemptInterest(read: ReadField, info: Ca3853Info): number | undefined {
  const federal = numberOrBlank(read("form-1040.line.2a")) ?? 0;
  return federal > 0 || (info.ca3853?.usObligationInterest ?? 0) > 0 ? undefined : 0;
}

export function householdIncome(read: ReadField, info: Ca3853Info): Result<HouseholdIncome> {
  const members = info.ca3853?.members ?? [];
  const caAgi = numberOrBlank(read("form-540.line.17_ca_agi"));
  if (caAgi === undefined) return undefined;
  const incomes = members.map((person) => memberIncome(person, info));
  const gap = incomes.find(isGap);
  if (gap !== undefined) return gap;
  if (incomes.some((income) => income === undefined)) return undefined;
  const exempt = caTaxExemptInterest(read, info);
  const amount = applicableHouseholdIncome({
    caAgi,
    caTaxExemptInterest: exempt ?? 0,
    membersMagi: incomes.map((income) => (income as { counted: number }).counted),
  });
  return {
    amount,
    exact: exempt !== undefined,
    caAgi,
    returnMagi: exempt === undefined ? undefined : caAgi + exempt,
  };
}

/* The chart's thresholds for this return. */
export function thresholdsOf(info: Ca3853Info): Result<FilingThresholds> {
  const status = info.filingStatus;
  const household = info.ca3853;
  if (status === undefined || household?.people65OrOlder === undefined) return undefined;
  if (status === "married_filing_separately") return MARRIED_SEPARATELY;
  const thresholds = filingThresholds(
    status as ThresholdStatus,
    household.people65OrOlder,
    household.dependentsClaimed,
  );
  return thresholds ?? SURVIVING_SPOUSE_NO_DEPENDENT;
}

/*
 * DECISION (2026-11-24, by the author, not reviewed by a person): which
 * threshold the household income is tested against. Part II line 1 says
 * "compare your applicable household income to the California adjusted gross
 * income filing threshold or your gross income to the California gross income
 * filing threshold" (ca-3853-inst-2025::sec::line-1-applicable-household-income-or-gross::b01).
 * Step 4 says "Use your gross income to look up your filing threshold" and,
 * when the household income less it is zero or less, "You do not owe an
 * Individual Shared Responsibility Penalty ... check the ... box in Part II"
 * (step-2-flat-dollar-amount::b04). The engine follows Step 4: the household
 * income against the gross income chart, then gross income against the same
 * chart. Reason: Step 4 is the penalty's own arithmetic, and it is the larger
 * threshold the penalty is figured from.
 */
export function partIIBox(read: ReadField, info: Ca3853Info): Result<boolean> {
  const thresholds = thresholdsOf(info);
  if (thresholds === undefined || isGap(thresholds)) return thresholds;
  const income = householdIncome(read, info);
  if (income === undefined || isGap(income)) return income;
  if (income.amount <= thresholds.grossIncome) {
    return income.exact ? true : unsupported(TAX_EXEMPT_INTEREST_UNKNOWN);
  }
  // Gross income is at least Form 540 line 17, so it is over the threshold when line 17 is.
  if (income.caAgi > thresholds.grossIncome) return false;
  const stated = info.ca3853?.grossIncome;
  if (stated !== undefined) return stated < thresholds.grossIncome;
  return info.ca3853?.grossIncomeAsked ? undefined : false;
}

/* The first test that covers the month (the Affordability Worksheet's first situation that applies). */
const testFor = (tests: readonly CaAffordabilityTest[], month: number) =>
  tests.find((test) => test.months.includes(month));

/* (B) for one test: the annualized employer contribution or the Marketplace worksheet's line 13. */
function requiredContribution(
  test: CaAffordabilityTest,
  income: HouseholdIncome,
  read: ReadField,
  info: Ca3853Info,
): number {
  if (test.kind === "employer")
    return annualizedContribution(test.contribution, test.months.length);
  const members = info.ca3853?.members ?? [];
  const returnBenefits =
    (numberOrBlank(read("form-1040.line.6a")) ?? 0) -
    (numberOrBlank(read("form-1040.line.6b")) ?? 0);
  return marketplaceAnnualContribution({
    bronzeMonthlyPremium: test.bronzeMonthlyPremium,
    householdIncome: income.amount,
    nontaxableSocialSecurity: sum(
      returnBenefits,
      ...members.map(({ coverage }) => coverage?.nontaxableSocialSecurity),
    ),
    householdSize: members.filter(({ kind }) => kind !== "unclaimed").length,
    slcspMonthlyPremium: test.slcspMonthlyPremium,
    marriedFilingSeparately: info.filingStatus === "married_filing_separately",
  });
}

/* Code A by month (index 0 is January); undefined while the salary reduction premiums wait. */
function unaffordableMonths(
  person: Ca3853Member,
  income: HouseholdIncome,
  read: ReadField,
  info: Ca3853Info,
): boolean[] | undefined {
  const tests = person.coverage?.affordabilityTests ?? [];
  if (tests.length === 0) return Array.from({ length: MONTHS_IN_YEAR }, () => false);
  const premiums = info.ca3853?.salaryReductionPremiums;
  if (premiums === undefined) return undefined;
  const threshold = affordabilityThreshold(income.amount, premiums);
  return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
    const test = testFor(tests, index + 1);
    return (
      test !== undefined &&
      isUnaffordable(requiredContribution(test, income, read, info), threshold)
    );
  });
}

/* A member's codes, January first. Code A needs the exact household income. */
export function memberCodes(
  person: Ca3853Member,
  read: ReadField,
  info: Ca3853Info,
): Result<string[][]> {
  if (person.codeInputs === undefined) return undefined;
  const tests = person.coverage?.affordabilityTests ?? [];
  let unaffordable = Array.from({ length: MONTHS_IN_YEAR }, () => false);
  if (tests.length > 0) {
    const income = householdIncome(read, info);
    if (income === undefined || isGap(income)) return income;
    if (!income.exact) return unsupported(TAX_EXEMPT_INTEREST_UNKNOWN);
    const months = unaffordableMonths(person, income, read, info);
    if (months === undefined) return undefined;
    unaffordable = months;
  }
  return monthCodes(person.codeInputs, unaffordable);
}
