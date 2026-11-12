import { describe, expect, it } from "vitest";
import { makeRentalFactKey, type RentalFactValue } from "../../../../src/facts/index.js";
import { resolveScheduleEInfo } from "../../../../src/federal/schedule-e/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const duplex: RentalFactValue = {
  owner: "joint",
  propertyType: "multi_family",
  address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  allInvestmentAtRisk: true,
};

const key = makeRentalFactKey("duplex");

const inputs = (status: string, value: RentalFactValue = duplex) =>
  makeResolverInputs({
    facts: [
      { key, category: "rental", value },
      { key: "rental.payments_require_1099", category: "rental", value: false },
      { key: "rental.real_estate_professional", category: "rental", value: false },
    ],
    decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
  });

describe("Schedule E with a spouse's or joint property", () => {
  it("files a separate return and waits on a joint property's share", () => {
    const info = resolveScheduleEInfo(inputs("married_filing_separately"));
    expect(info.mustFile?.["schedule-e"]?.value).toBe(true);
    expect(info.missingInputs?.["schedule-e"]).toContain(key);
    expect(info.rentalProperties).toBeUndefined();
  });

  it("waits on a spouse's own property on a separate return", () => {
    const info = resolveScheduleEInfo(
      inputs("married_filing_separately", { ...duplex, owner: "spouse" }),
    );
    expect(info.mustFile?.["schedule-e"]?.value).toBe(true);
    expect(info.missingInputs?.["schedule-e"]).toContain(key);
  });

  it("files the joint property on a joint return with nothing pending", () => {
    const info = resolveScheduleEInfo(inputs("married_filing_jointly"));
    expect(info.mustFile?.["schedule-e"]?.value).toBe(true);
    expect(info.missingInputs?.["schedule-e"]).toEqual([]);
    expect(info.rentalProperties?.map((property) => property.factKey)).toEqual([key]);
  });
});

describe("Schedule E with more than three properties", () => {
  const withProperties = (count: number) =>
    makeResolverInputs({
      facts: [
        ...Array.from({ length: count }, (_, index) => ({
          key: makeRentalFactKey(`unit${index + 1}`),
          category: "rental",
          value: duplex,
        })),
        { key: "rental.payments_require_1099", category: "rental", value: false },
        { key: "rental.real_estate_professional", category: "rental", value: false },
      ],
      decisions: [
        { decisionKey: "decisions.scope.filing_status", decision: "married_filing_jointly" },
      ],
    });

  it("waits on the fourth property, which needs another Schedule E", () => {
    const info = resolveScheduleEInfo(withProperties(4));
    expect(info.rentalPropertiesOverflow).toBe(true);
    expect(info.rentalProperties).toHaveLength(3);
    expect(info.missingInputs?.["schedule-e"]).toEqual([makeRentalFactKey("unit4")]);
  });

  it("has nothing pending with three properties", () => {
    const info = resolveScheduleEInfo(withProperties(3));
    expect(info.rentalPropertiesOverflow).toBe(false);
    expect(info.missingInputs?.["schedule-e"]).toEqual([]);
  });
});
