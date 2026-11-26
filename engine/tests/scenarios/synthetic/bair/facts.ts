/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2 and the 1099 facts are the boxes as the documents would
 * print them, and the Form 2555 fact holds Bair's answers.
 */

import {
  makeDependentFactKey,
  makeDividendFactKey,
  makeForeignEarnedIncomeFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type DividendFactValue,
  type ForeignEarnedIncomeFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BAIR_USER_ID = "bair-integration";
export const BAIR_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const VERBAL = "Verbal, 2026-11-25";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BAIR_USER_ID,
  taxYear: BAIR_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BAIR = {
  firstName: "Bair",
  lastName: "Halloran",
  ssn: "400-00-2555",
  street: "1220 Bayshore Lantern Drive",
  city: "Tampa",
  state: "FL",
  zip: "33606",
};

const address = { line1: BAIR.street, city: BAIR.city, state: BAIR.state, zip: BAIR.zip };

/*
 * The W-2 from his U.S. employer (made up). Box 1 holds every Part IV amount
 * except the meals that section 119 excludes, plus $9,000 earned on U.S.
 * business trips (Form 2555 line 14, column (d)).
 */
const brightwaterW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Brightwater Freight Systems Inc",
  employerEin: "00-0002555",
  employerAddress: { line1: "500 Channelside Quay", city: "Tampa", state: "FL", zip: "33602" },
  employee: { firstName: BAIR.firstName, lastName: BAIR.lastName, ssn: BAIR.ssn, address },
  box1: 225300,
  box2: 19000,
  box3: 176100,
  box4: 10918.2,
  box5: 225300,
  box6: 3266.85,
};

const interest: InterestFactValue = { payerName: "Gulfline Savings Bank", box1: 1500 };
const dividends: DividendFactValue = {
  payerName: "Harborview Index Funds",
  box1a: 3000,
  box1b: 3000,
};

const grandson: DependentFactValue = {
  firstName: "Caelan",
  lastName: "Halloran",
  ssn: "400-00-2556",
  relationship: "Grandchild",
  dob: "09/02/2016",
  monthsLivedWithYou: 12,
  livedInUs: false,
  usCitizenOrResident: true,
};

/* Bair's Form 2555 answers: a bona fide resident of the United Kingdom since March 2023. */
const form2555: ForeignEarnedIncomeFactValue = {
  foreignAddress: "27 Larchmere Mews, Manchester M20 2QX, United Kingdom",
  occupation: "Logistics director",
  employer: {
    name: "Brightwater Freight Systems Inc",
    usAddress: "500 Channelside Quay, Tampa, FL 33602",
    foreignAddress: "3 Fenwick Yard, Manchester M1 4BX, United Kingdom",
    types: ["us_company"],
  },
  lastYearFiled: 2024,
  citizenship: "United States",
  // Manchester is not in Notice 2025-16's table, so line 29b is the general limit.
  taxHomes: [{ location: "Manchester, United Kingdom", established: "03/01/2023" }],
  bonaFideResidence: {
    began: "03/01/2023",
    livingQuarters: ["rented_house"],
    familyAbroad: "Grandson, all of 2025",
    nonresidentStatement: false,
    foreignIncomeTaxRequired: true,
    usVisits: [
      { arrived: "04/07/2025", left: "04/12/2025", businessDays: 5, businessIncome: 3500 },
      { arrived: "10/13/2025", left: "10/21/2025", businessDays: 7, businessIncome: 5500 },
    ],
    contractTerms: "Five-year assignment to the Manchester office from March 2023, renewable.",
    visaType: "Skilled Worker visa",
    visaLimitedStay: false,
    usHome: "1220 Bayshore Lantern Drive, Tampa, FL 33606; not rented, no occupants",
  },
  wages: 150000,
  noncash: {
    meals: 1200,
    car: 4800,
    other: { description: "Club membership", amount: 600 },
  },
  allowances: {
    costOfLiving: 12000,
    family: 2400,
    education: 9000,
    homeLeave: 3500,
    quarters: 30000,
    other: { description: "Tax equalization", amount: 2500 },
  },
  otherIncome: { description: "Assignment completion bonus", amount: 1500 },
  excludableMealsAndLodging: 1200,
  // Rent and utilities on the Manchester house, paid in pounds.
  housing: { expenses: { amount: 30000, currency: "GBP" } },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BAIR_USER_ID, taxYear: BAIR_TAX_YEAR, suffix, value });

export const bairFacts: TaxFactRow[] = [
  idFact("name.first", BAIR.firstName),
  idFact("name.last", BAIR.lastName),
  idFact("ssn", BAIR.ssn),
  idFact("dob", "05/14/1958"),
  idFact("address.street", BAIR.street),
  idFact("address.city", BAIR.city),
  idFact("address.state", BAIR.state),
  idFact("address.zip", BAIR.zip),
  idFact("occupation", "Logistics director"),
  idFact("phone", "813-555-0125"),
  fact(
    "wages",
    makeW2FactKey("brightwater-freight"),
    brightwaterW2,
    "W-2 from Brightwater Freight.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("gulfline-savings"),
    interest,
    "1099-INT from Gulfline Savings Bank.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("harborview-index"),
    dividends,
    "1099-DIV from Harborview Index Funds.",
  ),
  fact("dependents", makeDependentFactKey("caelan-halloran"), grandson, VERBAL),
  fact(
    "foreign",
    makeForeignEarnedIncomeFactKey("taxpayer"),
    form2555,
    `${VERBAL}: Bair's answers for Form 2555; Part IV from his employer's assignment pay statement.`,
  ),
];
