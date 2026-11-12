/*
 * Schedule C (Form 8995-A) files when a QBI trade or business has a loss. A passive
 * rental's loss files it too: column (a) is the loss Form 8582 allows, 0 when all
 * of it is suspended, and a row of 0 nets nothing.
 */
import { describe, expect, it } from "vitest";
import {
  makeBusinessFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  type RentalFactValue,
} from "../../../../src/facts/index.js";
import { resolve8995AScheduleCInfo } from "../../../../src/federal/8995-a-schedule-c/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const rentalKey = makeRentalFactKey("duplex");

const duplex = (repairs: number): RentalFactValue => ({
  owner: "taxpayer",
  propertyType: "multi_family",
  address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  expenses: { repairs },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: true,
});

// Wages above the threshold: Form 8995-A figures the deduction.
const inputs = (rental: RentalFactValue) =>
  makeResolverInputs({
    facts: [
      {
        key: makeW2FactKey("employer"),
        category: "wages",
        value: {
          employerName: "Employer",
          employerEin: "00-0000001",
          box1: 300000,
          box2: 0,
          box3: 176100,
        },
      },
      {
        key: makeBusinessFactKey("consulting"),
        category: "self_employment",
        value: {
          activity: "consulting",
          grossReceipts: 40000,
          sellsGoods: false,
          materiallyParticipated: true,
          specifiedService: false,
        },
      },
      { key: rentalKey, category: "rental", value: rental },
      { key: "rental.payments_require_1099", category: "rental", value: false },
      { key: "rental.real_estate_professional", category: "rental", value: false },
    ],
    decisions: [{ decisionKey: "decisions.scope.filing_status", decision: "single" }],
  });

const mustFile = (rental: RentalFactValue) =>
  resolve8995AScheduleCInfo(inputs(rental)).mustFile?.["form-8995-a-schedule-c"];

describe("Schedule C (Form 8995-A) with a passive QBI rental", () => {
  it("files when the rental has a net loss", () => {
    const resolution = mustFile(duplex(20000));
    expect(resolution?.value).toBe(true);
    expect(resolution?.derivation?.triggeredByFactKeys).toEqual([rentalKey]);
  });

  it("does not file when the rental has no loss", () => {
    expect(mustFile(duplex(2000))?.value).toBe(false);
  });
});
