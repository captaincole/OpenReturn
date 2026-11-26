/*
 * Form 4255 arithmetic: the published examples of the 2025 instructions
 * (irs-4255-inst-2025), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type {
  CreditRecaptureLineFactValue,
  CreditRecapturePropertyFactValue,
} from "../../../../src/facts/index.js";
import {
  firstOfMonth,
  fullYearsBetween,
  partThreeLines,
  partTwoTotals,
  percentText,
  prevailingWageRecapture,
  propertyIncreaseInTax,
  propertyLines,
  recapturePercent,
  type PropertyLines,
} from "../../../../src/federal/4255/lines.js";
import {
  partOneRow,
  partOneTotals,
  type RecaptureEvent,
} from "../../../../src/federal/4255/partOne.js";

/* An energy credit of $100,000: 10% of $1,000,000. */
const energyProperty = (
  creditTaken: number,
  disposition: CreditRecapturePropertyFactValue["disposition"],
): CreditRecapturePropertyFactValue => ({
  line: "1j",
  description: "Energy property A",
  originalRate: 0.1,
  creditBase: 1000000,
  creditTaken,
  disposition,
});

const figured = (property: CreditRecapturePropertyFactValue): PropertyLines => {
  const lines = propertyLines(property);
  if (lines === undefined) throw new Error("expected Part II lines");
  return lines;
};

const eventOf = (lines: PropertyLines): RecaptureEvent => ({
  increaseInTax: propertyIncreaseInTax(lines),
  carryoverReduction: lines.sectionD?.carryoverReduction ?? 0,
  percent: lines.sectionD?.line15,
});

const row = (
  line: Parameters<typeof partOneRow>[0],
  fact: CreditRecaptureLineFactValue,
  events: RecaptureEvent[] = [],
) => {
  const result = partOneRow(line, fact, events);
  if (typeof result === "string") throw new Error(result);
  return result;
};

describe("Form 4255 instructions, Examples 1 to 4 (part-iii::b01–b03, worksheet-2::b03)", () => {
  const example1 = energyProperty(36000, {
    placedInService: "2023-01-10",
    ceased: "2025-06-15",
    unusedCreditsWithoutProperty: 0,
    unusedCredit: 64000,
  });

  it("Example 1: line 6 $36,000, 60%, $21,600 of tax; the $64,000 carryforward loses $38,400", () => {
    const lines = figured(example1);
    expect(lines.line6).toBe(36000);
    expect(lines.sectionD).toMatchObject({
      line12: 2,
      line13: 0,
      line14: 36000,
      line15: 60,
      line16: 21600,
    });
    expect(lines.sectionD?.carryoverReduction).toBe(38400);
    expect(64000 - (lines.sectionD?.carryoverReduction ?? 0)).toBe(25600);
  });

  it("Example 1 in Part I: column (h) is the basis increase, $60,000 ($21,600 + $38,400)", () => {
    const cells = row("1j", { creditClaimed: 100000, nonElectiveCreditAppliedToTax: 36000 }, [
      eventOf(figured(example1)),
    ]);
    expect(cells).toMatchObject({
      a: 100000,
      e: 36000,
      f: 64000,
      g: "60%",
      h: 60000,
      i: 38400,
      j: 21600,
      r: 21600,
    });
  });

  it("Example 2: $12,000 of unused credit on line 13 leaves $24,000 and $14,400 of tax", () => {
    const lines = figured({
      ...example1,
      disposition: { ...example1.disposition!, unusedCreditsWithoutProperty: 12000 },
    });
    expect(lines.sectionD).toMatchObject({ line13: 12000, line14: 24000, line16: 14400 });
    const cells = row("1j", { creditClaimed: 100000, nonElectiveCreditAppliedToTax: 36000 }, [
      eventOf(lines),
    ]);
    expect(cells.h).toBe(52800);
  });

  it("Example 3: line 6 $100,000, line 13 $75,000, $15,000 of tax", () => {
    const lines = figured(
      energyProperty(100000, {
        placedInService: "2023-01-05",
        ceased: "2025-06-20",
        unusedCreditsWithoutProperty: 75000,
        unusedCredit: 0,
      }),
    );
    expect(lines.sectionD).toMatchObject({ line14: 25000, line15: 60, line16: 15000 });
  });

  it("Example 4: placed in service July 2023, ceased February 1, 2025: 1 full year, 80%, $20,000", () => {
    const lines = figured(
      energyProperty(100000, {
        placedInService: "2023-07-18",
        ceased: "2025-02-01",
        unusedCreditsWithoutProperty: 75000,
        unusedCredit: 0,
      }),
    );
    expect(lines.sectionD).toMatchObject({
      line10: "2023-07-01",
      line12: 1,
      line15: 80,
      line16: 20000,
    });
  });
});

describe("Form 4255 instructions, Example 6 (worksheet-2::b05, b06): a net EPE recaptured", () => {
  it("80% of a $100,000 credit paid as a net EPE goes in column (l)", () => {
    const lines = figured({
      ...energyProperty(100000, {
        placedInService: "2023-12-12",
        ceased: "2025-07-08",
        unusedCreditsWithoutProperty: 0,
        unusedCredit: 0,
      }),
      line: "1d",
    });
    expect(lines.sectionD).toMatchObject({ line12: 1, line15: 80, line16: 80000 });
    const cells = row(
      "1d",
      {
        creditClaimed: 100000,
        grossElectivePayment: 100000,
        grossElectivePaymentAppliedToTax: 0,
        nonElectiveCreditAppliedToTax: 0,
      },
      [eventOf(lines)],
    );
    expect(cells).toMatchObject({ d: 100000, h: 80000, l: 80000, r: 80000, s: 80000 });
    expect(cells.j).toBeUndefined();
  });
});

describe("Form 4255 penalty ratio (excessive-payments-eps-excessive-credit::b02, net-epe::b01)", () => {
  it("the published example: a $5,000 penalty on line 1c is $3,500 in (o)(1) and $1,500 in (o)(2)", () => {
    const cells = row("1c", {
      creditClaimed: 1000,
      grossElectivePayment: 1000,
      grossElectivePaymentAppliedToTax: 300,
      nonElectiveCreditAppliedToTax: 0,
      prevailingWagePenalty: 5000,
    });
    expect(cells).toMatchObject({ d: 700, o1: 3500, o2: 1500, r: 5000, t: 5000 });
    expect(cells.o3).toBeUndefined();
  });

  it("with no EPE the full penalty is in (o)(3) and (p)(3)", () => {
    const cells = row("1e", {
      creditClaimed: 4000,
      nonElectiveCreditAppliedToTax: 1000,
      prevailingWagePenalty: 900,
      apprenticeshipPenalty: 250,
    });
    expect(cells).toMatchObject({ o3: 900, p3: 250, r: 1150 });
    expect(cells.t).toBeUndefined();
  });

  it("DECISION: with a carryover the rest of the penalty is in (o)(3), so the three add up", () => {
    const cells = row("2a", {
      creditClaimed: 1000,
      grossElectivePayment: 600,
      grossElectivePaymentAppliedToTax: 200,
      nonElectiveCreditAppliedToTax: 100,
      prevailingWagePenalty: 5000,
    });
    expect(cells).toMatchObject({ f: 300, o1: 2000, o2: 1000, o3: 2000 });
  });
});

describe("Form 4255 Part II limits", () => {
  it("line 12 counts full years only; under 12 months is 0", () => {
    expect(fullYearsBetween("2024-03-01", "2025-02-28")).toBe(0);
    expect(fullYearsBetween("2024-03-01", "2025-03-01")).toBe(1);
    expect(fullYearsBetween("2020-03-01", "2025-02-28")).toBe(4);
    expect(fullYearsBetween("2020-03-01", "2025-03-01")).toBe(5);
    expect(firstOfMonth("2023-02-20")).toBe("2023-02-01");
  });

  it("line 15 follows the table, 0 from five full years", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(recapturePercent)).toEqual([100, 80, 60, 40, 20, 0, 0]);
  });

  it("a separation failure or a 48D expansion is 0 years; the expansion is 100%", () => {
    const base = energyProperty(30000, {
      placedInService: "2019-01-01",
      ceased: "2025-06-01",
      unusedCreditsWithoutProperty: 0,
      unusedCredit: 0,
    });
    const expansion = figured({
      ...base,
      disposition: { ...base.disposition!, zeroYearEvent: "advanced_manufacturing_expansion" },
    });
    expect(expansion.sectionD).toMatchObject({ line12: 0, line15: 100, line16: 30000 });
    const failure = figured({
      ...base,
      disposition: { ...base.disposition!, zeroYearEvent: "sequestration_failure" },
    });
    expect(failure.sectionD).toMatchObject({ line12: 0, line15: 100 });
    expect(figured(base).sectionD?.line16).toBe(0);
  });

  it("Section C: a $20,000 increase in nonqualified nonrecourse financing", () => {
    const lines = figured({
      line: "1j",
      description: "Solar",
      originalRate: 0.3,
      creditBase: 120000,
      creditTaken: 36000,
      nonrecourseFinancing: { netChange: 20000, unusedCreditsWithCurrentBase: 1500 },
    });
    expect(lines).toMatchObject({
      line3: 20000,
      line4: 100000,
      line5: 30000,
      line7: 6000,
      line8: 1500,
      line9: 4500,
    });
    expect(lines.sectionD).toBeUndefined();
  });

  it("a decrease makes line 4 larger and line 7 is -0-", () => {
    const lines = figured({
      line: "1j",
      description: "Solar",
      originalRate: 0.3,
      creditBase: 100000,
      creditTaken: 30000,
      nonrecourseFinancing: { netChange: -10000, unusedCreditsWithCurrentBase: 0 },
    });
    expect(lines).toMatchObject({ line4: 110000, line5: 33000, line7: 0, line9: 0 });
  });

  it("line 5 is never more than a dollar limit", () => {
    const lines = figured({
      ...energyProperty(5000, undefined),
      creditLimit: 4000,
      nonrecourseFinancing: { netChange: 0, unusedCreditsWithCurrentBase: 0 },
    });
    expect(lines.line5).toBe(4000);
    expect(lines.line7).toBe(1000);
  });

  it("line 7 above 0 with no Worksheet 1 amount has no line 8", () => {
    expect(
      propertyLines({ ...energyProperty(5000, undefined), creditLimit: 4000 }),
    ).toBeUndefined();
    expect(propertyLines(energyProperty(150000, undefined))).toBeUndefined();
    expect(figured(energyProperty(100000, undefined))).toMatchObject({
      line3: 0,
      line7: 0,
      line8: 0,
      line9: 0,
    });
  });

  it("lines 18 to 20 add every property; line 19 is blank with no disposition", () => {
    const financed = figured({
      ...energyProperty(36000, undefined),
      nonrecourseFinancing: { netChange: 700000, unusedCreditsWithCurrentBase: 0 },
    });
    expect(partTwoTotals([financed])).toEqual({ line18: 6000, line19: undefined, line20: 6000 });
  });
});

describe("Form 4255 Part III and Worksheet 3", () => {
  it("Part III: 20% of the credit difference", () => {
    const lines = partThreeLines({
      designedEmissionsRate: "0.40 kg",
      basis: 250000,
      energyPercentage: 0.3,
      verificationReport: { emissionsRate: "2.10 kg", energyPercentage: 0.075 },
    });
    expect(lines).toMatchObject({
      line3: "30%",
      line4: 75000,
      line6: "7.5%",
      line7: 18750,
      line8: 56250,
      line9: 11250,
    });
  });

  it("no verification report: lines 5 and 6 are 0 and line 9 is 20% of line 4", () => {
    const lines = partThreeLines({
      designedEmissionsRate: "0.40 kg",
      basis: 100000,
      energyPercentage: 0.3,
    });
    expect(lines).toMatchObject({ line5: "0", line6: "0", line7: 0, line8: 30000, line9: 6000 });
  });

  it("a higher percentage this year is no recapture", () => {
    const lines = partThreeLines({
      designedEmissionsRate: "x",
      basis: 100000,
      energyPercentage: 0.075,
      verificationReport: { emissionsRate: "y", energyPercentage: 0.3 },
    });
    expect(lines.line8).toBe(0);
    expect(lines.line9).toBe(0);
  });

  it("Worksheet 3: 80% of the credit times the table percentage", () => {
    expect(
      prevailingWageRecapture({
        description: "x",
        credit: 15000,
        placedInService: "2024-06-10",
        failedOn: "2025-09-01",
      }),
    ).toEqual({ percent: 80, increaseInTax: 9600 });
    expect(
      prevailingWageRecapture({
        description: "x",
        credit: 15000,
        placedInService: "2020-01-01",
        failedOn: "2025-02-01",
      }).increaseInTax,
    ).toBe(0);
  });

  it("percentages print as the form shows them", () => {
    expect([0.2, 0.075, 0.123456, 1].map(percentText)).toEqual(["20%", "7.5%", "12.35%", "100%"]);
  });
});

describe("Form 4255 Part I limits", () => {
  const electing: CreditRecaptureLineFactValue = {
    creditClaimed: 10000,
    grossElectivePayment: 10000,
    grossElectivePaymentAppliedToTax: 0,
    nonElectiveCreditAppliedToTax: 0,
  };

  it("the 20% EP and the 20% of an excessive transfer are not owed with reasonable cause", () => {
    const owed = row("2a", {
      ...electing,
      excessivePayment: { netPortion: 4000, otherPortion: 1000, reasonableCause: false },
      excessiveCreditTransfer: { amount: 2000, reasonableCause: false },
    });
    expect(owed).toMatchObject({
      n1: 4000,
      n2: 1000,
      n3: 1000,
      m1: 2000,
      m2: 400,
      q: 8400,
      s: 4000,
      t: 1000,
    });
    const excused = row("2a", {
      ...electing,
      excessivePayment: { netPortion: 4000, otherPortion: 1000, reasonableCause: true },
    });
    expect(excused.n3).toBeUndefined();
  });

  it("a line 2 recapture is column (q); a line 1 recapture column (r)", () => {
    const event = [{ increaseInTax: 500, carryoverReduction: 0 }];
    const base = { creditClaimed: 1000, nonElectiveCreditAppliedToTax: 1000 };
    expect(row("2b", base, event)).toMatchObject({ j: 500, q: 500 });
    expect(row("1b", base, event)).toMatchObject({ j: 500, r: 500 });
    expect(
      row("1z", { ...base, otherForm: "Form 8864", creditTransferRecapture: 300 }, event),
    ).toMatchObject({ m3: 300, r: 800 });
  });

  it("more than one event on a line prints N/A in column (g)", () => {
    const events = [
      { increaseInTax: 500, carryoverReduction: 0, percent: 60 },
      { increaseInTax: 200, carryoverReduction: 0, percent: 40 },
    ];
    expect(
      row("1j", { creditClaimed: 5000, nonElectiveCreditAppliedToTax: 5000 }, events),
    ).toMatchObject({ g: "N/A", h: 700 });
  });

  it("stops: an EPE on a line an individual cannot elect, a split the instructions do not give, a missing column", () => {
    expect(partOneRow("1b", electing, [])).toMatch(/elect a payment only/);
    const mixed = { ...electing, grossElectivePaymentAppliedToTax: 4000 };
    expect(partOneRow("1d", mixed, [{ increaseInTax: 1000, carryoverReduction: 0 }])).toMatch(
      /more than one way/,
    );
    expect(partOneRow("1d", { ...electing, prevailingWagePenalty: 100 }, [])).toMatch(
      /no column \(o\)\(1\)/,
    );
    expect(partOneRow("1a", { ...electing, creditClaimed: 9000 }, [])).toMatch(/do not add up/);
  });

  it("line 3 totals each column; blank where no line prints", () => {
    const totals = partOneTotals([
      row("1b", { creditClaimed: 1000, nonElectiveCreditAppliedToTax: 400 }, [
        { increaseInTax: 240, carryoverReduction: 360, percent: 60 },
      ]),
      row("2b", { creditClaimed: 500, nonElectiveCreditAppliedToTax: 500 }, [
        { increaseInTax: 100, carryoverReduction: 0 },
      ]),
    ]);
    expect(totals).toMatchObject({
      a: 1500,
      e: 900,
      f: 600,
      h: 700,
      i: 360,
      j: 340,
      q: 100,
      r: 240,
    });
    expect(totals.b).toBeUndefined();
    expect(totals.n1).toBeUndefined();
  });
});
