/*
 * Form 8936 and Schedule A (Form 8936): the pure rules. The published examples
 * of the 2025 instructions come first, then the limits and edges of each part.
 */

import { describe, expect, it } from "vitest";
import type { CleanVehicleFactValue } from "../../../../src/facts/index.js";
import {
  businessTotal,
  modifiedAgi,
  overMagiLimit,
  taxLimit,
} from "../../../../src/federal/8936/lines.js";
import {
  businessUsePercent,
  commercialLines,
  newVehicleLines,
  previouslyOwnedLines,
  scheduleA,
  type MagiAnswers,
} from "../../../../src/federal/8936/scheduleA.js";

const NEW: CleanVehicleFactValue = {
  modelYear: 2025,
  make: "Test",
  model: "Sedan",
  vin: "TESTVIN0000000001",
  placedInServiceDate: "2025-04-01",
  acquiredDate: "2025-03-28",
  kind: "new",
  resoldWithin30Days: false,
  acquiredForUse: true,
  tentativeCredit: 7500,
  businessUsePercent: 0,
};

const USED: CleanVehicleFactValue = {
  ...NEW,
  modelYear: 2020,
  kind: "previously_owned",
  tentativeCredit: undefined,
  businessUsePercent: undefined,
  salesPrice: 12000,
  claimedUsedCreditInPrior3Years: false,
};

const COMMERCIAL: CleanVehicleFactValue = {
  ...NEW,
  kind: "commercial",
  tentativeCredit: undefined,
  businessUsePercent: undefined,
  resoldWithin30Days: undefined,
  depreciable: true,
  poweredByGasOrDiesel: false,
  grossVehicleWeightRating: 6000,
  basis: 48000,
  incrementalCost: 7500,
};

const COMMERCIAL_INPUTS = {
  basis: 48000,
  poweredByGasOrDiesel: false,
  incrementalCost: 7500,
  grossVehicleWeightRating: 6000,
};

const UNDER: MagiAnswers = { status2025: "single", line2: 90000 };

describe("published examples (Instructions for Form 8936, 2025)", () => {
  /*
   * irs-8936-inst-2025::sec::lines-1a-and-3a::b02–b03: a spouse filing MFS
   * claims the credit with a modified AGI of $200,000, over the $150,000 MFS
   * threshold; the prior year was $140,000, single ($150,000), so "that spouse
   * meets the modified AGI requirement to claim the credit".
   */
  it("lines-1a-and-3a: MFS $200,000 now, single $140,000 before: the new vehicle credit stands", () => {
    expect(overMagiLimit(200000, "new", "married_filing_separately")).toBe(true);
    expect(overMagiLimit(140000, "new", "single")).toBe(false);
    const result = scheduleA(NEW, {
      status2025: "married_filing_separately",
      line2: 200000,
      line4: 140000,
      status2024: "single",
    });
    expect(result.reach).toBe(2);
    expect(result.outcome).toMatchObject({ kind: "new", line9: 7500, line12: 7500 });
  });

  /* irs-8936-inst-2025::sec::line-10::b02: 50% business use for the last 6 months: "you would enter 25% on line 10". */
  it("line-10: 50% for the last 6 months is 25%", () => {
    expect(businessUsePercent(50, 6)).toBe(25);
    expect(businessUsePercent(50)).toBe(50);
  });
});

describe("Part I and the chart under line 5", () => {
  it("line 2 adds lines 1a through 1e", () => {
    expect(
      modifiedAgi({
        agi: 100000,
        puertoRicoExcluded: 1000,
        form2555Line45: 2000,
        form2555Line50: 3000,
        form4563Line15: 4000,
      }),
    ).toBe(110000);
  });

  it.each([
    ["single", 150000, 75000],
    ["married_filing_separately", 150000, 75000],
    ["head_of_household", 225000, 112500],
    ["married_filing_jointly", 300000, 150000],
    ["qualifying_surviving_spouse", 300000, 150000],
  ] as const)("%s: at the limit qualifies, a dollar over does not", (status, partIII, partIV) => {
    expect(overMagiLimit(partIII, "new", status)).toBe(false);
    expect(overMagiLimit(partIII + 1, "new", status)).toBe(true);
    expect(overMagiLimit(partIV, "previously_owned", status)).toBe(false);
    expect(overMagiLimit(partIV + 1, "previously_owned", status)).toBe(true);
  });
});

describe("Schedule A Part II and III: a new clean vehicle", () => {
  it("line 11 is line 9 times line 10, line 12 the rest", () => {
    expect(newVehicleLines(7500, 40)).toEqual({
      kind: "new",
      line9: 7500,
      line10: 40,
      line11: 3000,
      line12: 4500,
    });
  });

  it("100% business use stops after line 11: no line 12", () => {
    expect(newVehicleLines(7500, 100)).toMatchObject({ line11: 7500, line12: undefined });
  });

  it("line 11 rounds to the nearest dollar, and lines 11 + 12 equal line 9", () => {
    const lines = newVehicleLines(3750, 33);
    expect(lines).toMatchObject({ line11: 1238, line12: 2512 });
  });

  it("2025 modified AGI under the limit stops at line 8c: lines 1–2 only", () => {
    expect(scheduleA(NEW, UNDER).reach).toBe(1);
  });

  it("over the limit both years: no credit", () => {
    const magi = {
      status2025: "single",
      line2: 160000,
      line4: 151000,
      status2024: "single",
    } as const;
    expect(scheduleA(NEW, magi).outcome).toMatchObject({ kind: "none" });
  });

  it("over both years with a transfer: line 4a goes to Schedule 2 line 1b", () => {
    const magi = {
      status2025: "single",
      line2: 160000,
      line4: 151000,
      status2024: "single",
    } as const;
    const vehicle = { ...NEW, creditTransferredToDealer: 7500 };
    expect(scheduleA(vehicle, magi).outcome).toEqual({
      kind: "repay",
      schedule2Line: "1b",
      amount: 7500,
    });
  });

  it("a transfer and an eligible return: stop, nothing on Form 8936 and nothing to repay", () => {
    const vehicle = { ...NEW, creditTransferredToDealer: 7500 };
    expect(scheduleA(vehicle, UNDER).outcome).toMatchObject({ kind: "none" });
  });

  it("resold within 30 days with a transfer: repay, with no Part I", () => {
    const vehicle = { ...NEW, resoldWithin30Days: true, creditTransferredToDealer: 3750 };
    expect(scheduleA(vehicle, UNDER)).toEqual({
      reach: 0,
      outcome: { kind: "repay", schedule2Line: "1b", amount: 3750 },
    });
  });

  it("not acquired for use (a lease): no credit", () => {
    expect(scheduleA({ ...NEW, acquiredForUse: false }, UNDER).outcome.kind).toBe("none");
  });

  it("over in 2025 waits for the 2024 answers", () => {
    const result = scheduleA(NEW, { status2025: "single", line2: 160000 });
    expect(result).toEqual({ reach: 2, outcome: { kind: "waits", on: "line4" } });
  });

  it("a 2025 joint return over the limit after a 2024 single return is a gap", () => {
    const magi = {
      status2025: "married_filing_jointly",
      line2: 310000,
      line4: 100000,
      status2024: "single",
    } as const;
    expect(scheduleA(NEW, magi).outcome.kind).toBe("gap");
  });
});

describe("Schedule A lines 5–7: the dates", () => {
  it("acquired September 30, 2025 qualifies; October 1 does not", () => {
    expect(scheduleA({ ...NEW, acquiredDate: "2025-09-30" }, UNDER).outcome.kind).toBe("new");
    expect(scheduleA({ ...NEW, acquiredDate: "2025-10-01" }, UNDER).outcome.kind).toBe("none");
  });

  it("placed in service in 2024 is not this year's schedule", () => {
    expect(scheduleA({ ...NEW, placedInServiceDate: "2024-12-30" }, UNDER).outcome.kind).toBe(
      "none",
    );
  });

  it("a transferred credit for a vehicle lines 5–7 rule out is a gap", () => {
    const vehicle = { ...NEW, acquiredDate: "2025-10-02", creditTransferredToDealer: 7500 };
    expect(scheduleA(vehicle, UNDER).outcome.kind).toBe("gap");
  });
});

describe("Schedule A Part IV: a previously owned clean vehicle", () => {
  it("line 15 is 30% of line 14; line 17 the smaller of it and $4,000", () => {
    expect(previouslyOwnedLines(12000)).toEqual({
      kind: "previously_owned",
      line14: 12000,
      line15: 3600,
      line16: 4000,
      line17: 3600,
    });
    expect(previouslyOwnedLines(25000)).toMatchObject({ line15: 7500, line17: 4000 });
  });

  it("the credit is never more than $4,000 or 30% of the price", () => {
    for (const price of [1, 999, 13333, 13334, 20000, 25000]) {
      const lines = previouslyOwnedLines(price);
      if (lines.kind !== "previously_owned") throw new Error("kind");
      expect(lines.line17).toBeLessThanOrEqual(4000);
      expect(lines.line17).toBeLessThanOrEqual(lines.line15);
    }
  });

  it("a sales price of $25,000 qualifies; $25,000.01 does not (line 13e)", () => {
    const magi = { ...UNDER, line2: 50000 };
    expect(scheduleA({ ...USED, salesPrice: 25000 }, magi, false).outcome.kind).toBe(
      "previously_owned",
    );
    expect(scheduleA({ ...USED, salesPrice: 25000.01 }, magi, false).outcome.kind).toBe("none");
  });

  it("line 13d: a credit in the 3 years before stops it", () => {
    const vehicle = { ...USED, claimedUsedCreditInPrior3Years: true };
    expect(scheduleA(vehicle, { ...UNDER, line2: 50000 }, false).outcome.kind).toBe("none");
  });

  it("line 13g: waits for the dependent answer, and a dependent gets nothing", () => {
    const magi = { ...UNDER, line2: 50000 };
    expect(scheduleA(USED, magi).outcome).toEqual({ kind: "waits", on: "dependent" });
    expect(scheduleA(USED, magi, true).outcome.kind).toBe("none");
  });

  it("uses the Part IV limits: $80,000 single is over in 2025", () => {
    expect(scheduleA(USED, UNDER, false).reach).toBe(2);
  });

  it("over both years with a transfer: Schedule 2 line 1c", () => {
    const magi = {
      status2025: "single",
      line2: 80000,
      line4: 76000,
      status2024: "single",
    } as const;
    const vehicle = { ...USED, creditTransferredToDealer: 3600 };
    expect(scheduleA(vehicle, magi).outcome).toEqual({
      kind: "repay",
      schedule2Line: "1c",
      amount: 3600,
    });
  });
});

describe("Schedule A Part V: a qualified commercial clean vehicle", () => {
  it("30% with no gas or diesel engine, capped by the incremental cost and $7,500", () => {
    expect(commercialLines({ ...COMMERCIAL_INPUTS })).toEqual({
      kind: "commercial",
      line19: 48000,
      line20: undefined,
      line21: 48000,
      line22: 14400,
      line23: 7500,
      line24: 7500,
      line25: 7500,
      line26: 7500,
    });
  });

  it("15% with an engine, less the section 179 deduction", () => {
    const lines = commercialLines({
      ...COMMERCIAL_INPUTS,
      poweredByGasOrDiesel: true,
      basis: 40000,
      section179Deduction: 10000,
    });
    expect(lines).toMatchObject({ line20: 10000, line21: 30000, line22: 4500, line26: 4500 });
  });

  it("14,000 pounds or more: the $40,000 maximum", () => {
    const heavy = { ...COMMERCIAL_INPUTS, basis: 300000, incrementalCost: 120000 };
    expect(commercialLines({ ...heavy, grossVehicleWeightRating: 13999 })).toMatchObject({
      line25: 7500,
      line26: 7500,
    });
    expect(commercialLines({ ...heavy, grossVehicleWeightRating: 14000 })).toMatchObject({
      line25: 40000,
      line26: 40000,
    });
  });

  it("no Part I: the modified AGI test does not apply", () => {
    expect(scheduleA(COMMERCIAL, {})).toMatchObject({ reach: 0, outcome: { line26: 7500 } });
  });

  it("not depreciable: no credit", () => {
    expect(scheduleA({ ...COMMERCIAL, depreciable: false }, {}).outcome.kind).toBe("none");
  });
});

describe("Parts III and IV: the tax limit", () => {
  it("line 13 is the smaller of the credit and line 12", () => {
    expect(taxLimit(7500, 20000, 4000)).toEqual({
      tax: 20000,
      credits: 4000,
      room: 16000,
      credit: 7500,
    });
    expect(taxLimit(7500, 6000, 1000)).toMatchObject({ room: 5000, credit: 5000 });
  });

  it("line 12 zero or less: -0-, and line 13 stays blank", () => {
    expect(taxLimit(7500, 3000, 3000)).toEqual({ tax: 3000, credits: 3000, room: 0 });
    expect(taxLimit(7500, 3000, 4500)).toMatchObject({ room: 0, credit: undefined });
  });
});

describe("Parts II and V: the K-1 lines", () => {
  it("line 7 joins only a line 6 that is used", () => {
    expect(businessTotal(undefined, 1200)).toEqual({ fromK1: undefined, total: undefined });
    expect(businessTotal(2250, 1200)).toEqual({ fromK1: 1200, total: 3450 });
    expect(businessTotal(0, undefined)).toEqual({ fromK1: undefined, total: 0 });
  });
});
