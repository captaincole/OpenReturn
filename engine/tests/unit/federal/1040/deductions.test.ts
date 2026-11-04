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
