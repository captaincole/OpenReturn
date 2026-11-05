/* Source: 2025 Form 8995-A instructions, line 34 and Schedule A. */

import { describe, expect, it } from "vitest";
import {
  netCapitalGain,
  QBI_LIMITS,
  qualifiedBusinesses,
} from "../../../../src/federal/8995-a/lines.js";

describe("Form 8995-A line 34 net capital gain", () => {
  it.each([
    // label, Schedule D line 15, line 16, 1040 line 7a, gain
    ["Schedule D, both gains: the smaller", 60919, 56626, 56626, 56626],
    ["Schedule D, a long-term loss", -500, 2000, 2000, 0],
    ["no Schedule D: 1040 line 7a", undefined, undefined, 7500, 7500],
    ["no Schedule D, no line 7a", undefined, undefined, undefined, 0],
  ] as Array<[string, number | undefined, number | undefined, number | undefined, number]>)(
    "%s",
    (_, l15, l16, l7a, expected) => {
      expect(netCapitalGain(l15, l16, l7a)).toBe(expected);
    },
  );
});

describe("Form 8995-A Part I businesses", () => {
  const limits = QBI_LIMITS.single;
  const sstb = { specifiedService: true };
  const other = { specifiedService: false };
  const unanswered = { specifiedService: undefined };

  it.each([
    // label, businesses, taxable income before QBI, Part I businesses
    ["no SSTB: all, without income", [other], undefined, [other]],
    ["SSTB, income unknown: waits", [sstb, other], undefined, undefined],
    ["SSTB at the threshold", [sstb, other], 197300, [sstb, other]],
    ["SSTB in the phase-in range", [sstb, other], 247300, [sstb, other]],
    ["SSTB above the range: left off", [sstb, other], 247301, [other]],
    ["only an SSTB above the range: none", [sstb], 300000, []],
    ["unanswered above the range: waits", [unanswered, other], 300000, undefined],
    ["unanswered in the range: all", [unanswered, other], 200000, [unanswered, other]],
  ] as Array<[string, Array<{ specifiedService?: boolean }>, number | undefined, unknown]>)(
    "%s",
    (_, businesses, income, expected) => {
      expect(qualifiedBusinesses(businesses, income, limits)).toEqual(expected);
    },
  );
});
