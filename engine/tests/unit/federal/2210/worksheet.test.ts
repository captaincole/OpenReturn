/*
 * Form 2210 Part III: the calendar, Section A and the penalty worksheet, with
 * the numbered examples of the 2025 instructions (irs-2210-inst-2025).
 */

import { describe, expect, it } from "vitest";
import {
  columnOfPayment,
  countedDay,
  dayNumber,
  DUE_DATES_2025,
  PENALTY_END_2025,
} from "../../../../src/federal/2210/dates.js";
import { evenWithholding, paymentsByColumn } from "../../../../src/federal/2210/form.js";
import {
  daysInRatePeriod,
  partPenalty,
  penaltyWorksheet,
  type DatedPayment,
} from "../../../../src/federal/2210/penaltyWorksheet.js";
import { regularInstallments, sectionALines } from "../../../../src/federal/2210/sectionA.js";

const day = (date: string) => dayNumber(date) as number;
const paid = (date: string, amount: number): DatedPayment => ({
  day: countedDay(day(date)),
  amount,
});

describe("Form 2210 calendar", () => {
  // Calendar To Determine the Number of Days a Payment Is Late (line-1b::b02).
  it("calendar example: due June 15, paid November 4, is 142 days late", () => {
    expect(day("2025-11-04") - day("2025-06-15")).toBe(142);
  });

  // Table 2. Chart of Total Days (table-2-chart-of-total-days::b01).
  it("Table 2: days in each rate period for an underpayment never paid", () => {
    const starts = [day("2025-04-15"), day("2025-06-30"), day("2025-09-30"), day("2025-12-31")];
    const lasts = [day("2025-06-30"), day("2025-09-30"), day("2025-12-31"), day("2026-04-15")];
    const table = DUE_DATES_2025.map((due) =>
      starts.map((start, index) => daysInRatePeriod(due, PENALTY_END_2025, start, lasts[index])),
    );
    expect(table).toEqual([
      [76, 92, 92, 105],
      [15, 92, 92, 105],
      [0, 15, 92, 105],
      [0, 0, 0, 90],
    ]);
  });

  it("a payment on Monday, June 16, 2025 counts on Sunday, June 15 (table-1::b01)", () => {
    expect(countedDay(day("2025-06-16"))).toBe(day("2025-06-15"));
    expect(columnOfPayment(countedDay(day("2025-06-16")))).toBe(1);
    expect(columnOfPayment(day("2025-06-17"))).toBe(2);
  });

  it("columns: through April 15, June 15, September 15, January 15; later has none", () => {
    expect(columnOfPayment(day("2025-04-15"))).toBe(0);
    expect(columnOfPayment(day("2025-04-16"))).toBe(1);
    expect(columnOfPayment(day("2025-09-15"))).toBe(2);
    expect(columnOfPayment(day("2026-01-15"))).toBe(3);
    expect(columnOfPayment(day("2026-01-16"))).toBeUndefined();
  });

  it("a date that is not YYYY-MM-DD, or not on the calendar, has no day", () => {
    expect(dayNumber("06/15/2025")).toBeUndefined();
    expect(dayNumber("2025-02-30")).toBeUndefined();
  });
});

describe("Form 2210 line 11", () => {
  // Example 1 (table-1-estimated-tax-payments::b02–b03).
  it("Example 1: $1,000 overpayment, $4,000 withheld, $500 on 9/15 and 1/15", () => {
    const payments = [
      paid("2025-04-15", 1000),
      ...evenWithholding(4000),
      paid("2025-09-15", 500),
      paid("2026-01-15", 500),
    ];
    expect(paymentsByColumn(payments)).toEqual([2000, 1000, 1500, 1500]);
  });

  it("withholding in four parts adds up to line 6 exactly", () => {
    const parts = evenWithholding(10001).map((payment) => payment.amount);
    expect(parts.reduce((total, part) => total + part, 0)).toBe(10001);
  });
});

describe("Form 2210 Section A and the penalty worksheet", () => {
  // Example 3 (line-1b::b01, tax-year-2025::b06) and Example 4 (line-3-2::b01).
  const example3 = [
    paid("2025-04-30", 2000),
    paid("2025-06-15", 3000),
    paid("2025-09-15", 4000),
    paid("2026-01-15", 4000),
  ];

  it("Example 3: line 1a is $4,000 in (a) and $3,000 in (b)–(d)", () => {
    const sheet = penaltyWorksheet([4000, 4000, 4000, 4000], example3);
    expect(sheet.underpayments).toEqual([4000, 3000, 3000, 3000]);
    const lines = sectionALines([4000, 4000, 4000, 4000], paymentsByColumn(example3));
    expect(lines.columns.map((column) => column.line17)).toEqual([4000, 3000, 3000, 3000]);
  });

  it("Example 3 and 4: 04/30 $2,000 (15 days) and 06/15 $2,000 (61 days) pay column (a)", () => {
    const sheet = penaltyWorksheet([4000, 4000, 4000, 4000], example3);
    const columnA = sheet.parts.filter((part) => part.column === 0);
    expect(columnA.map((part) => [part.amount, part.paidDay - DUE_DATES_2025[0]])).toEqual([
      [2000, 15],
      [2000, 61],
    ]);
    expect(sheet.parts.filter((part) => part.column === 1)[0]).toMatchObject({
      amount: 3000,
      paidDay: day("2025-09-15"),
    });
    expect(sheet.parts.filter((part) => part.column === 2)[0]).toMatchObject({
      amount: 3000,
      paidDay: day("2026-01-15"),
    });
    // "Do not enter any payment on line 1b, column (d)": unpaid through April 15, 2026.
    expect(sheet.parts.filter((part) => part.column === 3)[0]?.paidDay).toBe(PENALTY_END_2025);
  });

  /*
   * Part III has four columns; a person can pay more often. Line 11 adds each
   * column's payments, and the worksheet takes every payment on its own day.
   */
  it("nine payments: line 11 adds them by column; one after January 15 pays column (d) late", () => {
    const nine = [
      paid("2025-04-01", 400),
      paid("2025-04-15", 400),
      paid("2025-05-01", 300),
      paid("2025-06-16", 300),
      paid("2025-07-01", 500),
      paid("2025-09-15", 500),
      paid("2025-10-01", 500),
      paid("2026-01-15", 500),
      paid("2026-02-01", 200),
    ];
    expect(paymentsByColumn(nine)).toEqual([800, 600, 1000, 1000]);
    const installments = [1000, 1000, 1000, 1000];
    const sheet = penaltyWorksheet(installments, nine);
    expect(sheet.underpayments).toEqual([200, 600, 600, 600]);
    const lines = sectionALines(installments, paymentsByColumn(nine));
    expect(lines.columns.map((column) => column.line17)).toEqual([200, 600, 600, 600]);
    const columnD = sheet.parts.filter((part) => part.column === 3);
    expect(columnD.map((part) => [part.amount, part.paidDay])).toEqual([
      [200, day("2026-02-01")],
      [400, PENALTY_END_2025],
    ]);
  });

  // Example 2 (section-b-figure-the-penalty::b01).
  it("Example 2: $500 April underpayment paid June 10 (56 days); $700 left for June 15", () => {
    const sheet = penaltyWorksheet(
      [1700, 1200, 0, 0],
      [paid("2025-04-15", 1200), paid("2025-06-10", 1200)],
    );
    expect(sheet.parts[0]).toMatchObject({ column: 0, amount: 500 });
    expect(sheet.parts[0].paidDay - DUE_DATES_2025[0]).toBe(56);
    expect(sheet.underpayments[1]).toBe(500);
  });

  it("an underpayment never paid owes 7% for a year from April 15 (365 days)", () => {
    const sheet = penaltyWorksheet([1000, 0, 0, 0], []);
    expect(sheet.penaltyExact).toBeCloseTo(70, 10);
    expect(partPenalty({ column: 3, amount: 3650, paidDay: PENALTY_END_2025 })).toBeCloseTo(63, 10);
  });

  it("no underpayment, no penalty; Section A stops at line 11", () => {
    const payments = [
      paid("2025-04-15", 2500),
      paid("2025-06-15", 2500),
      paid("2025-09-15", 2500),
      paid("2026-01-15", 2500),
    ];
    expect(penaltyWorksheet(regularInstallments(10000), payments).penalty).toBe(0);
    const lines = sectionALines(regularInstallments(10000), paymentsByColumn(payments));
    expect(lines.stoppedAtLine11).toBe(true);
    expect(lines.columns[1].line12).toBeUndefined();
  });

  it("line 16 holds what the period's payments leave unpaid of earlier columns", () => {
    const lines = sectionALines([1000, 1000, 1000, 1000], [0, 300, 3000, 1000]);
    expect(lines.columns[1]).toMatchObject({ line14: 1000, line15: 0, line16: 700, line17: 1000 });
    expect(lines.columns[2]).toMatchObject({ line14: 1700, line15: 1300, line16: 0, line18: 300 });
    expect(lines.columns[3]).toMatchObject({
      line12: 300,
      line13: 1300,
      line14: 0,
      line17: undefined,
    });
  });

  it("Section A line 17 equals worksheet line 1a for any payments", () => {
    const due = [3000, 1500, 0, 4500];
    const cases: DatedPayment[][] = [
      [paid("2025-05-01", 500), paid("2025-08-01", 7000)],
      [paid("2025-04-01", 9000)],
      [paid("2025-12-01", 1000), paid("2026-01-10", 2000), paid("2026-02-01", 9000)],
    ];
    for (const payments of cases) {
      const lines = sectionALines(due, paymentsByColumn(payments));
      const sheet = penaltyWorksheet(due, payments);
      const line17 = lines.stoppedAtLine11
        ? [0, 0, 0, 0]
        : lines.columns.map((column) => column.line17 ?? 0);
      expect(sheet.underpayments).toEqual(line17);
      expect(sheet.penalty).toBeGreaterThanOrEqual(0);
    }
  });

  it("line 10 by the regular method is 25% of line 9 to the nearest dollar", () => {
    expect(regularInstallments(9000)).toEqual([2250, 2250, 2250, 2250]);
    expect(regularInstallments(10002)).toEqual([2501, 2501, 2501, 2501]);
  });
});
