/*
 * Schedule S arithmetic, pure. No published example with numbers exists for
 * this form (QUESTIONS.md), so each test is a rule the form or its
 * instructions state, or a limit that needs no source.
 */

import { describe, expect, it } from "vitest";
import type { BaseFilingInfo } from "../../../../../src/filingInfo.js";
import {
  incomeRatio,
  ratioText,
  residentCreditAllowed,
  scheduleSLines,
  type ScheduleSAmounts,
} from "../../../../../src/state/ca/schedule-s/lines.js";
import {
  californiaAdjustedGrossIncome,
  californiaTaxLiability,
  NOT_FORM_540,
  otherStateCreditTotal,
} from "../../../../../src/state/ca/schedule-s/returnAmounts.js";

const base: ScheduleSAmounts = {
  californiaTax: 22402,
  californiaAgi: 310000,
  items: [
    { description: "Wages", californiaAmount: 46000, otherStateAmount: 46000 },
    { description: "RSU", californiaAmount: 12400, otherStateAmount: 15250 },
    { description: "Bonus", californiaAmount: 5600, otherStateAmount: 6100 },
  ],
  taxPaid: 4180,
  otherStateAdjustedGrossIncome: 70850,
};

describe("Schedule S lines 5 and 10, the ratios", () => {
  it("divides and rounds to four places, half up", () => {
    expect(incomeRatio(64000, 310000)).toBe(0.2065);
    expect(incomeRatio(1, 3)).toBe(0.3333);
    expect(incomeRatio(2, 3)).toBe(0.6667);
    expect(incomeRatio(41290, 200000)).toBe(0.2065);
  });

  it("is never more than 1.0000 (the form)", () => {
    expect(incomeRatio(80000, 70000)).toBe(1);
    expect(incomeRatio(70000, 70000)).toBe(1);
    expect(incomeRatio(5000, 0)).toBe(1);
    expect(incomeRatio(5000, -2000)).toBe(1);
  });

  it("is 0 with no double-taxed income", () => {
    expect(incomeRatio(0, 50000)).toBe(0);
    expect(incomeRatio(-300, 50000)).toBe(0);
  });

  it("prints one digit, the point and four places", () => {
    expect(ratioText(0.2065)).toBe("0.2065");
    expect(ratioText(0.029)).toBe("0.0290");
    expect(ratioText(1)).toBe("1.0000");
    expect(ratioText(0)).toBe("0.0000");
  });
});

describe("Schedule S lines 1 to 12", () => {
  const lines = scheduleSLines(base);

  it("line 1 totals each column, and lines 3 and 8 copy it (part-i-double-taxed-income::b02)", () => {
    expect([lines.line1California, lines.line1OtherState]).toEqual([64000, 67350]);
    expect([lines.line3, lines.line8]).toEqual([64000, 67350]);
  });

  it("line 1 keeps the cents of the items and rounds the total once", () => {
    const cents = scheduleSLines({
      ...base,
      items: [
        { description: "A", californiaAmount: 100.4, otherStateAmount: 100.4 },
        { description: "B", californiaAmount: 200.4, otherStateAmount: 200.4 },
      ],
    });
    expect(cents.rows.map((row) => row.californiaAmount)).toEqual([100, 200]);
    expect(cents.line1California).toBe(301);
  });

  it("line 6 is line 2 times line 5, and line 11 is line 7 times line 10", () => {
    expect(lines.line5).toBe(0.2065);
    expect(lines.line6).toBe(4626); // 22,402 × 0.2065 = 4,626.01
    expect(lines.line10).toBe(0.9506);
    expect(lines.line11).toBe(3974); // 4,180 × 0.9506 = 3,973.51
  });

  it("line 12 is line 11 when it is the smaller", () => {
    expect(lines.line12).toBe(3974);
  });

  it("line 12 is line 6 when it is the smaller", () => {
    const small = scheduleSLines({
      californiaTax: 4591,
      californiaAgi: 95000,
      items: [{ description: "Wages", californiaAmount: 30000, otherStateAmount: 30000 }],
      taxPaid: 1500,
      otherStateAdjustedGrossIncome: 30000,
    });
    expect([small.line6, small.line10, small.line11, small.line12]).toEqual([1450, 1, 1500, 1450]);
  });

  it("the credit is never more than the California tax or the other state's tax", () => {
    const all = scheduleSLines({ ...base, californiaAgi: 64000, otherStateAdjustedGrossIncome: 1 });
    expect(all.line5).toBe(1);
    expect(all.line10).toBe(1);
    expect(all.line12).toBe(Math.min(all.line2, all.line7));
    expect(all.line12).toBeLessThanOrEqual(all.line2);
    expect(all.line12).toBeLessThanOrEqual(all.line7);
  });

  it("no California tax or no tax paid gives no credit", () => {
    expect(scheduleSLines({ ...base, californiaTax: 0 }).line12).toBe(0);
    expect(scheduleSLines({ ...base, taxPaid: 0 }).line12).toBe(0);
  });
});

describe("Schedule S General Information C: the states a resident may claim", () => {
  it("allows a listed state, in any case", () => {
    expect(residentCreditAllowed({ state: "NY" })).toBe(true);
    expect(residentCreditAllowed({ state: "ny" })).toBe(true);
    expect(residentCreditAllowed({ state: "PR" })).toBe(true);
  });

  it("does not allow a state outside the list", () => {
    expect(residentCreditAllowed({ state: "TX" })).toBe(false);
    expect(residentCreditAllowed({ state: "GU" })).toBe(false);
    expect(residentCreditAllowed({ state: "OR" })).toBe(false);
    expect(residentCreditAllowed({ state: "AZ" })).toBe(false);
  });

  it("allows Virginia for a dual resident only (c-california-residents::b02)", () => {
    expect(residentCreditAllowed({ state: "VA" })).toBe(false);
    expect(residentCreditAllowed({ state: "VA", dualResident: true })).toBe(true);
  });

  it("allows Arizona, Oregon and Virginia on a group nonresident return (c-california-residents::b02)", () => {
    for (const state of ["AZ", "OR", "VA"]) {
      expect(residentCreditAllowed({ state, groupNonresidentReturn: true })).toBe(true);
    }
  });
});

/* A read of the return's lines by full field id, for the return amounts. */
const reader = (values: Record<string, number>) => (fieldId: string) => values[fieldId];
const filing = (...formIds: string[]): BaseFilingInfo =>
  ({
    mustFile: Object.fromEntries(
      formIds.map((formId) => [formId, { decisionKey: "test", value: true, derivation: {} }]),
    ),
  }) as unknown as BaseFilingInfo;

describe("Schedule S lines 2 and 4 from the return", () => {
  const line35 = "form-540.line.35_total_tax_after_credits";
  const line40 = "form-540.line.40_child_dependent_care_credit";
  const credit3506 = "form-3506.0.line.12_child_dependent_care_credit";

  it("line 2 is Form 540 line 35 less the other credits, not below 0", () => {
    const read = reader({ [line35]: 5000, [line40]: 300 });
    expect(californiaTaxLiability(read, filing("form-540"))).toBe(4700);
    const over = reader({ [line35]: 200, [line40]: 300 });
    expect(californiaTaxLiability(over, filing("form-540"))).toBe(0);
  });

  it("line 2 waits for the FTB 3506 credit when that form files", () => {
    const info = filing("form-540", "form-3506");
    expect(californiaTaxLiability(reader({ [line35]: 5000 }), info)).toBeUndefined();
    expect(
      californiaTaxLiability(reader({ [line35]: 5000, [credit3506]: 300 }), info),
    ).toBeUndefined();
    expect(
      californiaTaxLiability(reader({ [line35]: 5000, [credit3506]: 300, [line40]: 300 }), info),
    ).toBe(4700);
  });

  it("line 4 adds the Schedule G-1 lump sum to Form 540 line 17", () => {
    const line17 = "form-540.line.17_ca_agi";
    const g1 = {
      "schedule-g-1.0.line.6_capital_gain_1099r_box_3": 5000,
      "schedule-g-1.0.line.10_total_taxable_amount": 20000,
    };
    const info = filing("form-540", "schedule-g-1");
    expect(californiaAdjustedGrossIncome(reader({ [line17]: 100000 }), filing("form-540"))).toBe(
      100000,
    );
    expect(
      californiaAdjustedGrossIncome(reader({ [line17]: 100000, ...g1 }), info),
    ).toBeUndefined();
    const figured = {
      [line17]: 100000,
      ...g1,
      "schedule-g-1.0.line.28_tax_on_lump_sum_distribution": 900,
    };
    expect(californiaAdjustedGrossIncome(reader(figured), info)).toBe(125000);
  });

  it("a filer with no Form 540 (Form 540NR) is unsupported", () => {
    expect(californiaTaxLiability(reader({}), filing("form-540nr"))).toBe(NOT_FORM_540);
    expect(californiaAdjustedGrossIncome(reader({}), filing("form-540nr"))).toBe(NOT_FORM_540);
  });

  it("the total adds every copy's line 12 and waits for an incomplete one", () => {
    const read = reader({ [line35]: 22402, "form-540.line.17_ca_agi": 310000 });
    const ny = { factKey: "ny", state: "NY", ...base, items: [...base.items] };
    const il = {
      factKey: "il",
      state: "IL",
      items: [{ description: "Wages", californiaAmount: 9000, otherStateAmount: 9000 }],
      taxPaid: 446,
      otherStateAdjustedGrossIncome: 9000,
    };
    const info = { ...filing("form-540"), otherStateCredits: [ny, il] };
    expect(otherStateCreditTotal(read, info)).toBe(3974 + 446);
    const waiting = { ...info, otherStateCredits: [ny, { ...il, taxPaid: undefined }] };
    expect(otherStateCreditTotal(read, waiting)).toBeUndefined();
    expect(otherStateCreditTotal(read, { ...info, otherStateCredits: [] })).toBe(0);
  });
});
