/*
 * The IRA Deduction Worksheet—Schedule 1, Line 20 (irs-1040-inst-2025::sec::your-ira-spouse-s-ira::b01–b03,
 * ::ira-deduction-worksheet-continued::b01–b03), for one person's IRA (one
 * column). A joint return has two columns and its own limits; the engine does
 * not figure it.
 */

import { atLeast, stepsOf, sum } from "../../money.js";

/* ::your-ira-spouse-s-ira::b01: the contribution limit, and the line 2 amounts. */
const LIMIT_UNDER_50 = 7000;
const LIMIT_50_OR_OLDER = 8000;
const SINGLE_OR_APART_LINE_2 = 89000;
const SURVIVING_SPOUSE_LINE_2 = 146000;
const MFS_LIVED_WITH_SPOUSE_LINE_2 = 10000;
/* ::b02: "If single, head of household, or married filing separately, and the result is $10,000 or more". */
const FULL_LIMIT_MARGIN = 10000;
const FULL_LIMIT_MARGIN_SURVIVING_SPOUSE = 20000;
/* ::ira-deduction-worksheet-continued::b01: 70% (80% at 50 or older), up to the next $10, at least $200. */
const PHASE_OUT_RATE = 0.7;
const PHASE_OUT_RATE_50_OR_OLDER = 0.8;
const PHASE_OUT_RATE_SURVIVING_SPOUSE = 0.35;
const PHASE_OUT_RATE_SURVIVING_SPOUSE_50 = 0.4;
const ROUND_UP_TO = 10;
const MINIMUM_LINE_7 = 200;

export const JOINT_RETURN_GAP =
  "The IRA Deduction Worksheet for a joint return (two columns, the spouse's coverage and Pub. 590-A when both kinds of IRA got contributions) is not modeled.";

export interface IraDeductionInputs {
  status: string | undefined;
  contributions: number;
  /* Line 1a: a retirement plan at work (W-2 box 13) or a self-employed SEP, SIMPLE or qualified plan. */
  coveredByPlan: boolean;
  age50OrOlder: boolean;
  /* Married filing separately: lived apart from the spouse all year. */
  livedApartAllYear: boolean | undefined;
  /* Line 3: Form 1040 line 9. */
  totalIncome: number;
  /* Line 4: Schedule 1 lines 11 through 19a, plus 23 and 25. */
  otherAdjustments: number;
  /* Line 8: wages, salaries, tips, and the alimony on Schedule 1 line 2a. */
  wagesAndAlimony: number;
  /* Line 9: net earnings from self-employment, less Schedule 1 lines 15 and 16. */
  selfEmploymentEarnings: number;
}

/* Line 2 for the filing status; undefined while the married-separately answer is missing. */
function line2(inputs: IraDeductionInputs): number | undefined {
  if (inputs.status === "qualifying_surviving_spouse") return SURVIVING_SPOUSE_LINE_2;
  if (inputs.status !== "married_filing_separately") return SINGLE_OR_APART_LINE_2;
  if (inputs.livedApartAllYear === undefined) return undefined;
  return inputs.livedApartAllYear ? SINGLE_OR_APART_LINE_2 : MFS_LIVED_WITH_SPOUSE_LINE_2;
}

/* Lines 1–7: the most the person can deduct before the earned income limit; undefined while an answer waits. */
function line7(inputs: IraDeductionInputs): number | undefined {
  const limit = inputs.age50OrOlder ? LIMIT_50_OR_OLDER : LIMIT_UNDER_50;
  if (!inputs.coveredByPlan) return limit;
  const threshold = line2(inputs);
  if (threshold === undefined) return undefined;
  const line5 = inputs.totalIncome - inputs.otherAdjustments;
  if (line5 >= threshold) return 0;
  const line6 = threshold - line5;
  const survivor = inputs.status === "qualifying_surviving_spouse";
  if (line6 >= (survivor ? FULL_LIMIT_MARGIN_SURVIVING_SPOUSE : FULL_LIMIT_MARGIN)) return limit;
  const rate = survivor
    ? inputs.age50OrOlder
      ? PHASE_OUT_RATE_SURVIVING_SPOUSE_50
      : PHASE_OUT_RATE_SURVIVING_SPOUSE
    : inputs.age50OrOlder
      ? PHASE_OUT_RATE_50_OR_OLDER
      : PHASE_OUT_RATE;
  return Math.max(MINIMUM_LINE_7, stepsOf(line6 * rate, ROUND_UP_TO) * ROUND_UP_TO);
}

/* Line 12: the smallest of line 7, line 10 and line 11; Schedule 1 line 20. */
export function iraDeduction(inputs: IraDeductionInputs): number | undefined {
  const most = line7(inputs);
  if (most === undefined) return undefined;
  const line10 = sum(inputs.wagesAndAlimony, atLeast(0, inputs.selfEmploymentEarnings));
  return Math.min(most, line10, inputs.contributions);
}
