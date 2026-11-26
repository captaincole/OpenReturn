/*
 * Form 4972 Part III, the 10-year tax option (irs-4972-form-2025::sec::face-part-iii::b01
 * and b02, the blank form), with the multiple-recipient steps of
 * irs-4972-form-2025::sec::specific-instructions::b02 to b04.
 */

import { atLeast, roundDollars, sum } from "../../money.js";
import {
  MINIMUM_ALLOWANCE_CAP,
  MINIMUM_ALLOWANCE_ENDS_AT,
  MINIMUM_ALLOWANCE_FLOOR,
  MINIMUM_ALLOWANCE_RATE,
  MINIMUM_ALLOWANCE_REDUCTION_RATE,
  TEN_YEAR_FRACTION,
  TEN_YEAR_MULTIPLIER,
  completesPartII,
  decimalRatio,
  estateTaxOnCapitalGain,
  fullExclusion,
  scheduleTax,
  type DeathBenefitWorksheet,
  type LumpSumAmounts,
  type LumpSumChoices,
  type NuaWorksheet,
} from "./lines.js";

/* Lines 13 to 16: blank when line 12 is $70,000 or more. */
export interface MinimumAllowance {
  line13: number;
  line14: number;
  line15: number;
  line16: number;
}

/* Lines 20 to 22: blank when line 11 is zero ("skip lines 20 through 22"). Line 21 is blank with lines 13 to 16. */
export interface AnnuityLines {
  line20: number;
  line21?: number;
  line22: number;
}

/* Lines 26 to 28: blank when line 11 is zero. */
export interface AnnuityTaxLines {
  line26: number;
  line27: number;
  line28: number;
}

/* The Step 5 worksheet of a recipient who shares the distribution (specific-instructions::b04). */
export interface MultipleRecipientsWorksheet {
  lineA: number;
  /* Box 9a as a fraction. */
  lineB: number;
  lineC: number;
}

export interface PartIII {
  line8: number;
  line9?: number;
  line10: number;
  line11: number;
  line12: number;
  allowance?: MinimumAllowance;
  line17: number;
  line18?: number;
  line19: number;
  annuity?: AnnuityLines;
  line23: number;
  line24: number;
  line25: number;
  annuityTax?: AnnuityTaxLines;
  multipleRecipients?: MultipleRecipientsWorksheet;
  line29: number;
}

export interface PartIIIContext {
  amounts: LumpSumAmounts;
  choices: LumpSumChoices;
  nua?: NuaWorksheet;
  deathBenefit?: DeathBenefitWorksheet;
}

/*
 * Line 8 (irs-4972-form-2025::sec::line-8::b01; Steps 2 and 3): box 2a, less box
 * 3 with Part II; plus NUA when included (box 6 without Part II, NUA Worksheet
 * line F with it); divided by the box 9a percentage when the distribution is shared.
 */
export function line8Of({ amounts, choices, nua }: PartIIIContext): number {
  const partII = completesPartII(amounts, choices);
  const nuaIncluded = partII
    ? nua?.lineF
    : choices.includeNua
      ? amounts.netUnrealizedAppreciation
      : undefined;
  const ordinary = sum(amounts.taxableAmount, partII ? -amounts.capitalGain : 0, nuaIncluded);
  return roundDollars(ordinary / amounts.recipientShare);
}

/*
 * Line 9 (line-9::b01, b02): the allowable exclusion. With Part II, the part
 * not used for the capital gain: Death Benefit Worksheet line D − line E for the
 * only recipient, or the full exclusion less the full exclusion times line C for
 * a shared distribution. Both are the full exclusion less its line C part.
 */
export function line9Of({ amounts, choices, deathBenefit }: PartIIIContext): number | undefined {
  const full = fullExclusion(choices);
  if (full <= 0) return undefined;
  if (!completesPartII(amounts, choices) || deathBenefit === undefined) return full;
  const { lineC, lineD, lineE } = deathBenefit;
  if (amounts.recipientShare === 1 && lineD !== undefined && lineE !== undefined)
    return lineD - lineE;
  return full - roundDollars(full * lineC);
}

/* Lines 13 to 16: the minimum distribution allowance. */
export function minimumAllowance(line12: number): MinimumAllowance | undefined {
  if (line12 >= MINIMUM_ALLOWANCE_ENDS_AT) return undefined;
  const line13 = Math.min(roundDollars(line12 * MINIMUM_ALLOWANCE_RATE), MINIMUM_ALLOWANCE_CAP);
  const line14 = atLeast(0, line12 - MINIMUM_ALLOWANCE_FLOOR);
  const line15 = roundDollars(line14 * MINIMUM_ALLOWANCE_REDUCTION_RATE);
  return { line13, line14, line15, line16: atLeast(0, line13 - line15) };
}

/* Lines 23 to 25, or 26 to 28: 10% of the amount, the schedule's tax, times 10. */
export function tenYearTax(amount: number): { tenth: number; tax: number; times10: number } {
  const tenth = roundDollars(amount * TEN_YEAR_FRACTION);
  const tax = roundDollars(scheduleTax(tenth));
  return { tenth, tax, times10: tax * TEN_YEAR_MULTIPLIER };
}

/* Lines 20 to 22 with an annuity on line 11. */
function annuityLines(
  line11: number,
  line12: number,
  allowance: MinimumAllowance | undefined,
): AnnuityLines | undefined {
  if (line11 <= 0) return undefined;
  const line20 = decimalRatio(line11, line12);
  const line21 = allowance === undefined ? undefined : roundDollars(allowance.line16 * line20);
  return { line20, line21, line22: atLeast(0, line11 - (line21 ?? 0)) };
}

/* Line 29: line 25 − line 28; a shared distribution takes its box 9a part (Step 5). */
function line29Of(
  amounts: LumpSumAmounts,
  line25: number,
  annuityTax: AnnuityTaxLines | undefined,
): { line29: number; multipleRecipients?: MultipleRecipientsWorksheet } {
  const difference = atLeast(0, line25 - (annuityTax?.line28 ?? 0));
  if (amounts.recipientShare === 1) return { line29: difference };
  const lineC = roundDollars(difference * amounts.recipientShare);
  return {
    line29: lineC,
    multipleRecipients: { lineA: difference, lineB: amounts.recipientShare, lineC },
  };
}

/* Lines 8 to 29. */
export function partIII(context: PartIIIContext): PartIII {
  const { amounts, choices } = context;
  const line8 = line8Of(context);
  const line9 = line9Of(context);
  const line10 = atLeast(0, line8 - (line9 ?? 0));
  const line11 = roundDollars(amounts.annuityValue / amounts.annuityShare);
  const line12 = line10 + line11;
  const allowance = minimumAllowance(line12);
  const line17 = line12 - (allowance?.line16 ?? 0);
  const estateTax = roundDollars(atLeast(0, choices.federalEstateTax));
  const remainingEstateTax = estateTax - estateTaxOnCapitalGain(choices, context.deathBenefit);
  const line18 = remainingEstateTax > 0 ? remainingEstateTax : undefined;
  const line19 = atLeast(0, line17 - (line18 ?? 0));
  const annuity = annuityLines(line11, line12, allowance);
  const whole = tenYearTax(line19);
  const annuityPart = annuity === undefined ? undefined : tenYearTax(annuity.line22);
  const annuityTax = annuityPart && {
    line26: annuityPart.tenth,
    line27: annuityPart.tax,
    line28: annuityPart.times10,
  };
  return {
    line8,
    line9,
    line10,
    line11,
    line12,
    allowance,
    line17,
    line18,
    line19,
    annuity,
    line23: whole.tenth,
    line24: whole.tax,
    line25: whole.times10,
    annuityTax,
    ...line29Of(amounts, whole.times10, annuityTax),
  };
}
