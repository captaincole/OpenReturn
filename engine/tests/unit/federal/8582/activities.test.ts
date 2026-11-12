/*
 * Source: 2025 Instructions for Form 8582 (irs-8582-inst-2025). Expected parts are
 * worked by hand from:
 * - part-iv-2::b01: rental real estate with active participation goes in Part IV;
 *   a prior-year loss stays in Part IV column (c) only with active participation
 *   in the year it arose too, otherwise Part V column (c); MFS spouses who lived
 *   together at any time use Part V.
 * - part-v::b01: passive trade or business activities and rentals without the
 *   special allowance go in Part V.
 * - rental-activities::b01: an average customer use of 7 days or less is not a
 *   rental activity; reporting-income-and-losses-from-the::b01: as a trade or
 *   business it goes in Part V without material participation, and on no part with it.
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import {
  placementOf,
  type ActivitiesInfo,
  type Placement,
  type Undecided,
} from "../../../../src/federal/8582/activities.js";
import { isPassiveActivity } from "../../../../src/federal/rentals/passive.js";

const house: RentalFactValue = {
  propertyType: "single_family",
  address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  activeParticipation: true,
};

const single: ActivitiesInfo = { filingStatus: "single" };

const part4: Placement = { current: "part4", prior: "part4" };
const part5: Placement = { current: "part5", prior: "part5" };

type Expected = Placement | Undecided | null;

describe("Form 8582 Parts IV and V: a rental with a prior-year loss (placementOf)", () => {
  it.each([
    ["active participation when the loss arose: all in Part IV", true, part4],
    [
      "no active participation when the loss arose: prior-year loss in Part V",
      false,
      { current: "part4", prior: "part5" },
    ],
    ["unknown: undecided", undefined, "property"],
  ] as Array<[string, boolean | undefined, Expected]>)("%s", (_, whenLossArose, expected) => {
    const value = {
      ...house,
      priorYearUnallowedLoss: 3000,
      activeParticipationWhenLossArose: whenLossArose,
    };
    expect(placementOf({ value, passive: true }, single, -4000)).toEqual(expected);
  });

  it("needs no answer for the year the loss arose without a prior-year loss", () => {
    expect(placementOf({ value: house, passive: true }, single, -4000)).toEqual(part4);
  });

  it("puts a rental without active participation in Part V, prior-year loss too", () => {
    const value = { ...house, activeParticipation: false, priorYearUnallowedLoss: 3000 };
    expect(placementOf({ value, passive: true }, single, -4000)).toEqual(part5);
  });
});

describe("Form 8582 Parts IV and V: married filing separately (placementOf)", () => {
  it.each([
    ["lived apart all year: Part IV", true, part4],
    ["lived together at some time: Part V", false, part5],
    ["unknown: undecided", undefined, "lived_apart"],
  ] as Array<[string, boolean | undefined, Expected]>)("%s", (_, livedApart, expected) => {
    const info: ActivitiesInfo = {
      filingStatus: "married_filing_separately",
      livedApartFromSpouseAllYear: livedApart,
    };
    expect(placementOf({ value: house, passive: true }, info, -4000)).toEqual(expected);
  });
});

describe("Form 8582 Parts IV and V: a short stay (placementOf)", () => {
  const stay = (overrides: Partial<RentalFactValue>): RentalFactValue => ({
    ...house,
    propertyType: "vacation_short_term",
    ...overrides,
  });

  // The passive answer comes from isPassiveActivity, as the resolvers set it.
  const place = (value: RentalFactValue) =>
    placementOf({ value, passive: isPassiveActivity(value, false) }, single, -3000);

  it.each([
    [
      "5 days, no material participation: Part V",
      stay({ averageCustomerUseDays: 5, materiallyParticipated: false }),
      part5,
    ],
    [
      "5 days, material participation: not on the form",
      stay({ averageCustomerUseDays: 5, materiallyParticipated: true }),
      null,
    ],
    ["unknown average days: undecided", stay({ materiallyParticipated: false }), "passive"],
    ["8 days is a rental activity: Part IV", stay({ averageCustomerUseDays: 8 }), part4],
  ] as Array<[string, RentalFactValue, Expected]>)("%s", (_, value, expected) => {
    expect(place(value)).toEqual(expected);
  });
});
