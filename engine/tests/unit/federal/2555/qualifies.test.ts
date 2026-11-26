/*
 * Who qualifies for Form 2555 (src/federal/2555/qualifies.ts, dates.ts): the
 * time rules the form and its instructions state.
 */

import { describe, expect, it } from "vitest";
import type {
  BonaFideResidence,
  ForeignEarnedIncomeFactValue,
  PhysicalPresence,
} from "../../../../src/facts/index.js";
import {
  coversWholeYear,
  fullDaysAbroad,
  isTwelveMonthPeriod,
  qualifyingDays,
} from "../../../../src/federal/2555/dates.js";
import { qualification } from "../../../../src/federal/2555/qualifies.js";

const partI = {
  foreignAddress: "x",
  occupation: "x",
  citizenship: "United States",
  taxHomes: [{ location: "x", established: "01/01/2024" }],
};

const residence: BonaFideResidence = {
  began: "01/01/2024",
  livingQuarters: [],
  nonresidentStatement: false,
  foreignIncomeTaxRequired: true,
  contractTerms: "x",
  visaType: "x",
  visaLimitedStay: false,
};

const presence = (stays?: PhysicalPresence["stays"]): PhysicalPresence => ({
  from: "03/01/2025",
  through: "02/28/2026",
  principalCountry: "Portugal",
  stays,
});

const withResidence = (change: Partial<BonaFideResidence> = {}): ForeignEarnedIncomeFactValue => ({
  ...partI,
  bonaFideResidence: { ...residence, ...change },
});

describe("the physical presence test (irs-2555-inst-2025::sec::line-16::b01)", () => {
  it("line 16 must be 12 months in a row with part of it in 2025", () => {
    expect(isTwelveMonthPeriod(presence())).toBe(true);
    expect(isTwelveMonthPeriod({ ...presence(), through: "03/01/2026" })).toBe(false);
    expect(isTwelveMonthPeriod({ ...presence(), from: "03/01/2023", through: "02/29/2024" })).toBe(
      false,
    );
    // A leap year: 366 days (02/29/2024 inside the period).
    expect(isTwelveMonthPeriod({ ...presence(), from: "06/01/2024", through: "05/31/2025" })).toBe(
      true,
    );
  });

  it("no stay listed: the whole period is abroad", () => {
    expect(fullDaysAbroad(presence())).toBe(365);
  });

  it("330 full days qualify, 329 do not (::part-iii-taxpayers-qualifying-under::b01)", () => {
    const stays = (abroad: number) => [
      { country: "Portugal", arrived: "02/28/2025", left: "12/31/2025", fullDays: abroad },
      { country: "United States", arrived: "12/31/2025", left: "02/28/2026", fullDays: 30 },
    ];
    expect(qualification({ ...partI, physicalPresence: presence(stays(330)) })).toEqual({
      qualifies: true,
      test: "physical_presence",
    });
    expect(qualification({ ...partI, physicalPresence: presence(stays(329)) })).toMatchObject({
      qualifies: false,
    });
  });

  it("lines 31 and 38 count the 12-month period's days in 2025", () => {
    expect(qualifyingDays({ ...partI, physicalPresence: presence() })).toBe(306);
  });
});

describe("the bona fide residence test (::part-ii-taxpayers-qualifying-under::b01)", () => {
  it("line 13a Yes with line 13b No does not qualify (the form, face-part-ii::b01)", () => {
    const value = withResidence({ nonresidentStatement: true, foreignIncomeTaxRequired: false });
    expect(qualification(value)).toMatchObject({ qualifies: false });
    expect(qualification(withResidence({ nonresidentStatement: true }))).toMatchObject({
      qualifies: true,
    });
  });

  it("a residence must include an entire tax year; one that continues is taken as stated", () => {
    expect(coversWholeYear("01/01/2025", "12/31/2025")).toBe(true);
    expect(coversWholeYear("01/02/2025", "12/31/2025")).toBe(false);
    expect(coversWholeYear("08/14/2025", "12/31/2026")).toBe(true);
    expect(coversWholeYear("08/14/2025", undefined)).toBe(true);
  });

  it("the qualifying period starts no earlier than the first tax home", () => {
    const value = {
      ...withResidence(),
      taxHomes: [{ location: "x", established: "07/01/2025" }],
    };
    expect(qualifyingDays(value)).toBe(184);
  });

  it("a period that ends before 2025 has no day in 2025", () => {
    const value = withResidence({ began: "01/01/2023", ended: "12/31/2024" });
    expect(qualification(value)).toMatchObject({ qualifies: false });
  });
});

describe("the answers", () => {
  it("both tests is a gap; neither waits (::line-9::b01)", () => {
    const both = { ...withResidence(), physicalPresence: presence() };
    expect(typeof qualification(both)).toBe("string");
    expect(qualification(partI)).toHaveProperty("waiting");
  });

  it("a date not in MM/DD/YYYY form waits", () => {
    expect(qualification(withResidence({ began: "2024-01-01" }))).toHaveProperty("waiting");
  });
});
