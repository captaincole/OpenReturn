/*
 * Schedule G-1 arithmetic, 2025 (ca-540-sched-g1-inst-2025). Pure: amounts in,
 * lines out. The inputs come from the Form 1099-R facts and the taxpayer's
 * answers (resolveInfo.ts). Each printed line rounds to the nearest dollar.
 */

import { atLeast, roundDollars, roundToPlaces, wholePart } from "../../../money.js";

/* Part II: "Figure the tax using 5.5% instead of the 20% used for federal purposes" (::f-capital-gain-election::b01). */
export const CAPITAL_GAIN_RATE = 0.055;
/* The $5,000 death benefit exclusion (::death-benefit-worksheet::b01, footnote). */
export const DEATH_BENEFIT_EXCLUSION_LIMIT = 5000;
/* Line 12: "If this amount is $70,000 or more, skip line 13 through line 16" (the blank form). */
export const ALLOWANCE_CUTOFF = 70000;
/* Line 13: 50%, "but do not enter more than $10,000". */
export const ALLOWANCE_RATE = 0.5;
export const ALLOWANCE_LIMIT = 10000;
/* Lines 14 and 15: the allowance falls by 20% of line 12 over $20,000. */
export const ALLOWANCE_PHASE_OUT_START = 20000;
export const ALLOWANCE_PHASE_OUT_RATE = 0.2;
/* Lines 18 and 24: 10%; lines 20 and 26: times ten. */
export const ONE_TENTH = 0.1;
export const TEN_YEARS = 10;
/* Worksheet ratios: "rounded to at least three places" (irs-4972-form-2025::sec::specific-instructions::b04). */
export const RATIO_PLACES = 3;
/* Line 21: "carried to four places and rounded to three places" (::line-8-…::b02). */
export const LINE_21_CARRIED_PLACES = 4;
const PERCENT = 100;
/* Float error only: 0.4445 × 10,000 is 4444.999…, and the instructions make it .4445. */
const FLOAT_TOLERANCE = 1e-9;

/*
 * Tax Rate Schedule for Part III, 10-Year Averaging
 * (ca-540-sched-g1-inst-2025::sec::tax-rate-schedule-for-part-iii-10-year-averaging::b01, b02):
 * over, the tax on that amount, the rate on the part above it.
 */
export const TEN_YEAR_RATE_SCHEDULE: ReadonlyArray<{ over: number; base: number; rate: number }> = [
  { over: 0, base: 0, rate: 0.01 },
  { over: 3490, base: 34.9, rate: 0.02 },
  { over: 6110, base: 87.3, rate: 0.03 },
  { over: 8710, base: 165.3, rate: 0.04 },
  { over: 11360, base: 271.3, rate: 0.05 },
  { over: 13980, base: 402.3, rate: 0.06 },
  { over: 16630, base: 561.3, rate: 0.07 },
  { over: 19220, base: 742.6, rate: 0.08 },
  { over: 21850, base: 953, rate: 0.09 },
  { over: 24460, base: 1187.9, rate: 0.1 },
  { over: 27090, base: 1450.9, rate: 0.11 },
];

/* What the schedule's lines read: the 1099-R boxes added together, and the answers. */
export interface ScheduleG1Inputs {
  capitalGainElection: boolean;
  tenYearAveraging: boolean;
  includeNua: boolean;
  /* Box 2a. */
  taxableAmount: number;
  /* Box 3. */
  capitalGain: number;
  /* Box 6. */
  nua: number;
  /* Box 8, the current actuarial value of an annuity; undefined with none. */
  annuityValue?: number;
  /* The percentage next to box 8; 100 when the recipient takes all of it. */
  annuityPercent: number;
  /* Box 9a; 100 when the recipient takes the whole distribution. */
  distributionPercent: number;
  /* The recipient's share of the death benefit exclusion, at most $5,000. */
  deathBenefitExclusion?: number;
  /* FTB Pub. 1005, Worksheet I: the California taxable amount. */
  californiaTaxableAmount?: number;
}

/* Lines 21 to 26: only with an annuity on line 11. */
export interface AnnuityLines {
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  line25: number;
  line26: number;
}

export interface PartIIILines {
  line8: number;
  line9?: number;
  line10: number;
  line11?: number;
  line12: number;
  /* Lines 13 to 16 are skipped when line 12 is $70,000 or more. */
  line13?: number;
  line14?: number;
  line15?: number;
  line16?: number;
  line17: number;
  line18: number;
  line19: number;
  line20: number;
  annuity?: AnnuityLines;
  line27: number;
  line28: number;
}

export interface ScheduleG1Lines {
  line6: number;
  line7: number;
  partIII?: PartIIILines;
}

/* The schedule's tax on one tenth of an amount: lines 19 and 25. */
export function tenYearScheduleTax(amount: number): number {
  const bracket = [...TEN_YEAR_RATE_SCHEDULE].reverse().find((row) => amount > row.over);
  if (bracket === undefined) return 0;
  return bracket.base + bracket.rate * (amount - bracket.over);
}

/* Line 21: carried to four places, then rounded to three (.4434 is .443, .4445 is .445). */
export function line21Ratio(line11: number, line12: number): number {
  const scale = 10 ** LINE_21_CARRIED_PLACES;
  const carried = wholePart((line11 / line12) * scale + FLOAT_TOLERANCE) / scale;
  return roundToPlaces(carried, RATIO_PLACES);
}

const ratio = (part: number, whole: number) =>
  whole === 0 ? 0 : roundToPlaces(part / whole, RATIO_PLACES);

/*
 * NUA Worksheet of the Form 4972 instructions, which the California
 * instructions name (::f-capital-gain-election::b01): line E is the capital gain
 * part of box 6, line F the ordinary part, line G the capital gain in all
 * (irs-4972-form-2025::sec::specific-instructions::b04).
 */
export function nuaWorksheet(inputs: ScheduleG1Inputs) {
  const lineE = ratio(inputs.capitalGain, inputs.taxableAmount) * inputs.nua;
  return { lineE, lineF: inputs.nua - lineE, lineG: inputs.capitalGain + lineE };
}

/*
 * Lines A and B of the Death Benefit Worksheet
 * (ca-540-sched-g1-inst-2025::sec::death-benefit-worksheet::b01): the capital
 * gain and the taxable amount. With a California taxable amount, FTB Pub. 1005
 * gives line 6 as that amount times box 3 over box 2a
 * (ftb-pub-1005-2025::sec::california-federal-worksheet-i::b01).
 */
export function capitalGainAndTaxable(inputs: ScheduleG1Inputs) {
  if (inputs.includeNua) {
    return { lineA: nuaWorksheet(inputs).lineG, lineB: inputs.taxableAmount + inputs.nua };
  }
  const taxable = inputs.californiaTaxableAmount;
  if (taxable === undefined) return { lineA: inputs.capitalGain, lineB: inputs.taxableAmount };
  const share = inputs.taxableAmount === 0 ? 0 : inputs.capitalGain / inputs.taxableAmount;
  return { lineA: taxable * share, lineB: taxable };
}

/* Death Benefit Worksheet lines C to F; line E is the exclusion allocated to the capital gain. */
export function deathBenefitWorksheet(inputs: ScheduleG1Inputs) {
  const { lineA, lineB } = capitalGainAndTaxable(inputs);
  const lineD = inputs.deathBenefitExclusion ?? 0;
  const lineE = lineD * ratio(lineA, lineB);
  return { lineA, lineB, lineD, lineE, lineF: lineA - lineE };
}

/*
 * Line 6 (::part-ii::b01): 0 without the 5.5% election; box 3 (or NUA line G);
 * with a death benefit exclusion, line F of the worksheet.
 */
export function line6(inputs: ScheduleG1Inputs): number {
  if (!inputs.capitalGainElection) return 0;
  const worksheet = deathBenefitWorksheet(inputs);
  return roundDollars(
    inputs.deathBenefitExclusion === undefined ? worksheet.lineA : worksheet.lineF,
  );
}

/*
 * Line 8 (::line-8-…::b01, and the multiple-recipient table ::multiple-recipients-…::b02):
 * the ordinary income after the 5.5% election (plus NUA line F), else box 2a
 * (plus box 6 with the NUA election), divided by the box 9a percentage.
 */
export function line8(inputs: ScheduleG1Inputs): number {
  const taxable = inputs.californiaTaxableAmount ?? inputs.taxableAmount;
  const ordinary = inputs.capitalGainElection
    ? inputs.includeNua
      ? inputs.taxableAmount - inputs.capitalGain + nuaWorksheet(inputs).lineF
      : taxable - capitalGainAndTaxable(inputs).lineA
    : taxable + (inputs.includeNua ? inputs.nua : 0);
  return roundDollars((ordinary * PERCENT) / inputs.distributionPercent);
}

/* Line 9 (::line-8-…::b02): the exclusion, less line E of the worksheet when Part II used part of it. */
export function line9(inputs: ScheduleG1Inputs): number | undefined {
  if (inputs.deathBenefitExclusion === undefined) return undefined;
  const used = inputs.capitalGainElection ? deathBenefitWorksheet(inputs).lineE : 0;
  return roundDollars(inputs.deathBenefitExclusion - used);
}

/* Line 11 (::line-8-…::b02): box 8 divided by the percentage shown next to it. */
export function line11(inputs: ScheduleG1Inputs): number | undefined {
  if (inputs.annuityValue === undefined || inputs.annuityValue === 0) return undefined;
  return roundDollars((inputs.annuityValue * PERCENT) / inputs.annuityPercent);
}

/* Lines 13 to 16, the minimum distribution allowance; skipped at $70,000 or more. */
export function minimumDistributionAllowance(line12: number) {
  if (line12 >= ALLOWANCE_CUTOFF) return undefined;
  const line13 = roundDollars(Math.min(line12 * ALLOWANCE_RATE, ALLOWANCE_LIMIT));
  const line14 = atLeast(0, line12 - ALLOWANCE_PHASE_OUT_START);
  const line15 = roundDollars(line14 * ALLOWANCE_PHASE_OUT_RATE);
  return { line13, line14, line15, line16: line13 - line15 };
}

/* Lines 21 to 26: the part of the tax that belongs to the annuity. */
export function annuityLines(line11: number, line12: number, line16: number): AnnuityLines {
  const line21 = line21Ratio(line11, line12);
  const line22 = roundDollars(line16 * line21);
  const line23 = line11 - line22;
  const line24 = roundDollars(line23 * ONE_TENTH);
  const line25 = roundDollars(tenYearScheduleTax(line24));
  return { line21, line22, line23, line24, line25, line26: line25 * TEN_YEARS };
}

/*
 * Line 28 worksheet (::line-8-…::b03): box 9a times line 27, plus line 7. With
 * the whole distribution (100%) it is line 27 plus line 7.
 */
export function line28(line27: number, line7: number, distributionPercent: number): number {
  return roundDollars((line27 * distributionPercent) / PERCENT) + line7;
}

/* Part III, lines 8 to 28. */
export function partIIILines(inputs: ScheduleG1Inputs, line7: number): PartIIILines {
  const eight = line8(inputs);
  const nine = line9(inputs);
  const line10 = eight - (nine ?? 0);
  const eleven = line11(inputs);
  const line12 = line10 + (eleven ?? 0);
  const allowance = minimumDistributionAllowance(line12);
  const line16 = allowance?.line16 ?? 0;
  const line17 = line12 - line16;
  const line18 = roundDollars(line17 * ONE_TENTH);
  const line19 = roundDollars(tenYearScheduleTax(line18));
  const line20 = line19 * TEN_YEARS;
  const annuity = eleven === undefined ? undefined : annuityLines(eleven, line12, line16);
  const line27 = line20 - (annuity?.line26 ?? 0);
  return {
    line8: eight,
    line9: nine,
    line10,
    line11: eleven,
    line12,
    ...allowance,
    line17,
    line18,
    line19,
    line20,
    annuity,
    line27,
    line28: line28(line27, line7, inputs.distributionPercent),
  };
}

export function scheduleG1Lines(inputs: ScheduleG1Inputs): ScheduleG1Lines {
  const six = line6(inputs);
  const line7 = roundDollars(six * CAPITAL_GAIN_RATE);
  const partIII = inputs.tenYearAveraging ? partIIILines(inputs, line7) : undefined;
  return { line6: six, line7, partIII };
}

/*
 * Form 540 line 34: line 28; without Part III, line 7 ("If you elect to use
 * Part III, go to line 8. Otherwise, enter the amount from line 7 on Form 540,
 * line 34", the blank form).
 */
export function scheduleG1Tax(lines: ScheduleG1Lines): number {
  return lines.partIII?.line28 ?? lines.line7;
}

/*
 * The part of box 2a that Schedule G-1 taxes, and so the part that leaves
 * California income (Schedule CA line 5b, column B) when federal AGI includes
 * it: box 3 under Part II, the rest under Part III (QUESTIONS.md).
 */
export function amountTaxedOnScheduleG1(inputs: ScheduleG1Inputs): number {
  const capitalGain = inputs.capitalGainElection ? inputs.capitalGain : 0;
  const ordinary = inputs.tenYearAveraging ? inputs.taxableAmount - capitalGain : 0;
  return roundDollars(capitalGain + ordinary);
}
