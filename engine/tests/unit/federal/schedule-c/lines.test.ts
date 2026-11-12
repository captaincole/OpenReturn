/*
 * Schedule C line 9 (car and truck), line 30 (the simplified home office) and
 * line 31, from the business fact. Source: 2025 Schedule C instructions,
 * line 9, line 30 and the Simplified Method Worksheet.
 */

import { describe, expect, it } from "vitest";
import type {
  BusinessFactValue,
  BusinessVehicle,
  HomeOfficeSimplified,
} from "../../../../src/facts/index.js";
import {
  carAndTruckExpenses,
  homeOfficeExpenses,
  homeOfficeGap,
  netProfit,
} from "../../../../src/federal/schedule-c/lines.js";

/* A service business with line G "Yes": line 29 is $10,000 less its expenses. */
const business = (change: Partial<BusinessFactValue> = {}): BusinessFactValue => ({
  activity: "consulting",
  grossReceipts: 10000,
  sellsGoods: false,
  materiallyParticipated: true,
  ...change,
});

const vehicle = (change: Partial<BusinessVehicle> = {}): BusinessVehicle => ({
  businessMiles: 1000,
  standardMileageRate: true,
  ...change,
});

const office = (change: Partial<HomeOfficeSimplified> = {}): HomeOfficeSimplified => ({
  homeSquareFeet: 2000,
  businessSquareFeet: 200,
  sameAreaAllYear: true,
  allGrossIncomeFromHome: true,
  ...change,
});

describe("line 9, car and truck expenses", () => {
  it.each([
    ["standard mileage: miles × $0.70", { vehicles: [vehicle()] }, 700],
    [
      "standard mileage plus parking and tolls, cents kept",
      { vehicles: [vehicle({ parkingAndTolls: 12.6 })] },
      713,
    ],
    [
      "actual expenses: carAndTruck, plus the vehicle's parking and tolls",
      {
        expenses: { carAndTruck: 1200 },
        vehicles: [vehicle({ standardMileageRate: false, parkingAndTolls: 30 })],
      },
      1230,
    ],
    [
      "one vehicle at each method",
      {
        expenses: { carAndTruck: 500 },
        vehicles: [vehicle({ businessMiles: 280 }), vehicle({ standardMileageRate: false })],
      },
      696,
    ],
    ["no vehicle and no amount: blank", {}, undefined],
  ] as Array<[string, Partial<BusinessFactValue>, number | undefined]>)(
    "%s",
    (_, change, expected) => {
      expect(carAndTruckExpenses(business(change))).toBe(expected);
    },
  );
});

describe("line 30, the simplified home office", () => {
  const line30 = (offices: Array<Partial<BusinessFactValue>>) => {
    const onReturn = offices.map((change) => business(change));
    return homeOfficeExpenses(onReturn[0], onReturn);
  };

  it.each([
    ["200 square feet × $5", [{ homeOffice: office() }], 1000],
    [
      "the area is capped at 300 square feet",
      [{ homeOffice: office({ businessSquareFeet: 400 }) }],
      1500,
    ],
    ["limited to line 29", [{ grossReceipts: 600, homeOffice: office() }], 600],
    [
      "part-year use: the average monthly square feet",
      [{ homeOffice: office({ sameAreaAllYear: false, averageMonthlySquareFeet: 125 }) }],
      625,
    ],
    [
      "part-year use with no average: blank",
      [{ homeOffice: office({ sameAreaAllYear: false }) }],
      undefined,
    ],
    [
      "the gross-income answer not given: blank",
      [{ homeOffice: office({ allGrossIncomeFromHome: undefined }) }],
      undefined,
    ],
    [
      "one owner's two offices within 300 together",
      [
        { homeOffice: office({ businessSquareFeet: 100 }) },
        { activity: "tutoring", homeOffice: office({ businessSquareFeet: 150 }) },
      ],
      500,
    ],
    [
      "one owner's two offices above 300 together: blank",
      [
        { homeOffice: office({ businessSquareFeet: 200 }) },
        { activity: "tutoring", homeOffice: office({ businessSquareFeet: 150 }) },
      ],
      undefined,
    ],
    [
      "a spouse's office does not share the taxpayer's cap",
      [
        { homeOffice: office({ businessSquareFeet: 200 }) },
        { activity: "tutoring", owner: "spouse", homeOffice: office({ businessSquareFeet: 150 }) },
      ],
      1000,
    ],
  ] as Array<[string, Array<Partial<BusinessFactValue>>, number | undefined]>)(
    "%s",
    (_, offices, expected) => {
      expect(line30(offices)).toBe(expected);
    },
  );
});

describe("the home office cases the engine does not handle", () => {
  it.each([
    ["all income from the home", [{ homeOffice: office() }], undefined],
    [
      "some income from another place",
      [{ homeOffice: office({ allGrossIncomeFromHome: false }) }],
      "partOfIncomeFromHome",
    ],
    [
      "one owner's offices above 300 square feet",
      [
        { homeOffice: office({ businessSquareFeet: 200 }) },
        { activity: "tutoring", homeOffice: office({ businessSquareFeet: 150 }) },
      ],
      "areaAllocation",
    ],
    [
      "an answer still open waits, not unsupported",
      [{ homeOffice: office({ sameAreaAllYear: false }) }],
      undefined,
    ],
  ] as Array<[string, Array<Partial<BusinessFactValue>>, string | undefined]>)(
    "%s",
    (_, offices, expected) => {
      const onReturn = offices.map((change) => business(change));
      expect(homeOfficeGap(onReturn[0], onReturn)).toBe(expected);
    },
  );
});

describe("line 31, net profit", () => {
  it.each([
    ["no home office: line 29", {}, 10000],
    ["less line 30", { homeOffice: office() }, 9000],
    [
      "a blank line 30 leaves line 31 blank",
      { homeOffice: office({ sameAreaAllYear: false }) },
      undefined,
    ],
    ["line G not Yes: blank", { materiallyParticipated: false }, undefined],
    ["a loss: blank", { expenses: { office: 12000 } }, undefined],
  ] as Array<[string, Partial<BusinessFactValue>, number | undefined]>)(
    "%s",
    (_, change, expected) => {
      const value = business(change);
      expect(netProfit(value, [value])).toBe(expected);
    },
  );
});
