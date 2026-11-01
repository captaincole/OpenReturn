/* Source: 2025 Schedule D instructions, line 21; Form 1040 line 7a. */

import { describe, expect, it } from "vitest";
import { allowableLoss, form1040Line7a } from "../../../../src/federal/schedule-d/lines.js";
import type { FilingStatus } from "../../../../src/values.js";

describe("Schedule D line 21 (allowable loss)", () => {
  it.each([
    // label, line 16, status, line 21
    ["loss over the cap, single", -20000, "single", -3000],
    ["loss over the cap, MFJ", -20000, "married_filing_jointly", -3000],
    ["loss over the cap, MFS", -20000, "married_filing_separately", -1500],
    ["loss under the cap", -1200, "single", -1200],
    ["a gain: line 21 is blank", 5000, "single", undefined],
    ["zero: line 21 is blank", 0, "single", undefined],
    ["no filing status", -20000, undefined, undefined],
  ] as Array<[string, number, FilingStatus | undefined, number | undefined]>)(
    "%s",
    (_, line16, status, expected) => {
      expect(allowableLoss(line16, status)).toBe(expected);
    },
  );
});

describe("Form 1040 line 7a from Schedule D", () => {
  it("takes line 16 when it is a gain", () => {
    expect(form1040Line7a(56626, undefined)).toBe(56626);
  });

  it("takes line 21 when line 16 is a loss", () => {
    expect(form1040Line7a(-20000, -3000)).toBe(-3000);
  });

  it("stays blank for a loss with no line 21", () => {
    expect(form1040Line7a(-20000, undefined)).toBeUndefined();
  });
});
