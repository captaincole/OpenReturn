/*
 * Form 2210 Part I from the return: when the return's amounts leave a line 2
 * tax unknown, the form is a gap, not a penalty that is too low.
 */

import { describe, expect, it } from "vitest";
import { form2210Outcome, type Form2210Info } from "../../../../src/federal/2210/outcome.js";

/* A single filer with $50,000 withheld, a $60,000 2024 tax and $280,000 of 2024 AGI. */
const info = {
  filingStatus: "single",
  mustFile: { "form-2210": { value: true } },
  form2210: {
    estimatedPayments: [],
    priorYearTax: 60000,
    priorYearAgi: 280000,
    noTwelveMonthReturn: false,
    jointReturn2024: false,
    waiver: { request: "part", amount: 10 },
    annualizedPeriodsIncomplete: false,
  },
} as unknown as Form2210Info;

const returnAmounts = { "form-1040.line.22": 70000, "form-1040.line.25d": 50000 };

describe("Form 2210 Part I line 2: household employment taxes (line-2::b01)", () => {
  it("Schedule H line 9 Yes: FUTA is not figured, so the form is a gap", () => {
    const outcome = form2210Outcome(
      { ...returnAmounts, "schedule-h.0.line.9_yes": true, "schedule-h.0.line.8": 9180 },
      info,
    );
    expect(outcome.kind).toBe("gap");
  });

  it("Schedule H line 9 No: Schedule 2 line 9 counts on line 2", () => {
    const outcome = form2210Outcome(
      {
        ...returnAmounts,
        "schedule-h.0.line.9_no": true,
        "schedule-2.0.line.9_household_employment_taxes": 9180,
      },
      info,
    );
    expect(outcome.kind).toBe("figured");
    if (outcome.kind !== "figured") return;
    expect(outcome.result.partI).toMatchObject({ line2: 9180, line4: 79180 });
  });

  it("no Schedule H: the form figures as before", () => {
    const outcome = form2210Outcome(returnAmounts, info);
    expect(outcome.kind).toBe("figured");
    if (outcome.kind !== "figured") return;
    expect(outcome.result.partI).toMatchObject({ line2: 0, line4: 70000, line9: 63000 });
  });
});
