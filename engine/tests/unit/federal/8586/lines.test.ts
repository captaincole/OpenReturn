/*
 * Form 8586 lines 1 to 5, pure. The form and its instructions publish no
 * example with numbers (irs-8586-form-2025), so these are limit tests: a total
 * equals its parts, a gap passes through, a copy that waits leaves the total
 * blank, and line 2 follows item E of each Form 8609-A.
 */

import { describe, expect, it } from "vitest";
import { isGap } from "../../../../src/federal/3800/cells.js";
import {
  form8586LinesOf,
  line3Of,
  line5Of,
  type BuildingOnForm8586,
} from "../../../../src/federal/8586/lines.js";
import { unsupported } from "../../../../src/types.js";

const building = (
  bin: string,
  credit: BuildingOnForm8586["credit"],
  qualifiedBasisDecreased = false,
): BuildingOnForm8586 => ({ buildingIdentificationNumber: bin, credit, qualifiedBasisDecreased });

describe("Form 8586 line 3: the total of the Forms 8609-A (line-3::b01)", () => {
  it("adds line 18 of every copy", () => {
    expect(line3Of([26_042, 56_700, 0])).toBe(82_742);
  });

  it("prints 0 when every copy has no credit (years 12 to 15)", () => {
    expect(line3Of([0, 0])).toBe(0);
  });

  it("is blank with no Form 8609-A", () => {
    expect(line3Of([])).toBeUndefined();
  });

  it("is blank while a copy waits, so no credit drops out of the total", () => {
    expect(line3Of([26_042, undefined])).toBeUndefined();
  });

  it("is a gap when any copy is a gap, also next to a copy that waits", () => {
    expect(isGap(line3Of([26_042, unsupported("at-risk"), undefined]))).toBe(true);
  });
});

describe("Form 8586 line 5: add lines 3 and 4 (face-page-1::b01)", () => {
  it("equals its parts", () => {
    expect(line5Of(64_800, 4_350, false)).toBe(69_150);
  });

  it("with no K-1 credit is line 3", () => {
    expect(line5Of(26_042, undefined, false)).toBe(26_042);
  });

  it("is blank when both lines are blank", () => {
    expect(line5Of(undefined, undefined, false)).toBeUndefined();
  });

  it("is blank while a Form 8609-A waits, even with a K-1 credit", () => {
    expect(line5Of(undefined, 4_350, true)).toBeUndefined();
  });

  it("carries a gap from line 4", () => {
    expect(isGap(line5Of(64_800, unsupported("trust"), false))).toBe(true);
  });
});

describe("Form 8586 lines 1 and 2 (face-page-1::b01)", () => {
  it("counts the Forms 8609-A and answers No when no basis decreased", () => {
    const lines = form8586LinesOf([building("WA-21-00377", 26_042)], undefined);
    expect(lines.line1).toBe(1);
    expect(lines.line2Decreased).toBe(false);
    expect(lines.decreasedBins).toEqual([]);
    expect(lines.line5).toBe(26_042);
  });

  it("answers Yes and lists only the BINs whose basis decreased, in copy order", () => {
    const lines = form8586LinesOf(
      [
        building("NV-19-00412", 64_800, true),
        building("NV-20-00031", 12_000),
        building("NV-21-00118", 9_000, true),
      ],
      4_350,
    );
    expect(lines.line1).toBe(3);
    expect(lines.line2Decreased).toBe(true);
    expect(lines.decreasedBins).toEqual(["NV-19-00412", "NV-21-00118"]);
    expect(lines.line3).toBe(85_800);
    expect(lines.line5).toBe(90_150);
  });

  it("with no Form 8609-A (the decision files it for a K-1 credit) line 1 is 0 and line 5 is line 4", () => {
    const lines = form8586LinesOf([], 4_350);
    expect(lines.line1).toBe(0);
    expect(lines.line2Decreased).toBe(false);
    expect(lines.line3).toBeUndefined();
    expect(lines.line5).toBe(4_350);
  });
});
