/*
 * Form 8915-F Parts II, III and IV: the taxable amount this year. Whole dollars,
 * except the cents of a cost share, which each line rounds once. Block ids are
 * in irs-8915f-inst-2025 unless named otherwise.
 */

import { atLeast, roundDollars, sum } from "../../money.js";
import { amountSubjectToTax, spreadOverThreeYears } from "./lines.js";

export type Answer = "yes" | "no";

/* Prints only when the amount is above 0: the lines that say "if any". */
const ifAny = (amount: number): number | undefined => (amount > 0 ? amount : undefined);

export interface PartIILines {
  line8?: Answer;
  line8Amount?: number;
  line9?: number;
  line10?: number;
  line11Checked?: boolean;
  line11?: number;
  line12?: number;
  line13?: number;
  line14?: number;
  line15?: number;
}

/*
 * Part II. Line 8 asks whether line 2 column (b) has an amount; the question is
 * answered when Part I is completed. Lines 12 to 15 are completed with income
 * or a repayment from an earlier year too (Appendix A Part II, part-ii::b01).
 * Line 9 is the cost (line-9::b01), line 11 the spread (line-11::b01).
 */
export function partIILines(input: {
  partICompleted: boolean;
  line2ColumnB?: number;
  cost: number;
  electNotToSpread: boolean;
  priorYearIncome: number;
  totalRepayment: number;
}): PartIILines {
  const yes = (input.line2ColumnB ?? 0) > 0;
  const lines: PartIILines = { line8: input.partICompleted ? (yes ? "yes" : "no") : undefined };
  if (yes) {
    const line8Amount = input.line2ColumnB as number;
    const line9 = roundDollars(input.cost);
    const line10 = line8Amount - line9;
    Object.assign(lines, {
      line8Amount,
      line9: ifAny(line9),
      line10,
      line11Checked: input.electNotToSpread ? true : undefined,
      line11: spreadOverThreeYears(line10, input.electNotToSpread),
    });
  }
  if (!yes && input.priorYearIncome === 0 && input.totalRepayment === 0) return lines;
  const line13 = sum(lines.line11, input.priorYearIncome);
  return {
    ...lines,
    line12: ifAny(input.priorYearIncome),
    line13,
    line14: ifAny(input.totalRepayment),
    line15: amountSubjectToTax(line13, input.totalRepayment),
  };
}

export interface PartIIILines {
  line16?: Answer;
  line17?: Answer;
  line18?: number;
  line19?: number;
  line20?: number;
  line21?: number;
  line22Checked?: boolean;
  line22?: number;
  line23?: number;
  line24?: number;
  line25?: number;
  line26?: number;
}

/* What Form 8606 gives lines 18 and 19 when line 17 is Yes; undefined while it waits. */
export interface FromForm8606 {
  line18?: number;
  line19?: number;
  waiting: boolean;
}

/*
 * Part III. Line 16 asks about line 3 or 4 column (b); line 17 whether an IRA
 * qualified disaster distribution is on this year's Form 8606, which then
 * gives lines 18 (Form 8606 line 15b) and 19 (line 25b). Line 20 is line 3
 * column (b) less the amounts on Form 8606 (the form). Lines 23 to 26 are
 * completed with income or a repayment from an earlier year too.
 */
export function partIIILines(input: {
  partICompleted: boolean;
  iraColumnB: number;
  form8606?: FromForm8606;
  line20: number;
  electNotToSpread: boolean;
  priorYearIncome: number;
  totalRepayment: number;
}): PartIIILines {
  const yes = input.iraColumnB > 0;
  const lines: PartIIILines = { line16: input.partICompleted ? (yes ? "yes" : "no") : undefined };
  let line22: number | undefined;
  if (yes) {
    const on8606 = input.form8606 !== undefined;
    const line21 = input.form8606?.waiting
      ? undefined
      : sum(input.form8606?.line18, input.form8606?.line19, input.line20);
    line22 =
      line21 === undefined ? undefined : spreadOverThreeYears(line21, input.electNotToSpread);
    Object.assign(lines, {
      line17: on8606 ? "yes" : "no",
      line18: input.form8606?.line18,
      line19: input.form8606?.line19,
      line20: ifAny(input.line20),
      line21,
      line22Checked: input.electNotToSpread ? true : undefined,
      line22,
    });
    if (line21 === undefined) return lines;
  }
  if (!yes && input.priorYearIncome === 0 && input.totalRepayment === 0) return lines;
  const line24 = sum(line22, input.priorYearIncome);
  return {
    ...lines,
    line23: ifAny(input.priorYearIncome),
    line24,
    line25: ifAny(input.totalRepayment),
    line26: amountSubjectToTax(line24, input.totalRepayment),
  };
}

/* One Part IV distribution: cents kept on the cost share. */
export interface HomePurchasePiece {
  amount: number;
  /* The cost of a plan distribution (line-29::b01); 0 for an IRA ("don't enter any amount on line 29"). */
  cost: number;
  repaid: number;
  fromIra: boolean;
}

export interface PartIVLines {
  line27: Answer;
  line28: number;
  line29?: number;
  line30: number;
  line31?: number;
  line32: number;
  /* The part of line 32 from an IRA (Form 1040 line 4b); the rest is from a plan (line 5b). */
  line32FromIra: number;
  line32FromPlan: number;
}

/*
 * Lines 28 to 32 (line-28::b01, line-29::b01, line-31::b01, the form). A
 * repayment counts up to the taxable part of its distribution: "Don't include
 * ... any repayments of nontaxable amounts" (line-31::b01). Line 32 splits by
 * where the distribution came from: an IRA goes on Form 1040 line 4b, a plan on
 * line 5b (the form, line 32).
 */
export function partIVLines(pieces: readonly HomePurchasePiece[]): PartIVLines {
  const repaidOf = (piece: HomePurchasePiece) =>
    Math.min(atLeast(0, piece.repaid), atLeast(0, piece.amount - piece.cost));
  const line28 = sum(...pieces.map((piece) => piece.amount));
  const line29 = roundDollars(sum(...pieces.map((piece) => piece.cost)));
  const line30 = line28 - line29;
  const line31 = roundDollars(sum(...pieces.map(repaidOf)));
  const line32 = atLeast(0, line30 - line31);
  const ira = pieces.filter((piece) => piece.fromIra);
  const line32FromIra = Math.min(
    line32,
    roundDollars(sum(...ira.map((piece) => piece.amount - repaidOf(piece)))),
  );
  return {
    line27: "no",
    line28,
    line29: ifAny(line29),
    line30,
    line31: ifAny(line31),
    line32,
    line32FromIra,
    line32FromPlan: line32 - line32FromIra,
  };
}
