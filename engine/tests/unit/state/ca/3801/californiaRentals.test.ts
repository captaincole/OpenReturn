/*
 * FTB 3801 Parts IV and V for one Schedule E property, in California amounts.
 * Sources: ca-3801-inst-2025::sec::step-1-figuring-your-california-passive-activity-income-loss::b01
 * (column (d) is Schedule E line 21; column (f) adds the California adjustment),
 * ::material-participation-in-real-property-business-irc-section-469-c-7::b01
 * (every rental is passive for California), irs-8582-inst-2025::sec::part-iv-2::b01
 * (a carryover from a year without active participation goes to Part V), and
 * irs-pub-925-2025::sec::a-b-c-total::b01 (Terry's ratable disallowance).
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../../src/facts/index.js";
import { allocateLosses } from "../../../../../src/federal/8582/allocation.js";
import type { RentalProperty } from "../../../../../src/federal/schedule-e/filingInfo.js";
import { californiaAfterLimits, partsOf } from "../../../../../src/state/ca/3801/afterLimits.js";
import {
  asksCarryover,
  californiaPassive,
  californiaProperty,
  FORMER_PASSIVE_GAP,
  UNMODELED_GAP,
  type CaScheduleEActivity,
  type PlacementAnswers,
} from "../../../../../src/state/ca/3801/californiaRentals.js";
import { form3801Lines } from "../../../../../src/state/ca/3801/lines.js";

const house = (overrides: Partial<RentalFactValue> = {}): RentalFactValue => ({
  propertyType: "single_family",
  address: { street: "1 Elm St", city: "Fresno", state: "CA", zip: "93701" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  expenses: { taxes: 2000, mortgageInterest: 6000, depreciationOrDepletion: 7000 },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  ...overrides,
});

const property = (value: RentalFactValue, passive: boolean | undefined = true): RentalProperty => ({
  factKey: "rental.property.elm",
  column: "a",
  value,
  passive,
});

const answers = (stated?: number): PlacementAnswers => ({
  filingStatus: "single",
  statedCarryover: () => stated,
  carryoverKey: () => "ca_passive.prior_year_unallowed_loss.elm",
});

function ready(outcome: ReturnType<typeof californiaProperty>): CaScheduleEActivity {
  if (outcome.kind !== "ready") throw new Error(`not ready: ${JSON.stringify(outcome)}`);
  return outcome.activity;
}

describe("californiaPassive", () => {
  it("a real estate professional's rental is passive for California", () => {
    expect(californiaPassive(house({ materiallyParticipated: true }))).toBe(true);
  });

  it("a stay of 7 days or less is passive only without material participation", () => {
    const shortStay = house({ propertyType: "vacation_short_term", averageCustomerUseDays: 4 });
    expect(californiaPassive({ ...shortStay, materiallyParticipated: true })).toBe(false);
    expect(californiaPassive({ ...shortStay, materiallyParticipated: false })).toBe(true);
    expect(californiaPassive(shortStay)).toBeUndefined();
  });

  it("a royalty follows its answer", () => {
    expect(californiaPassive({ propertyType: "royalties", royaltyActivity: "portfolio" })).toBe(
      false,
    );
    expect(californiaPassive({ propertyType: "royalties", royaltyActivity: "passive" })).toBe(true);
    expect(californiaPassive({ propertyType: "royalties" })).toBeUndefined();
  });
});

describe("californiaProperty", () => {
  it("column (f) is line 21 plus the FTB 3885A difference", () => {
    const value = house({
      expenses: { taxes: 2000, mortgageInterest: 6000 },
      depreciation: { priorYearMacrs: 7000, californiaPriorYearDepreciation: 5500 },
    });
    const activity = ready(californiaProperty(property(value), answers()));
    expect(activity.federalNet).toBe(-3000);
    expect(activity.californiaAdjustment).toBe(1500);
    expect(activity.californiaNet).toBe(-1500);
    expect(activity.rows).toEqual([
      expect.objectContaining({ part: "part4", netLoss: 1500, priorUnallowedLoss: 0 }),
    ]);
  });

  it("asks for the California carryover when the property has a federal one", () => {
    const value = house({ priorYearUnallowedLoss: 4000, activeParticipationWhenLossArose: true });
    expect(asksCarryover(property(value), true)).toBe(true);
    const waits = californiaProperty(property(value), answers());
    expect(waits).toEqual({
      kind: "waits",
      keys: ["ca_passive.prior_year_unallowed_loss.elm"],
    });
    const activity = ready(californiaProperty(property(value), answers(3200)));
    expect(activity.rows[0]).toMatchObject({ part: "part4", priorUnallowedLoss: 3200 });
  });

  it("asks for it when the property is not passive federally (a real estate professional's)", () => {
    expect(asksCarryover(property(house(), false), true)).toBe(true);
    expect(asksCarryover(property(house(), true), true)).toBe(false);
  });

  it("takes the federal carryover of 0 when none is asked", () => {
    const activity = ready(californiaProperty(property(house()), answers()));
    expect(activity.rows[0].priorUnallowedLoss).toBe(0);
  });

  it("a carryover from a year without active participation goes to Part V", () => {
    const value = house({ priorYearUnallowedLoss: 2000, activeParticipationWhenLossArose: false });
    const activity = ready(californiaProperty(property(value), answers(2500)));
    expect(activity.rows.map((entry) => [entry.part, entry.priorUnallowedLoss])).toEqual([
      ["part4", 0],
      ["part5", 2500],
    ]);
  });

  it("a rental without active participation goes to Part V", () => {
    const activity = ready(
      californiaProperty(property(house({ activeParticipation: false })), answers()),
    );
    expect(activity.rows[0].part).toBe("part5");
  });

  it("a self-rental with net income is nonpassive: no row", () => {
    const value = house({ propertyType: "self_rental", rentsReceived: 20000 });
    const outcome = californiaProperty(property(value), answers());
    const activity = ready(outcome);
    expect(activity.passive).toBe(false);
    expect(activity.rows).toEqual([]);
    expect(outcome.kind === "ready" && outcome.producesLoss).toBe(false);
  });

  it("a passive property with a California loss needs the form; one with only gains does not", () => {
    const loss = californiaProperty(property(house()), answers());
    expect(loss.kind === "ready" && loss.producesLoss).toBe(true);
    const gain = californiaProperty(property(house({ rentsReceived: 20000 })), answers());
    expect(gain.kind === "ready" && gain.producesLoss).toBe(false);
  });

  it("an entire disposition is a gap", () => {
    const outcome = californiaProperty(property(house({ disposedOfEntirely: true })), answers());
    expect(outcome).toMatchObject({ kind: "gap", reason: UNMODELED_GAP });
  });

  it("a nonpassive property with a California carryover (a former passive activity) is a gap", () => {
    const royalty: RentalFactValue = {
      propertyType: "royalties",
      royaltiesReceived: 3000,
      royaltyActivity: "portfolio",
      priorYearUnallowedLoss: 500,
    };
    const outcome = californiaProperty(property(royalty, false), answers());
    expect(outcome).toMatchObject({ kind: "gap", reason: FORMER_PASSIVE_GAP });
  });

  it("waits while active participation is unanswered", () => {
    const outcome = californiaProperty(
      property(house({ activeParticipation: undefined })),
      answers(),
    );
    expect(outcome).toMatchObject({ kind: "waits", keys: ["rental.property.elm"] });
  });
});

describe("Pub. 925, Terry, through Parts VII and VIII and the Schedule E worksheet", () => {
  const activity = (factKey: string, net: number): CaScheduleEActivity => ({
    factKey,
    column: "a",
    name: factKey,
    royalty: false,
    federalNet: net,
    californiaAdjustment: 0,
    californiaNet: net,
    passive: true,
    rows: [
      {
        factKey,
        part: "part5",
        name: factKey,
        netIncome: net > 0 ? net : 0,
        netLoss: net < 0 ? -net : 0,
        priorUnallowedLoss: 0,
      },
    ],
  });
  const activities = [activity("A", -9000), activity("B", -16000), activity("C", 4000)];
  const parts = partsOf(activities);
  const lines = form3801Lines(parts, { marriedFilingSeparately: false }, undefined);
  const allocation = allocateLosses(parts, lines.line3, lines.line9);

  it("disallows A $7,560 and B $13,440 (ratios 0.36 and 0.64)", () => {
    expect(allocation?.part7).toEqual([
      expect.objectContaining({ factKey: "A", loss: 9000, ratio: "0.36000", unallowed: 7560 }),
      expect.objectContaining({ factKey: "B", loss: 16000, ratio: "0.64000", unallowed: 13440 }),
    ]);
    expect(allocation?.part8.map((entry) => entry.allowed)).toEqual([1440, 2560]);
  });

  it("the allowed losses total line 11, and column (c) totals line 10 less line 11", () => {
    const allowed = (allocation?.part8 ?? []).reduce((total, entry) => total + entry.allowed, 0);
    expect(allowed).toBe(lines.line11);
    const afterLimits = activities.map((entry) => californiaAfterLimits(entry, allocation!));
    expect(afterLimits).toEqual([-1440, -2560, 4000]);
    expect(afterLimits.reduce((total, amount) => total + amount, 0)).toBe(
      (lines.line10 ?? 0) - (lines.line11 ?? 0),
    );
  });
});
