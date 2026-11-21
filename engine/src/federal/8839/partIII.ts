import { atLeast, sum } from "../../money.js";
import { phaseOut, reductionOf, type PhaseOut } from "./lines.js";

/* One child's Part III inputs: lines 19, 20 and 22, and the line 24 special rule. */
export interface PartIIIInput {
  line19: number;
  line20: number;
  line22: number;
  /* Special needs, final in 2025, and the employer has a qualified program (line-24::b01). */
  takesLine21: boolean;
}

export interface PartIIIColumn {
  line19: number;
  line20: number;
  line21: number;
  line22: number;
  line24: number;
  line28: number;
  line29: number;
}

export interface PartIIIResult {
  columns: PartIIIColumn[];
  line23: number;
  line25: number;
  phaseOut: PhaseOut;
  line30: number;
  /* Line 31: negative when line 30 is more than line 23 (the "Yes" box). */
  line31: number;
  line30MoreThan23: boolean;
}

/*
 * Lines 19–31 (the blank form). Line 21 is not less than zero. Line 24 is the
 * smaller of lines 21 and 22, or line 21 for a special needs child final in 2025
 * when the employer has a qualified program (irs-8839-inst-2025::sec::line-24::b01).
 */
export function partIII(inputs: PartIIIInput[], magi: number): PartIIIResult {
  const phase = phaseOut(magi);
  const columns = inputs.map((input): PartIIIColumn => {
    const line21 = atLeast(0, input.line19 - input.line20);
    const line24 = input.takesLine21 ? line21 : Math.min(line21, input.line22);
    const line28 = phase.over ? reductionOf(line24, phase.thousandths) : 0;
    return {
      line19: input.line19,
      line20: input.line20,
      line21,
      line22: input.line22,
      line24,
      line28,
      line29: line24 - line28,
    };
  });
  const line23 = sum(...columns.map((column) => column.line22));
  const line30 = sum(...columns.map((column) => column.line29));
  return {
    columns,
    line23,
    line25: magi,
    phaseOut: phase,
    line30,
    line31: line23 - line30,
    line30MoreThan23: line30 > line23,
  };
}

/* The Form 1040 amounts the line 25 MAGI worksheet reads. */
export interface Line25WorksheetInput {
  /* Worksheet line 1: Form 1040 line 1z without line 1f (all of line 23 excluded). */
  wagesWithoutLine1f: number;
  /* Worksheet line 2: Form 8839 line 23. */
  line23: number;
  /* Worksheet line 3: Form 1040 lines 2b, 3b, 4b, 5b, 6b, 7a and Schedule 1 line 10. */
  otherIncome: number;
  /* Worksheet line 5: Schedule 1 lines 11 through 20, 23 and 25. */
  adjustments: number;
}

/*
 * The MAGI Worksheet—Line 25, lines 1–6
 * (irs-8839-inst-2025::sec::modified-adjusted-gross-income-magi-worksheet-line-25::b01, b02).
 * The Form 2555, Form 4563 and Puerto Rico additions are gaps the caller checks.
 */
export function line25ModifiedAgi(input: Line25WorksheetInput): number {
  const line4 = input.wagesWithoutLine1f + input.line23 + input.otherIncome;
  return line4 - input.adjustments;
}

/* Form 1040 line 1f: line 31 when it is not zero (the blank form, line 31). */
export function form1040Line1f(line31: number): number | undefined {
  return line31 === 0 ? undefined : line31;
}
