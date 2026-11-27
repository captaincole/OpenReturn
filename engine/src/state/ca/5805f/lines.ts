/*
 * FTB 5805F as pure arithmetic: Part I (lines 1 to 12) and Part II (lines 13
 * to 16), from the 2025 instructions (ca-5805f-inst-2025) and the form face
 * (ca-5805f-face-2025). Calendar-year individual filers of Form 540 only.
 */

import { dayNumber, type DayNumber } from "../../../federal/2210/dates.js";
import { atLeast, roundDollars, sum } from "../../../money.js";

/* Line 4: "Multiply line 3 by 66 2/3% (.6667)" (ca-5805f-face-2025::sec::face-part-i::b01). */
export const CURRENT_YEAR_SHARE = 0.6667;

/*
 * Lines 6 and 9: "If less than $500 ($250 if married/RDP filing separately),
 * STOP. You do not owe a penalty" (ca-5805f-face-2025::sec::face-part-i::b01);
 * also exceptions 2 and 3 (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01).
 */
export const NO_PENALTY_BELOW = 500;
export const NO_PENALTY_BELOW_SEPARATE = 250;

/*
 * Line 10: "If your California AGI is equal to or greater than
 * $1,000,000/$500,000 for married filing a separate return, use line 4"
 * (ca-5805f-face-2025::sec::face-part-i::b01).
 */
export const HIGH_AGI = 1_000_000;
export const HIGH_AGI_SEPARATE = 500_000;

/*
 * Line 15: "Number of days on line 14 / 365 x .07 x underpayment on line 12";
 * "A year is 365 days" (ca-5805f-face-2025::sec::face-part-ii::b01). 2026 is
 * not a leap year. FTB 5805 gives the same rate, "7% 7-1-25 through 4-15-26"
 * (ca-5805-inst-2025::sec::k-penalty-rates::b01).
 */
export const PENALTY_RATE = 0.07;
export const DAYS_IN_YEAR = 365;

/*
 * The gross income test: "at least two-thirds" (ca-5805f-inst-2025::sec::b-qualifications::b01).
 * Form 2210-F reads the same test, so it lives with the fact kind.
 */
export { meetsFarmerGrossIncomeTest as meetsGrossIncomeTest } from "../../../facts/index.js";

function knownDay(date: string): DayNumber {
  const day = dayNumber(date);
  if (day === undefined) throw new Error(`FTB 5805F calendar: bad date ${date}`);
  return day;
}

/* The one payment's due date for a calendar-year filer (::c-required-estimate-payment::b01). */
export const DUE_DATE = knownDay("2026-01-15");
/* Line 13: "the date ... the amount on line 12 was paid or April 15, 2026, whichever is earlier." */
export const PENALTY_END = knownDay("2026-04-15");

/* The 2024 return, when the taxpayer filed one for 12 months. */
export interface PriorYearInputs {
  /* Line 9: the 2024 tax less the 2024 lump-sum tax (PRIOR_YEAR_KEYS.caTax). */
  taxLessLumpSum: number;
  /* Line 8; undefined when there was none. */
  lumpSumTax?: number;
  /* 2024 Form 540 lines 71 and 73, for exception 2; undefined when not asked. */
  withholding?: number;
}

export interface Form5805FInputs {
  /* Form 540 line 48, line 61, line 62 and the IRC Section 453A interest of line 63. */
  taxAfterCredits: number;
  alternativeMinimumTax: number;
  behavioralHealthTax: number;
  installmentSaleInterest: number;
  /* Line 2: Form 540 line 34; undefined when blank. */
  lumpSumTax?: number;
  /* Line 5: Form 540 lines 71 and 73. */
  withholding: number;
  separateReturn: boolean;
  /* Form 540 line 17. */
  caAgi: number;
  /* Undefined: no 2024 return, or one for less than 12 months. */
  priorYear?: PriorYearInputs;
  /* Line 11 less line 5: estimated tax paid on or before January 15, 2026, and the 2024 overpayment applied. */
  paymentsByDueDate: number;
  filedAndPaidByMarch2: boolean;
  /* Line 13: the day the underpayment was paid; undefined means April 15, 2026. */
  underpaymentPaidOn?: DayNumber;
  /* Line 16: the amount to waive; undefined with no waiver request. */
  waiverAmount?: number;
}

export interface PenaltyLines {
  line13: DayNumber;
  line14: number;
  line15: number;
  /* Undefined with no waiver request. */
  line16?: number;
}

export type NoPenaltyReason =
  | "line_6_under_limit"
  | "line_9_under_limit"
  | "no_underpayment"
  | "filed_and_paid_by_march_2"
  | "prior_year_tax_less_withholding_under_limit";

export interface Form5805FLines {
  line1: number;
  line2?: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12?: number;
  /* Part II; undefined when no penalty is owed. */
  penalty?: PenaltyLines;
  noPenalty?: NoPenaltyReason;
}

type PartI = Omit<Form5805FLines, "penalty" | "noPenalty">;

const limitOf = (inputs: Form5805FInputs) =>
  inputs.separateReturn ? NO_PENALTY_BELOW_SEPARATE : NO_PENALTY_BELOW;

/* Lines 1 to 6. */
function currentYear(inputs: Form5805FInputs) {
  const line1 = sum(
    inputs.taxAfterCredits,
    inputs.alternativeMinimumTax,
    inputs.behavioralHealthTax,
    inputs.installmentSaleInterest,
  );
  const line3 = line1 - (inputs.lumpSumTax ?? 0);
  const line4 = roundDollars(line3 * CURRENT_YEAR_SHARE);
  const line5 = inputs.withholding;
  return { line1, line2: inputs.lumpSumTax, line3, line4, line5, line6: line3 - line5 };
}

/* Lines 7 to 9: "do not complete line 7 through line 9" with no 12-month 2024 return. */
function priorYear(inputs: Form5805FInputs) {
  const prior = inputs.priorYear;
  if (prior === undefined) return {};
  const line9 = prior.taxLessLumpSum;
  return { line7: sum(line9, prior.lumpSumTax), line8: prior.lumpSumTax, line9 };
}

/*
 * Line 10: the smaller of lines 4 and 9; line 4 alone at the AGI limit or
 * with no line 9. Line 11 adds line 5 and the payments by the due date.
 */
function requiredPayment(inputs: Form5805FInputs, line4: number, line9: number | undefined) {
  const highAgi = inputs.caAgi >= (inputs.separateReturn ? HIGH_AGI_SEPARATE : HIGH_AGI);
  const line10 = line9 === undefined || highAgi ? line4 : Math.min(line4, line9);
  const line11 = sum(inputs.withholding, inputs.paymentsByDueDate);
  return { line10, line11, line12: atLeast(0, line10 - line11) };
}

/*
 * Exceptions 1 and 2 (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01).
 * Exception 3 is line 9's stop; exception 4 (no 2024 tax) is a line 9 of 0.
 *
 * DECISION (2026-11-26, by the author): exception 1's last day. The FTB 5805F
 * instructions: "You file your 2025 tax return and pay the full amount of tax
 * due by March 2, 2026" (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01).
 * The FTB 5805 instructions: "pay the entire tax due by March 1, 2026"
 * (ca-5805-inst-2025::sec::g-farmers-and-fishermen::b01). The engine takes
 * March 2 (the fact filedAndPaidByMarch2): a form's own instructions decide,
 * and March 1, 2026 is a Sunday.
 */
function exceptionOf(inputs: Form5805FInputs): NoPenaltyReason | undefined {
  if (inputs.filedAndPaidByMarch2) return "filed_and_paid_by_march_2";
  const prior = inputs.priorYear;
  if (prior?.withholding === undefined) return undefined;
  return prior.taxLessLumpSum - prior.withholding < limitOf(inputs)
    ? "prior_year_tax_less_withholding_under_limit"
    : undefined;
}

/*
 * DECISION (2026-11-26, by the author): line 14 counts the days "after January
 * 15, 2026, to and including the date on line 13", and the next sentence says
 * "If you are a calendar year taxpayer and made no estimate payment, enter 90
 * days" (ca-5805f-face-2025::sec::face-part-ii::b01). A filer who made no
 * estimate payment and paid the underpayment before April 15 gets a different
 * count from each. The engine counts the days to line 13: the form's
 * arithmetic wins, and the 90 days is that count for April 15, 2026.
 */
export function penaltyLines(inputs: Form5805FInputs, line12: number): PenaltyLines {
  const paid = inputs.underpaymentPaidOn ?? PENALTY_END;
  const line13 = Math.min(paid, PENALTY_END);
  const line14 = atLeast(0, line13 - DUE_DATE);
  const line15 = roundDollars((line14 / DAYS_IN_YEAR) * PENALTY_RATE * line12);
  const waived = inputs.waiverAmount;
  const line16 = waived === undefined ? undefined : atLeast(0, line15 - roundDollars(waived));
  return { line13, line14, line15, line16 };
}

/* Every line of the form; the lines after a stop are blank. */
export function form5805FLines(inputs: Form5805FInputs): Form5805FLines {
  const current = currentYear(inputs);
  if (current.line6 < limitOf(inputs)) return { ...current, noPenalty: "line_6_under_limit" };
  const prior = priorYear(inputs);
  if (prior.line9 !== undefined && prior.line9 < limitOf(inputs)) {
    return { ...current, ...prior, noPenalty: "line_9_under_limit" };
  }
  const partI: PartI = {
    ...current,
    ...prior,
    ...requiredPayment(inputs, current.line4, prior.line9),
  };
  const line12 = partI.line12 ?? 0;
  if (line12 <= 0) return { ...partI, noPenalty: "no_underpayment" };
  const exception = exceptionOf(inputs);
  if (exception !== undefined) return { ...partI, noPenalty: exception };
  return { ...partI, penalty: penaltyLines(inputs, line12) };
}

/* Line 13 prints "mm/dd/yyyy". */
export function dateText(day: DayNumber): string {
  const date = new Date(day * 86_400_000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${dayOfMonth}/${date.getUTCFullYear()}`;
}

/* The two rows below line 16: at most this many characters on the first row, broken at a space. */
export const EXPLANATION_ROW_CHARACTERS = 95;

export function explanationRows(text: string): [string, string | undefined] {
  const words = text
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
  const first: string[] = [];
  let length = 0;
  for (const word of words) {
    const next = length === 0 ? word.length : length + 1 + word.length;
    if (next > EXPLANATION_ROW_CHARACTERS && first.length > 0) break;
    first.push(word);
    length = next;
  }
  const rest = words.slice(first.length).join(" ");
  return [first.join(" "), rest.length > 0 ? rest : undefined];
}
