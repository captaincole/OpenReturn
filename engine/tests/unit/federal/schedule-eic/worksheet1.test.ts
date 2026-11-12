/*
 * Source: irs-1040-inst-2025, Step 2 question 4 (yes-see-form-4797::b01,
 * yes-use-worksheet-1::b01), and Pub. 596 Worksheet 1 (irs-pub-596-2025,
 * interest-and-dividends::b01 through passive-activities::b02).
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import type {
  PropertyColumn,
  RentalProperty,
} from "../../../../src/federal/schedule-e/filingInfo.js";
import {
  earnedIncomeCredit,
  type EicAnswers,
  type EicReturn,
} from "../../../../src/federal/schedule-eic/credit.js";
import {
  RECHARACTERIZED_INCOME_GAP,
  ROYALTIES_WITH_RENTS_GAP,
  worksheet1,
  type Worksheet1Info,
} from "../../../../src/federal/schedule-eic/worksheet1.js";

const property = (
  column: PropertyColumn,
  value: Partial<RentalFactValue>,
  passive: boolean | undefined,
): RentalProperty => ({
  factKey: `rental.property.${column}`,
  column,
  value: { propertyType: "single_family", ...value },
  passive,
});

const filesE = (value: boolean | undefined): Worksheet1Info["mustFile"] => ({
  "schedule-e": {
    decisionKey: "decisions.scope.must_file_schedule_e",
    value,
    derivation: undefined,
  },
});

/* Schedule E's lines by full field id, as Form 1040's accessor reads them. */
const lines = (values: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(values).map(([line, value]) => [`schedule-e.0.line.${line}`, value]),
  );

describe("worksheet1 (Pub. 596 Worksheet 1)", () => {
  it("is not needed when Schedule E does not file, and waits while its filing is open", () => {
    expect(worksheet1({}, { mustFile: filesE(false) }, 500)).toBeUndefined();
    expect(worksheet1({}, {}, 500)).toBeUndefined();
    expect(worksheet1({}, { mustFile: filesE(undefined) }, 500)).toEqual({ kind: "waiting" });
  });

  it("adds a passive rental's line 26 amount and the royalties less their expenses (lines 10 and 13)", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [
        property("a", { rentsReceived: 9_000 }, true),
        property("b", { propertyType: "royalties", royaltiesReceived: 2_000 }, false),
      ],
    };
    const form = lines({
      "21_income_or_loss_a": 4_000,
      "20_total_expenses_b": 500,
      "21_income_or_loss_b": 1_500,
      "23b_total_royalties": 2_000,
      "26_total_income_or_loss": 5_500,
    });
    // Step 2's sum 3,000 + line 10 (2,000 − 500) + line 13 (4,000).
    expect(worksheet1(form, info, 3_000)).toEqual({ kind: "line14", amount: 8_500 });
  });

  it("leaves out a rental that is not passive (NPA) and counts a net passive loss as 0", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [
        property("a", { rentsReceived: 20_000 }, false),
        property("b", { rentsReceived: 1_000 }, true),
      ],
    };
    const form = lines({
      "21_income_or_loss_a": 15_000,
      "21_income_or_loss_b": -6_000,
      "22_deductible_loss_b": 6_000,
      "26_total_income_or_loss": 9_000,
    });
    expect(worksheet1(form, info, 1_200)).toEqual({ kind: "line14", amount: 1_200 });
  });

  it("takes line 22 as Form 8582 allows it: a prior-year loss freed against income, a loss limited", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [
        property("a", { rentsReceived: 12_000, priorYearUnallowedLoss: 3_000 }, true),
        property("b", { rentsReceived: 1_000 }, true),
      ],
    };
    const form = lines({
      "21_income_or_loss_a": 9_000,
      "22_deductible_loss_a": 3_000,
      "21_income_or_loss_b": -10_000,
      "22_deductible_loss_b": 4_000,
      "26_total_income_or_loss": 2_000,
    });
    // Line 13: (9,000 − 3,000) + (−4,000), not 9,000 − 10,000 (line 21 alone).
    expect(worksheet1(form, info, 500)).toEqual({ kind: "line14", amount: 2_500 });
  });

  it.each([
    ["land", { propertyType: "land" }],
    [
      "a stay of 7 days or less",
      { propertyType: "vacation_short_term", averageCustomerUseDays: 5 },
    ],
    ["an entire disposition", { disposedOfEntirely: true }],
  ] as const)("is a gap for %s with passive net income, which may be nonpassive", (_, value) => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [property("a", { rentsReceived: 9_000, ...value }, true)],
    };
    const form = lines({ "21_income_or_loss_a": 4_000, "26_total_income_or_loss": 4_000 });
    expect(worksheet1(form, info, 0)).toEqual({
      kind: "unsupported",
      reason: RECHARACTERIZED_INCOME_GAP,
    });
    // A loss is not recharacterized; Form 8582 figures line 22 as for any rental.
    const loss = lines({
      "21_income_or_loss_a": -4_000,
      "22_deductible_loss_a": 4_000,
      "26_total_income_or_loss": -4_000,
    });
    expect(worksheet1(loss, info, 0)?.kind).not.toBe("unsupported");
  });

  it("leaves a self-rental's net income out of line 13 (NPA) and counts its net loss", () => {
    const selfRental = { propertyType: "self_rental", rentsReceived: 9_000 } as const;
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [
        property("a", selfRental, true),
        property("b", { rentsReceived: 6_000 }, true),
      ],
    };
    const form = lines({
      "21_income_or_loss_a": 4_000,
      "21_income_or_loss_b": 2_500,
      "26_total_income_or_loss": 6_500,
    });
    // Line 13: property B's 2,500 only; A's 4,000 is nonpassive.
    expect(worksheet1(form, info, 1_000)).toEqual({ kind: "line14", amount: 3_500 });
    const loss = lines({
      "21_income_or_loss_a": -3_000,
      "22_deductible_loss_a": 3_000,
      "21_income_or_loss_b": 2_500,
      "26_total_income_or_loss": -500,
    });
    // A net loss is passive: line 13 is 2,500 − 3,000, entered as 0.
    expect(worksheet1(loss, info, 1_000)).toEqual({ kind: "line14", amount: 1_000 });
  });

  it("waits on a self-rental's net income over a prior-year loss, as Schedule E line 22 does", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [
        property(
          "a",
          { propertyType: "self_rental", rentsReceived: 9_000, priorYearUnallowedLoss: 1_000 },
          true,
        ),
      ],
    };
    const form = lines({ "21_income_or_loss_a": 4_000, "26_total_income_or_loss": 4_000 });
    expect(worksheet1(form, info, 0)).toEqual({ kind: "waiting" });
  });

  it("waits until Schedule E line 26 is a number", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [property("a", { rentsReceived: 9_000 }, true)],
    };
    expect(worksheet1(lines({ "21_income_or_loss_a": 4_000 }), info, 0)).toEqual({
      kind: "waiting",
    });
  });

  it("is a gap for a property with both rents and royalties", () => {
    const info: Worksheet1Info = {
      mustFile: filesE(true),
      rentalProperties: [property("a", { rentsReceived: 9_000, royaltiesReceived: 300 }, true)],
    };
    expect(worksheet1(lines({ "26_total_income_or_loss": 4_000 }), info, 0)).toEqual({
      kind: "unsupported",
      reason: ROYALTIES_WITH_RENTS_GAP,
    });
  });
});

const ANSWERED: EicAnswers = {
  qualifyingChildren: 1,
  childrenWithSsn: 1,
  childrenOpen: false,
  nonresidentAlien: false,
  qualifyingChildOfAnother: false,
  deniedInEarlierYear: false,
  barredByIrs: false,
};

// HOH, one child: wages 20,000 and passive rental income 8,000 (AGI 28,000).
const RENTAL: EicReturn = {
  filingStatus: "head_of_household",
  agi: 28_000,
  investmentIncome: 0,
  worksheet1: { kind: "line14", amount: 8_000 },
  earnedIncome: 20_000,
  worksheetB: false,
  taxpayerSsn: "400-00-0001",
  taxpayerDob: "01/01/1985",
};

describe("earnedIncomeCredit, Step 2 question 4", () => {
  it("credits a Schedule E filer whose Worksheet 1 line 14 is $11,950 or less", () => {
    // Earned income 20,000: 4,328; AGI 28,000 (over 23,350): 3,581, the smaller.
    expect(earnedIncomeCredit(RENTAL, ANSWERED)).toEqual({ kind: "credit", amount: 3_581 });
  });

  it("stops over $11,950 on line 14 (line 15), whatever the answers", () => {
    const over = { ...RENTAL, worksheet1: { kind: "line14", amount: 11_951 } } as const;
    expect(earnedIncomeCredit(over, ANSWERED)).toEqual({ kind: "none", checkLine27c: false });
    expect(earnedIncomeCredit(over, { ...ANSWERED, nonresidentAlien: undefined })).toEqual({
      kind: "none",
      checkLine27c: false,
    });
  });

  it("waits with Worksheet 1, and makes its gap the outcome once the lines are known", () => {
    expect(earnedIncomeCredit({ ...RENTAL, worksheet1: { kind: "waiting" } }, ANSWERED)).toEqual({
      kind: "waiting",
    });
    const gap = { kind: "unsupported", reason: ROYALTIES_WITH_RENTS_GAP } as const;
    expect(earnedIncomeCredit({ ...RENTAL, worksheet1: gap }, ANSWERED)).toEqual(gap);
    // No answer settles the gap, so the Step 1 answer is not waited on.
    expect(
      earnedIncomeCredit(
        { ...RENTAL, worksheet1: gap },
        { ...ANSWERED, nonresidentAlien: undefined },
      ),
    ).toEqual(gap);
    expect(
      earnedIncomeCredit(
        { ...RENTAL, worksheet1: gap, agi: undefined },
        { ...ANSWERED, nonresidentAlien: undefined },
      ),
    ).toEqual({ kind: "waiting" });
  });
});
