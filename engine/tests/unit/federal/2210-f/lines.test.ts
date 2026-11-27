/*
 * Form 2210-F as pure arithmetic (lines.ts). No published example with numbers
 * exists for this form; the tests are the Pub. 225 gross income examples, the
 * rule of each line, its limits and its stops.
 */

import { describe, expect, it } from "vitest";
import { meetsFarmerGrossIncomeTest } from "../../../../src/facts/index.js";
import {
  CURRENT_YEAR_SHARE,
  DUE_DATE,
  form2210FLines,
  line14Day,
  line2OtherTaxes,
  PENALTY_END,
  type Form2210FInputs,
} from "../../../../src/federal/2210-f/lines.js";
import { dayNumber } from "../../../../src/federal/2210/dates.js";

const day = (date: string) => dayNumber(date) as number;

/* A single farmer who paid too little by January 15 and the rest on April 15. */
const BASE: Form2210FInputs = {
  taxAfterCredits: 12000,
  otherTaxes: 14000,
  householdEmploymentTaxes: 0,
  incomeTaxWithheld: 1000,
  refundableCredits: 500,
  withholding: 1000,
  priorYearTax: 30000,
  paymentsByDueDate: 8000,
  latePayments: [],
  filedAndPaidByMarch2: false,
  jointReturn2024: false,
  jointReturn2025: false,
};

const lines = (changes: Partial<Form2210FInputs> = {}) => form2210FLines({ ...BASE, ...changes });

describe("the two-thirds gross income test (Pub. 225)", () => {
  it("Example 1: $105,000 of $149,500 is 70%, a qualified farmer (irs-pub-225-2025::sec::gross-income::b01)", () => {
    expect(meetsFarmerGrossIncomeTest(149500, 105000)).toBe(true);
  });

  it("Example 2: $120,000 of $164,500 is 73.2% (irs-pub-225-2025::sec::special-rules-for-qualified::b03)", () => {
    expect(meetsFarmerGrossIncomeTest(164500, 120000)).toBe(true);
  });

  it("exactly two-thirds passes; a dollar less fails; no income fails", () => {
    expect(meetsFarmerGrossIncomeTest(300000, 200000)).toBe(true);
    expect(meetsFarmerGrossIncomeTest(300000, 199999)).toBe(false);
    expect(meetsFarmerGrossIncomeTest(0, 0)).toBe(false);
  });
});

describe("Form 2210-F Part II", () => {
  it("figures lines 1 to 13 by the form's arithmetic", () => {
    const result = lines();
    expect(result).toMatchObject({
      line1: 12000,
      line2: 14000,
      line3: 26000,
      line4: 500,
      line6: 25500,
      line7: 17009, // 25,500 × 0.667 = 17,008.5 → 17,009
      line8: 1000,
      line9: 24500,
      line10: 30000,
      line11: 17009,
      line12: 9000,
      line13: 8009,
    });
    expect(result.line3).toBe((result.line1 ?? 0) + (result.line2 ?? 0));
    expect(result.line6).toBe((result.line3 ?? 0) - (result.line4 ?? 0));
  });

  it("line 7 uses the form's 0.667, not 0.6667 (DECISION, Pub. 225)", () => {
    expect(CURRENT_YEAR_SHARE).toBe(0.667);
    expect(lines({ taxAfterCredits: 30000, otherTaxes: 0, refundableCredits: 0 }).line7).toBe(
      20010,
    );
  });

  it("line 11 is the smaller of lines 7 and 10, never the 110% of Form 2210", () => {
    expect(lines({ priorYearTax: 12000 }).line11).toBe(12000);
    expect(lines({ priorYearTax: 40000 }).line11).toBe(17009);
  });

  it("with no 12-month 2024 return, line 10 is blank and line 11 is line 7 (line-10::b02)", () => {
    const result = lines({ priorYearTax: undefined });
    expect(result.line10).toBeUndefined();
    expect(result.line11).toBe(result.line7);
  });

  it("a 2024 tax of 0 owes no penalty (the no-liability exception)", () => {
    const result = lines({ priorYearTax: 0 });
    expect(result.stop).toBe("withholding_covers_required_payment");
    expect(result.penalty).toBeUndefined();
  });

  it("line 4 adds 75% of a section 1062 applicable net tax liability (line-4::b01–b02)", () => {
    expect(lines({ section1062NetTaxLiability: 4001 }).line4).toBe(3501); // 500 + 3,000.75
  });
});

describe("Form 2210-F stops", () => {
  it("line 3 under $1,000: no penalty, the form does not file; lines 4 and 6 still fill, line 6 stops", () => {
    // Line 3 says only "don't file"; line 6 says "stop" (face-part-ii::b01).
    const result = lines({ taxAfterCredits: 450, otherTaxes: 530, refundableCredits: 0 });
    expect(result).toMatchObject({ line3: 980, line4: 0, line6: 980 });
    expect(result.stop).toBe("line_3_under_limit");
    expect(result.line7).toBeUndefined();
    expect(result).toMatchObject({ boxA: false, boxB: false });
  });

  it("line 3 at exactly $1,000 goes on", () => {
    const result = lines({
      taxAfterCredits: 600,
      otherTaxes: 400,
      refundableCredits: 0,
      withholding: 0,
    });
    expect(result.stop).not.toBe("line_3_under_limit");
  });

  it("line 6 under $1,000 stops", () => {
    expect(lines({ taxAfterCredits: 1200, otherTaxes: 0, refundableCredits: 201 }).stop).toBe(
      "line_6_under_limit",
    );
  });

  it("line 9 under $1,000 owes no penalty, and box B stays clear", () => {
    const result = lines({ withholding: 24501, jointReturn2025: true, priorYearTax: 100 });
    expect(result.line9).toBe(999);
    expect(result.stop).toBe("line_9_under_limit");
    expect(result.boxB).toBe(false);
    expect(result.penalty).toBeUndefined();
  });

  it("line 9 under $1,000 does not say stop: lines 10 and 11 fill, then the line 11 note stops", () => {
    // Blind case 4: line 9 is $800; line 8 ($24,800) is above line 11 ($17,075).
    const result = lines({
      taxAfterCredits: 20000,
      otherTaxes: 6000,
      refundableCredits: 400,
      incomeTaxWithheld: 24800,
      withholding: 24800,
      priorYearTax: 25000,
    });
    expect(result).toMatchObject({ line9: 800, line10: 25000, line11: 17075 });
    expect(result.stop).toBe("line_9_under_limit");
    expect(result.line12).toBeUndefined();
  });

  it("line 9 under $1,000 with line 8 below line 11: lines 12 and 13 fill, still no penalty", () => {
    const result = lines({
      taxAfterCredits: 1500,
      otherTaxes: 0,
      refundableCredits: 0,
      withholding: 600,
    });
    expect(result).toMatchObject({ line9: 900, line11: 1001, line12: 8600, line13: 0 });
    expect(result.stop).toBe("line_9_under_limit");
    expect(result.penalty).toBeUndefined();
  });

  it("line 9 under $1,000 with an underpayment on line 13 still figures no Part III", () => {
    const result = lines({
      taxAfterCredits: 1500,
      otherTaxes: 0,
      refundableCredits: 0,
      withholding: 600,
      paymentsByDueDate: 0,
    });
    expect(result).toMatchObject({ line12: 600, line13: 401, stop: "line_9_under_limit" });
    expect(result.penalty).toBeUndefined();
    expect(result).toMatchObject({ boxA: false, boxB: false });
  });

  it("line 8 at or above line 11 stops before line 12", () => {
    const result = lines({ priorYearTax: 1000 });
    expect(result.stop).toBe("withholding_covers_required_payment");
    expect(result.line12).toBeUndefined();
  });

  it("line 13 at 0 stops: no Part III", () => {
    const result = lines({ paymentsByDueDate: 16009 });
    expect(result.line13).toBe(0);
    expect(result.stop).toBe("no_underpayment");
    expect(result.penalty).toBeUndefined();
  });

  it("filed and paid by March 2: no penalty, neither box", () => {
    const result = lines({ filedAndPaidByMarch2: true, waiver: { request: "entire", amount: 0 } });
    expect(result.stop).toBe("filed_and_paid_by_march_2");
    expect(result).toMatchObject({ boxA: false, boxB: false });
    expect(result.penalty).toBeUndefined();
  });
});

describe("Form 2210-F boxes", () => {
  it("box B: joint in one year only and line 10 below line 7", () => {
    expect(lines({ jointReturn2025: true, priorYearTax: 12000 }).boxB).toBe(true);
    expect(lines({ jointReturn2024: true, priorYearTax: 12000 }).boxB).toBe(true);
    expect(lines({ jointReturn2025: true, priorYearTax: 17009 }).boxB).toBe(false);
    expect(lines({ jointReturn2024: true, jointReturn2025: true, priorYearTax: 12000 }).boxB).toBe(
      false,
    );
  });

  it("box B stays checked when line 13 stops the form (the form still files)", () => {
    const result = lines({ jointReturn2025: true, priorYearTax: 9000 });
    expect(result.stop).toBe("no_underpayment");
    expect(result.boxB).toBe(true);
  });

  it("box A: a waiver request with an underpayment", () => {
    expect(lines({ waiver: { request: "part", amount: 10 } }).boxA).toBe(true);
    expect(lines({ waiver: { request: "part", amount: 10 }, paymentsByDueDate: 20000 }).boxA).toBe(
      false,
    );
  });
});

describe("Form 2210-F Part III", () => {
  it("no later payment: line 14 is April 15, 2026, 90 days", () => {
    const penalty = lines().penalty;
    expect(penalty?.line14).toBe(PENALTY_END);
    expect(penalty?.line15).toBe(90);
    // 8,009 × 90 / 365 × 0.07 = 138.24
    expect(penalty?.line16).toBe(138);
  });

  it("a stated payment day before April 15 shortens the count", () => {
    const penalty = lines({ underpaymentPaidOn: day("2026-03-20") }).penalty;
    expect(penalty?.line15).toBe(64);
    expect(penalty?.line16).toBe(98); // 8,009 × 64 / 365 × 0.07 = 98.30
  });

  it("a stated day after April 15 counts to April 15", () => {
    expect(lines({ underpaymentPaidOn: day("2026-05-01") }).penalty?.line15).toBe(90);
  });

  it("line 16 is never below 0, and a whole waiver leaves 0", () => {
    expect(lines({ waiver: { request: "entire", amount: 0 } }).penalty?.line16).toBe(0);
    expect(lines({ waiver: { request: "part", amount: 500 } }).penalty?.line16).toBe(0);
    expect(lines({ waiver: { request: "part", amount: 38 } }).penalty?.line16).toBe(100);
  });
});

describe("line 14 from the payments after January 15", () => {
  const feb = day("2026-02-10");
  const mar = day("2026-03-05");

  it("the day the dated payments cover line 13", () => {
    expect(
      line14Day(
        5000,
        [
          { day: mar, amount: 3000 },
          { day: feb, amount: 2000 },
        ],
        undefined,
      ),
    ).toBe(mar);
    expect(line14Day(5000, [{ day: feb, amount: 6000 }], undefined)).toBe(feb);
  });

  it("a part paid early: one computation from the day line 13 is paid in full (face-part-iii::b01)", () => {
    // Blind case 12: line 13 is $9,008; $3,000 paid February 5, the rest April 10.
    const penalty = form2210FLines({
      ...BASE,
      taxAfterCredits: 14000,
      otherTaxes: 10000,
      refundableCredits: 0,
      incomeTaxWithheld: 2000,
      withholding: 2000,
      priorYearTax: 20000,
      paymentsByDueDate: 5000,
      latePayments: [{ day: day("2026-02-05"), amount: 3000 }],
      underpaymentPaidOn: day("2026-04-10"),
      jointReturn2025: true,
    }).penalty;
    expect(penalty?.line15).toBe(85);
    // 9,008 × 85 / 365 × 0.07 = 146.84; not a separate count for each part ($110).
    expect(penalty?.line16).toBe(147);
  });

  it("payments that do not cover line 13: the stated day of the rest, or April 15", () => {
    expect(line14Day(5000, [{ day: feb, amount: 2000 }], undefined)).toBe(PENALTY_END);
    expect(line14Day(5000, [{ day: feb, amount: 2000 }], mar)).toBe(mar);
    // The rest cannot be paid before a part of it: the later day.
    expect(line14Day(5000, [{ day: mar, amount: 2000 }], feb)).toBe(mar);
  });

  it("a payment after April 15 does not count", () => {
    expect(line14Day(5000, [{ day: day("2026-05-01"), amount: 9000 }], undefined)).toBe(
      PENALTY_END,
    );
  });

  it("January 15 is the due date, so a stated day on it counts no days", () => {
    expect(lines({ underpaymentPaidOn: DUE_DATE }).penalty?.line15).toBe(0);
  });
});

describe("line 2 and household employment taxes (line-2::b01)", () => {
  it("count when income tax was withheld", () => {
    expect(line2OtherTaxes({ ...BASE, householdEmploymentTaxes: 3000 })).toBe(17000);
  });

  it("count with no withholding when estimated tax was required without them", () => {
    const inputs = {
      ...BASE,
      householdEmploymentTaxes: 3000,
      incomeTaxWithheld: 0,
      withholding: 0,
    };
    expect(line2OtherTaxes(inputs)).toBe(17000);
  });

  it("are left out with no withholding when nothing was required without them", () => {
    const inputs = {
      ...BASE,
      taxAfterCredits: 500,
      otherTaxes: 0,
      householdEmploymentTaxes: 3000,
      incomeTaxWithheld: 0,
      withholding: 0,
    };
    expect(line2OtherTaxes(inputs)).toBe(0);
    expect(form2210FLines(inputs)).toMatchObject({
      stop: "line_3_under_limit",
      line3: 500,
      line6: 0,
    });
  });
});
