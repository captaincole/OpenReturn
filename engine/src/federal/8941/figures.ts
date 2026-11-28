/*
 * Form 8941 from the small employer health credit fact
 * (facts/kinds/smallEmployerHealthCredit.ts): lines 1 to 14 for the return,
 * and the credit (line 12) that comes off the premiums deduction of the
 * business or farm the fact names. "You must reduce your deduction for the
 * cost of providing health insurance coverage to your employees by the amount
 * of any credit" (irs-8941-inst-2025::sec::premium-deduction-reduced::b01):
 * Schedule C line 14 (irs-1040sc-inst-2025::sec::line-14::b01,
 * facts/kinds/activitiesOnReturn.ts) or Schedule F line 15
 * (irs-1040sf-inst-2025::sec::line-15::b01, facts/kinds/farm.ts). Line 12 is
 * also the activity's Form 3800 line 4h source (form3800.ts). This file reads
 * only facts, so the facts layer can call it; the farms come from the caller,
 * so farm.ts can call it with no import circle.
 */

import { statedBusinessesOnReturn } from "../../facts/kinds/business.js";
import type { FarmFactValue } from "../../facts/kinds/farm.js";
import {
  readSmallEmployerHealthCreditFact,
  type EmployeeHealthCoverage,
  type HealthCreditEmployee,
  type SmallEmployerHealthCreditFact,
  type SmallEmployerHealthCreditFactValue,
} from "../../facts/kinds/smallEmployerHealthCredit.js";
import { roundDollars, sum } from "../../money.js";
import {
  adjustedAveragePremium,
  creditLines,
  hoursOfService,
  type CreditLines,
  type WorksheetEmployee,
} from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };
export type StatedFarm = { key: string; value: FarmFactValue };

const BUSINESS_PREFIX = "business.";
const FARM_PREFIX = "farm.";

/* The activity that deducts the premiums, as stated (before any credit). */
export interface PremiumActivity {
  kind: "business" | "farm";
  key: string;
  materiallyParticipated?: boolean;
  /* Schedule C line 14 or Schedule F line 15 as stated. */
  benefitPrograms?: number;
}

export interface HealthCreditFigures {
  /* The fact, when its activity is on this return. */
  fact?: SmallEmployerHealthCreditFact;
  /* The fact's shape is wrong: Cade records it again. */
  malformed: boolean;
  activity?: PremiumActivity;
  /* Line A "Yes" and line C "No": the form goes on to line 1 (irs-8941-face-2025::sec::face-page-1::b02). */
  claimsCredit: boolean;
  /* Lines 1 to 14; undefined with no claim or while a gap stops them. */
  lines?: CreditLines;
  /* Why the engine cannot figure the credit or its reduction. */
  gap?: string;
}

/*
 * Worksheet 4 column (b) of one plan: what the employer paid, plus a state
 * subsidy paid to the insurer, which counts "as an amount you paid for employee
 * health insurance coverage" (irs-8941-inst-2025::sec::employer-premiums-paid::b01).
 */
const columnB = (plan: EmployeeHealthCoverage): number =>
  sum(plan.employerPremiumsPaid, plan.stateSubsidyPaidToInsurer);

/*
 * Line 10: the stated subsidies and credits plus every subsidy paid to the
 * insurer. "Net premium payments are employer premiums paid ... minus ... any
 * state premium subsidies paid either to you or directly to your insurance
 * provider" (irs-8941-inst-2025::sec::state-premium-subsidy-and-tax::b01).
 */
function line10Amount(value: SmallEmployerHealthCreditFactValue): number {
  const toInsurer = value.employees.flatMap((employee) =>
    (employee.coverage ?? []).map((plan) => plan.stateSubsidyPaidToInsurer),
  );
  return sum(value.stateSubsidiesAndCredits, ...toInsurer);
}

/* Worksheets 1 and 4 for one employee (lines.ts). */
function worksheetRow(
  employee: HealthCreditEmployee,
  averagePremium: SmallEmployerHealthCreditFactValue["averagePremium"],
): WorksheetEmployee {
  const seasonal = employee.seasonal === true;
  const coverage = employee.coverage ?? [];
  const row = {
    hours: hoursOfService(employee.hoursOfService, seasonal),
    wages: seasonal ? 0 : employee.wages,
  };
  if (coverage.length === 0) return row;
  const average = (tier: string) =>
    tier === "employee_only" ? averagePremium.employeeOnly : averagePremium.family;
  return {
    ...row,
    premiums: {
      employerPremiumsPaid: sum(...coverage.map(columnB)),
      adjustedAveragePremium: sum(
        ...coverage.map((plan) =>
          adjustedAveragePremium(columnB(plan), average(plan.tier), plan.annualPremium),
        ),
      ),
    },
  };
}

/* The activity the fact names, from the stated businesses and the given farms; undefined when it is not on the return. */
function activityOf(
  key: string,
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  farms: ReadonlyArray<StatedFarm>,
): { activity?: PremiumActivity; offReturn: boolean; statedFarmCredit?: number } {
  if (key.startsWith(BUSINESS_PREFIX)) {
    const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
    const business = businesses.find((each) => each.key === key)?.value;
    if (business === undefined) return { offReturn: spouseKeys.includes(key) };
    const { materiallyParticipated } = business;
    const benefitPrograms = business.expenses?.employeeBenefitPrograms;
    return {
      activity: { kind: "business", key, materiallyParticipated, benefitPrograms },
      offReturn: false,
    };
  }
  const farm = key.startsWith(FARM_PREFIX) ? farms.find((each) => each.key === key) : undefined;
  if (farm === undefined) return { offReturn: false };
  const { materiallyParticipated, expenses, smallEmployerHealthCredit } = farm.value;
  const benefitPrograms = expenses?.employeeBenefitPrograms;
  return {
    activity: { kind: "farm", key, materiallyParticipated, benefitPrograms },
    offReturn: false,
    statedFarmCredit: smallEmployerHealthCredit,
  };
}

const NOT_ON_RETURN = (key: string) =>
  `The small employer health credit names ${key}, which is not a Schedule C business or a farm on this return: the credit reduces that activity's deduction for the premiums (irs-8941-inst-2025::sec::premium-deduction-reduced::b01).`;

const STATED_FARM_CREDIT = (key: string) =>
  `The farm ${key} states a Form 8941 credit (smallEmployerHealthCredit), and the small employer health credit fact figures one for it too: state only the fact, so Schedule F line 15 is not reduced twice.`;

/* Why the credit cannot come off the activity's stated premiums line; undefined when it can. */
function deductionGap(activity: PremiumActivity, credit: number): string | undefined {
  if (credit <= roundDollars(activity.benefitPrograms ?? 0)) return undefined;
  const line = activity.kind === "business" ? "Schedule C line 14" : "Schedule F line 15";
  return `The credit ($${credit}) is more than the stated employee benefit programs of ${activity.key} (${line}, $${roundDollars(activity.benefitPrograms ?? 0)}), which hold the premiums the credit reduces (irs-8941-inst-2025::sec::premium-deduction-reduced::b01).`;
}

/*
 * The figures of the return. A fact for a spouse's business on a separate
 * return is not on this return, like the business. With line A "No" or line C
 * "Yes" there is no credit: "Stop. Do not file Form 8941"
 * (irs-8941-face-2025::sec::face-page-1::b01, ::b02).
 */
export function healthCreditFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  farms: ReadonlyArray<StatedFarm>,
): HealthCreditFigures {
  const { fact, malformed } = readSmallEmployerHealthCreditFact(facts);
  if (fact === undefined) return { malformed, claimsCredit: false };
  const { value } = fact;
  const found = activityOf(value.activityKey, facts, joint, farms);
  if (found.offReturn) return { malformed, claimsCredit: false };
  const claimsCredit = value.shopCoverage && !value.creditClaimedBefore2024;
  const base = { fact, malformed, activity: found.activity, claimsCredit };
  if (!claimsCredit) return base;
  if (found.activity === undefined) return { ...base, gap: NOT_ON_RETURN(value.activityKey) };
  if ((found.statedFarmCredit ?? 0) > 0)
    return { ...base, gap: STATED_FARM_CREDIT(value.activityKey) };
  const rows = value.employees.map((employee) => worksheetRow(employee, value.averagePremium));
  const lines = creditLines(rows, line10Amount(value));
  const gap = deductionGap(found.activity, lines.line12);
  return gap === undefined ? { ...base, lines } : { ...base, gap };
}

/* The credit that comes off each activity of a kind, by key; empty while the form has a gap or no credit. */
export function healthCreditReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  kind: PremiumActivity["kind"],
  farms: ReadonlyArray<StatedFarm> = [],
): Map<string, number> {
  const figures = healthCreditFigures(facts, joint, farms);
  const credit = figures.lines?.line12 ?? 0;
  if (figures.activity?.kind !== kind || credit <= 0) return new Map();
  return new Map([[figures.activity.key, credit]]);
}
