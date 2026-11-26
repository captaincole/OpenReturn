/*
 * Form 172 Part I's reads of the return, with plain field records: what is
 * business and nonbusiness, and the cases the instructions do not sort.
 */

import { describe, expect, it } from "vitest";
import {
  CAPITAL_NETTED_GAP,
  CAPITAL_OTHER_FORMS_GAP,
  capitalInputs,
  INCREASED_STANDARD_GAP,
  nonbusinessDeductions,
  nonbusinessIncome,
  OTHER_ADJUSTMENTS_GAP,
  OTHER_INCOME_GAP,
  STATE_INCOME_TAX_GAP,
  type Info,
} from "../../../../src/federal/172/reads.js";

const info = (changes: Partial<Info> = {}): Info =>
  ({
    form172: {
      farmLoss: false,
      passThroughOnReturn: false,
      businessCapitalNet: 0,
    },
    ...changes,
  }) as Info;

const gapOf = (value: unknown) => (value as { reason?: string }).reason;

describe("line 6, nonbusiness deductions", () => {
  it("the standard deduction plus the named adjustments; business adjustments stay out", () => {
    const form = {
      "schedule-1.1.line.13": 1200,
      "schedule-1.1.line.20": 3000,
      "schedule-1.1.line.15": 900,
      "schedule-1.1.line.11": 300,
    };
    expect(nonbusinessDeductions(form, info(), 15750)).toBe(15750 + 1200 + 3000);
  });

  it("itemized deductions less the casualty loss, with sales tax elected", () => {
    const form = {
      "schedule-a.0.line.5a_general_sales_tax_election": true,
      "schedule-a.0.line.5a_state_local_income_or_sales_tax": 2000,
      "schedule-a.0.line.15_casualty_theft_loss": 4000,
    };
    expect(nonbusinessDeductions(form, info({ useItemizedDeductions: true }), 30000)).toBe(26000);
  });

  it("state income tax in the itemized deductions is a gap", () => {
    const form = { "schedule-a.0.line.5a_state_local_income_or_sales_tax": 2000 };
    const result = nonbusinessDeductions(form, info({ useItemizedDeductions: true }), 30000);
    expect(gapOf(result)).toBe(STATE_INCOME_TAX_GAP);
  });

  it("an increased standard deduction and other adjustments are gaps", () => {
    expect(
      gapOf(nonbusinessDeductions({}, info({ increasedStandardDeduction: true }), 20000)),
    ).toBe(INCREASED_STANDARD_GAP);
    expect(gapOf(nonbusinessDeductions({ "schedule-1.1.line.25": 400 }, info(), 15750))).toBe(
      OTHER_ADJUSTMENTS_GAP,
    );
  });
});

describe("line 7, nonbusiness income", () => {
  it("adds interest, dividends, retirement income and the named Schedule 1 lines", () => {
    const form = {
      "form-1040.line.1z": 50000,
      "form-1040.line.2b": 100,
      "form-1040.line.3b": 200,
      "form-1040.line.4b": 300,
      "form-1040.line.5b": 400,
      "form-1040.line.6b": 500,
      "schedule-1.0.line.8b": 600,
      "schedule-1.0.line.7": 7000,
    };
    expect(nonbusinessIncome(form)).toBe(2100);
  });

  it("other income or royalties are gaps", () => {
    expect(gapOf(nonbusinessIncome({ "schedule-1.0.line.8z": 50 }))).toBe(OTHER_INCOME_GAP);
    expect(gapOf(nonbusinessIncome({ "schedule-e.0.line.23b_total_royalties": 900 }))).toBe(
      OTHER_INCOME_GAP,
    );
  });
});

describe("lines 2, 3, 11, 12 and 16 from Schedule D", () => {
  const scheduleD = {
    "schedule-d.0.line.1b_gain_loss": -9000,
    "schedule-d.0.line.8b_gain_loss": 2000,
    "schedule-d.0.line.10_gain_loss": -1500,
    "schedule-d.0.line.13_capital_gain_distributions": 500,
    "schedule-d.0.line.14_long_term_loss_carryover": 700,
    "schedule-d.1.line.16_combined_gain_loss": -8700,
  };

  it("sales, distributions and the carryover are nonbusiness", () => {
    expect(capitalInputs(scheduleD, info())).toEqual({
      nonbusinessCapitalLosses: 11200,
      nonbusinessCapitalGains: 2500,
      businessCapitalLosses: 0,
      businessCapitalGains: 0,
      scheduleDLoss: 8700,
    });
  });

  it("the stated business capital loss moves to line 11", () => {
    const business = info({ form172: { ...info().form172!, businessCapitalNet: -1500 } });
    expect(capitalInputs(scheduleD, business)).toMatchObject({
      nonbusinessCapitalLosses: 9700,
      businessCapitalLosses: 1500,
    });
    const tooLarge = info({ form172: { ...info().form172!, businessCapitalNet: 4000 } });
    expect(gapOf(capitalInputs(scheduleD, tooLarge)?.nonbusinessCapitalGains)).toBe(
      CAPITAL_NETTED_GAP,
    );
  });

  it("a K-1 or another form's amount on Schedule D is a gap", () => {
    const form = { ...scheduleD, "schedule-d.0.line.5_net_short_term_passthrough": 300 };
    expect(gapOf(capitalInputs(form, info())?.scheduleDLoss)).toBe(CAPITAL_OTHER_FORMS_GAP);
  });

  it("without Schedule D, line 7a's capital gain distributions are a nonbusiness gain", () => {
    expect(capitalInputs({ "form-1040.line.7a": 650 }, info())).toMatchObject({
      nonbusinessCapitalGains: 650,
      scheduleDLoss: 0,
    });
  });

  it("waits while Schedule D files and its line 16 is blank", () => {
    const filing = info({
      mustFile: { "schedule-d": { value: true } },
    } as unknown as Partial<Info>);
    expect(capitalInputs({}, filing)).toBeUndefined();
  });
});
