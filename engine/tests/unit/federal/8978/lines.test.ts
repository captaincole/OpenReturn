/*
 * Form 8978's pure rules: the published examples of the instructions
 * (irs-8978-inst-2025) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import { underpaymentRateOn } from "../../../../src/data/underpaymentRates.js";
import type {
  Form8986FactValue,
  PartnerAdjustmentYearFactValue,
} from "../../../../src/facts/index.js";
import {
  AUDIT_ADDED_RATE,
  columnInterest,
  columnLines,
  extendedDueDate,
  formTotals,
  type ColumnInputs,
} from "../../../../src/federal/8978/lines.js";
import {
  placeStatement,
  planForms,
  reportingYearOf,
  type PlacedStatement,
} from "../../../../src/federal/8978/plan.js";
import { placedAttribute, scheduleAColumn } from "../../../../src/federal/8978/scheduleA.js";

const statement = (value: Partial<Form8986FactValue>): Form8986FactValue => ({
  submitter: "audited_partnership",
  returnType: "1065",
  partnershipName: "Test Partners LP",
  partnershipTin: "00-0000001",
  reviewYearEnded: "2021-12-31",
  dateFurnished: "2025-06-08",
  adjustments: [],
  ...value,
});

const placed = (value: Partial<Form8986FactValue>, key = "form_8986.test"): PlacedStatement => {
  const result = placeStatement({ key, value: statement(value) });
  if (typeof result === "string") throw new Error(result);
  return result;
};

const year = (value: Partial<PartnerAdjustmentYearFactValue> & { taxYear: number }) =>
  ({
    totalIncome: 0,
    totalDeductions: 0,
    totalCredits: 0,
    totalIncomeTax: 0,
    ...value,
  }) as PartnerAdjustmentYearFactValue;

const yearsOf = (...values: PartnerAdjustmentYearFactValue[]) =>
  new Map(values.map((value) => [value.taxYear, value]));

const inputs = (overrides: Partial<ColumnInputs> = {}): ColumnInputs => ({
  taxYear: 2021,
  source: "bba_audit",
  previous: { income: 100_000, deductions: 20_000, credits: 1_000, incomeTax: 12_000 },
  adjustments: { income: 5_000, deductions: -1_000, credits: -200, ...overrides.adjustments },
  statement: { incomeTax: 14_500 },
  ...overrides,
});

describe("Form 8978 reporting year (irs-8978-inst-2025::sec::purpose-of-this-form::b08)", () => {
  it("an item G date of 06/15/2023 is the 2023 reporting year of a calendar-year partner", () => {
    const fact = { key: "k", value: statement({ dateFurnished: "2023-06-15" }) };
    expect(reportingYearOf(fact)).toBe(2023);
  });

  it("Example 1 (::where-and-when-to-file::b01): the audited partnership's 03/01/2024, not the pass-through partner's later date", () => {
    const fact = {
      key: "k",
      value: statement({
        submitter: "pass_through_of_audited",
        dateFurnished: "2024-03-01",
        passThroughPartner: { name: "Tier LP", tin: "00-0000002", taxYearEnded: "2023-12-31" },
      }),
    };
    expect(reportingYearOf(fact)).toBe(2024);
  });
});

describe("Form 8978 columns: which years show", () => {
  it("first affected 2020 and only 2023 changed among the intervening years: columns 2020 and 2023 (::completing-form-8978-and-schedule-a::b02, b03)", () => {
    const first = placed({
      reviewYearEnded: "2020-12-31",
      adjustments: [{ lineNumber: "1", lineTitle: "Ordinary", netAdjustment: 10_000 }],
    });
    const years = yearsOf(
      year({ taxYear: 2020, bbaAudit: { incomeTax: 2_200 } }),
      year({
        taxYear: 2023,
        attributeAdjustments: [
          { source: "bba_audit", line: "income", description: "Carryover", amount: -500 },
        ],
        bbaAudit: { incomeTax: -110 },
      }),
    );
    const plan = planForms([first], years);
    expect(plan.copies[0]?.columns.map((column) => column.taxYear)).toEqual([2020, 2023]);
  });

  it("a fifth year starts a second form (::what-s-new::b02)", () => {
    const years = [2019, 2020, 2021, 2022, 2023].map((taxYear) =>
      year({ taxYear, bbaAudit: { incomeTax: 100 } }),
    );
    const plan = planForms([], yearsOf(...years));
    expect(plan.copies.map((copy) => copy.columns.length)).toEqual([4, 1]);
    expect(plan.copies.map((copy) => copy.totals?.line14)).toEqual([400, 100]);
  });

  it("a column without its year fact waits for it", () => {
    const plan = planForms([placed({})], new Map());
    expect(plan.waitingKeys).toEqual(["form_8978_year.2021"]);
    expect(plan.copies[0]?.totals).toBeUndefined();
  });
});

describe("Schedule A totals", () => {
  it("Example 2 (Bill Jones, ::example-2-completing-form-8978-and-schedule-a-for::b01–b02): 2021 income 7,000, deductions -10,000; 2022 income -3,000", () => {
    const bill = placed({
      adjustments: [
        { lineNumber: "1", lineTitle: "Ordinary business income", netAdjustment: 15_000 },
        { lineNumber: "13", lineTitle: "Other deductions", netAdjustment: -10_000 },
        { lineNumber: "9a", lineTitle: "Net long-term capital gain", netAdjustment: -6_000 },
      ],
    });
    const limit = placedAttribute({
      source: "bba_audit",
      line: "income",
      description: "Capital loss limit",
      amount: 3_000,
    });
    const released = placedAttribute({
      source: "bba_audit",
      line: "income",
      description: "Suspended passive loss",
      amount: -5_000,
    });
    expect(scheduleAColumn([...bill.amounts, limit, released])).toEqual({
      income: 7_000,
      deductions: -10_000,
      credits: 0,
    });
  });

  it("Example 4 (Mary Johnson, ::inconsistent-positions::b02): $50 adjustment and $30 inconsistent position give line 2 of $80", () => {
    const mary = placed({
      reviewYearEnded: "2023-12-31",
      adjustments: [{ lineNumber: "1", lineTitle: "Ordinary business income", netAdjustment: 50 }],
    });
    const inconsistent = placedAttribute({
      source: "bba_audit",
      line: "income",
      description: "Inconsistent position previously taken on line 1a item",
      amount: 30,
    });
    expect(scheduleAColumn([...mary.amounts, inconsistent]).income).toBe(80);
  });

  it("uses column (g), the adjustment net of modifications, never column (h)", () => {
    const row = {
      lineNumber: "1",
      lineTitle: "Ordinary",
      asReported: 40_000,
      approvedModifications: 2_000,
      netAdjustment: 13_000,
      asCorrected: 53_000,
    };
    expect(scheduleAColumn(placed({ adjustments: [row] }).amounts).income).toBe(13_000);
  });

  it("a part of another line (qualified dividends) and a non-income item add 0", () => {
    const rows = [
      { lineNumber: "6a", lineTitle: "Ordinary dividends", netAdjustment: 1_000 },
      { lineNumber: "6b", lineTitle: "Qualified dividends", netAdjustment: 800 },
      { lineNumber: "19", lineTitle: "Distributions", netAdjustment: 5_000 },
      { lineNumber: "K3", lineTitle: "Foreign taxes", netAdjustment: 300 },
    ];
    expect(scheduleAColumn(placed({ adjustments: rows }).amounts)).toEqual({
      income: 1_000,
      deductions: 0,
      credits: 0,
    });
  });

  it("an S corporation pass-through partner's K-1 lines: 11 and 12 deductions, 13 credits", () => {
    const rows = [
      { lineNumber: "11", lineTitle: "Section 179 deduction", netAdjustment: -400 },
      { lineNumber: "13", lineTitle: "Credits", netAdjustment: 250 },
    ];
    const amounts = placed({ returnType: "1120-S", adjustments: rows }).amounts;
    expect(scheduleAColumn(amounts)).toEqual({ income: 0, deductions: -400, credits: 250 });
  });

  it("a line the box table does not know, or a Form 1041 K-1, is a gap", () => {
    const unknown = placeStatement({
      key: "k",
      value: statement({ adjustments: [{ lineNumber: "99", lineTitle: "?", netAdjustment: 1 }] }),
    });
    const trust = placeStatement({
      key: "k",
      value: statement({
        returnType: "1041",
        adjustments: [{ lineNumber: "1", lineTitle: "Interest", netAdjustment: 1 }],
      }),
    });
    expect(typeof unknown).toBe("string");
    expect(typeof trust).toBe("string");
  });

  it("a review year of 2025 is a gap: it is not before the reporting year", () => {
    expect(
      typeof placeStatement({ key: "k", value: statement({ reviewYearEnded: "2025-12-31" }) }),
    ).toBe("string");
  });
});

describe("Form 8978 column arithmetic", () => {
  it("lines 1a to 13 follow the form's arithmetic", () => {
    const lines = columnLines(inputs());
    expect(lines).toMatchObject({
      line1a: 100_000,
      line1b: 5_000,
      line2: 105_000,
      line3a: 20_000,
      line3b: -1_000,
      line4: 19_000,
      line5: 86_000,
      line6: 14_500,
      line7: 0,
      line8: 14_500,
      line9a: 1_000,
      line9b: -200,
      line10: 800,
      line11: 13_700,
      line12: 12_000,
      line13: 1_700,
      line15: 0,
    });
  });

  it("the statement's taxable income and liability replace lines 5 and 11 when stated", () => {
    const lines = columnLines(
      inputs({ statement: { incomeTax: 14_500, taxableIncome: 84_000, taxLiability: 13_000 } }),
    );
    expect([lines.line5, lines.line11, lines.line13]).toEqual([84_000, 13_000, 1_000]);
  });

  it("each stated amount rounds to the dollar, then the lines combine the rounded values", () => {
    const lines = columnLines(
      inputs({
        previous: { income: 100_000.5, deductions: 20_000.49, credits: 0, incomeTax: 12_000.4 },
        statement: { incomeTax: 14_500.5, alternativeMinimumTax: 99.5 },
      }),
    );
    expect([lines.line1a, lines.line3a, lines.line8, lines.line12]).toEqual([
      100_001, 20_000, 14_601, 12_000,
    ]);
  });

  it("Example 3 (Frank Smith, ::example-3-completing-forms-8978-and-schedules-a-for::b01–b02): AAR -1,200 and audit +2,400 give 1,200; the audit form starts from the AAR form's corrected amounts", () => {
    const aar = placed({
      submitter: "aar_partnership",
      reviewYearEnded: "2020-12-31",
      dateFurnished: "2023-05-15",
      adjustments: [{ lineNumber: "13", lineTitle: "Other deductions", netAdjustment: 5_000 }],
    });
    const audit = placed({
      reviewYearEnded: "2020-12-31",
      dateFurnished: "2023-06-12",
      adjustments: [{ lineNumber: "1", lineTitle: "Ordinary", netAdjustment: 10_000 }],
    });
    const frank = year({
      taxYear: 2020,
      totalIncome: 90_000,
      totalDeductions: 12_400,
      totalIncomeTax: 12_000,
      aar: { incomeTax: 10_800 },
      bbaAudit: { incomeTax: 13_200 },
    });
    const plan = planForms([aar, audit], yearsOf(frank));
    const [aarCopy, auditCopy] = plan.copies;
    expect([aarCopy?.source, auditCopy?.source]).toEqual(["aar", "bba_audit"]);
    expect([aarCopy?.totals?.line14, auditCopy?.totals?.line14]).toEqual([-1_200, 2_400]);
    const auditColumn = auditCopy?.columns[0]?.lines;
    expect([auditColumn?.line1a, auditColumn?.line3a, auditColumn?.line12]).toEqual([
      90_000, 17_400, 10_800,
    ]);
    // "Because the AAR-related Form 8978 showed a decrease to tax, no interest is shown."
    expect(aarCopy?.totals?.line18).toBe(0);
  });

  it("lines 14, 16 and 18 equal the sum of their columns", () => {
    const columns = [1_700, -720, 432].map((line13, index) => ({
      ...columnLines(inputs()),
      line13,
      line15: index * 10,
      line17: index * 7,
    }));
    expect(formTotals(columns)).toEqual({ line14: 1_412, line16: 30, line18: 21 });
  });
});

/* The interest by hand: each day's rate over the days of its year, compounded daily. */
function handInterest(principal: number, from: string, to: string, added: number): number {
  let factor = 1;
  const day = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  while (day <= end) {
    const yearDays = day.getUTCFullYear() % 4 === 0 ? 366 : 365;
    factor *= 1 + (underpaymentRateOn(day)! + added) / yearDays;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return principal * (factor - 1);
}

describe("Form 8978 line 17 interest (irs-8978-inst-2025::sec::line-17::b01)", () => {
  const withLine13 = (line13: number, line15 = 0) => ({ ...columnLines(inputs()), line13, line15 });

  it("an audit: the underpayment rate with five points, from the original due date to April 15, 2026", () => {
    const lines = { ...withLine13(3_408), taxYear: 2021 };
    const expected = handInterest(3_408, "2022-04-15", "2026-04-15", AUDIT_ADDED_RATE);
    expect(columnInterest(lines, "bba_audit", false)).toBeCloseTo(expected, 6);
  });

  it("an AAR: the rate with three points, so less interest than an audit", () => {
    const lines = { ...withLine13(1_000), taxYear: 2023 };
    const aar = columnInterest(lines, "aar", false)!;
    expect(aar).toBeCloseTo(handInterest(1_000, "2024-04-15", "2026-04-15", 0), 6);
    expect(aar).toBeLessThan(columnInterest(lines, "bba_audit", false)!);
  });

  it("no interest on a decrease (Example 2's column (b))", () => {
    expect(columnInterest({ ...withLine13(-720), taxYear: 2022 }, "bba_audit", false)).toBe(0);
  });

  it("interest on a penalty runs from the extended due date when the return was extended", () => {
    const lines = { ...withLine13(0, 1_000), taxYear: 2021 };
    const extended = columnInterest(lines, "bba_audit", true)!;
    expect(extendedDueDate(2021).toISOString().slice(0, 10)).toBe("2022-10-15");
    expect(extended).toBeCloseTo(handInterest(1_000, "2022-10-15", "2026-04-15", 0.02), 6);
    expect(extended).toBeLessThan(columnInterest(lines, "bba_audit", false)!);
  });
});
