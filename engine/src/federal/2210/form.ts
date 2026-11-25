/*
 * The whole of Form 2210 as pure arithmetic: Part I, the Part II boxes, and
 * Part III with Schedule AI when the form figures the penalty. Inputs are whole
 * dollars on their counted days (inputs.ts builds them from the return).
 */

import type { WaiverRequest } from "../../facts/index.js";
import { atLeast, prorateDollars } from "../../money.js";
import { columnOfPayment, DUE_DATES_2025 } from "./dates.js";
import { partILines, type PartIInputs, type PartILines } from "./partI.js";
import { penaltyWorksheet, type DatedPayment, type PenaltyWorksheet } from "./penaltyWorksheet.js";
import { scheduleAILines, type ScheduleAIColumn, type ScheduleAIInputs } from "./scheduleAI.js";
import { regularInstallments, sectionALines, type SectionALines } from "./sectionA.js";

export interface Form2210Inputs {
  partI: PartIInputs;
  jointReturn2025: boolean;
  jointReturn2024: boolean;
  waiver?: { request: WaiverRequest; amount: number };
  /* Estimated tax payments and the applied 2024 overpayment. */
  estimatedPayments: readonly DatedPayment[];
  /* Box D: withholding on the dates it was withheld; it must add up to line 6. */
  datedWithholding?: readonly DatedPayment[];
  /* Box C: Schedule AI's columns. */
  annualized?: Omit<ScheduleAIInputs, "requiredAnnualPayment">;
}

export interface Form2210Boxes {
  a: boolean;
  b: boolean;
  c: boolean;
  d: boolean;
  e: boolean;
}

/* One way to figure the penalty: regular or annualized installments, withholding evenly or by date. */
export interface PenaltyMethod {
  annualized: boolean;
  actualWithholding: boolean;
  scheduleAI?: ScheduleAIColumn[];
  sectionA: SectionALines;
  worksheet: PenaltyWorksheet;
}

export interface Form2210Result {
  partI: PartILines;
  boxes: Form2210Boxes;
  /* Part III and line 19, present when box B, C or D is checked. */
  figured?: PenaltyMethod & { line19: number };
}

const NO_BOXES: Form2210Boxes = { a: false, b: false, c: false, d: false, e: false };

/*
 * "For withheld federal income tax and excess social security or tier 1 RRTA,
 * you are considered to have paid one-fourth of these amounts on each payment
 * due date unless you can show otherwise" (irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01).
 * The quarters add up to line 6 exactly.
 */
export function evenWithholding(line6: number): DatedPayment[] {
  return prorateDollars(line6, [1, 1, 1, 1]).map((amount, index) => ({
    day: DUE_DATES_2025[index],
    amount,
  }));
}

/* Line 11 of each column: the payments counted through its due date (table-1::b01). */
export function paymentsByColumn(payments: readonly DatedPayment[]): number[] {
  const columns = [0, 0, 0, 0];
  for (const payment of payments) {
    const column = columnOfPayment(payment.day);
    if (column !== undefined) columns[column] += payment.amount;
  }
  return columns;
}

function figureMethod(
  inputs: Form2210Inputs,
  line6: number,
  line9: number,
  choice: { annualized: boolean; actualWithholding: boolean },
): PenaltyMethod {
  const scheduleAI =
    choice.annualized && inputs.annualized
      ? scheduleAILines({ ...inputs.annualized, requiredAnnualPayment: line9 })
      : undefined;
  const installments = scheduleAI
    ? scheduleAI.map((column) => column.line27)
    : regularInstallments(line9);
  const withholding =
    choice.actualWithholding && inputs.datedWithholding
      ? inputs.datedWithholding
      : evenWithholding(line6);
  const payments = [...inputs.estimatedPayments, ...withholding];
  return {
    ...choice,
    scheduleAI,
    sectionA: sectionALines(installments, paymentsByColumn(payments)),
    worksheet: penaltyWorksheet(installments, payments),
  };
}

/*
 * Box C: "your penalty is reduced or eliminated when figured using the
 * annualized income installment method"; box D: "Your penalty is lower when
 * figured by treating the federal income tax withheld ... as paid on the dates
 * it was actually withheld." The engine figures each method the facts allow
 * and keeps the lowest penalty; a tie keeps the method with fewer boxes.
 */
export function lowestPenaltyMethod(
  inputs: Form2210Inputs,
  line6: number,
  line9: number,
): PenaltyMethod {
  const choices = [
    { annualized: false, actualWithholding: false },
    { annualized: true, actualWithholding: false },
    { annualized: false, actualWithholding: true },
    { annualized: true, actualWithholding: true },
  ].filter(
    (choice) =>
      (!choice.annualized || inputs.annualized !== undefined) &&
      (!choice.actualWithholding || inputs.datedWithholding !== undefined),
  );
  const methods = choices.map((choice) => figureMethod(inputs, line6, line9, choice));
  return methods.reduce((best, method) =>
    method.worksheet.penalty < best.worksheet.penalty ? method : best,
  );
}

/*
 * Box E: "You filed or are filing a joint return for either 2024 or 2025, but
 * not for both years, and line 8 above is smaller than line 5 above."
 */
function boxE(inputs: Form2210Inputs, partI: PartILines): boolean {
  if (inputs.jointReturn2024 === inputs.jointReturn2025) return false;
  return partI.line8 !== undefined && partI.line5 !== undefined && partI.line8 < partI.line5;
}

/*
 * Part II boxes and Part III (the flowchart on page 1; irs-2210-inst-2025::sec::other-methods-of-figuring-the-penalty::b01).
 * Boxes A–D apply only when line 9 is more than line 6 and a penalty is left.
 * Box A asks to waive the whole penalty: page 1 only, so C and D stay clear.
 * With B, C or D the form figures the penalty; B takes the waived part off
 * line 19 (waiver-of-penalty::b01).
 */
export function form2210(inputs: Form2210Inputs): Form2210Result {
  const partI = partILines(inputs.partI);
  const boxes = { ...NO_BOXES, e: boxE(inputs, partI) };
  if (partI.line9MoreThanLine6 !== true || partI.line6 === undefined) return { partI, boxes };
  const line9 = partI.line9 as number;
  const regular = figureMethod(inputs, partI.line6, line9, {
    annualized: false,
    actualWithholding: false,
  });
  const best = lowestPenaltyMethod(inputs, partI.line6, line9);
  if (best.worksheet.penalty <= 0) {
    const eliminated = regular.worksheet.penalty > 0;
    boxes.c = eliminated && best.annualized;
    boxes.d = eliminated && best.actualWithholding;
    return boxes.c || boxes.d
      ? { partI, boxes, figured: { ...best, line19: 0 } }
      : { partI, boxes };
  }
  boxes.a = inputs.waiver?.request === "entire";
  boxes.b = inputs.waiver?.request === "part";
  if (boxes.a) return { partI, boxes };
  boxes.c = best.annualized;
  boxes.d = best.actualWithholding;
  if (!boxes.b && !boxes.c && !boxes.d) return { partI, boxes };
  const waived = boxes.b ? (inputs.waiver?.amount ?? 0) : 0;
  return {
    partI,
    boxes,
    figured: { ...best, line19: atLeast(0, best.worksheet.penalty - waived) },
  };
}
