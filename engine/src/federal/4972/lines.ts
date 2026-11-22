/*
 * Form 4972 arithmetic: Part II, Part III, the NUA Worksheet, the Death Benefit
 * Worksheet and the multiple-recipient Step 5 worksheet. Pure functions of the
 * Form 1099-R amounts and the recipient's choices. Each money line is whole
 * dollars (CLAUDE.md rounding rule); a line that reads other lines uses their
 * rounded values.
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/* Line 7: "Multiply line 6 by 20% (0.20)" (the blank form; irs-4972-form-2025::sec::omb-no-1545-0193::b02). */
export const CAPITAL_GAIN_RATE = 0.2;
/* Line 12: "If this amount is $70,000 or more, skip lines 13 through 16" (omb-no-1545-0193::b03). */
export const MINIMUM_ALLOWANCE_ENDS_AT = 70_000;
/* Line 13: "Multiply line 12 by 50% (0.50), but don't enter more than $10,000". */
export const MINIMUM_ALLOWANCE_RATE = 0.5;
export const MINIMUM_ALLOWANCE_CAP = 10_000;
/* Line 14: "Subtract $20,000 from line 12"; line 15: "Multiply line 14 by 20% (0.20)". */
export const MINIMUM_ALLOWANCE_FLOOR = 20_000;
export const MINIMUM_ALLOWANCE_REDUCTION_RATE = 0.2;
/* Lines 23 and 26: "Multiply ... by 10% (0.10)"; lines 25 and 28: "Multiply ... by 10.0". */
export const TEN_YEAR_FRACTION = 0.1;
export const TEN_YEAR_MULTIPLIER = 10;
/* Line 9: "you may be able to exclude up to $5,000" (irs-4972-form-2025::sec::line-9::b01). */
export const DEATH_BENEFIT_EXCLUSION_LIMIT = 5_000;
/*
 * Line 20 and worksheet lines C: "rounded to at least three places". Four
 * places, as the filled-in Form 4972 of Pub. 575 (2024) prints line 20 (.0588).
 */
export const DECIMAL_PLACES = 4;

/*
 * The Tax Rate Schedule for lines 24 and 27 (irs-4972-form-2025::sec::tax-rate-schedule::b01):
 * over `over`, the tax is `base` plus `rate` of the amount over `over`.
 */
export const TAX_RATE_SCHEDULE: ReadonlyArray<{ over: number; base: number; rate: number }> = [
  { over: 0, base: 0, rate: 0.11 },
  { over: 1_190, base: 130.9, rate: 0.12 },
  { over: 2_270, base: 260.5, rate: 0.14 },
  { over: 4_530, base: 576.9, rate: 0.15 },
  { over: 6_690, base: 900.9, rate: 0.16 },
  { over: 9_170, base: 1_297.7, rate: 0.18 },
  { over: 11_440, base: 1_706.3, rate: 0.2 },
  { over: 13_710, base: 2_160.3, rate: 0.23 },
  { over: 17_160, base: 2_953.8, rate: 0.26 },
  { over: 22_880, base: 4_441, rate: 0.3 },
  { over: 28_600, base: 6_157, rate: 0.34 },
  { over: 34_320, base: 8_101.8, rate: 0.38 },
  { over: 42_300, base: 11_134.2, rate: 0.42 },
  { over: 57_190, base: 17_388, rate: 0.48 },
  { over: 85_790, base: 31_116, rate: 0.5 },
];

/* Lines 24 and 27 before rounding: the schedule's tax on an amount; 0 for 0 or less. */
export function scheduleTax(amount: number): number {
  if (amount <= 0) return 0;
  const bracket = TAX_RATE_SCHEDULE.reduce(
    (found, row) => (amount > row.over ? row : found),
    TAX_RATE_SCHEDULE[0],
  );
  return bracket.base + bracket.rate * (amount - bracket.over);
}

/* A worksheet ratio ("divide ... and enter the result as a decimal"); 0 when the divisor is 0. */
export function decimalRatio(numerator: number, divisor: number): number {
  return divisor > 0 ? roundToPlaces(numerator / divisor, DECIMAL_PLACES) : 0;
}

/* The Form 1099-R boxes, added across the participant's forms, cents kept. */
export interface LumpSumAmounts {
  /* Box 2a. */
  taxableAmount: number;
  /* Box 3. */
  capitalGain: number;
  /* Box 6. */
  netUnrealizedAppreciation: number;
  /* Box 8: the current actuarial value of an annuity contract. */
  annuityValue: number;
  /* Box 9a as a fraction (0.4 for 40%); 1 for the only recipient. */
  recipientShare: number;
  /* Box 8's percentage as a fraction; 1 for the only recipient. */
  annuityShare: number;
}

export interface LumpSumChoices {
  capitalGainElection: boolean;
  tenYearOption: boolean;
  includeNua: boolean;
  /* The allowable death benefit exclusion before any split among recipients; 0 for none. */
  deathBenefitExclusion: number;
  /* Federal estate tax paid on the lump-sum distribution; 0 for none. */
  federalEstateTax: number;
}

export interface NuaWorksheet {
  lineA: number;
  lineB: number;
  lineC: number;
  lineD: number;
  lineE: number;
  lineF: number;
  lineG: number;
}

/* Lines D to F only with a death benefit exclusion; A to C also figure the estate tax on the gain. */
export interface DeathBenefitWorksheet {
  lineA: number;
  lineB: number;
  lineC: number;
  lineD?: number;
  lineE?: number;
  lineF?: number;
}

/* Part II takes place only with an amount in box 3 (irs-4972-form-2025::sec::line-6::b01). */
export function completesPartII(amounts: LumpSumAmounts, choices: LumpSumChoices): boolean {
  return choices.capitalGainElection && roundDollars(amounts.capitalGain) > 0;
}

/*
 * The NUA Worksheet (irs-4972-form-2025::sec::specific-instructions::b04): with
 * the 20% capital gain election and the election to include NUA in income
 * ("Step 1 ... If you make the 20% capital gain election in Part II and also
 * elect to include NUA in taxable income, complete the NUA Worksheet").
 */
export function nuaWorksheet(
  amounts: LumpSumAmounts,
  choices: LumpSumChoices,
): NuaWorksheet | undefined {
  const lineD = roundDollars(amounts.netUnrealizedAppreciation);
  if (!completesPartII(amounts, choices) || !choices.includeNua || lineD <= 0) return undefined;
  const lineA = roundDollars(amounts.capitalGain);
  const lineB = roundDollars(amounts.taxableAmount);
  const lineC = decimalRatio(lineA, lineB);
  const lineE = roundDollars(lineC * lineD);
  return { lineA, lineB, lineC, lineD, lineE, lineF: lineD - lineE, lineG: lineA + lineE };
}

/*
 * The Death Benefit Worksheet (specific-instructions::b05), for line 6: lines A
 * to C with a death benefit exclusion or federal estate tax ("complete the Death
 * Benefit Worksheet, earlier, through line C, even if you don't take the death
 * benefit exclusion", line-6::b01); lines D to F with the exclusion. Line D is
 * the recipient's share: "the allowable death benefit exclusion must be
 * allocated among the recipients in the same proportion that they share the
 * distribution" (the worksheet's note).
 */
export function deathBenefitWorksheet(
  amounts: LumpSumAmounts,
  choices: LumpSumChoices,
  nua: NuaWorksheet | undefined,
): DeathBenefitWorksheet | undefined {
  if (!completesPartII(amounts, choices)) return undefined;
  if (choices.deathBenefitExclusion <= 0 && choices.federalEstateTax <= 0) return undefined;
  const lineA = nua?.lineG ?? roundDollars(amounts.capitalGain);
  const lineB = roundDollars(
    sum(amounts.taxableAmount, nua ? amounts.netUnrealizedAppreciation : undefined),
  );
  const lineC = decimalRatio(lineA, lineB);
  if (choices.deathBenefitExclusion <= 0) return { lineA, lineB, lineC };
  const lineD = roundDollars(fullExclusion(choices) * amounts.recipientShare);
  const lineE = roundDollars(lineD * lineC);
  return { lineA, lineB, lineC, lineD, lineE, lineF: lineA - lineE };
}

/* The allowable exclusion, at most $5,000 (line-9::b01). */
export function fullExclusion(choices: LumpSumChoices): number {
  return roundDollars(
    Math.min(atLeast(0, choices.deathBenefitExclusion), DEATH_BENEFIT_EXCLUSION_LIMIT),
  );
}

/*
 * The part of the federal estate tax that reduces the capital gain: "Multiply
 * the total federal estate tax paid on the lump-sum distribution ... by the
 * decimal on line C of the Death Benefit Worksheet" (line-6::b02). 0 without Part II.
 */
export function estateTaxOnCapitalGain(
  choices: LumpSumChoices,
  deathBenefit: DeathBenefitWorksheet | undefined,
): number {
  if (deathBenefit === undefined || choices.federalEstateTax <= 0) return 0;
  return roundDollars(choices.federalEstateTax * deathBenefit.lineC);
}

export interface PartII {
  line6: number;
  line7: number;
}

/*
 * Line 6: box 3; line G of the NUA Worksheet with NUA; line F of the Death
 * Benefit Worksheet with the exclusion; less the estate tax on the gain
 * (line-6::b01, b02). Line 7 is 20% of it.
 */
export function partII(
  amounts: LumpSumAmounts,
  choices: LumpSumChoices,
  nua: NuaWorksheet | undefined,
  deathBenefit: DeathBenefitWorksheet | undefined,
): PartII | undefined {
  if (!completesPartII(amounts, choices)) return undefined;
  const gain = deathBenefit?.lineF ?? nua?.lineG ?? roundDollars(amounts.capitalGain);
  const line6 = atLeast(0, gain - estateTaxOnCapitalGain(choices, deathBenefit));
  return { line6, line7: roundDollars(line6 * CAPITAL_GAIN_RATE) };
}
