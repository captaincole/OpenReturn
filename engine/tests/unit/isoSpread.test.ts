/*
 * The incentive stock option spread: from the Forms 3921, else the stated amount.
 * The $10,000 limit on a stated spread is a product rule (a large amount needs
 * its document); the spread on a form is box 4 less box 3, times box 5
 * (irs-6251-inst-2025::sec::line-2i-exercise-of-incentive-stock-options::b01).
 */

import { describe, expect, it } from "vitest";
import {
  AMT_KEYS,
  makeIsoExerciseFactKey,
  type IsoExerciseFactValue,
} from "../../src/facts/index.js";
import { resolveIsoSpread } from "../../src/isoSpread.js";
import { makeResolverInputs } from "../../src/resolverInputs.js";

const exercise = (date: string, shares: number): IsoExerciseFactValue => ({
  employerName: "Employers Name",
  box1: "03/15/2021",
  box2: date,
  box3: 20,
  box4: 75,
  box5: shares,
});
const form = (isoDate: string, value: IsoExerciseFactValue) => ({
  key: makeIsoExerciseFactKey("employers-name", isoDate),
  category: "other",
  value,
});
const stated = (value: number) => ({ key: AMT_KEYS.isoExerciseSpread, category: "other", value });
const held = (value: boolean) => ({
  key: AMT_KEYS.isoSharesHeldAtYearEnd,
  category: "other",
  value,
});
const resolve = (facts: Array<{ key: string; category: string; value: unknown }>) =>
  resolveIsoSpread(makeResolverInputs({ facts, decisions: [] }));

describe("resolveIsoSpread", () => {
  it("asks for the spread when nothing is on record", () => {
    expect(resolve([])).toEqual({
      spread: undefined,
      hasExercise: false,
      soldInYear: false,
      missing: [AMT_KEYS.isoExerciseSpread],
    });
  });

  it("takes a stated spread of $10,000 with no form", () => {
    const iso = resolve([stated(10_000)]);
    expect(iso.spread).toBe(10_000);
    expect(iso.missing).toEqual([]);
  });

  it("uses a stated spread above $10,000 and waits for the Form 3921", () => {
    const iso = resolve([stated(10_001)]);
    expect(iso.spread).toBe(10_001);
    expect(iso.missing).toEqual([AMT_KEYS.isoForm3921]);
  });

  it("asks whether the shares were held when a form is on file", () => {
    const iso = resolve([form("2025-06-16", exercise("06/16/2025", 5000))]);
    expect(iso.spread).toBeUndefined();
    expect(iso.hasExercise).toBe(true);
    expect(iso.missing).toEqual([AMT_KEYS.isoSharesHeldAtYearEnd]);
  });

  it("adds the spread of each form, and the forms replace a stated spread", () => {
    const iso = resolve([
      stated(300_000),
      form("2025-06-16", exercise("06/16/2025", 5000)),
      form("2025-09-02", exercise("09/02/2025", 100)),
      held(true),
    ]);
    expect(iso.spread).toBe(275_000 + 5_500);
    expect(iso.missing).toEqual([]);
  });

  it("does not handle shares sold in the year of exercise", () => {
    const iso = resolve([form("2025-06-16", exercise("06/16/2025", 5000)), held(false)]);
    expect(iso.spread).toBeUndefined();
    expect(iso.soldInYear).toBe(true);
    expect(iso.missing).toEqual([]);
  });
});
