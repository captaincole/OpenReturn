/*
 * Source: 2025 Form 4684 lines 2–18, irs-4684-inst-2025::sec::line-4::b01,
 * irs-4684-inst-2025::sec::line-11::b01, line-14::b01, Worksheet 1-1 and
 * line-15::b01–b03.
 * The three tcb-us-002 events, checked against the TaxCalcBench answer key.
 */

import { describe, expect, it } from "vitest";
import type { CasualtyEventFactValue, CasualtyPropertyValue } from "../../../../src/facts/index.js";
import {
  ADDITIONAL_SHEETS_GAP,
  additionalSheetsGap,
  line10,
  line11,
  line12,
  line17,
  line4Total,
  mostAffectedZip,
  needsAdditionalSheets,
  netQualifiedDisasterLoss,
  propertyLines,
  sectionATotals,
} from "../../../../src/federal/4684/lines.js";

const place = { city: "City", state: "AK", zip: "99999", dateAcquired: "01/01/2000" };

const event = (
  description: string,
  qualifiedDisasterLoss: boolean,
  properties: CasualtyPropertyValue[],
): CasualtyEventFactValue => ({
  description,
  federallyDeclaredDisaster: qualifiedDisasterLoss || description === "Fire",
  qualifiedDisasterLoss,
  properties,
});

const fire = event("Fire", false, [
  {
    type: "House",
    ...place,
    costBasis: 15000,
    reimbursement: 2000,
    fairMarketValueBefore: 14000,
    fairMarketValueAfter: 2000,
  },
]);
const monsoon = event("Monsoon", true, [
  {
    type: "Shed",
    ...place,
    costBasis: 12000,
    reimbursement: 2000,
    fairMarketValueBefore: 11000,
    fairMarketValueAfter: 6000,
  },
]);
const hurricane = event("Hurricane", false, [
  {
    type: "Barn",
    ...place,
    costBasis: 8000,
    reimbursement: 0,
    fairMarketValueBefore: 7000,
    fairMarketValueAfter: 3000,
  },
]);
const EVENTS = [fire, monsoon, hurricane];

describe("Form 4684 lines 2–9", () => {
  it.each([
    // event, line 2, 3, 5, 6, 7, 8, 9
    ["Fire", fire, 15000, 2000, 14000, 2000, 12000, 12000, 10000],
    ["Monsoon", monsoon, 12000, 2000, 11000, 6000, 5000, 5000, 3000],
    [
      "Hurricane (no reimbursement: line 3 blank)",
      hurricane,
      8000,
      undefined,
      7000,
      3000,
      4000,
      4000,
      4000,
    ],
  ])("%s", (_, casualty, line2, line3, line5, line6, line7, line8, line9) => {
    const [first] = casualty.properties;
    expect(propertyLines(first!)).toEqual({
      line2,
      line3,
      line4: undefined,
      line5,
      line6,
      line7,
      line8,
      line9,
    });
  });

  it("enters a gain on line 4 and skips lines 5 through 9 when line 3 is more than line 2", () => {
    const gain = propertyLines({
      type: "Car",
      costBasis: 5000,
      reimbursement: 7000,
      reimbursementReceived: 7000,
      fairMarketValueBefore: 9000,
      fairMarketValueAfter: 0,
    });
    expect(gain).toMatchObject({
      line2: 5000,
      line3: 7000,
      line4: 2000,
      line5: undefined,
      line9: undefined,
    });
  });

  it.each([
    // received in 2025, line 4
    ["coverage not claimed", 0, 0],
    ["part received in 2025", 11000, 1000],
    ["all received in 2025", 12000, 2000],
  ])("figures line 4 from the reimbursement received in 2025: %s", (_, received, line4) => {
    const lines = propertyLines({
      type: "House",
      costBasis: 10000,
      reimbursement: 12000,
      reimbursementReceived: received,
      fairMarketValueBefore: 20000,
      fairMarketValueAfter: 0,
    });
    expect(lines).toMatchObject({ line3: 12000, line4, line9: undefined });
  });

  it("waits on line 4 until the reimbursement received in 2025 is known", () => {
    const waiting = propertyLines({
      type: "House",
      costBasis: 10000,
      reimbursement: 12000,
      fairMarketValueBefore: 20000,
      fairMarketValueAfter: 0,
    });
    expect(waiting).toMatchObject({ line3: 12000, line4: undefined, line5: undefined });
  });

  it("enters -0- on line 9 when the reimbursement covers the loss", () => {
    const covered = propertyLines({
      type: "Car",
      costBasis: 5000,
      reimbursement: 5000,
      fairMarketValueBefore: 4000,
      fairMarketValueAfter: 1000,
    });
    expect(covered).toMatchObject({ line4: undefined, line8: 3000, line9: 0 });
  });
});

describe("Form 4684 lines 10–12", () => {
  it.each([
    // copy, line 10, 11, 12
    [0, 10000, 100, 9900],
    [1, 3000, 500, 2500],
    [2, 4000, 100, 3900],
  ])("copy %i", (index, ten, eleven, twelve) => {
    expect(line10(EVENTS[index]!)).toBe(ten);
    expect(line11(EVENTS, index)).toBe(eleven);
    expect(line12(EVENTS, index)).toBe(twelve);
  });

  it("enters $100 for a qualified disaster loss when line 10 is not larger than the line 4 gains of all Forms 4684", () => {
    const theft = event("Theft", false, [
      {
        type: "Ring",
        costBasis: 1000,
        reimbursement: 5000,
        reimbursementReceived: 5000,
        fairMarketValueBefore: 6000,
        fairMarketValueAfter: 0,
      },
    ]);
    expect(line4Total(theft)).toBe(4000);
    expect(line11([monsoon, theft], 0)).toBe(100);
    expect(line12([monsoon, theft], 0)).toBe(2900);
  });

  it("waits on line 11 for a qualified disaster loss only while a waiting line 4 can change it", () => {
    const ring = {
      type: "Ring",
      costBasis: 1000,
      reimbursement: 5000,
      fairMarketValueBefore: 6000,
      fairMarketValueAfter: 0,
    };
    const waiting = event("Theft", false, [ring]);
    expect(line4Total(waiting)).toBeUndefined();
    expect(line11([monsoon, waiting], 0)).toBeUndefined();
    expect(line12([monsoon, waiting], 0)).toBeUndefined();
    // Not a qualified disaster loss: $100 whatever the gains.
    expect(line11([fire, waiting], 0)).toBe(100);
    // The known gains already reach line 10: $100 whatever the waiting line 4 adds.
    const known = event("Theft", false, [{ ...ring, reimbursementReceived: 5000 }]);
    expect(line11([monsoon, known, waiting], 0)).toBe(100);
  });

  it("reports the additional sheets gap with more than four properties", () => {
    const many = event(
      "Flood",
      true,
      Array.from({ length: 5 }, () => monsoon.properties[0]!),
    );
    const four = event("Flood", true, many.properties.slice(0, 4));
    expect(needsAdditionalSheets(many)).toBe(true);
    expect(needsAdditionalSheets(four)).toBe(false);
    expect(additionalSheetsGap([fire, many])).toBe(ADDITIONAL_SHEETS_GAP);
    expect(additionalSheetsGap([fire, four])).toBeUndefined();
    // The bindings report the gap; the pure lines stay blank.
    expect(line10(many)).toBeUndefined();
    expect(line11([many], 0)).toBeUndefined();
    expect(sectionATotals([fire, many])).toBeUndefined();
  });

  it("leaves lines 10–12 blank when every column has a gain", () => {
    const gainOnly = event("Theft", false, [
      {
        type: "Ring",
        costBasis: 1000,
        reimbursement: 5000,
        fairMarketValueBefore: 6000,
        fairMarketValueAfter: 0,
      },
    ]);
    expect(line10(gainOnly)).toBeUndefined();
    expect(line12([gainOnly], 0)).toBeUndefined();
  });
});

describe("Form 4684 line 1, Property A's ZIP", () => {
  it("takes the ZIP of the property with the largest decrease in FMV", () => {
    const two = event("Fire", false, [
      { ...fire.properties[0]!, zip: "11111", fairMarketValueAfter: 13000 },
      { ...fire.properties[0]!, zip: "22222" },
    ]);
    expect(mostAffectedZip(two)).toBe("22222");
  });
});

describe("Form 4684 lines 13–17", () => {
  const theft = event("Theft", false, [
    {
      type: "Ring",
      costBasis: 1000,
      reimbursement: 5000,
      reimbursementReceived: 5000,
      fairMarketValueBefore: 6000,
      fairMarketValueAfter: 0,
    },
  ]);

  it("tcb-us-002: the qualified disaster loss on line 15, the rest on line 16", () => {
    expect(sectionATotals(EVENTS)).toEqual({
      line13: undefined,
      line14: 12400,
      line15: 2500,
      netQualifiedDisasterLoss: 2500,
      line16: 9900,
    });
    expect(netQualifiedDisasterLoss(EVENTS)).toBe(2500);
    expect(line17(33650)).toBe(3365);
  });

  it("counts a loss not attributable to a federally declared disaster only up to line 13 (Worksheet 1-1)", () => {
    expect(sectionATotals([fire, hurricane, theft])).toEqual({
      line13: 4000,
      line14: 13800,
      line15: 0,
      netQualifiedDisasterLoss: 0,
      line16: 9800,
    });
  });

  it("enters -0- on line 15 and stops when line 13 equals line 14", () => {
    expect(sectionATotals([hurricane])).toEqual({
      line13: undefined,
      line14: 0,
      line15: 0,
      netQualifiedDisasterLoss: 0,
      line16: undefined,
    });
  });

  it("enters a net gain on line 15 and stops when line 13 is more than line 14", () => {
    const one = sectionATotals([theft, hurricane]);
    expect(one).toMatchObject({ line13: 4000, line14: 3900, line15: 100, line16: undefined });
    expect(one?.netQualifiedDisasterLoss).toBe(0);
    // Gains cover the qualified disaster loss: line 11 is $100, so no net qualified disaster loss.
    expect(sectionATotals([monsoon, theft])).toMatchObject({
      line13: 4000,
      line14: 2900,
      line15: 1100,
      netQualifiedDisasterLoss: 0,
      line16: undefined,
    });
  });

  it("stops after line 15 when every loss is a qualified disaster loss", () => {
    expect(sectionATotals([monsoon])).toEqual({
      line13: undefined,
      line14: 2500,
      line15: 2500,
      netQualifiedDisasterLoss: 2500,
      line16: undefined,
    });
  });

  it("waits on a waiting line 4 and has nothing with no events", () => {
    const waiting = event("Theft", false, [
      { ...theft.properties[0]!, reimbursementReceived: undefined },
    ]);
    expect(sectionATotals([fire, waiting])).toBeUndefined();
    expect(netQualifiedDisasterLoss([fire, waiting])).toBeUndefined();
    expect(sectionATotals([])).toBeUndefined();
    expect(netQualifiedDisasterLoss([])).toBe(0);
  });

  it("rounds line 17 to the nearest dollar", () => {
    expect(line17(33655)).toBe(3366);
    expect(line17(undefined)).toBeUndefined();
  });
});
