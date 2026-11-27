/*
 * Form 965-A arithmetic: the published examples of the instructions (each test
 * names its block), and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  BEFORE_YEAR_ONE,
  eligibleForInstallments,
  INSTALLMENT_PERCENTS,
  installmentYearOf,
  netLiability,
  PAST_SCHEDULE,
  paymentsWithThisYear,
  percentThrough,
  remainingUnpaid,
  scheduledPayment,
  UNPAID_WITHOUT_ELECTION,
  type InstallmentInputs,
} from "../../../../src/federal/965-a/lines.js";

/* The payments of years 1 to 8 when each year pays what the schedule says. */
function onSchedule(base: Omit<InstallmentInputs, "paidBefore" | "year">): number[] {
  const paid: number[] = [];
  for (let year = 1; year <= 8; year++) {
    const due = scheduledPayment({ ...base, paidBefore: paid, year });
    paid.push(typeof due === "number" ? due : 0);
  }
  return paid;
}

describe("Form 965-A: the installment schedule (irs-965a-inst-2025::sec::line-1::b01)", () => {
  it("8% in years 1 to 5, then 15%, 20% and 25%: 100% in all", () => {
    expect(INSTALLMENT_PERCENTS).toEqual([8, 8, 8, 8, 8, 15, 20, 25]);
    expect(percentThrough(0)).toBe(0);
    expect(percentThrough(5)).toBe(40);
    expect(percentThrough(8)).toBe(100);
    expect(percentThrough(9)).toBe(100);
  });

  it("line-1::b02: reporting year 2020 is year 4 of a 2017 liability, 8% paid in each of years 1 to 4", () => {
    expect(installmentYearOf(2017, 2020)).toBe(4);
    const paid = onSchedule({ basis: "original", election: true, liability: 100000 });
    expect(paid.slice(0, 4)).toEqual([8000, 8000, 8000, 8000]);
  });

  it("2025 is year 9 of 2017, year 8 of 2018, year 7 of 2019, year 6 of 2020", () => {
    expect([2017, 2018, 2019, 2020].map((year) => installmentYearOf(year))).toEqual([9, 8, 7, 6]);
  });

  it("the eight installments add up to the liability, also when a percentage has cents", () => {
    for (const liability of [100, 6750, 34567, 75700]) {
      const paid = onSchedule({ basis: "original", election: true, liability });
      expect(paid.reduce((total, each) => total + each, 0)).toBe(liability);
    }
  });
});

describe("Form 965-A: the audit example (irs-965a-inst-2025::sec::lines-1-through-8::b10)", () => {
  /* $100 elected, $8 paid in years 1 to 4; in year 5 an audit adds $50, prorated to every installment. */
  const base = { basis: "original" as const, election: true, liability: 150 };

  it("year 5 pays the original $8 plus $20 (8% of $50 for years 1 to 5)", () => {
    expect(scheduledPayment({ ...base, paidBefore: [8, 8, 8, 8], year: 5 })).toBe(28);
  });

  it("years 6 to 8 pay 15%, 20% and 25% of $150 ($22.50, $30, $37.50), whole dollars", () => {
    expect(scheduledPayment({ ...base, paidBefore: [8, 8, 8, 8, 28], year: 6 })).toBe(23);
    expect(scheduledPayment({ ...base, paidBefore: [8, 8, 8, 8, 28, 23], year: 7 })).toBe(30);
    expect(scheduledPayment({ ...base, paidBefore: [8, 8, 8, 8, 28, 23, 30], year: 8 })).toBe(37);
  });

  it("at 100 times the amounts the example's cents vanish: $2,250, $3,000, $3,750", () => {
    const big = { ...base, liability: 15000 };
    const before = [800, 800, 800, 800];
    expect(scheduledPayment({ ...big, paidBefore: before, year: 5 })).toBe(2800);
    expect(scheduledPayment({ ...big, paidBefore: [...before, 2800], year: 6 })).toBe(2250);
    expect(scheduledPayment({ ...big, paidBefore: [...before, 2800, 2250], year: 7 })).toBe(3000);
    expect(scheduledPayment({ ...big, paidBefore: [...before, 2800, 2250, 3000], year: 8 })).toBe(
      3750,
    );
  });
});

describe("Form 965-A: the transfer example (irs-965a-inst-2025::sec::lines-1-through-8::b02, b03)", () => {
  /* The transferor paid five 8% installments of $100; the taxpayer assumed the remaining $60 in year 6. */
  const base = { basis: "assumed" as const, election: true, liability: 60 };
  /* Years 1 to 5 are the transferor's: blank on the taxpayer's Part II. */
  const TRANSFEROR_YEARS: undefined[] = [undefined, undefined, undefined, undefined, undefined];

  it("the transferee pays $15 in year 6, $20 in year 7 and $25 in year 8", () => {
    expect(scheduledPayment({ ...base, paidBefore: [], year: 6 })).toBe(15);
    expect(scheduledPayment({ ...base, paidBefore: [...TRANSFEROR_YEARS, 15], year: 7 })).toBe(20);
    expect(scheduledPayment({ ...base, paidBefore: [...TRANSFEROR_YEARS, 15, 20], year: 8 })).toBe(
      25,
    );
  });

  it("Part II column (j) is 0 after the last payment", () => {
    const payments = paymentsWithThisYear([...TRANSFEROR_YEARS, 15, 20], 8, 25);
    expect(payments).toEqual([undefined, undefined, undefined, undefined, undefined, 15, 20, 25]);
    expect(remainingUnpaid(60, payments)).toBe(0);
  });
});

describe("Form 965-A: Part I columns (d) and (f) (lines-1-through-8::b07)", () => {
  it("column (d) is (b) − (c), never below 0", () => {
    expect(netLiability(412600, 318400)).toBe(94200);
    expect(netLiability(1000, 1200)).toBe(0);
  });

  it("column (f) is (d) − (e); with no S corporation deferral it is (d)", () => {
    expect(eligibleForInstallments(94200, 18500)).toBe(75700);
    expect(eligibleForInstallments(94200, undefined)).toBe(94200);
    expect(eligibleForInstallments(100, 150)).toBe(0);
  });
});

describe("Form 965-A: when the schedule does not apply", () => {
  it("no election: year 1 pays column (h) in full (line-1::b03)", () => {
    const inputs = { basis: "original" as const, election: false, liability: 2225, paidBefore: [] };
    expect(scheduledPayment({ ...inputs, year: 1 })).toBe(2225);
    expect(scheduledPayment({ ...inputs, paidBefore: [2225], year: 6 })).toBeUndefined();
    expect(scheduledPayment({ ...inputs, paidBefore: [1000], year: 6 })).toBe(
      UNPAID_WITHOUT_ELECTION,
    );
  });

  it("a balance left after year 8 has no column; a fully paid line has no payment", () => {
    const inputs = { basis: "original" as const, election: true, liability: 1000 };
    expect(
      scheduledPayment({ ...inputs, paidBefore: [80, 80, 80, 80, 80, 150, 200], year: 9 }),
    ).toBe(PAST_SCHEDULE);
    const paid = [80, 80, 80, 80, 80, 150, 200, 250];
    expect(scheduledPayment({ ...inputs, paidBefore: paid, year: 9 })).toBeUndefined();
  });

  it("a year after the reporting year is not an installment year", () => {
    const inputs = { basis: "original" as const, election: true, liability: 1000, paidBefore: [] };
    expect(scheduledPayment({ ...inputs, year: 0 })).toBe(BEFORE_YEAR_ONE);
  });

  it("a transfer out leaves nothing unpaid, so nothing is due (line-1::b03)", () => {
    // $10,000 elected, $4,000 paid in years 1 to 5; the remaining $6,000 transferred out in year 6.
    const paid = [800, 800, 800, 800, 800];
    const inputs = { basis: "original" as const, election: true, liability: 10000 - 6000 };
    expect(scheduledPayment({ ...inputs, paidBefore: paid, year: 6 })).toBeUndefined();
    expect(remainingUnpaid(4000, paid)).toBe(0);
  });

  it("a payment is never more than what is unpaid", () => {
    for (let year = 1; year <= 8; year++) {
      const due = scheduledPayment({
        basis: "original",
        election: true,
        liability: 500,
        paidBefore: [490],
        year,
      });
      expect(typeof due !== "number" || due <= 10).toBe(true);
    }
  });
});
