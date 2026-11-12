import { describe, expect, it } from "vitest";
import {
  isRentalFactKey,
  makeRentalFactKey,
  readRentalFacts,
  rentalsOnReturn,
  type RentalFactValue,
} from "../../src/facts/index.js";

const duplex: RentalFactValue = {
  owner: "joint",
  propertyType: "multi_family",
  address: { street: "1 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  expenses: { advertising: 300, other: 50, otherDescription: "Pest control" },
};

const royalty: RentalFactValue = {
  owner: "spouse",
  propertyType: "royalties",
  royaltiesReceived: 2000,
  royaltyActivity: "portfolio",
};

const row = (key: string, value: unknown, category = "rental") => ({ key, value, category });

describe("rental fact keys", () => {
  it("holds the property id the tool chose", () => {
    expect(makeRentalFactKey("1-elm-st")).toBe("rental.property.1-elm-st");
    expect(isRentalFactKey("rental.property.1-elm-st")).toBe(true);
    expect(isRentalFactKey("rental.real_estate_professional")).toBe(false);
  });
});

describe("readRentalFacts", () => {
  it("lists a property with a negative amount or bad days as malformed", () => {
    const { properties, malformedKeys } = readRentalFacts([
      row(makeRentalFactKey("duplex"), duplex),
      row(makeRentalFactKey("bad-rent"), { ...duplex, rentsReceived: -1 }),
      row(makeRentalFactKey("bad-days"), { ...duplex, fairRentalDays: 10.5 }),
      row(makeRentalFactKey("other-category"), duplex, "other"),
    ]);
    expect(properties.map((property) => property.key)).toEqual(["rental.property.duplex"]);
    expect(malformedKeys).toEqual(["rental.property.bad-rent", "rental.property.bad-days"]);
  });
});

describe("rentalsOnReturn", () => {
  const facts = [
    row(makeRentalFactKey("duplex"), duplex),
    row(makeRentalFactKey("royalty"), royalty),
  ];

  it("takes every property on a joint return", () => {
    expect(rentalsOnReturn(facts, true).properties).toHaveLength(2);
  });

  it("leaves the spouse's and the joint properties off a separate return", () => {
    const { properties, spouseKeys } = rentalsOnReturn(facts, false);
    expect(properties).toEqual([]);
    expect(spouseKeys).toEqual(["rental.property.duplex", "rental.property.royalty"]);
  });
});
