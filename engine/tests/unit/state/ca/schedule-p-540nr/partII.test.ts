/*
 * Schedule P (540NR) Part II with no tentative minimum tax on total AMTI:
 * "If line 23 is zero or less, enter -0- on line 23, line 24, and line 43. Go
 * to line 44" (ca-540nr-sched-p-inst-2025::sec::line-23::b01). Lines 25 to 42
 * are skipped. The bindings run on a plain record of the lines they read.
 */

import { describe, expect, it } from "vitest";
import { PART_II_BINDINGS } from "../../../../../src/state/ca/schedule-p-540nr/partII.js";

type Lines = Record<string, unknown>;
const INFO = { filingStatus: "head_of_household" };

function line(field: string, form: Lines): unknown {
  const bind = PART_II_BINDINGS[field] as unknown as (form: Lines, info: unknown) => unknown;
  return bind(form, INFO);
}

/* A head of household with $85,000 of AMTI, under the $92,749 exemption: line 23 is 0. */
const BELOW_EXEMPTION: Lines = {
  "0.line.21_alternative_minimum_taxable_income": 85000,
  "1.line.23_amti_less_exemption": 0,
  "1.line.24_total_tentative_minimum_tax": 0,
  "schedule-ca-540nr.4.part4.1_california_agi": 60000,
  "1.line.25_california_agi": 60000,
  "1.line.28_combine_lines_25_through_27": 60000,
  "1.line.30_combine_lines_28_and_29": 70000,
  "1.line.32_california_amt_agi": 70000,
  "1.line.40_california_amti": 70000,
  "1.line.41_total_tmt": 0,
  "form-540nr.1.line.37_ca_tax_before_exemption_credits": 2100,
};

describe("line 23 of 0: go to line 44", () => {
  it.each([
    "1.line.25_california_agi",
    "1.line.28_combine_lines_25_through_27",
    "1.line.30_combine_lines_28_and_29",
    "1.line.32_california_amt_agi",
    "1.line.40_california_amti",
    "1.line.41_total_tmt",
    "1.line.42_california_amt_rate",
  ])("%s is blank", (field) => {
    expect(line(field, BELOW_EXEMPTION)).toBeUndefined();
  });

  it("line 43 is 0 and line 44 is Form 540NR line 37", () => {
    expect(line("1.line.43_california_tmt", BELOW_EXEMPTION)).toBe(0);
    expect(line("1.line.44_regular_tax", BELOW_EXEMPTION)).toBe(2100);
  });

  it("line 45 is 0", () => {
    const form = {
      ...BELOW_EXEMPTION,
      "1.line.43_california_tmt": 0,
      "1.line.44_regular_tax": 2100,
    };
    expect(line("1.line.45_alternative_minimum_tax", form)).toBe(0);
  });

  it("with line 23 above 0, line 25 takes Schedule CA (540NR) Part IV line 1", () => {
    const form = { ...BELOW_EXEMPTION, "1.line.23_amti_less_exemption": 1 };
    expect(line("1.line.25_california_agi", form)).toBe(60000);
  });
});
