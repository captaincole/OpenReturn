/*
 * FTB 5805F arithmetic (lines.ts). The published examples with numbers are
 * Pub. 225's two-thirds test and the Form 2210 day chart; the rest are limit
 * tests from the form face and the instructions.
 */

import { describe, expect, it } from "vitest";
import { dayNumber } from "../../../../../src/federal/2210/dates.js";
import {
  dateText,
  EXPLANATION_ROW_CHARACTERS,
  explanationRows,
  form5805FLines,
  meetsGrossIncomeTest,
  PENALTY_END,
  type Form5805FInputs,
} from "../../../../../src/state/ca/5805f/lines.js";

const day = (date: string) => dayNumber(date)!;

/* A farmer with a 2024 return, no lump-sum tax, an underpayment and no answers that stop it. */
const BASE: Form5805FInputs = {
  taxAfterCredits: 12000,
  alternativeMinimumTax: 0,
  behavioralHealthTax: 0,
  installmentSaleInterest: 0,
  withholding: 1000,
  separateReturn: false,
  caAgi: 150000,
  priorYear: { taxLessLumpSum: 10000, withholding: 800 },
  paymentsByDueDate: 2000,
  filedAndPaidByMarch2: false,
};

const lines = (changes: Partial<Form5805FInputs> = {}) => form5805FLines({ ...BASE, ...changes });

describe("the two-thirds test (Pub. 225)", () => {
  it("Example 1: $105,000 of $149,500 is 70%, a qualified farmer", () => {
    // irs-pub-225-2025::sec::gross-income::b01
    expect(meetsGrossIncomeTest(149500, 105000)).toBe(true);
  });

  it("Example 2: $120,000 of $164,500 is 73.2%, a qualified farmer", () => {
    // irs-pub-225-2025::sec::special-rules-for-qualified::b03
    expect(meetsGrossIncomeTest(164500, 120000)).toBe(true);
  });

  it("exactly two-thirds qualifies; a dollar less does not; no gross income does not", () => {
    expect(meetsGrossIncomeTest(300000, 200000)).toBe(true);
    expect(meetsGrossIncomeTest(300000, 199999)).toBe(false);
    expect(meetsGrossIncomeTest(0, 0)).toBe(false);
  });
});

describe("Part I", () => {
  it("line 3 is line 1 less line 2; line 4 is .6667 of line 3, to the nearest dollar", () => {
    const result = lines({ alternativeMinimumTax: 300, behavioralHealthTax: 200, lumpSumTax: 500 });
    expect(result.line1).toBe(12500);
    expect(result.line2).toBe(500);
    expect(result.line3).toBe(12000);
    expect(result.line4).toBe(8000); // 12,000 × .6667 = 8,000.40
  });

  it("line 6 under $500 stops the form: lines 7 to 16 are blank", () => {
    const result = lines({ taxAfterCredits: 1499 });
    expect(result.line6).toBe(499);
    expect(result.noPenalty).toBe("line_6_under_limit");
    expect(result.line7).toBeUndefined();
    expect(result.line12).toBeUndefined();
    expect(result.penalty).toBeUndefined();
  });

  it("line 6 of exactly $500 goes on", () => {
    expect(lines({ taxAfterCredits: 1500 }).noPenalty).not.toBe("line_6_under_limit");
  });

  it("married filing separately stops under $250 instead", () => {
    expect(lines({ taxAfterCredits: 1249, separateReturn: true }).noPenalty).toBe(
      "line_6_under_limit",
    );
    expect(lines({ taxAfterCredits: 1250, separateReturn: true }).noPenalty).not.toBe(
      "line_6_under_limit",
    );
  });

  it("line 9 is line 7 less line 8, and under $500 it stops the form", () => {
    const result = lines({ priorYear: { taxLessLumpSum: 499, lumpSumTax: 300, withholding: 0 } });
    expect(result.line7).toBe(799);
    expect(result.line8).toBe(300);
    expect(result.line9).toBe(499);
    expect(result.noPenalty).toBe("line_9_under_limit");
    expect(result.line10).toBeUndefined();
  });

  it("no 12-month 2024 return: lines 7 to 9 are blank and line 10 is line 4", () => {
    const result = lines({ priorYear: undefined });
    expect([result.line7, result.line8, result.line9]).toEqual([undefined, undefined, undefined]);
    expect(result.line10).toBe(result.line4);
  });

  it("line 10 is the smaller of lines 4 and 9", () => {
    expect(lines().line10).toBe(8000); // 12,000 × .6667 = 8,000 < 10,000
    expect(lines({ priorYear: { taxLessLumpSum: 6000, withholding: 0 } }).line10).toBe(6000);
  });

  it("California AGI of $1,000,000 or more uses line 4 even when line 9 is smaller", () => {
    const prior = { taxLessLumpSum: 6000, withholding: 0 };
    expect(lines({ priorYear: prior, caAgi: 999999 }).line10).toBe(6000);
    expect(lines({ priorYear: prior, caAgi: 1000000 }).line10).toBe(8000);
    expect(lines({ priorYear: prior, caAgi: 500000, separateReturn: true }).line10).toBe(8000);
    expect(lines({ priorYear: prior, caAgi: 499999, separateReturn: true }).line10).toBe(6000);
  });

  it("line 11 adds line 5 and the payments by the due date; line 12 is never below 0", () => {
    const result = lines();
    expect(result.line11).toBe(3000);
    expect(result.line12).toBe(5000);
    const paid = lines({ paymentsByDueDate: 9000 });
    expect(paid.line12).toBe(0);
    expect(paid.noPenalty).toBe("no_underpayment");
    expect(paid.penalty).toBeUndefined();
  });
});

describe("exceptions (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01)", () => {
  it("1: filed and paid by March 2, 2026: Part I stands, no penalty", () => {
    const result = lines({ filedAndPaidByMarch2: true });
    expect(result.line12).toBe(5000);
    expect(result.noPenalty).toBe("filed_and_paid_by_march_2");
    expect(result.penalty).toBeUndefined();
  });

  it("2: the 2024 tax less 2024 withholding under $500: no penalty", () => {
    const under = lines({ priorYear: { taxLessLumpSum: 10000, withholding: 9501 } });
    expect(under.noPenalty).toBe("prior_year_tax_less_withholding_under_limit");
    const at = lines({ priorYear: { taxLessLumpSum: 10000, withholding: 9500 } });
    expect(at.penalty).toBeDefined();
  });
});

describe("Part II", () => {
  it("April 15, 2026 is 90 days after January 15 (Form 2210 Table 2, column (d))", () => {
    // irs-2210-inst-2025::sec::table-2-chart-of-total-days::b01; the form's 90-day note.
    const penalty = lines().penalty!;
    expect(penalty.line13).toBe(PENALTY_END);
    expect(penalty.line14).toBe(90);
  });

  it("line 15 is days / 365 × .07 × line 12, to the nearest dollar", () => {
    // 90 / 365 × 0.07 × 5,000 = 86.30
    expect(lines().penalty!.line15).toBe(86);
  });

  it("line 13 is the payment day or April 15, whichever is earlier", () => {
    expect(lines({ underpaymentPaidOn: day("2026-03-10") }).penalty!.line14).toBe(54);
    expect(lines({ underpaymentPaidOn: day("2026-05-01") }).penalty!.line13).toBe(PENALTY_END);
    expect(lines({ underpaymentPaidOn: day("2026-01-16") }).penalty!.line14).toBe(1);
  });

  it("line 16 is line 15 less the waived amount, never below 0", () => {
    expect(lines({ waiverAmount: 30 }).penalty!.line16).toBe(56);
    expect(lines({ waiverAmount: 500 }).penalty!.line16).toBe(0);
    expect(lines().penalty!.line16).toBeUndefined();
  });

  it("the penalty is never more than a year of interest on line 12", () => {
    const { penalty, line12 } = lines({ paymentsByDueDate: 0 });
    expect(penalty!.line15).toBeLessThanOrEqual(line12! * 0.07);
  });
});

describe("printing", () => {
  it("line 13 prints mm/dd/yyyy", () => {
    expect(dateText(day("2026-04-06"))).toBe("04/06/2026");
  });

  it("the explanation breaks at a space; the rest goes on row 2", () => {
    const text = `${"word ".repeat(30)}end`;
    const [first, second] = explanationRows(text);
    expect(first.length).toBeLessThanOrEqual(EXPLANATION_ROW_CHARACTERS);
    expect(`${first} ${second}`).toBe(text);
    expect(explanationRows("Short reason.")).toEqual(["Short reason.", undefined]);
  });
});
