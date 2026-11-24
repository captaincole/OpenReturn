/*
 * Form 4797 lines from the published examples (the 4797 instructions, Pub. 544,
 * Pub. 946, Pub. 225) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type {
  BusinessPropertySaleFactValue,
  Section179RecaptureFactValue,
} from "../../../../src/facts/index.js";
import {
  dayAfter,
  fullMonthsHeld,
  heldMoreThanOneYear,
  printedDate,
} from "../../../../src/federal/4797/dates.js";
import { form4797Lines, partIVColumn } from "../../../../src/federal/4797/lines.js";
import {
  partIIIColumn,
  placeProperty,
  recaptureOf,
  saleGap,
  section1250Percentage,
  section1252Percentage,
  section1255Percentage,
  type PlacedProperty,
} from "../../../../src/federal/4797/properties.js";

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

const placed = (value: BusinessPropertySaleFactValue): PlacedProperty =>
  placeProperty(value, value.grossSalesPrice ?? 0);

/* A Part I land sale with the given gain: line 7 then equals the gain. */
const landGain = (gain: number): PlacedProperty =>
  placed(sale({ kind: "land", grossSalesPrice: 10000 + gain, costOrOtherBasis: 10000 }));

const lines = (
  properties: PlacedProperty[],
  nonrecapturedLosses?: number,
  recaptures: Section179RecaptureFactValue[] = [],
) => form4797Lines({ properties, reportedProceeds: [], nonrecapturedLosses, recaptures });

describe("Form 4797, published examples", () => {
  it("4797 instructions, line 8 example: line 7 $2,000, line 8 $7,000 → line 9 0, line 12 $2,000", () => {
    const figured = lines([landGain(2000)], 7000);
    expect([figured.line7, figured.line8, figured.line9, figured.line12]).toEqual([
      2000, 7000, 0, 2000,
    ]);
    expect(figured.scheduleDGain).toBeUndefined();
  });

  it("Pub. 544, section 1231 example: $2,000 gain, $700 not recaptured → $700 ordinary, $1,300 long-term", () => {
    const figured = lines([landGain(2000)], 700);
    expect([figured.line8, figured.line9, figured.line12, figured.scheduleDGain]).toEqual([
      700, 1300, 700, 1300,
    ]);
    expect(figured.line17).toBe(700);
  });

  it("Pub. 544, section 1245 truck: $7,000 price, $10,000 cost, $6,160 depreciation → $3,160 ordinary", () => {
    const truck = sale({
      dateAcquired: "2023-02-15",
      dateSold: "2025-05-20",
      grossSalesPrice: 7000,
      costOrOtherBasis: 10000,
      depreciationAllowed: 6160,
    });
    const column = partIIIColumn(truck, "Truck", 7000);
    expect(column).toMatchObject({
      line20: 7000,
      line21: 10000,
      line22: 6160,
      line23: 3840,
      line24: 3160,
      line25a: 6160,
      line25b: 3160,
    });
    const figured = lines([placed(truck)], 0);
    expect([figured.line30, figured.line31, figured.line32, figured.line13]).toEqual([
      3160, 3160, 0, 3160,
    ]);
    expect(figured.line6).toBeUndefined();
  });

  it("Pub. 544, low-income housing: Jan 1, 2009 to Jan 2, 2025 is 192 full months → 8%", () => {
    expect(fullMonthsHeld("2009-01-01", "2025-01-02")).toBe(192);
    const housing = sale({
      kind: "section_1250",
      dateAcquired: "2009-01-01",
      dateSold: "2025-01-02",
      lowIncomeHousing: true,
    });
    expect(section1250Percentage(housing)).toBeCloseTo(0.08, 10);
  });

  it("Pub. 544, low-income housing foreclosure: 130 months to the proceedings → 70%", () => {
    const housing = sale({
      kind: "section_1250",
      dateAcquired: "2013-06-01",
      dateSold: "2025-12-03",
      lowIncomeHousing: true,
      foreclosureBegan: "2024-04-03",
    });
    expect(fullMonthsHeld("2013-06-01", "2024-04-03")).toBe(130);
    expect(section1250Percentage(housing)).toBeCloseTo(0.7, 10);
  });

  it("Pub. 946, Paul Lamb: section 179 $5,000, allowable $4,185.20 → line 35 $815", () => {
    const paul = {
      description: "Machine",
      column: "section_179",
      priorDeductions: 5000,
      recomputedDepreciation: 4185.2,
    } as const;
    expect(partIVColumn([paul])).toEqual({ line33: 5000, line34: 4185, line35: 815 });
  });

  it("Pub. 946, Ellen Rye: $16,618 claimed, $12,600 allowable → $4,018 excess depreciation", () => {
    const ellen = {
      description: "Pickup",
      column: "section_280f",
      priorDeductions: 16618,
      recomputedDepreciation: 12600,
    } as const;
    const figured = lines([], undefined, [ellen]);
    expect(figured.partIV.section280f).toEqual({ line33: 16618, line34: 12600, line35: 4018 });
    expect(figured.partIV.section179).toBeUndefined();
  });

  /*
   * Pub. 225 sells land bought Jan 19, 2017 on Oct 5, 2025 "within the eighth
   * year" at 40%. By the 4797 instructions' count that date is in the 9th year;
   * the example's arithmetic holds one year earlier (QUESTIONS.md question 1).
   */
  it("Pub. 225, farmland: $15,000 expenses at 40%, $30,000 gain → $6,000 ordinary, $24,000 section 1231", () => {
    expect(section1252Percentage("2017-01-19", "2024-10-05")).toBe(0.4);
    const land = sale({
      kind: "section_1252",
      dateAcquired: "2018-01-19",
      dateSold: "2025-10-05",
      grossSalesPrice: 80000,
      costOrOtherBasis: 50000,
      soilWaterLandClearing: 15000,
    });
    const column = partIIIColumn(land, "Farmland", 80000);
    expect([column.line24, column.line27a, column.line27b, column.line27c]).toEqual([
      30000, 15000, 6000, 6000,
    ]);
    expect(column.line24 - recaptureOf(column)).toBe(24000);
  });
});

describe("Form 4797, holding period and placement", () => {
  it("a sale on the first anniversary is 1 year exactly; the next day is more than 1 year", () => {
    expect(heldMoreThanOneYear("2024-03-10", "2025-03-10")).toBe(false);
    expect(heldMoreThanOneYear("2024-03-10", "2025-03-11")).toBe(true);
    expect(heldMoreThanOneYear("INHERITED", "2025-01-02")).toBe(true);
  });

  it("dates print as MM/DD/YYYY, or INHERITED", () => {
    expect(printedDate("2025-08-20")).toBe("08/20/2025");
    expect(printedDate("INHERITED")).toBe("INHERITED");
    expect(dayAfter("2024-12-31")).toBe("2025-01-01");
  });

  it("held 1 year or less goes to Part II; ordinary property always does", () => {
    expect(placed(sale({ dateAcquired: "2025-01-02", grossSalesPrice: 500 })).part).toBe("part_ii");
    expect(placed(sale({ kind: "ordinary", grossSalesPrice: 500 })).part).toBe("part_ii");
  });

  it("a depreciable property held more than 1 year: Part III at a gain, Part I at a loss", () => {
    const gain = placed(
      sale({ grossSalesPrice: 600, costOrOtherBasis: 1000, depreciationAllowed: 500 }),
    );
    const loss = placed(
      sale({ grossSalesPrice: 400, costOrOtherBasis: 1000, depreciationAllowed: 500 }),
    );
    const even = placed(
      sale({ grossSalesPrice: 500, costOrOtherBasis: 1000, depreciationAllowed: 500 }),
    );
    expect([gain.part, loss.part, even.part]).toEqual(["part_iii", "part_i", "part_i"]);
  });

  it("land goes to Part I at a gain or a loss", () => {
    expect(landGain(500).part).toBe("part_i");
    expect(landGain(-500).part).toBe("part_i");
  });

  it("an elective partial disposition says so in its description", () => {
    const hvac = placed(
      sale({ grossSalesPrice: 0, costOrOtherBasis: 100, partialDisposition: "elective" }),
    );
    expect(hvac.part === "part_i" && hvac.row.description).toBe(
      "Property (Partial Disposition Election)",
    );
  });

  it("a retired roof (elective partial disposition, no proceeds) is an abandonment: line 10, not Part I", () => {
    const roof = placed(
      sale({
        kind: "section_1250",
        dateAcquired: "2014-06-01",
        dateSold: "2025-02-01",
        costOrOtherBasis: 20000,
        depreciationAllowed: 6000,
        partialDisposition: "elective",
        abandoned: true,
      }),
    );
    expect(roof.part).toBe("part_ii");
    const figured = lines([roof]);
    expect([
      figured.line7,
      figured.line11,
      figured.line1c,
      figured.line17,
      figured.line18b,
    ]).toEqual([undefined, undefined, 14000, -14000, -14000]);
  });

  it("an abandonment with a gain is a gap", () => {
    const value = sale({ grossSalesPrice: 500, costOrOtherBasis: 100, abandoned: true });
    expect(saleGap(value, 500)).toMatch(/abandonment/);
    expect(saleGap({ ...value, grossSalesPrice: 0 }, 0)).toBeUndefined();
  });

  it("a sale with no price, or section 126 payments with no date, is a gap", () => {
    expect(saleGap(sale({}), undefined)).toMatch(/no gross sales price/);
    expect(saleGap(sale({ section126ExcludedPayments: 10 }), 0)).toMatch(/no date received/);
    expect(saleGap(sale({ kind: "section_1252", dateAcquired: "INHERITED" }), 0)).toMatch(
      /inherited/,
    );
    expect(saleGap(sale({}), 100)).toBeUndefined();
  });
});

describe("Form 4797, section 1250 (line 26)", () => {
  const building = (overrides: Partial<BusinessPropertySaleFactValue>) =>
    partIIIColumn(
      sale({
        kind: "section_1250",
        costOrOtherBasis: 100000,
        depreciationAllowed: 30000,
        ...overrides,
      }),
      "Building",
      150000,
    );

  it("straight line only: line 26g is 0 and lines 26a–26e are blank", () => {
    const column = building({});
    expect(column.line24).toBe(80000);
    expect([column.line26a, column.line26b, column.line26c, column.line26g]).toEqual([
      undefined,
      undefined,
      undefined,
      0,
    ]);
  });

  it("additional depreciation: 26b = the smaller of 24 and 26a; 26e = the smaller of 26c and 26d", () => {
    const column = building({
      additionalDepreciationAfter1975: 12000,
      additionalDepreciation1970To1975: 3000,
    });
    expect(column).toMatchObject({
      line26a: 12000,
      line26b: 12000,
      line26c: 68000,
      line26d: 3000,
      line26e: 3000,
      line26g: 15000,
    });
  });

  it("residential rental property skips lines 26d and 26e", () => {
    const column = building({
      additionalDepreciationAfter1975: 12000,
      additionalDepreciation1970To1975: 3000,
      residentialRental: true,
    });
    expect([column.line26d, column.line26e, column.line26g]).toEqual([undefined, undefined, 12000]);
  });

  it("line 24 not more than 26a: 26b is line 24, 26c is 0, 26d and 26e are skipped", () => {
    const column = partIIIColumn(
      sale({
        kind: "section_1250",
        costOrOtherBasis: 100000,
        depreciationAllowed: 30000,
        additionalDepreciationAfter1975: 25000,
      }),
      "Building",
      90000,
    );
    expect(column).toMatchObject({ line24: 20000, line26b: 20000, line26c: 0, line26g: 20000 });
    expect(column.line26d).toBeUndefined();
  });

  it("the low-income housing percentage falls 1% a month after 100 months and stops at 0", () => {
    const housing = (dateSold: string) =>
      section1250Percentage(
        sale({
          kind: "section_1250",
          dateAcquired: "2005-01-01",
          lowIncomeHousing: true,
          dateSold,
        }),
      );
    expect(housing("2013-05-02")).toBe(1);
    expect(housing("2013-06-02")).toBeCloseTo(0.99, 10);
    expect(housing("2025-06-30")).toBe(0);
  });
});

describe("Form 4797, sections 1252, 1254 and 1255 (lines 27–29)", () => {
  it("line 27b percentage: 100% to 5 years, then 80, 60, 40, 20; none from the 10th year", () => {
    const percent = (dateSold: string) => section1252Percentage("2015-03-01", dateSold);
    expect(percent("2020-03-01")).toBe(1);
    expect(percent("2020-03-02")).toBe(0.8);
    expect(percent("2021-03-02")).toBe(0.6);
    expect(percent("2022-03-02")).toBe(0.4);
    expect(percent("2023-03-02")).toBe(0.2);
    expect(percent("2024-03-02")).toBeUndefined();
  });

  it("line 29a percentage: 100% under 10 years, less 10% a year or part, 0 at 20 years", () => {
    expect(section1255Percentage("2015-03-01", "2025-03-01")).toBe(1);
    expect(section1255Percentage("2015-03-01", "2025-03-02")).toBeCloseTo(0.9, 10);
    expect(section1255Percentage("2005-03-01", "2025-03-01")).toBe(0);
  });

  it("line 29b is the smaller of 29a and line 24 less the gain already ordinary", () => {
    const column = partIIIColumn(
      sale({
        kind: "section_1252",
        dateAcquired: "2022-01-01",
        costOrOtherBasis: 10000,
        soilWaterLandClearing: 4000,
        section126ExcludedPayments: 9000,
        section126PaymentsReceived: "2022-06-01",
      }),
      "Farm",
      16000,
    );
    expect(column).toMatchObject({ line24: 6000, line27c: 4000, line29a: 9000, line29b: 2000 });
    expect(recaptureOf(column)).toBe(6000);
  });

  it("line 28b is the smaller of line 24 and the section 1254 costs", () => {
    const column = partIIIColumn(
      sale({
        kind: "section_1254",
        costOrOtherBasis: 20000,
        depreciationAllowed: 5000,
        section1254Costs: 30000,
      }),
      "Working interest",
      40000,
    );
    expect([column.line24, column.line28a, column.line28b]).toEqual([25000, 30000, 25000]);
  });

  it("a recapture line is never more than the gain on line 24", () => {
    const column = partIIIColumn(
      sale({ costOrOtherBasis: 1000, depreciationAllowed: 900 }),
      "Tool",
      300,
    );
    expect([column.line24, column.line25b]).toEqual([200, 200]);
  });
});

describe("Form 4797, the summary lines", () => {
  it("line 7 a loss goes to line 11 as a positive amount, and line 17 subtracts it", () => {
    const figured = lines([
      landGain(-3000),
      placed(sale({ dateAcquired: "2025-02-01", grossSalesPrice: 800 })),
    ]);
    expect([figured.line7, figured.line11, figured.line17, figured.line18b]).toEqual([
      -3000, 3000, -2200, -2200,
    ]);
    expect(figured.scheduleDGain).toBeUndefined();
  });

  it("line 7 a gain with no prior losses goes to Schedule D, and lines 8, 9, 11 and 12 are skipped", () => {
    const figured = lines([landGain(5000)], 0);
    expect(figured.scheduleDGain).toBe(5000);
    expect([figured.line8, figured.line9, figured.line11, figured.line12]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("line 7 a gain waits for the line 8 answer", () => {
    const figured = lines([landGain(5000)]);
    expect(figured.waitsForLine8).toBe(true);
    expect([figured.line8, figured.line17, figured.scheduleDGain]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("the Part III gain over its recapture goes to line 6; line 30 = the column gains, line 31 their recapture", () => {
    const van = placed(
      sale({ grossSalesPrice: 9000, costOrOtherBasis: 10000, depreciationAllowed: 4000 }),
    );
    const shop = placed(
      sale({
        kind: "section_1250",
        grossSalesPrice: 50000,
        costOrOtherBasis: 40000,
        depreciationAllowed: 5000,
      }),
    );
    const figured = lines([van, shop], 0);
    expect([figured.line30, figured.line31, figured.line32, figured.line6, figured.line13]).toEqual(
      [18000, 3000, 15000, 15000, 3000],
    );
    expect(figured.line30).toBe((figured.line31 ?? 0) + (figured.line32 ?? 0));
    expect(figured.line7).toBe(15000);
  });

  it("lines 1a, 1b and 1c add the 1099 proceeds and the partial dispositions' gains and losses", () => {
    const partialGain = placed(
      sale({
        grossSalesPrice: 700,
        costOrOtherBasis: 1000,
        depreciationAllowed: 500,
        partialDisposition: "required",
      }),
    );
    const partialLoss = placed(
      sale({
        grossSalesPrice: 100,
        costOrOtherBasis: 1000,
        depreciationAllowed: 500,
        partialDisposition: "elective",
      }),
    );
    const figured = form4797Lines({
      properties: [partialGain, partialLoss],
      reportedProceeds: [700.4, 100.4],
      nonrecapturedLosses: 0,
      recaptures: [],
    });
    expect([figured.line1a, figured.line1b, figured.line1c]).toEqual([801, 200, 400]);
  });

  it("no sale: every line is blank", () => {
    const figured = lines([]);
    expect([figured.line7, figured.line17, figured.line30, figured.line1a]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("Part IV: each property's recapture is at least 0, figured on its own", () => {
    const column = partIVColumn([
      {
        description: "A",
        column: "section_179",
        priorDeductions: 1000,
        recomputedDepreciation: 1500,
      },
      {
        description: "B",
        column: "section_179",
        priorDeductions: 1000,
        recomputedDepreciation: 400,
      },
    ]);
    expect(column).toEqual({ line33: 2000, line34: 1900, line35: 600 });
  });
});
