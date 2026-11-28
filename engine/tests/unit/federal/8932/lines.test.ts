/*
 * Form 8932 lines 1, 2 and 4 as pure arithmetic (lines.ts). No published
 * example with numbers exists for this form (.scratch evidence search): these
 * are limit tests from the stated rules: "The credit is 20% of up to $20,000
 * of differential wage payments paid to each qualified employee"
 * (irs-8932-form-2025::sec::purpose-of-form::b01).
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_RATE,
  PAYMENTS_LIMIT_PER_EMPLOYEE,
  eligiblePaymentsOf,
  line1Of,
  line2ByActivity,
  line2Of,
  line4Of,
  lines1To2,
} from "../../../../src/federal/8932/lines.js";

const qualified = (payments: number) => ({
  differentialWagePayments: payments,
  employedPrior91Days: true,
});

describe("Form 8932 eligible payments (line 1, specific-instructions::b01)", () => {
  it("counts every payment up to $20,000 for one employee", () => {
    expect(eligiblePaymentsOf(qualified(19_999.99))).toBe(19_999.99);
    expect(eligiblePaymentsOf(qualified(PAYMENTS_LIMIT_PER_EMPLOYEE))).toBe(20_000);
  });

  it("counts no more than $20,000 for one employee", () => {
    expect(eligiblePaymentsOf(qualified(20_000.01))).toBe(20_000);
    expect(eligiblePaymentsOf(qualified(64_000))).toBe(20_000);
  });

  it("counts nothing for an employee who was not employed for the 91 days before (qualified-employee::b01)", () => {
    expect(
      eligiblePaymentsOf({ differentialWagePayments: 8_000, employedPrior91Days: false }),
    ).toBe(0);
  });

  it("applies the limit to each employee, not to the total", () => {
    expect(line1Of([qualified(26_400), qualified(8_450.5), qualified(20_000)])).toBe(48_451);
  });

  it("keeps the cents while adding and rounds the total once", () => {
    expect(line1Of([qualified(100.4), qualified(100.4)])).toBe(201);
    expect(line1Of([qualified(100.49)])).toBe(100);
  });
});

describe("Form 8932 line 2 (20%) and line 4", () => {
  it("multiplies line 1 by 20% and rounds to the dollar", () => {
    expect(CREDIT_RATE).toBe(0.2);
    expect(line2Of(28_451)).toBe(5_690);
    expect(line2Of(18_253)).toBe(3_651); // 3,650.60
    expect(line2Of(0)).toBe(0);
  });

  it("is never more than $4,000 for each employee", () => {
    for (const payments of [0, 1, 19_999, 20_000, 20_001, 250_000]) {
      expect(lines1To2([qualified(payments)]).line2).toBeLessThanOrEqual(4_000);
    }
    expect(lines1To2([qualified(90_000), qualified(90_000)]).line2).toBe(8_000);
  });

  it("adds line 3 on line 4, and stays blank while both are blank", () => {
    expect(line4Of(5_690, 1_840)).toBe(7_530);
    expect(line4Of(undefined, 1_840)).toBe(1_840);
    expect(line4Of(5_690, undefined)).toBe(5_690);
    expect(line4Of(undefined, undefined)).toBeUndefined();
  });
});

describe("Form 8932 line 2 by activity (line-2::b01)", () => {
  it("splits line 2 by each activity's eligible payments, and the parts add to line 2", () => {
    const employees = [
      { ...qualified(26_400), activityKey: "business.a" },
      { ...qualified(8_450.5), activityKey: "business.a" },
      { ...qualified(6_125.25), activityKey: "farm.b" },
    ];
    const parts = line2ByActivity(employees);
    expect(parts.get("business.a")).toBe(5_690);
    expect(parts.get("farm.b")).toBe(1_225);
    expect(lines1To2(employees).line2).toBe(6_915);
  });

  it("gives an activity whose employees are not qualified no part", () => {
    const parts = line2ByActivity([
      { ...qualified(10_000), activityKey: "business.a" },
      { differentialWagePayments: 9_000, employedPrior91Days: false, activityKey: "farm.b" },
    ]);
    expect(parts.get("business.a")).toBe(2_000);
    expect(parts.get("farm.b")).toBe(0);
  });

  it("adds up to line 2 when each part rounds the other way", () => {
    const employees = ["a", "b", "c"].map((id) => ({
      ...qualified(1_002.5),
      activityKey: `business.${id}`,
    }));
    const parts = [...line2ByActivity(employees).values()];
    expect(parts.reduce((total, part) => total + part, 0)).toBe(lines1To2(employees).line2);
  });
});
