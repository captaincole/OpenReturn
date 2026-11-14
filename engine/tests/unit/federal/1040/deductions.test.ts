/* Source: 2025 Form 1040 instructions, lines 12e and 14. */

import { describe, expect, it } from "vitest";
import { awaitsSchedule1A, standardDeduction } from "../../../../src/federal/1040/deductions.js";
import type { Form1040FilingInfo } from "../../../../src/federal/1040/filingInfo.js";

const MFS = "married_filing_separately" as const;

describe("standardDeduction (line 12e)", () => {
  it.each([
    // label, info, 12e
    ["single, under 65", { filingStatus: "single", taxpayerBornBeforeJan2_1961: false }, 15750],
    [
      "single, born before 1961",
      { filingStatus: "single", taxpayerBornBeforeJan2_1961: true },
      17750,
    ],
    [
      "MFS, spouse does not itemize, born before 1961",
      { filingStatus: MFS, spouseItemizesSeparately: false, taxpayerBornBeforeJan2_1961: true },
      17350,
    ],
    [
      "MFS, spouse itemizes (Exception 2)",
      { filingStatus: MFS, spouseItemizesSeparately: true, taxpayerBornBeforeJan2_1961: true },
      0,
    ],
    [
      "MFS, spouse answer missing",
      { filingStatus: MFS, taxpayerBornBeforeJan2_1961: true },
      undefined,
    ],
    /*
     * One box for each filer who is blind, at the age box's amount: "multiply the
     * number on line 1 by $1,600 ($2,000 if single or head of household)"
     * (irs-1040-inst-2025::sec::line-16::b03, and the chart in b04).
     */
    [
      "single, blind",
      { filingStatus: "single", taxpayerBornBeforeJan2_1961: false, taxpayerBlind: true },
      17750,
    ],
    [
      "single, born before 1961 and blind",
      { filingStatus: "single", taxpayerBornBeforeJan2_1961: true, taxpayerBlind: true },
      19750,
    ],
    [
      "joint, both born before 1961 and blind",
      {
        filingStatus: "married_filing_jointly",
        taxpayerBornBeforeJan2_1961: true,
        spouseBornBeforeJan2_1961: true,
        taxpayerBlind: true,
        spouseBlind: true,
      },
      37900,
    ],
    [
      "joint, only the spouse is blind",
      {
        filingStatus: "married_filing_jointly",
        taxpayerBornBeforeJan2_1961: false,
        spouseBornBeforeJan2_1961: false,
        spouseBlind: true,
      },
      33100,
    ],
    // "Don't check any boxes for your spouse if your filing status is head of household" (line-12d::b01).
    [
      "head of household, blind: a spouse box does not count",
      {
        filingStatus: "head_of_household",
        taxpayerBornBeforeJan2_1961: false,
        taxpayerBlind: true,
        spouseBlind: true,
      },
      25625,
    ],
    [
      "MFS, blind: the spouse box does not count",
      {
        filingStatus: MFS,
        spouseItemizesSeparately: false,
        taxpayerBornBeforeJan2_1961: false,
        taxpayerBlind: true,
        spouseBlind: true,
      },
      17350,
    ],
    ["no filing status", { taxpayerBornBeforeJan2_1961: false }, undefined],
    ["birth date missing", { filingStatus: "single" }, undefined],
  ] as Array<[string, Form1040FilingInfo, number | undefined]>)("%s", (_, info, expected) => {
    expect(standardDeduction(info)).toBe(expected);
  });
});

const files1A = (value: boolean): Form1040FilingInfo => ({
  mustFile: {
    "schedule-1-a": {
      decisionKey: "decisions.scope.must_file_schedule_1_a",
      value,
      derivation: undefined,
    },
  },
});

describe("awaitsSchedule1A (line 14 blocks)", () => {
  it.each([
    ["Schedule 1-A filed, line 38 blank", files1A(true), undefined, true],
    ["Schedule 1-A filed, line 38 computed", files1A(true), 6000, false],
    ["Schedule 1-A not filed", files1A(false), undefined, false],
    ["no Schedule 1-A resolution", {}, undefined, false],
  ] as Array<[string, Form1040FilingInfo, number | undefined, boolean]>)(
    "%s",
    (_, info, line13b, expected) => {
      expect(awaitsSchedule1A(info, line13b)).toBe(expected);
    },
  );
});
