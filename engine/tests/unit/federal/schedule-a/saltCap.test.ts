/* Source: 2025 Schedule A instructions, line 5e worksheet. */

import { describe, expect, it } from "vitest";
import { saltCap } from "../../../../src/federal/schedule-a/saltCap.js";
import type { FilingStatus } from "../../../../src/values.js";

describe("Schedule A line 5e cap", () => {
  it.each([
    // label, MAGI, status, cap
    ["single, under the threshold", 400000, "single", 40000],
    ["single, $1 over: line 7 rounds to $0", 500001, "single", 40000],
    ["single, $100,000 over", 600000, "single", 10000],
    ["single, $50,000 over", 550000, "single", 25000],
    ["MFS, under the threshold", 200000, "married_filing_separately", 20000],
    ["MFS, $50,000 over: reduce, then halve", 300000, "married_filing_separately", 12500],
    ["MFS, far over: half the $10,000 floor", 400000, "married_filing_separately", 5000],
    ["no MAGI yet", undefined, "single", 40000],
  ] as Array<[string, number | undefined, FilingStatus, number]>)(
    "%s",
    (_, magi, status, expected) => {
      expect(saltCap(magi, status)).toBe(expected);
    },
  );
});
