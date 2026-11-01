/* Source: 2025 Form 8995-A instructions, line 34. */

import { describe, expect, it } from "vitest";
import { netCapitalGain } from "../../../../src/federal/8995-a/lines.js";

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
