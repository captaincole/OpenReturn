/*
 * Schedule D-1 lines: the federal Form 4797 examples (4797 instructions, Pub.
 * 544, Pub. 946, Pub. 225), which hold on D-1 when the California amounts are
 * the federal ones (ca-540-sched-d1-inst-2025::sec::a-purpose::b01), and limit
 * tests for California's own lines (19–21, the California amounts, line 38).
 */

import { describe, expect, it } from "vitest";
import type {
  BusinessPropertySaleFactValue,
  Section179RecaptureFactValue,
} from "../../../../../src/facts/index.js";
import { californiaRecapture } from "../../../../../src/facts/index.js";
import { form4797Lines } from "../../../../../src/federal/4797/lines.js";
import { placeProperty, type PlacedProperty } from "../../../../../src/federal/4797/properties.js";
import {
  californiaSale,
  californiaSaleGap,
  differsForCalifornia,
} from "../../../../../src/state/ca/schedule-d-1/california.js";
import { scheduleD1CopyCount } from "../../../../../src/state/ca/schedule-d-1/copies.js";
import {
  differsFromFederal,
  ordinaryAdjustment,
  recaptureDifference,
  scheduleD1Lines,
} from "../../../../../src/state/ca/schedule-d-1/lines.js";

const sale = (
  overrides: Partial<BusinessPropertySaleFactValue>,
): BusinessPropertySaleFactValue => ({
  description: "Property",
  kind: "section_1245",
  dateAcquired: "2020-01-15",
  dateSold: "2025-06-30",
  grossSalesPrice: 0,
  costOrOtherBasis: 0,
  ...overrides,
});

/* A property placed with its California amounts, as the resolver does. */
const placed = (value: BusinessPropertySaleFactValue): PlacedProperty =>
  placeProperty(californiaSale(value), value.grossSalesPrice ?? 0);

const landGain = (gain: number): PlacedProperty =>
  placed(sale({ kind: "land", grossSalesPrice: 10000 + gain, costOrOtherBasis: 10000 }));

const lines = (
  properties: PlacedProperty[],
  nonrecapturedLosses?: number,
  recaptures: Section179RecaptureFactValue[] = [],
  federalLine18b?: number,
) =>
  scheduleD1Lines({
    properties,
    reportedProceeds: [],
    nonrecapturedLosses,
    recaptures,
    federalLine18b,
    federalWaits: false,
  });

describe("Schedule D-1, the federal Form 4797 examples with California amounts equal", () => {
  it("4797 instructions, line 8 example: line 7 $2,000, line 8 $7,000 → line 9 0, line 12 $2,000", () => {
    const figured = lines([landGain(2000)], 7000);
    expect([figured.line7, figured.line8, figured.line9, figured.line12]).toEqual([
      2000, 7000, 0, 2000,
    ]);
    expect(figured.scheduleDGain).toBeUndefined();
  });

  it("Pub. 544, section 1231 example: $700 ordinary on line 12, $1,300 to Schedule D (540)", () => {
    const figured = lines([landGain(2000)], 700);
    expect([figured.line8, figured.line9, figured.line12, figured.scheduleDGain]).toEqual([
      700, 1300, 700, 1300,
    ]);
    expect(figured.line18b).toBe(700);
  });

  it("Pub. 544, section 1245 truck: line 27 $3,160, line 28b $3,160, lines 33 and 34 $3,160", () => {
    const truck = sale({
      dateAcquired: "2023-02-15",
      dateSold: "2025-05-20",
      grossSalesPrice: 7000,
      costOrOtherBasis: 10000,
      depreciationAllowed: 6160,
    });
    const figured = lines([placed(truck)], 0);
    expect(figured.partIIIColumns[0]).toMatchObject({
      line20: 7000,
      line21: 10000,
      line22: 6160,
      line23: 3840,
      line24: 3160,
      line25a: 6160,
      line25b: 3160,
    });
    expect([figured.line30, figured.line31, figured.line32, figured.line13]).toEqual([
      3160, 3160, 0, 3160,
    ]);
  });

  it("Pub. 946, Paul Lamb: line 36 $5,000, line 37 $4,185, line 38 $815", () => {
    const paul: Section179RecaptureFactValue = {
      description: "Machine",
      column: "section_179",
      priorDeductions: 5000,
      recomputedDepreciation: 4185.2,
    };
    expect(lines([], undefined, [paul]).partIV.section179).toEqual({
      line33: 5000,
      line34: 4185,
      line35: 815,
    });
  });

  it("Pub. 946, Ellen Rye: column (b) line 38 $4,018", () => {
    const ellen: Section179RecaptureFactValue = {
      description: "Pickup",
      column: "section_280f",
      priorDeductions: 16618,
      recomputedDepreciation: 12600,
    };
    expect(lines([], undefined, [ellen]).partIV.section280f?.line35).toBe(4018);
  });

  it("Pub. 225 farmland logic: 40% of $15,000 is $6,000 on line 30c (8th year)", () => {
    const land = sale({
      kind: "section_1252",
      dateAcquired: "2018-01-19",
      dateSold: "2025-10-05",
      grossSalesPrice: 80000,
      costOrOtherBasis: 50000,
      soilWaterLandClearing: 15000,
    });
    const column = lines([placed(land)], 0).partIIIColumns[0];
    expect([column?.line24, column?.line27a, column?.line27b, column?.line27c]).toEqual([
      30000, 15000, 6000, 6000,
    ]);
  });
});

describe("Schedule D-1, California amounts", () => {
  const excavator = sale({
    grossSalesPrice: 48000,
    costOrOtherBasis: 80000,
    depreciationAllowed: 80000,
    californiaDepreciationAllowed: 58000,
  });

  it("the California depreciation replaces the federal one: line 27 $26,000, line 28b $26,000", () => {
    const column = lines([placed(excavator)], 0).partIIIColumns[0];
    expect([column?.line22, column?.line24, column?.line25b]).toEqual([58000, 26000, 26000]);
  });

  it("a federal gain can be a California loss: Part III federally, Part I for California", () => {
    const mixer = sale({
      grossSalesPrice: 5000,
      costOrOtherBasis: 20000,
      depreciationAllowed: 20000,
      californiaDepreciationAllowed: 12000,
    });
    expect(placeProperty(mixer, 5000).part).toBe("part_iii");
    expect(placed(mixer)).toMatchObject({ part: "part_i", row: { gainOrLoss: -3000 } });
  });

  it("the California basis replaces the federal one", () => {
    const oven = sale({
      grossSalesPrice: 12000,
      costOrOtherBasis: 20000,
      depreciationAllowed: 14000,
      californiaCostOrOtherBasis: 18000,
    });
    expect(californiaSale(oven).costOrOtherBasis).toBe(18000);
    expect(differsForCalifornia(oven)).toBe(true);
    expect(differsForCalifornia(sale({ costOrOtherBasis: 5, californiaCostOrOtherBasis: 5 }))).toBe(
      false,
    );
  });

  it("no California additional depreciation is straight line: lines 29a–29e blank, 29g 0", () => {
    const paving = sale({
      kind: "section_1250",
      dateAcquired: "2019-03-20",
      grossSalesPrice: 40000,
      costOrOtherBasis: 30000,
      depreciationAllowed: 30000,
      additionalDepreciationAfter1975: 28000,
      californiaDepreciationAllowed: 5000,
      californiaAdditionalDepreciationAfter1976: 0,
    });
    const column = lines([placed(paving)], 0).partIIIColumns[0];
    expect(column).toMatchObject({ line24: 15000, line26g: 0 });
    expect(column?.line26a).toBeUndefined();
    expect(californiaSaleGap(paving)).toBeUndefined();
  });

  it("section 1250 property acquired before 1977 with additional depreciation needs California amounts", () => {
    const old = sale({
      kind: "section_1250",
      dateAcquired: "1975-05-01",
      additionalDepreciationAfter1975: 900,
    });
    expect(californiaSaleGap(old)).toContain("before 1977");
    expect(
      californiaSaleGap({ ...old, californiaAdditionalDepreciationAfter1976: 700 }),
    ).toBeUndefined();
  });

  it("a different California depreciation with federal additional depreciation needs line 29a's amount", () => {
    const building = sale({
      kind: "section_1250",
      additionalDepreciationAfter1975: 900,
      depreciationAllowed: 5000,
      californiaDepreciationAllowed: 4000,
    });
    expect(californiaSaleGap(building)).toContain("line 29a");
    expect(californiaSaleGap({ ...building, californiaDepreciationAllowed: 5000 })).toBeUndefined();
  });

  it("line 31a takes the California drilling costs", () => {
    const well = sale({
      kind: "section_1254",
      grossSalesPrice: 50000,
      costOrOtherBasis: 40000,
      depreciationAllowed: 10000,
      section1254Costs: 9000,
      californiaSection1254Costs: 4000,
    });
    expect(lines([placed(well)], 0).partIIIColumns[0]?.line28a).toBe(4000);
  });

  it("farmland in its 10th year has no line 30 (the DECISION in lines.ts)", () => {
    const land = sale({
      kind: "section_1252",
      dateAcquired: "2015-01-10",
      dateSold: "2025-06-30",
      grossSalesPrice: 90000,
      costOrOtherBasis: 50000,
      soilWaterLandClearing: 8000,
    });
    expect(placed(land).part).toBe("part_i");
  });
});

describe("Schedule D-1, lines 19 to 21", () => {
  it("line 19 more than line 20 is 21a; line 20 more is 21b; equal fills neither", () => {
    expect(ordinaryAdjustment(88000, 27200)).toEqual({ line21a: 60800 });
    expect(ordinaryAdjustment(8800, 13800)).toEqual({ line21b: 5000 });
    expect(ordinaryAdjustment(500, 500)).toEqual({});
  });

  it("a blank line counts as 0, and a loss compares as a negative number", () => {
    expect(ordinaryAdjustment(undefined, 1200)).toEqual({ line21b: 1200 });
    expect(ordinaryAdjustment(-300, undefined)).toEqual({ line21b: 300 });
    expect(ordinaryAdjustment(-300, -1000)).toEqual({ line21a: 700 });
  });

  it("line 20 is line 18b; 21a + line 20 = line 19", () => {
    const trailer = placed(
      sale({
        dateAcquired: "2025-02-01",
        dateSold: "2025-11-01",
        grossSalesPrice: 9000,
        costOrOtherBasis: 12000,
        depreciationAllowed: 12000,
        californiaDepreciationAllowed: 1700,
      }),
    );
    const figured = lines([trailer], undefined, [], 9000);
    expect([figured.line18b, figured.line19, figured.line20, figured.line21a]).toEqual([
      -1300, 9000, -1300, 10300,
    ]);
    expect((figured.line21a ?? 0) + (figured.line20 ?? 0)).toBe(figured.line19);
  });

  it("lines 19–21 wait while either return waits for its line 8 answer", () => {
    const waiting = lines([landGain(500)], undefined, [], 0);
    expect(waiting.waitsForLine19Or20).toBe(true);
    expect([waiting.line19, waiting.line20, waiting.line21a, waiting.line21b]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const federalWaits = scheduleD1Lines({
      properties: [landGain(500)],
      reportedProceeds: [],
      nonrecapturedLosses: 0,
      recaptures: [],
      federalWaits: true,
    });
    expect(federalWaits.line19).toBeUndefined();
  });
});

describe("Schedule D-1, against federal Form 4797", () => {
  const federalOf = (properties: PlacedProperty[]) =>
    form4797Lines({ properties, reportedProceeds: [], nonrecapturedLosses: 0, recaptures: [] });

  it("the same amounts do not differ; a different gain does", () => {
    const land = landGain(4000);
    expect(differsFromFederal(lines([land], 0), federalOf([land]))).toBe(false);
    expect(differsFromFederal(lines([landGain(3000)], 0), federalOf([land]))).toBe(true);
  });

  it("line 38 against line 35: federal more is column B, California more is column C", () => {
    const grinder: Section179RecaptureFactValue = {
      description: "Stump grinder",
      column: "section_179",
      priorDeductions: 40000,
      recomputedDepreciation: 16000,
      californiaPriorDeductions: 25000,
      californiaRecomputedDepreciation: 10000,
    };
    expect(recaptureDifference([grinder], [californiaRecapture(grinder)])).toEqual({
      subtraction: 9000,
      addition: 0,
    });
    const car: Section179RecaptureFactValue = {
      description: "Car",
      column: "section_280f",
      priorDeductions: 12000,
      recomputedDepreciation: 9000,
      californiaPriorDeductions: 10000,
      californiaRecomputedDepreciation: 6000,
    };
    expect(recaptureDifference([car], [californiaRecapture(car)])).toEqual({
      subtraction: 0,
      addition: 1000,
    });
  });

  it("each property's recapture is at least 0 on both returns", () => {
    const below: Section179RecaptureFactValue = {
      description: "Saw",
      column: "section_179",
      priorDeductions: 1000,
      recomputedDepreciation: 1500,
      californiaPriorDeductions: 2000,
      californiaRecomputedDepreciation: 1500,
    };
    expect(recaptureDifference([below], [californiaRecapture(below)])).toEqual({
      subtraction: 0,
      addition: 500,
    });
  });
});

describe("Schedule D-1, copies", () => {
  it("three rows on lines 2 and 10 and four Part III columns per copy", () => {
    const rows = (count: number) => Array.from({ length: count }, () => landGain(100));
    expect(scheduleD1CopyCount(undefined)).toBe(1);
    expect(scheduleD1CopyCount(lines(rows(3), 0))).toBe(1);
    expect(scheduleD1CopyCount(lines(rows(4), 0))).toBe(2);
    expect(scheduleD1CopyCount(lines(rows(7), 0))).toBe(3);
  });

  it("no sale and no recapture: every line is blank", () => {
    const empty = lines([], undefined, [], undefined);
    expect([empty.line1a, empty.line7, empty.line18b, empty.line19, empty.line21a]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
