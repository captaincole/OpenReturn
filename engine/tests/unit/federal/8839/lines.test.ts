/*
 * Form 8839 arithmetic: the published examples of the 2025 instructions
 * (irs-8839-inst-2025), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { AdoptionChildFactValue } from "../../../../src/facts/index.js";
import {
  creditLimit,
  line5Expenses,
  nonrefundableCredit,
  partII,
  phaseOut,
  ratioText,
  reductionOf,
} from "../../../../src/federal/8839/lines.js";
import { line25ModifiedAgi, partIII } from "../../../../src/federal/8839/partIII.js";

const child = (value: Partial<AdoptionChildFactValue>): AdoptionChildFactValue => ({
  firstName: "A",
  lastName: "B",
  birthYear: 2020,
  ...value,
});

const LOW_MAGI = 100_000;
const column = (line5: number, line3 = 0) => ({ line2: 17_280, line3, line5 });

describe("published examples (irs-8839-inst-2025)", () => {
  it("employer Example 1 (employer-provided-adoption-benefits::b01, b02): 4,000 excluded, credit limited to 6,000", () => {
    // The fact holds qualified expenses: 10,000 paid less the 4,000 reimbursed.
    const line5 = line5Expenses(child({ finalYear: 2025, expensesPaid2025: 6_000 }), 0);
    const credit = partII([column(line5)], LOW_MAGI, 0);
    expect([line5, credit.columns[0].line6, credit.line12]).toEqual([6_000, 6_000, 6_000]);
    const benefits = partIII(
      [{ line19: 17_280, line20: 0, line22: 4_000, takesLine21: false }],
      LOW_MAGI,
    );
    expect([benefits.line30, benefits.line31]).toEqual([4_000, 0]);
  });

  it("employer Examples 2 and 3 (b02, b03): 8,000 exclusion and 12,000 credit", () => {
    const line5 = line5Expenses(child({ finalYear: 2025, expensesPaid2025: 12_000 }), 0);
    expect(partII([column(line5)], LOW_MAGI, 0).line12).toBe(12_000);
    const benefits = partIII(
      [{ line19: 17_280, line20: 0, line22: 8_000, takesLine21: false }],
      LOW_MAGI,
    );
    expect(benefits.line30).toBe(8_000);
  });

  it("employer Example 4 (b03): a foreign child final in 2025, 17,280 excluded and the credit limited to 17,280", () => {
    // 36,000 paid; 17,280 reimbursed; 18,720 still qualified.
    const line5 = line5Expenses(
      child({ foreign: true, finalYear: 2025, expensesPaid2025: 18_720 }),
      0,
    );
    const credit = partII([column(line5)], LOW_MAGI, 0);
    expect([line5, credit.columns[0].line6]).toEqual([18_720, 17_280]);
    // 1,440 is never claimed: 36,000 − 17,280 − 17,280.
    expect(36_000 - 17_280 - credit.columns[0].line6).toBe(1_440);
    const benefits = partIII(
      [{ line19: 17_280, line20: 0, line22: 17_280, takesLine21: false }],
      LOW_MAGI,
    );
    expect([benefits.line30, benefits.line31]).toEqual([17_280, 0]);
  });

  it("attempted adoptions Example 3 (specific-instructions::b03): Child 1 21,000, Child 2 12,000", () => {
    const credit = partII([column(21_000), column(12_000)], LOW_MAGI, 0);
    expect(credit.columns.map((each) => each.line6)).toEqual([17_280, 12_000]);
  });

  it("Riley and Parker, non-Hague (more-than-three-eligible-children::b11, b12): 25,000 paid, credit limited to 17,280", () => {
    const riley = child({
      foreign: true,
      finalYear: 2025,
      expensesPaidBefore2024: 7_000 + 8_000,
      expensesPaid2024: 9_000,
      expensesPaid2025: 1_000,
    });
    const line5 = line5Expenses(riley, 0);
    expect([line5, partII([column(line5)], LOW_MAGI, 0).columns[0].line6]).toEqual([
      25_000, 17_280,
    ]);
  });

  it("unsuccessful U.S. adoption (line-5::b02): 3,000 of 2024 on line 5; the 2025 2,000 waits for 2026", () => {
    expect(line5Expenses(child({ expensesPaid2024: 3_000, expensesPaid2025: 2_000 }), 0)).toBe(
      3_000,
    );
  });

  it("special needs, final in 2025 (line-5::b01, b02): 17,280 with no expenses, less a prior line 3", () => {
    const special = child({ specialNeeds: true, finalYear: 2025 });
    expect(line5Expenses(special, 0)).toBe(17_280);
    expect(line5Expenses(special, 4_000)).toBe(13_280);
  });

  it("credit limit worksheet example (credit-limit-worksheet-line-17::b02): 5,000 refundable, 10,000 nonrefundable, 2,280 carried", () => {
    const line5 = line5Expenses(child({ finalYear: 2025, expensesPaid2025: 20_000 }), 0);
    const credit = partII([column(line5)], LOW_MAGI, 0);
    expect([credit.line13, credit.line14, credit.line16]).toEqual([5_000, 12_280, 12_280]);
    const line17 = creditLimit(credit.line16, 10_000, 0);
    const line18 = nonrefundableCredit(credit.line16, line17);
    expect([line17, line18, credit.line16 - line18]).toEqual([10_000, 10_000, 2_280]);
    expect(line5 - 17_280).toBe(2_720);
  });

  it("income limit table (general-instructions::b04): 259,190 no effect; 299,190 eliminates", () => {
    expect(phaseOut(259_190).over).toBe(false);
    expect(phaseOut(299_190)).toEqual({ over: true, excess: 40_000, thousandths: 1_000 });
    const gone = partII([column(17_280)], 299_190, 0);
    expect([gone.columns[0].line11a, gone.line12, gone.line13]).toEqual([0, 0, 0]);
  });
});

describe("line 5 timing (line-5::b01)", () => {
  const paid = { expensesPaidBefore2024: 1_000, expensesPaid2024: 2_000, expensesPaid2025: 4_000 };
  it("final in 2025: 2024 and 2025", () =>
    expect(line5Expenses(child({ ...paid, finalYear: 2025 }), 0)).toBe(6_000));
  it("final before 2025: 2025 only", () =>
    expect(line5Expenses(child({ ...paid, finalYear: 2023 }), 0)).toBe(4_000));
  it("not final: 2024 only", () => expect(line5Expenses(child(paid), 0)).toBe(2_000));
  it("foreign final in 2025: every year", () =>
    expect(line5Expenses(child({ ...paid, foreign: true, finalYear: 2025 }), 0)).toBe(7_000));
  it("cents add, the total rounds", () =>
    expect(
      line5Expenses(child({ finalYear: 2025, expensesPaid2024: 0.3, expensesPaid2025: 0.3 }), 0),
    ).toBe(1));
  it("a special needs foreign child takes the expense rules", () =>
    expect(
      line5Expenses(child({ ...paid, specialNeeds: true, foreign: true, finalYear: 2025 }), 0),
    ).toBe(7_000));
});

describe("limits", () => {
  it("line 9 is at most 1.000 and has three places", () => {
    expect(phaseOut(400_000).thousandths).toBe(1_000);
    expect(phaseOut(259_191).thousandths).toBe(0);
    expect(phaseOut(269_221).thousandths).toBe(251);
    expect(ratioText(251)).toEqual({ whole: "0", fraction: "251" });
    expect(ratioText(1_000)).toEqual({ whole: "1", fraction: "000" });
    expect(ratioText(7)).toEqual({ whole: "0", fraction: "007" });
  });

  it("below the threshold line 10 is 0", () => {
    const credit = partII([column(9_000)], 259_190, 0);
    expect([credit.phaseOut.over, credit.columns[0].line10]).toEqual([false, 0]);
  });

  it("line 10 rounds to the nearest dollar", () => expect(reductionOf(11_026, 251)).toBe(2_768));

  it("line 11b is at most 5,000 per child; line 13 is line 11c; line 12 adds line 11a", () => {
    const credit = partII([column(17_280), column(3_000), column(5_000)], LOW_MAGI, 0);
    expect(credit.columns.map((each) => each.line11b)).toEqual([5_000, 3_000, 5_000]);
    expect([credit.line11c, credit.line13, credit.line12]).toEqual([13_000, 13_000, 25_280]);
    expect(credit.line14).toBe(credit.line12 - credit.line13);
  });

  it("line 4 and line 17 are not less than zero", () => {
    expect(partII([column(5_000, 18_000)], LOW_MAGI, 0).columns[0].line4).toBe(0);
    expect(creditLimit(5_000, 1_000, 3_000)).toBe(0);
  });

  it("line 16 adds the carryforward; line 18 is the smaller of 16 and 17", () => {
    const credit = partII([column(4_000)], LOW_MAGI, 2_500);
    expect([credit.line14, credit.line16]).toEqual([0, 2_500]);
    expect(nonrefundableCredit(2_500, creditLimit(2_500, 1_200, 0))).toBe(1_200);
  });
});

describe("Part III", () => {
  it("line 24 takes line 21 for a special needs child with a program, and line 31 goes negative", () => {
    const benefits = partIII(
      [{ line19: 17_280, line20: 0, line22: 0, takesLine21: true }],
      LOW_MAGI,
    );
    expect([benefits.columns[0].line24, benefits.line30MoreThan23, benefits.line31]).toEqual([
      17_280,
      true,
      -17_280,
    ]);
  });

  it("benefits above the limit are taxable", () => {
    const benefits = partIII(
      [{ line19: 17_280, line20: 2_000, line22: 20_000, takesLine21: false }],
      LOW_MAGI,
    );
    expect([benefits.columns[0].line21, benefits.line30, benefits.line31]).toEqual([
      15_280, 15_280, 4_720,
    ]);
  });

  it("phases out like Part II", () => {
    const benefits = partIII(
      [{ line19: 17_280, line20: 0, line22: 10_000, takesLine21: false }],
      279_190,
    );
    expect([benefits.phaseOut.thousandths, benefits.columns[0].line28, benefits.line31]).toEqual([
      500, 5_000, 5_000,
    ]);
  });

  it("the line 25 worksheet adds line 23 back to income without line 1f", () => {
    expect(
      line25ModifiedAgi({
        wagesWithoutLine1f: 232_000,
        line23: 15_500,
        otherIncome: 34_000,
        adjustments: 500,
      }),
    ).toBe(281_000);
  });
});
