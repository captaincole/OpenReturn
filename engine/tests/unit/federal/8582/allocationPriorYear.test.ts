/*
 * Source: 2025 Instructions for Form 8582 (irs-8582-inst-2025). A rental whose
 * prior-year loss arose in a year without active participation, from Schedule E's
 * properties through Parts IV–VIII. Expected values are worked by hand; see
 * allocation.test.ts for the rules of Parts VI–VIII.
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import { passiveActivities, type ActivitiesInfo } from "../../../../src/federal/8582/activities.js";
import { allocateLosses } from "../../../../src/federal/8582/allocation.js";
import type { PropertyColumn } from "../../../../src/federal/schedule-e/filingInfo.js";

/*
 * part-iv-2::b01: column (c) stays in Part IV only with active participation in the
 * year the loss arose too; otherwise it goes in Part V column (c). Part VIII adds
 * the activity's columns (b) and (c) from both parts (part-viii-allowed-losses::b01).
 */
describe("Form 8582 with a prior-year loss from a year without active participation", () => {
  const rental = (overrides: Partial<RentalFactValue>): RentalFactValue => ({
    propertyType: "single_family",
    address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
    activeParticipation: true,
    ...overrides,
  });

  const info = (whenLossArose: boolean): ActivitiesInfo => ({
    filingStatus: "single",
    rentalProperties: [
      {
        factKey: "A",
        column: "a",
        passive: true,
        value: rental({
          priorYearUnallowedLoss: 3000,
          activeParticipationWhenLossArose: whenLossArose,
        }),
      },
      {
        factKey: "B",
        column: "b",
        passive: true,
        value: rental({
          address: { street: "2 Oak St", city: "Tampa", state: "FL", zip: "33601" },
        }),
      },
    ],
  });

  // Schedule E line 21: A −4,000, B −6,000.
  const line21 = (column: PropertyColumn) => ({ a: -4000, b: -6000, c: undefined })[column];
  const nameA = "1 Elm St, Tampa, FL 33601";
  const nameB = "2 Oak St, Tampa, FL 33601";

  it("splits A: current loss in Part IV, prior-year loss in Part V", () => {
    /*
     * Part IV: A 4,000, B 6,000; line 1d −10,000. Part V: A prior 3,000. Line 3 −13,000.
     * MAGI $130,000: line 8 10,000; line 4 10,000; line 9 10,000.
     * Part VI: 0.40000 and 0.60000 of 10,000 = 4,000 and 6,000: column (c) equals (a), no (d).
     * Part VII: A's Part V 3,000 alone, 1.00000; line C 3,000.
     * Part VIII: A 4,000 + 3,000 = 7,000, unallowed 3,000, allowed 4,000. B is allowed in full.
     */
    const activities = passiveActivities(info(false), line21);
    expect(activities).toEqual({
      part4: [
        {
          factKey: "A",
          column: "a",
          part: "part4",
          name: nameA,
          netIncome: 0,
          netLoss: 4000,
          priorUnallowedLoss: 0,
        },
        {
          factKey: "B",
          column: "b",
          part: "part4",
          name: nameB,
          netIncome: 0,
          netLoss: 6000,
          priorUnallowedLoss: 0,
        },
      ],
      part5: [
        {
          factKey: "A",
          column: "a",
          part: "part5",
          name: nameA,
          netIncome: 0,
          netLoss: 0,
          priorUnallowedLoss: 3000,
        },
      ],
    });
    expect(allocateLosses(activities, -13000, 10000)).toEqual({
      part6: [
        { factKey: "A", column: "a", name: nameA, loss: 4000, ratio: "0.40000", allowance: 4000 },
        { factKey: "B", column: "b", name: nameB, loss: 6000, ratio: "0.60000", allowance: 6000 },
      ],
      part7: [
        { factKey: "A", column: "a", name: nameA, loss: 3000, ratio: "1.00000", unallowed: 3000 },
      ],
      part8: [
        { factKey: "A", column: "a", name: nameA, loss: 7000, unallowed: 3000, allowed: 4000 },
      ],
    });
  });

  it("keeps A whole in Part IV with active participation in both years", () => {
    /*
     * Part IV: A 4,000 + prior 3,000 = 7,000, B 6,000; line 1d and line 3 −13,000.
     * MAGI $130,000: line 8 10,000; line 4 13,000; line 9 10,000.
     * Part VI: 7/13 → 0.53846, 6/13 → 0.46154; 5,384.62 → 5,385 and 4,615.38 → 4,615.
     * Column (d): 1,615 and 1,385. Part VII of 3,000: 0.53833 and 0.46167; line C 3,000.
     */
    const activities = passiveActivities(info(true), line21);
    expect(activities?.part5).toEqual([]);
    expect(allocateLosses(activities, -13000, 10000)).toEqual({
      part6: [
        {
          factKey: "A",
          column: "a",
          name: nameA,
          loss: 7000,
          ratio: "0.53846",
          allowance: 5385,
          remaining: 1615,
        },
        {
          factKey: "B",
          column: "b",
          name: nameB,
          loss: 6000,
          ratio: "0.46154",
          allowance: 4615,
          remaining: 1385,
        },
      ],
      part7: [
        { factKey: "A", column: "a", name: nameA, loss: 1615, ratio: "0.53833", unallowed: 1615 },
        { factKey: "B", column: "b", name: nameB, loss: 1385, ratio: "0.46167", unallowed: 1385 },
      ],
      part8: [
        { factKey: "A", column: "a", name: nameA, loss: 7000, unallowed: 1615, allowed: 5385 },
        { factKey: "B", column: "b", name: nameB, loss: 6000, unallowed: 1385, allowed: 4615 },
      ],
    });
  });
});
