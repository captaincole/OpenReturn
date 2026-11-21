import type { Section1256Fact, Section1256StatementFactValue } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Lines 8 and 9: 40% short term, 60% long term, however long the contracts
 * were held (irs-6781-form-2025::sec::omb-no-1545-0074::b01 and b02;
 * irs-6781-form-2025::sec::mark-to-market-rules::b01).
 */
export const SHORT_TERM_SHARE = 0.4;
export const LONG_TERM_SHARE = 0.6;

/* Line 1 prints three rows (the blank form). The instructions give no continuation statement. */
export const LINE_1_ROW_COUNT = 3;

/*
 * Box 11 of a 1099-B is the aggregate profit or (loss), figured from boxes 8,
 * 9 and 10 (irs-1099b-inst-2025::sec::box-11-aggregate-profit-or-loss-on-contracts::b01, b02).
 * Line 1 takes box 11 (irs-6781-form-2025::sec::specific-instructions::b01).
 * With no box 11: box 8 (realized in 2025) − box 9 (open at the end of 2024,
 * already taxed last year) + box 10 (open at the end of 2025), the formula of
 * Pub. 550 (2010), Emily Jones: (11,000) − 1,000 + 27,000 = 15,000. A blank box counts as 0.
 */
export function aggregateProfitOrLoss(boxes: Section1256StatementFactValue): number {
  if (typeof boxes.box11 === "number") return boxes.box11;
  return sum(boxes.box8) - sum(boxes.box9) + sum(boxes.box10);
}

/* One row of line 1: column (a) and the gain (positive) or loss (negative). */
export interface Line1Row {
  account: string;
  amount: number;
}

/* Column (a): "Form 1099-B" and the broker's name; else the contract's description. */
export function line1Row(fact: Section1256Fact): Line1Row {
  if (fact.kind === "statement") {
    return {
      account: `Form 1099-B, ${fact.value.brokerName}`,
      amount: aggregateProfitOrLoss(fact.value),
    };
  }
  return { account: fact.value.description, amount: fact.value.gainOrLoss };
}

/*
 * Columns (b) (Loss) and (c) Gain of one row, in whole dollars. A loss goes in
 * column (b) as a positive amount: line 2 prints column (b) inside printed
 * parentheses, and line 3 combines the two columns. A row of 0 prints 0 in (c).
 */
export function line1Columns(amount: number): { loss?: number; gain?: number } {
  const dollars = roundDollars(amount);
  return dollars < 0 ? { loss: -dollars } : { gain: dollars };
}

export interface PartIResult {
  line2Loss?: number;
  line2Gain?: number;
  line3: number;
  line5: number;
  line6?: number;
  line7: number;
  line8: number;
  line9: number;
}

/* "Multiply line 7 by …": nearest dollar; || 0 keeps a -0 off the form. */
const shareOf = (line7: number, share: number): number => roundDollars(line7 * share) || 0;

/*
 * Part I from the line 1 amounts (every row, also rows the form has no room for).
 * Line 4 (straddle and hedging adjustments) has no input: it counts as 0.
 * Line 6: skipped when line 5 is a net gain; else 0, because the engine does not
 * make the box D carryback election ("If you didn't check box D, enter -0-").
 */
export function partI(amounts: ReadonlyArray<number>): PartIResult {
  const columns = amounts.map(line1Columns);
  const line2Loss = sumOrBlank(...columns.map((column) => column.loss));
  const line2Gain = sumOrBlank(...columns.map((column) => column.gain));
  const line3 = sum(line2Gain) - sum(line2Loss);
  const line5 = line3;
  const line6 = line5 > 0 ? undefined : 0;
  const line7 = line5 + sum(line6);
  return {
    line2Loss,
    line2Gain,
    line3,
    line5,
    line6,
    line7,
    line8: shareOf(line7, SHORT_TERM_SHARE),
    line9: shareOf(line7, LONG_TERM_SHARE),
  };
}
