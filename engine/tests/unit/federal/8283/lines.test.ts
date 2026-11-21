/*
 * Source: 2025 Form 8283 (Rev. December 2025) Section A, irs-8283-inst-2025
 * (who-must-file, which-sections-to-complete, similar-items-of-property,
 * fair-market-value-fmv, qualified-vehicle-donations, line-1) and
 * irs-pub-526-2025 (ordinary-income-property, cars-boats-and-airplanes).
 */

import { describe, expect, it } from "vitest";
import {
  makeNoncashGiftFactKey,
  type NoncashGiftFact,
  type NoncashGiftFactValue,
} from "../../../../src/facts/index.js";
import {
  costBasisColumn,
  dateAcquiredColumn,
  form8283Plan,
  giftDeduction,
  heldMoreThanOneYear,
  missingColumns,
  noncashGiftsTotal,
  vehicleIdentificationNumber,
  type Form8283Row,
} from "../../../../src/federal/8283/lines.js";

const donee = { name: "Goodwill", street: "1 Main St", city: "Town", state: "TN", zip: "37922" };

const gift = (overrides: Partial<NoncashGiftFactValue> = {}): NoncashGiftFactValue => ({
  donee,
  propertyType: "other",
  description: "Household goods, good condition",
  contributionDate: "06/15/2025",
  dateAcquired: "03/01/2020",
  howAcquired: "Purchase",
  costBasis: 900,
  fairMarketValue: 400,
  valuationMethod: "Thrift shop value",
  ...overrides,
});

const facts = (...gifts: NoncashGiftFactValue[]): NoncashGiftFact[] =>
  gifts.map((value, index) => ({
    giftSlug: `gift-${index + 1}`,
    gift: value,
    factKey: makeNoncashGiftFactKey(`gift-${index + 1}`),
  }));

const onlyRow = (value: NoncashGiftFactValue): Form8283Row => {
  const { rows } = form8283Plan(facts(value));
  expect(rows).toHaveLength(1);
  return rows[0];
};

const car = (vehicle: NoncashGiftFactValue["vehicle"], fairMarketValue: number) =>
  gift({
    propertyType: "vehicle",
    description: "2015 sedan, fair condition, 90,000 miles",
    dateAcquired: "05/01/2020",
    costBasis: 35000,
    fairMarketValue,
    valuationMethod: "Used vehicle pricing guide",
    vehicle,
  });

describe("column (h): the deduction", () => {
  it("Schedule A line-12::b03: a worn household item of $500 or less has no deduction", () => {
    const sofa = gift({ propertyType: "clothing_household", goodUsedCondition: false });
    expect(giftDeduction(sofa)).toBe(0);
    expect(giftDeduction({ ...sofa, goodUsedCondition: true })).toBe(400);
  });

  it("Pub. 526 patents-and-other-intellectual-property::b01: the smaller of basis and FMV", () => {
    const patent = gift({ propertyType: "intellectual_property", fairMarketValue: 1000 });
    expect(giftDeduction({ ...patent, costBasis: 200 })).toBe(200);
    expect(giftDeduction({ ...patent, costBasis: 1500 })).toBe(1000);
    expect(giftDeduction({ ...patent, costBasis: undefined })).toBe(1000);
  });

  it("Pub. 526 ordinary-income-property::b01–b02: stock held 5 months, FMV $1,000, basis $800 → $800", () => {
    const stock = gift({
      propertyType: "publicly_traded_security",
      description: "10 shares XYZ Corp common, NYSE",
      dateAcquired: "01/15/2025",
      contributionDate: "06/15/2025",
      costBasis: 800,
      fairMarketValue: 1000,
      valuationMethod: "Mean of high and low",
    });
    expect(giftDeduction(stock)).toBe(800);
    const row = onlyRow(stock);
    // line-1::b04: a security held 12 months or less prints no date acquired, but its basis.
    expect(dateAcquiredColumn(row)).toBeUndefined();
    expect(costBasisColumn(row)).toBe(800);
    expect(missingColumns(row)).toEqual([]);
  });

  it("ordinary income property worth less than its basis deducts the FMV", () => {
    const stock = gift({
      propertyType: "publicly_traded_security",
      dateAcquired: "01/15/2025",
      costBasis: 1200,
      fairMarketValue: 1000,
    });
    expect(giftDeduction(stock)).toBe(1000);
  });

  it("ordinary income property with no basis waits", () => {
    const row = onlyRow(
      gift({ dateAcquired: "01/15/2025", costBasis: undefined, fairMarketValue: 700 }),
    );
    expect(row.deduction).toBeUndefined();
    expect(missingColumns(row)).toEqual(["g", "h"]);
  });

  it("Pub. 526 cars-boats-and-airplanes::b05: FMV $6,000, sold for $2,900, no exception → $2,900", () => {
    const value = car(
      { acknowledgmentAttached: true, grossProceeds: 2900, fmvException: false },
      6000,
    );
    expect(giftDeduction(value)).toBe(2900);
  });

  it("qualified-vehicle-donations::b05–b06: Ash's car, FMV $20,000, Form 1098-C $15,000 → $15,000 in Section A", () => {
    const value = car(
      { acknowledgmentAttached: true, grossProceeds: 15000, fmvException: false },
      20000,
    );
    const plan = form8283Plan(facts(value));
    expect(plan.sectionBFactKeys).toEqual([]);
    expect(plan.rows[0].deduction).toBe(15000);
  });

  it("Pub. 526 cars-boats-and-airplanes::b05: a sale of $500 or less deducts the smaller of $500 and the FMV", () => {
    const value = car(
      { acknowledgmentAttached: true, grossProceeds: 300, fmvException: false },
      2000,
    );
    expect(giftDeduction(value)).toBe(500);
  });

  it("an exception on Form 1098-C deducts the FMV; over $5,000 that is Section B", () => {
    const value = car({ acknowledgmentAttached: true, fmvException: true }, 8000);
    expect(giftDeduction(value)).toBe(8000);
    expect(form8283Plan(facts(value)).sectionBFactKeys).toEqual([makeNoncashGiftFactKey("gift-1")]);
  });

  it("a vehicle over $500 with no gross proceeds waits", () => {
    const value = car({ acknowledgmentAttached: true, fmvException: false }, 3000);
    expect(giftDeduction(value)).toBeUndefined();
  });
});

describe("column (b): the vehicle", () => {
  it("line-1::b01: a VIN of 13 characters gets four zeros on the left", () => {
    const value = car(
      {
        vin: "555555X555555",
        acknowledgmentAttached: false,
        grossProceeds: 400,
        fmvException: false,
      },
      450,
    );
    expect(vehicleIdentificationNumber(onlyRow(value))).toBe("0000555555X555555");
  });

  it("no VIN when Form 1098-C is attached", () => {
    const value = car(
      {
        vin: "1HGCM82633A004352",
        acknowledgmentAttached: true,
        grossProceeds: 2900,
        fmvException: false,
      },
      6000,
    );
    const row = onlyRow(value);
    expect(vehicleIdentificationNumber(row)).toBeUndefined();
    expect(missingColumns(row)).toEqual([]);
  });

  it("a vehicle with no acknowledgment and no VIN is missing column (b)", () => {
    const value = car({ acknowledgmentAttached: false, fmvException: false }, 450);
    expect(missingColumns(onlyRow(value))).toEqual(["b"]);
  });
});

describe("the sections", () => {
  it("$5,000 for one item is Section A; $5,001 is Section B (which-sections-to-complete::b04–b05)", () => {
    expect(form8283Plan(facts(gift({ fairMarketValue: 5000 }))).rows).toHaveLength(1);
    const over = form8283Plan(facts(gift({ fairMarketValue: 5001 })));
    expect(over.rows).toEqual([]);
    expect(over.sectionBFactKeys).toHaveLength(1);
  });

  it("publicly traded stock of $50,000 is Section A (::b04, 2.a)", () => {
    const stock = gift({ propertyType: "publicly_traded_security", fairMarketValue: 50000 });
    expect(form8283Plan(facts(stock)).rows).toHaveLength(1);
  });

  it.each(["other_security", "digital_asset", "art", "real_estate"] as const)(
    "%s of $5,001 is Section B",
    (propertyType) => {
      const plan = form8283Plan(facts(gift({ propertyType, fairMarketValue: 5001 })));
      expect(plan.sectionBFactKeys).toHaveLength(1);
    },
  );

  it.each(["intellectual_property", "inventory"] as const)(
    "%s over $5,000 is Section A (::b05)",
    (propertyType) => {
      const plan = form8283Plan(
        facts(gift({ propertyType, fairMarketValue: 9000, costBasis: 9000 })),
      );
      expect(plan.rows).toHaveLength(1);
    },
  );

  it("a partial interest in a security over $5,000 is Section B (::b06)", () => {
    const stock = gift({
      propertyType: "publicly_traded_security",
      fairMarketValue: 6000,
      partialInterestOrRestrictedUse: true,
    });
    expect(form8283Plan(facts(stock)).sectionBFactKeys).toHaveLength(1);
  });

  it("which-sections-to-complete::b02: books of $2,000, $2,500 and $900 to three colleges are Section B", () => {
    const books = [2000, 2500, 900].map((fairMarketValue) =>
      gift({ description: "Books", fairMarketValue, similarItemsGroup: "books" }),
    );
    const plan = form8283Plan(facts(...books));
    expect(plan.rows).toEqual([]);
    expect(plan.sectionBFactKeys).toHaveLength(3);
  });

  it("similar-items-of-property::b01: six rare books of $1,000 each are Section B", () => {
    const books = Array.from({ length: 6 }, () =>
      gift({ description: "Rare book", fairMarketValue: 1000, similarItemsGroup: "rare books" }),
    );
    expect(form8283Plan(facts(...books)).sectionBFactKeys).toHaveLength(6);
  });

  it("which-sections-to-complete::b05: one household item below good used condition over $500 is Section B", () => {
    const item = (fairMarketValue: number) =>
      gift({ propertyType: "clothing_household", goodUsedCondition: false, fairMarketValue });
    expect(form8283Plan(facts(item(501))).sectionBFactKeys).toHaveLength(1);
    expect(form8283Plan(facts(item(500))).rows).toHaveLength(1);
  });
});

describe("rows and copies", () => {
  it("five gifts make two forms: four rows, then one", () => {
    const plan = form8283Plan(
      facts(...[100, 200, 300, 400, 500].map((amount) => gift({ fairMarketValue: amount }))),
    );
    expect(plan.copies.map((copy) => copy.length)).toEqual([4, 1]);
    expect(plan.copies[1][0].factKey).toBe(makeNoncashGiftFactKey("gift-5"));
  });

  it("a Section B gift takes no row; with no Section A gift there is one empty form", () => {
    const plan = form8283Plan(facts(gift({ fairMarketValue: 7000 })));
    expect(plan.copies).toEqual([[]]);
  });

  it("the rows keep the order the gifts were recorded, around a Section B gift", () => {
    const plan = form8283Plan(
      facts(
        gift({ fairMarketValue: 100 }),
        gift({ fairMarketValue: 7000 }),
        gift({ fairMarketValue: 200 }),
      ),
    );
    expect(plan.rows.map((row) => row.factKey)).toEqual([
      makeNoncashGiftFactKey("gift-1"),
      makeNoncashGiftFactKey("gift-3"),
    ]);
  });
});

describe("the columns a row may leave blank (the form's note; line-1::b03–b04)", () => {
  const bare = { dateAcquired: undefined, howAcquired: undefined, costBasis: undefined };

  it("a gift of $500 or less needs no (e), (f) or (g)", () => {
    expect(missingColumns(onlyRow(gift({ ...bare, fairMarketValue: 500 })))).toEqual([]);
  });

  it("a gift of $501 needs them", () => {
    expect(missingColumns(onlyRow(gift({ ...bare, fairMarketValue: 501 })))).toEqual([
      "e",
      "f",
      "g",
    ]);
  });

  it("three similar gifts of $200 make a group of $600, which needs them", () => {
    const clothes = [1, 2, 3].map(() =>
      gift({
        ...bare,
        propertyType: "clothing_household",
        fairMarketValue: 200,
        similarItemsGroup: "clothing",
      }),
    );
    const plan = form8283Plan(facts(...clothes));
    expect(plan.rows.map(missingColumns)).toEqual([
      ["e", "f", "g"],
      ["e", "f", "g"],
      ["e", "f", "g"],
    ]);
  });

  it("a publicly traded security held more than 12 months prints (e) and leaves (g) blank", () => {
    const row = onlyRow(
      gift({
        propertyType: "publicly_traded_security",
        fairMarketValue: 1000,
        dateAcquired: "12/14/2021",
      }),
    );
    expect(dateAcquiredColumn(row)).toBe("12/2021");
    expect(costBasisColumn(row)).toBeUndefined();
    expect(missingColumns(row)).toEqual([]);
  });

  it("other property prints its basis and the month and year acquired", () => {
    const row = onlyRow(
      gift({ fairMarketValue: 700, costBasis: 1234.5, dateAcquired: "03/01/2020" }),
    );
    expect(dateAcquiredColumn(row)).toBe("03/2020");
    expect(costBasisColumn(row)).toBe(1235);
  });

  it('"Various" prints as recorded and counts as held more than 12 months', () => {
    const row = onlyRow(
      gift({ propertyType: "publicly_traded_security", dateAcquired: "Various" }),
    );
    expect(dateAcquiredColumn(row)).toBe("Various");
    expect(row.heldMoreThanOneYear).toBe(true);
  });
});

describe("held more than 1 year", () => {
  it("is false on the anniversary and true the day after", () => {
    const on = gift({ dateAcquired: "06/15/2024", contributionDate: "06/15/2025" });
    const after = gift({ dateAcquired: "06/14/2024", contributionDate: "06/15/2025" });
    expect(heldMoreThanOneYear(on)).toBe(false);
    expect(heldMoreThanOneYear(after)).toBe(true);
  });

  it("is unknown with no date", () => {
    expect(heldMoreThanOneYear(gift({ dateAcquired: undefined }))).toBeUndefined();
  });
});

describe("Schedule A line 12 from the gifts", () => {
  it("adds every gift's deduction, Section B too, and rounds the total once", () => {
    const total = noncashGiftsTotal(
      facts(
        gift({ fairMarketValue: 100.4 }),
        gift({ fairMarketValue: 7000 }),
        gift({ fairMarketValue: 0.4 }),
      ),
    );
    expect(total).toBe(7101);
  });

  it("is undefined with no gift facts, and while a deduction waits", () => {
    expect(noncashGiftsTotal([])).toBeUndefined();
    const waiting = car({ acknowledgmentAttached: true, fmvException: false }, 3000);
    expect(noncashGiftsTotal(facts(waiting))).toBeUndefined();
  });
});
