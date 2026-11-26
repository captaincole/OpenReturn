/*
 * Worksheets 2 to 5 of the Form 8915-F instructions: the income this year from
 * distributions of earlier years (lines 12 and 23), and the total repayment
 * (lines 14 and 25). Whole dollars.
 */

import type { EarlierForm8915F, PlanAndIraAmounts } from "../../facts/index.js";
import { atLeast, roundDollars } from "../../money.js";
import { LAST_DISTRIBUTION_YEAR_AFTER_DISASTER } from "./lines.js";

/* Part II reads the other-than-IRA lines (11, 13, 14), Part III the IRA lines (22, 24, 25). */
export type PlanOrIra = "plan" | "ira";

export interface PriorYearIncome {
  line1: number;
  line2: number;
  line3: number;
}

/* The spread line of an earlier form: 0 when its box was checked (the whole amount was taxed then). */
function spreadLine(form: EarlierForm8915F | undefined, part: PlanOrIra): number {
  if (!form) return 0;
  const checked = part === "plan" ? form.line11Checked : form.line22Checked;
  if (checked === true) return 0;
  return roundDollars(atLeast(0, (part === "plan" ? form.line11 : form.line22) ?? 0));
}

/* An earlier year's form spreads income into this year when its year can hold distributions. */
const canHoldDistributions = (disasterYear: number, formYear: number) =>
  formYear >= disasterYear && formYear <= disasterYear + LAST_DISTRIBUTION_YEAR_AFTER_DISASTER;

/*
 * Worksheet 2 (line 12) and Worksheet 4 (line 23). Line 1 is last year's line
 * 11 (22), line 2 the line of two years ago, each 0 when its box was checked.
 * The Supplemental Information tables take a year only when distributions could
 * be made in it: for 2025, item B 2021 reads only 2023; 2022 and 2023 read 2024
 * and 2023; 2024 reads 2024; 2025 reads none
 * (irs-8915f-inst-2025::sec::worksheet-2-for-line-12-total-income-from-oth::b02–b03,
 * line-14::b02, worksheet-4-supplemental-information::b01–b02, line-25::b02).
 */
export function priorYearIncome(input: {
  disasterYear: number;
  taxYear: number;
  lastYear?: EarlierForm8915F;
  twoYearsAgo?: EarlierForm8915F;
  part: PlanOrIra;
}): PriorYearIncome {
  const fromYear = (formYear: number, form: EarlierForm8915F | undefined) =>
    canHoldDistributions(input.disasterYear, formYear) ? spreadLine(form, input.part) : 0;
  const line1 = fromYear(input.taxYear - 1, input.lastYear);
  const line2 = fromYear(input.taxYear - 2, input.twoYearsAgo);
  return { line1, line2, line3: line1 + line2 };
}

export interface TotalRepayment {
  line1: number;
  line2: number;
  line3a: number;
  line3b: number;
  line3c: number;
  line4: number;
  line5: number;
}

/* A stated amount in whole dollars; none or below 0 is 0. */
const statedDollars = (amount: number | undefined) => roundDollars(atLeast(0, amount ?? 0));

/*
 * Worksheet 3 (line 14) and Worksheet 5 (line 25): last year's repayment line
 * less last year's income line, at least 0; less what was already carried
 * back; plus this year's repayments (irs-8915f-inst-2025::sec::line-14::b03–b04,
 * worksheet-5::b01–b02).
 */
export function totalRepayment(input: {
  lastYear?: EarlierForm8915F;
  carriedBack?: PlanAndIraAmounts;
  thisYear?: PlanAndIraAmounts;
  part: PlanOrIra;
}): TotalRepayment {
  const plan = input.part === "plan";
  const line1 = statedDollars(plan ? input.lastYear?.line14 : input.lastYear?.line25);
  const line2 = statedDollars(plan ? input.lastYear?.line13 : input.lastYear?.line24);
  const line3a = atLeast(0, line1 - line2);
  const line3b = statedDollars(plan ? input.carriedBack?.plan : input.carriedBack?.ira);
  const line3c = atLeast(0, line3a - line3b);
  const line4 = statedDollars(plan ? input.thisYear?.plan : input.thisYear?.ira);
  return { line1, line2, line3a, line3b, line3c, line4, line5: line3c + line4 };
}
