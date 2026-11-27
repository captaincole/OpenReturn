/*
 * Form 2210-F as pure arithmetic: the Part I boxes, Part II (lines 1 to 13)
 * and Part III (lines 14 to 16), from the 2025 form face (irs-2210f-face-2025)
 * and its instructions (irs-2210f-inst-2025). Whole dollars in, whole dollars out.
 */

import type { WaiverRequest } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { dayNumber, type DayNumber } from "../2210/dates.js";
import type { DatedPayment } from "../2210/penaltyWorksheet.js";

/*
 * Lines 3, 6 and 9: "If less than $1,000, you don't owe a penalty; don't file
 * Form 2210-F" (irs-2210f-face-2025::sec::face-part-ii::b01).
 */
export const NO_PENALTY_BELOW = 1000;

/*
 * Line 7: "Multiply line 6 by 66 2/3% (0.667)" (irs-2210f-face-2025::sec::face-part-ii::b01).
 *
 * DECISION (2026-11-26, by the author): the decimal of line 7. The form face:
 * "Multiply line 6 by 66 2/3% (0.667)" (irs-2210f-face-2025::sec::face-part-ii::b01).
 * Pub. 225, the farmer's guide: "at least 66 2/3% (0.6667) of the total tax
 * shown on your 2025 tax return" and "On line 12a, multiply line 11c by 66 2/3%
 * (0.6667)" (irs-pub-225-2025::sec::special-rules-for-qualified::b01,
 * ::required-annual-payment::b01). The engine multiplies by 0.667: a form's
 * own text decides how that form is filled, and Pub. 225's decimal is for the
 * Form 1040-ES worksheet, not for this line.
 */
export const CURRENT_YEAR_SHARE = 0.667;

/*
 * Line 4: "include here 75 percent of the applicable net tax liability" of a
 * section 1062(a) election for 2025 (irs-2210f-inst-2025::sec::line-4::b01–b02).
 */
export const SECTION_1062_SHARE = 0.75;

/*
 * Line 16: "Underpayment on line 13 × Number of days on line 15 / 365 × 0.07"
 * (irs-2210f-face-2025::sec::face-part-iii::b01).
 */
export const PENALTY_RATE = 0.07;
export const DAYS_IN_YEAR = 365;

function knownDay(date: string): DayNumber {
  const day = dayNumber(date);
  if (day === undefined) throw new Error(`Form 2210-F calendar: bad date ${date}`);
  return day;
}

/*
 * The one payment's due date (irs-2210f-inst-2025::sec::who-must-pay-the-underpayment::b01)
 * and the last day line 14 allows (irs-2210f-face-2025::sec::face-part-iii::b01).
 */
export const DUE_DATE = knownDay("2026-01-15");
export const PENALTY_END = knownDay("2026-04-15");

export interface Form2210FInputs {
  /* Line 1: Form 1040 line 22. */
  taxAfterCredits: number;
  /* Line 2 without household employment taxes (Schedule 2, irs-2210f-inst-2025::sec::line-2::b01). */
  otherTaxes: number;
  householdEmploymentTaxes: number;
  /* Form 1040 line 25d, for the household employment tax rule of line 2. */
  incomeTaxWithheld: number;
  /* Line 4 without the section 1062 part (irs-2210f-inst-2025::sec::line-4::b01). */
  refundableCredits: number;
  section1062NetTaxLiability?: number;
  /* Line 8: Form 1040 line 25d and Schedule 3 line 11 (irs-2210f-inst-2025::sec::line-8::b01). */
  withholding: number;
  /* Line 10; undefined with no 12-month 2024 return. */
  priorYearTax?: number;
  /* Line 12 less line 8: estimated tax paid by January 15, 2026, and the 2024 overpayment applied. */
  paymentsByDueDate: number;
  /* Estimated tax payments after January 15, 2026, on their days. */
  latePayments: readonly DatedPayment[];
  /* The day the rest of line 13 was paid by another payment (the return); undefined: April 15, 2026. */
  underpaymentPaidOn?: DayNumber;
  filedAndPaidByMarch2: boolean;
  jointReturn2024: boolean;
  jointReturn2025: boolean;
  waiver?: { request: WaiverRequest; amount: number };
}

export type StopReason =
  | "line_3_under_limit"
  | "line_6_under_limit"
  | "line_9_under_limit"
  | "withholding_covers_required_payment"
  | "no_underpayment"
  | "filed_and_paid_by_march_2";

export interface PenaltyLines {
  line14: DayNumber;
  line15: number;
  /* Line 16 "without regard to the waiver". */
  penaltyBeforeWaiver: number;
  line16: number;
}

export interface PartIILines {
  line1: number;
  line2: number;
  line3: number;
  line4?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12?: number;
  line13?: number;
  /* The first reason in line order that no penalty is owed. */
  stop?: StopReason;
}

export interface Form2210FLines extends PartIILines {
  boxA: boolean;
  boxB: boolean;
  /* Part III; undefined when no penalty is owed. */
  penalty?: PenaltyLines;
}

/*
 * Lines 1 to 13 with line 2's other taxes as given. `stop` is the first reason,
 * in line order, that no penalty is owed. A line is blank only after a line
 * that says "stop" (line 6, the note at line 11, line 13). Lines 3 and 9 say
 * only "you don't owe a penalty; don't file Form 2210-F", and the instructions
 * say "To determine whether the total tax is less than $1,000, complete lines 1
 * through 9" (irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01), so the
 * arithmetic goes on after them (QUESTIONS.md).
 */
export function partIILines(inputs: Form2210FInputs, otherTaxes: number): PartIILines {
  const line1 = roundDollars(inputs.taxAfterCredits);
  const line2 = roundDollars(otherTaxes);
  const line3 = line1 + line2;
  const section1062 = SECTION_1062_SHARE * (inputs.section1062NetTaxLiability ?? 0);
  const line4 = roundDollars(sum(inputs.refundableCredits, section1062));
  const line6 = line3 - line4;
  const top = { line1, line2, line3, line4, line6 };
  if (line3 < NO_PENALTY_BELOW || line6 < NO_PENALTY_BELOW) {
    return { ...top, stop: line3 < NO_PENALTY_BELOW ? "line_3_under_limit" : "line_6_under_limit" };
  }
  const line7 = roundDollars(line6 * CURRENT_YEAR_SHARE);
  const line8 = roundDollars(inputs.withholding);
  const line9 = line6 - line8;
  const line9Stop: StopReason | undefined =
    line9 < NO_PENALTY_BELOW ? "line_9_under_limit" : undefined;
  const line10 = line10Amount(inputs.priorYearTax);
  const line11 = line10 === undefined ? line7 : Math.min(line7, line10);
  const middle = { ...top, line7, line8, line9, line10, line11 };
  if (line8 >= line11) {
    return { ...middle, stop: line9Stop ?? "withholding_covers_required_payment" };
  }
  const line12 = roundDollars(inputs.paymentsByDueDate) + line8;
  const line13 = atLeast(0, line11 - line12);
  const all = { ...middle, line12, line13 };
  const stop = line9Stop ?? (line13 > 0 ? undefined : "no_underpayment");
  return stop === undefined ? all : { ...all, stop };
}

/*
 * Line 10: "If you didn't file a return for 2024 ... don't complete line 10.
 * Instead, enter the amount from line 7 on line 11" (line-10::b02).
 *
 * DECISION (2026-11-26, by the author): a farmer who had no tax for 2024 and
 * did not file. The exceptions: "You won't have to pay the penalty or file
 * this form if ... You had no tax liability for 2024, you were a U.S. citizen
 * or resident alien for the entire year ..., and your 2024 return was (or
 * would have been had you been required to file) for a full 12 months"
 * (irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01). Line 10: "If you
 * didn't file a return for 2024 ... enter the amount from line 7 on line 11.
 * However, see Exceptions to the Penalty, earlier" (irs-2210f-inst-2025::sec::line-10::b02).
 * The engine applies the exception through line 10, as Form 2210 does (row 7
 * of docs/rule-decisions.md): a stated 2024 tax of 0 makes line 11 zero and no
 * penalty follows; "no 12-month return" (undefined) figures one from line 7.
 * One rule for both penalty forms, and Cade asks for the 2024 tax.
 */
function line10Amount(priorYearTax: number | undefined): number | undefined {
  return priorYearTax === undefined ? undefined : roundDollars(priorYearTax);
}

/*
 * Line 2: household employment taxes count unless "(1) you didn't have federal
 * income tax withheld from your income, and (2) you wouldn't be required to
 * make estimated tax payments even if the household employment taxes weren't
 * included" (irs-2210f-inst-2025::sec::line-2::b01). The engine reads (2) as:
 * without them the form reaches line 12, the required annual payment is more
 * than the withholding.
 */
export function line2OtherTaxes(inputs: Form2210FInputs): number {
  if (inputs.householdEmploymentTaxes <= 0) return inputs.otherTaxes;
  const without = partIILines(inputs, inputs.otherTaxes);
  const required = without.stop === undefined || without.stop === "no_underpayment";
  return inputs.incomeTaxWithheld > 0 || required
    ? inputs.otherTaxes + inputs.householdEmploymentTaxes
    : inputs.otherTaxes;
}

/*
 * Line 14: "the date the amount on line 13 was paid or April 15, 2026, whichever
 * is earlier" (irs-2210f-face-2025::sec::face-part-iii::b01). The amount is paid
 * on the day the payments after January 15 add up to it: first the dated
 * estimated tax payments in date order, then the stated day of the rest, else
 * April 15, 2026. A part paid earlier does not shorten the count (QUESTIONS.md).
 *
 * DECISION (2026-11-26, by the author): a part of line 13 paid before the rest.
 * The Form 2210-F face has one date and one count: "Enter the date the amount
 * on line 13 was paid or April 15, 2026, whichever is earlier" and "Underpayment
 * on line 13 × Number of days on line 15 / 365 × 0.07"
 * (irs-2210f-face-2025::sec::face-part-iii::b01); its instructions say nothing
 * more. The Form 2210 instructions: "If more than one payment was required to
 * fully satisfy an underpayment amount, make a separate computation for each
 * payment" (irs-2210-inst-2025::sec::line-4::b01). The engine follows the Form
 * 2210-F face, the day the whole of line 13 is paid: a form's own text decides
 * how that form is filled, and the Form 2210 sentence is for Form 2210's
 * worksheet. The statute counts each portion on its own
 * (usc-26-2025::sec::s6654::b, (b)(2)(B)); QUESTIONS.md names it for
 * docs/law-findings.md.
 */
export function line14Day(
  line13: number,
  latePayments: readonly DatedPayment[],
  paidOn: DayNumber | undefined,
): DayNumber {
  const inOrder = [...latePayments].sort((first, second) => first.day - second.day);
  let paid = 0;
  let lastDay: DayNumber | undefined;
  for (const payment of inOrder) {
    if (payment.day > PENALTY_END) break;
    paid += payment.amount;
    lastDay = payment.day;
    if (paid >= line13) return payment.day;
  }
  const rest = Math.min(paidOn ?? PENALTY_END, PENALTY_END);
  return lastDay === undefined ? rest : Math.max(rest, lastDay);
}

/*
 * Lines 14 to 16. A waiver: "Complete Form 2210-F through line 15 without
 * regard to the waiver. Enter the amount you want waived in parentheses ...
 * Subtract this amount from the total penalty you figured without regard to
 * the waiver, and enter the result on line 16"
 * (irs-2210f-inst-2025::sec::waiver-of-penalty::b01). A request for the whole
 * penalty waives all of it.
 */
export function penaltyLines(inputs: Form2210FInputs, line13: number): PenaltyLines {
  const line14 = line14Day(line13, inputs.latePayments, inputs.underpaymentPaidOn);
  const line15 = atLeast(0, line14 - DUE_DATE);
  const penaltyBeforeWaiver = roundDollars(((line13 * line15) / DAYS_IN_YEAR) * PENALTY_RATE);
  const waiver = inputs.waiver;
  const waived =
    waiver === undefined
      ? 0
      : waiver.request === "entire"
        ? penaltyBeforeWaiver
        : roundDollars(waiver.amount);
  return { line14, line15, penaltyBeforeWaiver, line16: atLeast(0, penaltyBeforeWaiver - waived) };
}

const STOPS_THAT_DO_NOT_FILE: readonly (StopReason | undefined)[] = [
  "line_3_under_limit",
  "line_6_under_limit",
  "line_9_under_limit",
];

/*
 * Every line and the two boxes. Box A: "You request a waiver", for "an
 * underpayment on line 13" (irs-2210f-inst-2025::sec::waiver-of-penalty::b01).
 * Box B: "You filed or are filing a joint return for either 2024 or 2025, but
 * not for both years, and line 10 below is smaller than line 7 below"
 * (irs-2210f-face-2025::sec::face-part-i::b01). Lines 3, 6 and 9 say "don't
 * file Form 2210-F", and the March 2 exception says "You won't have to pay the
 * penalty or file this form" (irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01):
 * both boxes stay clear, so the form leaves the return.
 */
export function form2210FLines(inputs: Form2210FInputs): Form2210FLines {
  const lines = partIILines(inputs, line2OtherTaxes(inputs));
  if (STOPS_THAT_DO_NOT_FILE.includes(lines.stop)) return { ...lines, boxA: false, boxB: false };
  if (inputs.filedAndPaidByMarch2) {
    return { ...lines, stop: "filed_and_paid_by_march_2", boxA: false, boxB: false };
  }
  const boxB =
    inputs.jointReturn2024 !== inputs.jointReturn2025 &&
    lines.line10 !== undefined &&
    lines.line7 !== undefined &&
    lines.line10 < lines.line7;
  const line13 = lines.line13 ?? 0;
  if (line13 <= 0) return { ...lines, boxA: false, boxB };
  return {
    ...lines,
    boxA: inputs.waiver !== undefined,
    boxB,
    penalty: penaltyLines(inputs, line13),
  };
}
