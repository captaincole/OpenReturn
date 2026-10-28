/* Source: 2025 Form 1040 instructions, lines 12e and 14. */

import { describe, expect, it } from "vitest";
import {
  mayClaimSeniorDeduction,
  standardDeduction,
} from "../../../../src/federal/1040/deductions.js";
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

describe("mayClaimSeniorDeduction (line 14 blocks)", () => {
  it.each([
    [
      "single, born before 1961",
      { filingStatus: "single", taxpayerBornBeforeJan2_1961: true },
      true,
    ],
    ["MFS, born before 1961", { filingStatus: MFS, taxpayerBornBeforeJan2_1961: true }, false],
    ["single, under 65", { filingStatus: "single", taxpayerBornBeforeJan2_1961: false }, false],
  ] as Array<[string, Form1040FilingInfo, boolean]>)("%s", (_, info, expected) => {
    expect(mayClaimSeniorDeduction(info)).toBe(expected);
  });
});
