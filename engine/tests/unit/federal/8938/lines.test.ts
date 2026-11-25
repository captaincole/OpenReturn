/*
 * Form 8938 arithmetic: the published examples of the instructions (Examples 2
 * to 11, irs-8938-inst-2025::sec::related-domestic-corporations::b01 to b08),
 * the threshold edges, the value ranges and the GIIN boxes.
 */

import { describe, expect, it } from "vitest";
import type { ForeignAssetOwner } from "../../../../src/facts/index.js";
import {
  cityLine,
  dollarsOf,
  giinSegments,
  printedMaximum,
  reportingThreshold,
  thresholdOutcome,
  thresholdShare,
  thresholdTotals,
  valueRangeOf,
} from "../../../../src/federal/8938/lines.js";
import type { UnitsPerDollar } from "../../../../src/money.js";

interface ExampleAsset {
  owner: ForeignAssetOwner;
  yearEnd: number;
  maximum?: number;
}

/* The outcome for one filer: the assets as the example states them. */
function outcome(
  assets: ExampleAsset[],
  opts: { joint: boolean; abroad?: boolean; spouseIsSpecifiedIndividual?: boolean },
) {
  const counted = assets.map((asset) => ({
    share: thresholdShare(asset.owner, opts.joint, opts.spouseIsSpecifiedIndividual ?? true) ?? 1,
    yearEndDollars: asset.yearEnd,
    maximumDollars: asset.maximum ?? asset.yearEnd,
  }));
  const totals = thresholdTotals(counted);
  return {
    totals,
    result: thresholdOutcome(totals, reportingThreshold(opts.joint, opts.abroad ?? false)),
  };
}

describe("Form 8938 instructions, Examples 2 to 11 (who must file)", () => {
  it("Example 2: unmarried in the U.S., never more than $49,000: does not file", () => {
    expect(outcome([{ owner: "taxpayer", yearEnd: 49000 }], { joint: false }).result).toBe(
      "does_not_file",
    );
  });

  it("Example 3: sold the only asset on October 15 at $125,000: files on the any-time test", () => {
    const { result } = outcome([{ owner: "taxpayer", yearEnd: 0, maximum: 125000 }], {
      joint: false,
    });
    expect(result).toBe("files");
  });

  it("Example 4: owned with an unrelated person, $60,000: each owner counts all of it and files", () => {
    const { totals, result } = outcome([{ owner: "joint_with_other", yearEnd: 60000 }], {
      joint: false,
    });
    expect(totals.yearEnd).toBe(60000);
    expect(result).toBe("files");
  });

  it("Example 5: $30,000 in a disregarded entity plus $25,000 owned directly is $55,000: files", () => {
    const { totals, result } = outcome(
      [
        { owner: "taxpayer", yearEnd: 30000 },
        { owner: "taxpayer", yearEnd: 25000 },
      ],
      { joint: false },
    );
    expect(totals.yearEnd).toBe(55000);
    expect(result).toBe("files");
  });

  it("Example 6: a joint return, one joint asset of $60,000: does not file", () => {
    expect(outcome([{ owner: "joint_with_spouse", yearEnd: 60000 }], { joint: true }).result).toBe(
      "does_not_file",
    );
  });

  it("Example 7: a joint return, $90,000 joint + $10,000 + $1,000 = $101,000: files", () => {
    const { totals, result } = outcome(
      [
        { owner: "joint_with_spouse", yearEnd: 90000 },
        { owner: "spouse", yearEnd: 10000 },
        { owner: "taxpayer", yearEnd: 1000 },
      ],
      { joint: true },
    );
    expect(totals.yearEnd).toBe(101000);
    expect(result).toBe("files");
  });

  it("Example 8: separate returns, a joint asset of $60,000 all year: each counts $30,000, neither files", () => {
    const { totals, result } = outcome([{ owner: "joint_with_spouse", yearEnd: 60000 }], {
      joint: false,
    });
    expect(totals.yearEnd).toBe(30000);
    expect(result).toBe("does_not_file");
  });

  it("Example 9: separate returns: the spouse has $55,000 and files; you have $46,000 and do not", () => {
    const spouse = outcome(
      [
        { owner: "joint_with_spouse", yearEnd: 90000 },
        { owner: "taxpayer", yearEnd: 10000 },
      ],
      { joint: false },
    );
    const you = outcome(
      [
        { owner: "joint_with_spouse", yearEnd: 90000 },
        { owner: "taxpayer", yearEnd: 1000 },
        { owner: "spouse", yearEnd: 10000 },
      ],
      { joint: false },
    );
    expect(spouse.totals.yearEnd).toBe(55000);
    expect(spouse.result).toBe("files");
    expect(you.totals.yearEnd).toBe(46000);
    expect(you.result).toBe("does_not_file");
  });

  it("Example 10: a joint return, living abroad, $150,000 on any day: does not file", () => {
    const { result } = outcome([{ owner: "joint_with_spouse", yearEnd: 150000 }], {
      joint: true,
      abroad: true,
    });
    expect(result).toBe("does_not_file");
  });

  it("Example 11: separate return abroad, the spouse not a specified individual: $150,000 + $60,000 = $210,000, files", () => {
    const { totals, result } = outcome(
      [
        { owner: "joint_with_spouse", yearEnd: 150000 },
        { owner: "spouse", yearEnd: 10000 },
        { owner: "taxpayer", yearEnd: 60000 },
      ],
      { joint: false, abroad: true, spouseIsSpecifiedIndividual: false },
    );
    expect(totals.yearEnd).toBe(210000);
    expect(result).toBe("files");
  });
});

describe("the reporting thresholds", () => {
  it("has the four pairs of types-of-reporting-thresholds::b01 to b03", () => {
    expect(reportingThreshold(false, false)).toEqual({ lastDay: 50000, anyTime: 75000 });
    expect(reportingThreshold(true, false)).toEqual({ lastDay: 100000, anyTime: 150000 });
    expect(reportingThreshold(false, true)).toEqual({ lastDay: 200000, anyTime: 300000 });
    expect(reportingThreshold(true, true)).toEqual({ lastDay: 400000, anyTime: 600000 });
  });

  it("is 'more than': exactly the threshold does not file, a cent more does", () => {
    const single = (yearEnd: number, maximum: number) =>
      outcome([{ owner: "taxpayer", yearEnd, maximum }], { joint: false }).result;
    expect(single(50000, 50000)).toBe("does_not_file");
    expect(single(50000.01, 50000.01)).toBe("files");
    expect(single(0, 75000)).toBe("does_not_file");
    expect(single(0, 75000.01)).toBe("files");
  });

  it("asks for the highest total only between the largest asset and the sum of the maximums", () => {
    const totals = thresholdTotals([
      { share: 1, yearEndDollars: 40000, maximumDollars: 60000 },
      { share: 1, yearEndDollars: 0, maximumDollars: 30000 },
    ]);
    const threshold = reportingThreshold(false, false);
    expect(totals).toEqual({ yearEnd: 40000, sumOfMaximums: 90000, largestMaximum: 60000 });
    expect(thresholdOutcome(totals, threshold)).toBe("needs_highest_total");
    expect(thresholdOutcome(totals, threshold, 70000)).toBe("does_not_file");
    expect(thresholdOutcome(totals, threshold, 80000)).toBe("files");
  });

  it("does not need the highest total when the year-end test already files", () => {
    const totals = thresholdTotals([{ share: 1, yearEndDollars: 51000, maximumDollars: 51000 }]);
    expect(thresholdOutcome(totals, reportingThreshold(false, false), 0)).toBe("files");
  });

  it("counts a spouse's own asset on a joint return and not on a separate one", () => {
    expect(thresholdShare("spouse", true, undefined)).toBe(1);
    expect(thresholdShare("spouse", false, true)).toBe(0);
    expect(thresholdShare("joint_with_spouse", false, undefined)).toBeUndefined();
    expect(thresholdShare("joint_with_other", false, undefined)).toBe(1);
  });
});

describe("values and boxes", () => {
  it("converts at the year-end rate and floors a negative value at zero", () => {
    const chf = 0.796 as UnitsPerDollar;
    expect(dollarsOf(98000, chf)).toBeCloseTo(123115.58, 2);
    expect(dollarsOf(-500)).toBe(0);
    expect(printedMaximum(98000, chf)).toBe(123116);
    expect(printedMaximum(1912.5)).toBe(1913);
  });

  it("picks the line 32 range by the whole-dollar maximum", () => {
    expect(valueRangeOf(0)).toBe("a");
    expect(valueRangeOf(50000)).toBe("a");
    expect(valueRangeOf(50001)).toBe("b");
    expect(valueRangeOf(100000)).toBe("b");
    expect(valueRangeOf(150001)).toBe("d");
    expect(valueRangeOf(200000)).toBe("d");
    expect(valueRangeOf(200001)).toBe("e");
  });

  it("splits a 19-character GIIN into its four boxes and rejects any other shape", () => {
    expect(giinSegments("K7Q2M4.00018.SL.756")).toEqual(["K7Q2M4", "00018", "SL", "756"]);
    expect(giinSegments("K7Q2M400018SL756")).toBeUndefined();
    expect(giinSegments("K7Q2M.400018.SL.756")).toBeUndefined();
  });

  it("writes the city line with the parts that are present", () => {
    expect(
      cityLine({ street: "x", city: "Zurich", country: "Switzerland", postalCode: "8001" }),
    ).toBe("Zurich, Switzerland 8001");
    expect(
      cityLine({ street: "x", city: "Toronto", stateOrProvince: "ON", country: "Canada" }),
    ).toBe("Toronto, ON, Canada");
  });
});
