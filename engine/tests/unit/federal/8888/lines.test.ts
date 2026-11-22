/*
 * Form 8888's pure rules: the published examples of its instructions
 * (irs-8888-form-2025), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  accountNumberAsEntered,
  isValidAccountNumber,
  isValidRoutingNumber,
  refundAccountOf,
} from "../../../../src/federal/8888/accounts.js";
import { allocateRefund, form8888Lines } from "../../../../src/federal/8888/lines.js";

describe("Published examples (irs-8888-form-2025)", () => {
  it("sample check: routing number 250250025 is valid (lines-1b-2b-and-3b::b01)", () => {
    expect(isValidRoutingNumber("250250025")).toBe(true);
  });

  it("sample check: account number 20202086 is entered as it is (lines-1d-2d-and-3d::b01)", () => {
    expect(accountNumberAsEntered("20202086")).toBe("20202086");
    expect(isValidAccountNumber("20202086")).toBe(true);
  });

  it("math-errors::b01, refund increased: $300 as $100 x 3 becomes $350; line 3 gets the $50", () => {
    expect(allocateRefund(350, [100, 100, 100])).toEqual([100, 100, 150]);
  });

  it("math-errors::b01–b02, refund decreased by $150: line 3 gets nothing, line 2 loses $50", () => {
    expect(allocateRefund(150, [100, 100, 100])).toEqual([100, 50, 0]);
  });

  it("math-errors::b01, refund increased with two accounts: line 2 gets the increase", () => {
    expect(allocateRefund(250, [100, 100])).toEqual([100, 150]);
  });
});

describe("Line 5 (line-5::b01)", () => {
  it("equals the refund and the sum of lines 1a, 2a and 3a", () => {
    const lines = form8888Lines(3385, [1500, 1000, undefined]);
    expect(lines.deposits.map((each) => each.amount)).toEqual([1500, 1000, 885]);
    expect(lines.line5).toBe(3385);
  });

  it("stated amounts that add up to the refund stay as stated", () => {
    expect(allocateRefund(900, [400, 500])).toEqual([400, 500]);
  });

  it("an account with no amount takes the rest, wherever it is listed", () => {
    expect(allocateRefund(1000, [undefined, 300, 200])).toEqual([500, 300, 200]);
  });

  it("the split always adds up to the refund", () => {
    for (const refund of [1, 2, 99, 300, 1234, 50000]) {
      for (const stated of [
        [100, 100, 100],
        [5000, undefined],
        [undefined, 1, 1],
        [0, 0],
      ]) {
        const total = allocateRefund(refund, stated).reduce((left, right) => left + right, 0);
        expect(total).toBe(refund);
      }
    }
  });

  it("no account ever gets less than 0", () => {
    const amounts = allocateRefund(10, [100, 100, undefined]);
    expect(amounts).toEqual([10, 0, 0]);
    expect(Math.min(...amounts)).toBeGreaterThanOrEqual(0);
  });
});

describe("Each deposit at least $1 (lines-1a-2a-and-3a::b01)", () => {
  it("an account the split leaves with $0 gets no line; the rest move up", () => {
    const lines = form8888Lines(500, [300, undefined, 200]);
    expect(lines.deposits).toEqual([
      { account: 0, amount: 300 },
      { account: 2, amount: 200 },
    ]);
    expect(lines.line5).toBe(500);
  });

  it("$1 is a deposit; the edge stays on the form", () => {
    const lines = form8888Lines(101, [100, undefined]);
    expect(lines.deposits.map((each) => each.amount)).toEqual([100, 1]);
  });

  it("a stated amount rounds to the whole dollar first (49 cents down, 50 cents up)", () => {
    expect(allocateRefund(1000, [100.49, undefined])).toEqual([100, 900]);
    expect(allocateRefund(1000, [100.5, undefined])).toEqual([101, 899]);
  });

  it("no refund: no deposits and line 5 blank", () => {
    expect(form8888Lines(0, [100, 200])).toEqual({ deposits: [], line5: undefined });
  });
});

describe("Routing number (lines-1b-2b-and-3b::b01)", () => {
  it("first two digits 01 through 12 or 21 through 32", () => {
    expect(isValidRoutingNumber("011000015")).toBe(true);
    expect(isValidRoutingNumber("129999999")).toBe(true);
    expect(isValidRoutingNumber("211111111")).toBe(true);
    expect(isValidRoutingNumber("329999999")).toBe(true);
  });

  it("refuses 00, 13–20 and 33 and up", () => {
    for (const prefix of ["00", "13", "20", "33", "99"]) {
      expect(isValidRoutingNumber(`${prefix}1234567`)).toBe(false);
    }
  });

  it("must be nine digits", () => {
    expect(isValidRoutingNumber("25025002")).toBe(false);
    expect(isValidRoutingNumber("2502500255")).toBe(false);
    expect(isValidRoutingNumber("25025002A")).toBe(false);
  });
});

describe("Account number (lines-1d-2d-and-3d::b01)", () => {
  it("keeps hyphens, leaves out spaces and special symbols", () => {
    expect(accountNumberAsEntered("12-34 56#7")).toBe("12-34567");
  });

  it("up to 17 characters", () => {
    expect(isValidAccountNumber("A".repeat(17))).toBe(true);
    expect(isValidAccountNumber("A".repeat(18))).toBe(false);
    expect(isValidAccountNumber("")).toBe(false);
  });
});

describe("An account the form can use", () => {
  const good = { routingNumber: "250250025", accountNumber: "2020 2086", accountType: "checking" };

  it("reads a good account and enters its number", () => {
    expect(refundAccountOf(good)).toEqual({
      ...good,
      accountNumber: "20202086",
      amount: undefined,
    });
  });

  it("refuses a bad routing number, a bad box, a negative amount", () => {
    expect(refundAccountOf({ ...good, routingNumber: "990000000" })).toBeUndefined();
    expect(refundAccountOf({ ...good, accountType: "brokerage" })).toBeUndefined();
    expect(refundAccountOf({ ...good, amount: -5 })).toBeUndefined();
    expect(refundAccountOf("not an account")).toBeUndefined();
  });
});
