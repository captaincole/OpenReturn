/*
 * Form 5695 Part II helpers: which section qualifies, item order, and the
 * "30%, but not more than $X" step (2025 Form 5695 and instructions).
 */

import { describe, expect, it } from "vitest";
import type { EnergyImprovementItem } from "../../../../src/facts/index.js";
import type { Form5695FilingInfo } from "../../../../src/federal/5695/filingInfo.js";
import {
  costOf,
  credit,
  itemsOf,
  sectionAApplies,
  sectionAQualifies,
  sectionBQualifies,
  total,
} from "../../../../src/federal/5695/partII.js";

const door = (cost: number): EnergyImprovementItem => ({ kind: "exterior_door", cost });
const ac = (cost: number): EnergyImprovementItem => ({ kind: "central_air_conditioner", cost });

/* Lines 17a–17c Yes, 17e No: every answer that lets the credit through. */
const YES = {
  homeEnergyMainHomeInUs: true,
  homeEnergyOriginalUser: true,
  homeEnergyLastsFiveYears: true,
  homeEnergyNewConstruction: false,
};
const BOTH = [door(800), ac(2100)];

describe("section qualification", () => {
  it.each([
    // label, info, A applies (17d–17e), A qualifies (18–20), B qualifies
    ["all answers allow it, both kinds", { ...YES, energyItems: BOTH }, true, true, true],
    [
      "17e Yes (new home construction): skip 18a–20d",
      { ...YES, homeEnergyNewConstruction: true, energyItems: BOTH },
      true,
      false,
      true,
    ],
    [
      "17e not answered",
      { ...YES, homeEnergyNewConstruction: undefined, energyItems: BOTH },
      true,
      false,
      true,
    ],
    [
      "17c No (lasts 5 years)",
      { ...YES, homeEnergyLastsFiveYears: false, energyItems: BOTH },
      false,
      false,
      true,
    ],
    [
      "17a/21a No (main home in US)",
      { ...YES, homeEnergyMainHomeInUs: false, energyItems: BOTH },
      false,
      false,
      false,
    ],
    [
      "17b/21b No (original user)",
      { ...YES, homeEnergyOriginalUser: false, energyItems: BOTH },
      false,
      false,
      false,
    ],
    ["answers not given", { energyItems: BOTH }, false, false, false],
    ["doors only", { ...YES, energyItems: [door(800)] }, true, true, false],
    ["no items", YES, false, false, false],
  ] as Array<[string, Form5695FilingInfo, boolean, boolean, boolean]>)(
    "%s",
    (_, info, aApplies, aQualifies, bQualifies) => {
      expect([sectionAApplies(info), sectionAQualifies(info), sectionBQualifies(info)]).toEqual([
        aApplies,
        aQualifies,
        bQualifies,
      ]);
    },
  );
});

describe("itemsOf / costOf", () => {
  it("lists the items of one kind, most expensive first", () => {
    const info = { energyItems: [door(685), ac(400), door(1020), door(920)] };
    expect(itemsOf(info, "exterior_door").map((i) => i.cost)).toEqual([1020, 920, 685]);
  });

  it("adds the cents, then rounds the total", () => {
    expect(costOf([door(100.3), door(100.3)])).toBe(201);
  });

  it("is blank, not 0, when there are no items", () => {
    expect(costOf([])).toBeUndefined();
  });
});

describe("credit", () => {
  it.each([
    // amount, cap, credit
    [1020, 250, 250], // one door: 306 → the $250 cap
    [1720, Infinity, 516], // other doors: no cap of their own
    [2000, 600, 600], // central air: 600 → the $600 cap
    [1001, 1200, 300], // 300.30 rounds down
    [1005, 1200, 302], // 301.50 rounds up
  ])("30%% of %d, at most %d, is %d", (amount, cap, expected) => {
    expect(credit(amount, cap)).toBe(expected);
  });

  it("stays blank when the line is blank", () => {
    expect(credit(undefined, 600)).toBeUndefined();
  });
});

describe("total", () => {
  it("is blank only when every value is blank", () => {
    expect(total(undefined, undefined)).toBeUndefined();
    expect(total(undefined, 0)).toBe(0);
    expect(total(250, undefined, 600)).toBe(850);
  });
});
