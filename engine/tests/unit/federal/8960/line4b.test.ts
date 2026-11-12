/*
 * Source: irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01, ::b02
 * (nonpassive rental income or loss that rises to a section 162 trade or business), and
 * irs-8960-inst-2025::sec::special-rules-for-certain-rental-income::b01, ::b02 (a
 * self-rental's recharacterized net income).
 */

import { describe, expect, it } from "vitest";
import type { FormAccessor } from "../../../../src/defineForm.js";
import { makeRentalFactKey, type RentalFactValue } from "../../../../src/facts/index.js";
import { nonpassiveRentalAdjustments } from "../../../../src/federal/8960/lines.js";
import type { Form8960 } from "../../../../src/federal/8960/types.js";
import type { RentalProperty } from "../../../../src/federal/schedule-e/filingInfo.js";
import { resolve8960Info } from "../../../../src/filingInfoResolvers.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const key = makeRentalFactKey("duplex");

const duplex: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "multi_family",
  address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 30000,
  allInvestmentAtRisk: true,
  materiallyParticipated: true,
  priorYearUnallowedLoss: 0,
  // The QBI answer alone does not decide line 4b.
  qualifiedBusiness: true,
};

const property = (passive: boolean, value: Partial<RentalFactValue> = {}): RentalProperty => ({
  factKey: key,
  column: "a",
  value: { ...duplex, ...value },
  passive,
});

// Line 22 holds the deductible loss as a positive amount.
const scheduleE = (line21: number, line22?: number) =>
  ({
    "schedule-e.0.line.21_income_or_loss_a": line21,
    "schedule-e.0.line.22_deductible_loss_a": line22,
  }) as unknown as FormAccessor<Form8960>;

describe("Form 8960 line 4b rental adjustments", () => {
  it("takes nonpassive section 162 income out as a negative", () => {
    const adjustments = nonpassiveRentalAdjustments(scheduleE(21000), [
      property(false, { tradeOrBusiness: true }),
    ]);
    expect(adjustments).toEqual([-21000]);
  });

  it("takes a nonpassive section 162 loss out as a positive", () => {
    const adjustments = nonpassiveRentalAdjustments(scheduleE(-4000, 4000), [
      property(false, { tradeOrBusiness: true }),
    ]);
    expect(adjustments).toEqual([4000]);
  });

  it("takes a nonpassive section 162 royalty's loss out from line 21 (a royalty has no line 22)", () => {
    const royalty = property(false, {
      propertyType: "royalties",
      royaltyActivity: "nonpassive",
      tradeOrBusiness: true,
    });
    expect(nonpassiveRentalAdjustments(scheduleE(-3000), [royalty])).toEqual([3000]);
  });

  it("leaves a nonpassive rental that is not a trade or business in net investment income", () => {
    const adjustments = nonpassiveRentalAdjustments(scheduleE(21000), [
      property(false, { tradeOrBusiness: false }),
    ]);
    expect(adjustments).toEqual([]);
  });

  it("waits while a nonpassive rental's trade-or-business answer is missing", () => {
    expect(nonpassiveRentalAdjustments(scheduleE(21000), [property(false)])).toBeUndefined();
  });

  it("leaves a passive rental in net investment income", () => {
    expect(nonpassiveRentalAdjustments(scheduleE(21000), [property(true)])).toEqual([]);
  });

  it("takes a self-rental's net income out with no trade-or-business answer", () => {
    const selfRental = property(true, { propertyType: "self_rental" });
    expect(nonpassiveRentalAdjustments(scheduleE(10000), [selfRental])).toEqual([-10000]);
  });

  it("leaves a self-rental's net loss in net investment income", () => {
    const selfRental = property(true, { propertyType: "self_rental" });
    expect(nonpassiveRentalAdjustments(scheduleE(-2000, 2000), [selfRental])).toEqual([]);
  });

  it("waits on a self-rental's income over a prior-year loss", () => {
    const selfRental = property(true, {
      propertyType: "self_rental",
      priorYearUnallowedLoss: 3000,
    });
    expect(nonpassiveRentalAdjustments(scheduleE(10000), [selfRental])).toBeUndefined();
  });

  it("leaves a self-rental's income under its prior-year loss in net investment income", () => {
    const selfRental = property(true, {
      propertyType: "self_rental",
      priorYearUnallowedLoss: 12000,
    });
    expect(nonpassiveRentalAdjustments(scheduleE(10000), [selfRental])).toEqual([]);
  });

  it("reads a nonpassive self-rental's trade-or-business answer, as any nonpassive rental", () => {
    const selfRental = property(false, { propertyType: "self_rental" });
    expect(nonpassiveRentalAdjustments(scheduleE(10000), [selfRental])).toBeUndefined();
    const business = property(false, { propertyType: "self_rental", tradeOrBusiness: false });
    expect(nonpassiveRentalAdjustments(scheduleE(10000), [business])).toEqual([]);
  });

  it("waits while a self-rental's line 21 is blank", () => {
    const selfRental = property(true, { propertyType: "self_rental" });
    const blank = {} as unknown as FormAccessor<Form8960>;
    expect(nonpassiveRentalAdjustments(blank, [selfRental])).toBeUndefined();
  });
});

describe("Form 8960 asks the trade-or-business answer", () => {
  const missing = (professional: boolean, value: Partial<RentalFactValue> = {}) =>
    resolve8960Info(
      makeResolverInputs({
        facts: [
          { key, category: "rental", value: { ...duplex, ...value } },
          { key: "rental.payments_require_1099", category: "rental", value: false },
          { key: "rental.real_estate_professional", category: "rental", value: professional },
        ],
        decisions: [
          { decisionKey: "decisions.scope.filing_status", decision: "single" },
          { decisionKey: "decisions.scope.must_file_8960", decision: true },
        ],
      }),
    ).missingInputs?.["form-8960"];

  it("asks for a nonpassive rental with no answer", () => {
    expect(missing(true)).toContain(key);
  });

  it("does not ask once the nonpassive rental has an answer", () => {
    expect(missing(true, { tradeOrBusiness: false })).not.toContain(key);
  });

  it("does not ask for a passive rental", () => {
    expect(missing(false)).not.toContain(key);
  });

  it("does not ask for a self-rental's net income", () => {
    expect(missing(false, { propertyType: "self_rental" })).not.toContain(key);
  });
});
