/*
 * Worksheets 1 to 4 (worksheets.ts) and Worksheets 5 to 9 (allocation.ts):
 * which worksheet a credit goes on, its columns (a) and (b), and how the
 * allowed credit is shared.
 */

import { describe, expect, it } from "vitest";
import type { PassiveCreditActivity } from "../../../../src/facts/index.js";
import type { Carryover, CurrentCredit } from "../../../../src/federal/3800/credits.js";
import { allocate } from "../../../../src/federal/8582-cr/allocation.js";
import { form8582CRLines, type ReturnAmounts } from "../../../../src/federal/8582-cr/lines.js";
import { passiveEntriesOf, worksheetOf } from "../../../../src/federal/8582-cr/worksheets.js";

const RENTAL_ACTIVE: PassiveCreditActivity = {
  name: "Duplex",
  rentalRealEstate: true,
  activelyParticipated: true,
};
const RENTAL_PASSIVE: PassiveCreditActivity = { ...RENTAL_ACTIVE, activelyParticipated: false };
const BUSINESS: PassiveCreditActivity = { name: "Bakery", rentalRealEstate: false };
const HOUSING: PassiveCreditActivity = {
  name: "Apartments",
  rentalRealEstate: true,
  before1990: false,
};

const credit = (
  line: string,
  amount: number,
  activity: PassiveCreditActivity,
  extra = {},
): CurrentCredit => ({
  line,
  key: `credit-${line}-${amount}`,
  amount,
  passive: true,
  activity,
  ...extra,
});
const carried = (
  line: string,
  amount: number,
  activity: PassiveCreditActivity,
  extra = {},
): Carryover => ({
  line,
  key: `carryover-${line}-${amount}`,
  originYear: 2023,
  amount,
  passive: true,
  activity,
  changed: false,
  ...extra,
});

describe("the worksheet of a credit (reporting-credits-from-the-activities::b02, ::b03)", () => {
  it("rental real estate with active participation: Worksheet 1; without: Worksheet 4", () => {
    expect(worksheetOf("1e", RENTAL_ACTIVE, false)).toBe(1);
    expect(worksheetOf("3", RENTAL_ACTIVE, false)).toBe(1);
    expect(worksheetOf("1e", RENTAL_PASSIVE, false)).toBe(4);
  });

  it("a rehabilitation credit from rental real estate: Worksheet 2, whatever the participation", () => {
    expect(worksheetOf("4k", RENTAL_PASSIVE, false)).toBe(2);
    expect(worksheetOf("4k", BUSINESS, false)).toBe(4);
  });

  it("a low-income housing credit: Worksheet 3 after 1989, Worksheet 2 before 1990", () => {
    expect(worksheetOf("4d", HOUSING, false)).toBe(3);
    expect(worksheetOf("2b", { ...HOUSING, before1990: true }, false)).toBe(2);
    expect(worksheetOf("4d", { ...HOUSING, before1990: undefined }, false)).toBeUndefined();
  });

  it("a trade or business: Worksheet 4", () => {
    expect(worksheetOf("4b", BUSINESS, false)).toBe(4);
  });

  it("a separate return living with the spouse: every credit on Worksheet 4", () => {
    expect(worksheetOf("1e", RENTAL_ACTIVE, true)).toBe(4);
    expect(worksheetOf("4k", RENTAL_PASSIVE, true)).toBe(4);
    expect(worksheetOf("4d", HOUSING, true)).toBe(4);
  });

  it("an unanswered active participation waits", () => {
    expect(
      worksheetOf("1e", { ...RENTAL_ACTIVE, activelyParticipated: undefined }, false),
    ).toBeUndefined();
  });
});

describe("columns (a) and (b)", () => {
  it("a current credit in (a), net of a transfer; a carryover in (b)", () => {
    const sold = credit("4k", 5_000, RENTAL_PASSIVE, {
      transfer: { direction: "sold", amount: 2_000, registrationNumber: "R" },
    });
    const { entries } = passiveEntriesOf([sold, carried("4d", 700, HOUSING)], false);
    expect(entries.map((entry) => [entry.worksheet, entry.current, entry.prior])).toEqual([
      [2, 3_000, 0],
      [3, 0, 700],
    ]);
  });

  it("a Part VI election lowers the prior year unallowed credit by the basis adjustment", () => {
    const election = { propertyDescription: "Warehouse roof", amount: 300 };
    const { entries } = passiveEntriesOf(
      [carried("4k", 1_000, RENTAL_PASSIVE, { basisIncreaseElection: election })],
      false,
    );
    expect(entries[0].prior).toBe(700);
  });

  it("a recaptured passive carryover is a gap; a publicly traded partnership's credit stays off the form", () => {
    const recaptured = passiveEntriesOf([carried("4b", 900, BUSINESS, { recaptured: 100 })], false);
    expect(recaptured.gap?.unsupported).toBe(true);
    const ptp = credit("4b", 900, { ...BUSINESS, publiclyTradedPartnership: true });
    const result = passiveEntriesOf([ptp], false);
    expect(result.entries).toHaveLength(0);
    expect(result.publiclyTraded).toEqual([ptp]);
  });

  it("a nonpassive credit, or a passive one with no amount, is not on the form", () => {
    const nonpassive: CurrentCredit = { line: "1e", key: "own", amount: 400, passive: false };
    const { entries } = passiveEntriesOf([nonpassive, credit("1e", 0, RENTAL_ACTIVE)], false);
    expect(entries).toHaveLength(0);
  });

  it("a passive credit with no activity stated waits", () => {
    const missing: CurrentCredit = { line: "1e", key: "x", amount: 400, passive: true };
    expect(passiveEntriesOf([missing], false).waiting).toBe(true);
  });
});

const flat: ReturnAmounts = {
  line6: 0,
  livedWithSpouse: false,
  mfsApart: false,
  magi: () => 120_000,
  form8582Line9: 6_000,
  taxAttributable: (amount) => amount * 0.22,
};

describe("Worksheets 5 to 9", () => {
  it("the allowed credits add to line 37, and each is within its credit", () => {
    const sources = [
      credit("1e", 2_500, RENTAL_ACTIVE),
      credit("3", 1_200, RENTAL_ACTIVE),
      carried("1e", 700, RENTAL_ACTIVE),
      credit("4k", 1_000, RENTAL_PASSIVE),
      credit("4d", 4_000, HOUSING),
      carried("4d", 1_000, HOUSING),
      credit("4b", 900, BUSINESS),
    ];
    const { entries } = passiveEntriesOf(sources, false);
    const lines = form8582CRLines(
      {
        line1a: 3_700,
        line1b: 700,
        line2a: 1_000,
        line3a: 4_000,
        line3b: 1_000,
        line4a: 900,
      },
      { ...flat, line6: 500 },
    );
    const { allowed, unallowed } = allocate(entries, lines);
    const total = [...allowed.values()].reduce((sum, each) => sum + each, 0);
    expect(total).toBe(lines.line37);
    for (const entry of entries) {
      const own = entry.current + entry.prior;
      expect(allowed.get(entry.source)! + unallowed.get(entry.source)!).toBe(own);
      expect(allowed.get(entry.source)!).toBeLessThanOrEqual(own);
    }
  });

  it("Worksheet 5: line 16 is shared by the ratios of column (a); column (d) goes to Worksheet 8", () => {
    const access = credit("1e", 3_000, RENTAL_ACTIVE);
    const zone = credit("3", 1_000, RENTAL_ACTIVE);
    const { entries } = passiveEntriesOf([access, zone], false);
    const lines = form8582CRLines({ line1a: 4_000 }, flat);
    // Line 12 is 15,000, line 14 9,000, line 15 1,980: line 16 is 1,980.
    expect(lines.line16).toBe(1_980);
    const { allowed } = allocate(entries, lines);
    expect(allowed.get(access)).toBe(1_485);
    expect(allowed.get(zone)).toBe(495);
  });

  it("Worksheet 8: with line 6 the unallowed credit is shared over Worksheet 4 and column (d)", () => {
    const business = credit("4b", 3_000, BUSINESS);
    const housing = credit("4d", 9_000, HOUSING);
    const { entries } = passiveEntriesOf([housing, business], false);
    const lines = form8582CRLines(
      { line3a: 9_000, line4a: 3_000 },
      { ...flat, line6: 1_000, magi: () => 400_000, form8582Line9: undefined },
    );
    // Line 35 is the tax on $25,000: 5,500; line 37 is 1,000 + 5,500.
    expect(lines.line37).toBe(6_500);
    const { allowed } = allocate(entries, lines);
    // Worksheet 8 column (a): 3,500 (Worksheet 7 column (d)) and 3,000; line C is 5,500.
    expect(allowed.get(housing)).toBe(9_000 - 2_962);
    expect(allowed.get(business)).toBe(3_000 - 2_538);
  });

  it("one credit: the allowed credit is line 37 (line-37::b01)", () => {
    const only = credit("4d", 12_000, HOUSING);
    const { entries } = passiveEntriesOf([only], false);
    const lines = form8582CRLines({ line3a: 12_000 }, { ...flat, taxAttributable: () => 8_250 });
    expect(allocate(entries, lines).allowed.get(only)).toBe(8_250);
  });
});
