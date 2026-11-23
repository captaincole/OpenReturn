/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * 1099-DIV is in docs/ (made by generate-docs.ts from the values below); the
 * other facts are the boxes as the W-2 and the 1099-INT would print them.
 */

import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const FAILE_USER_ID = "faile-synthetic";
export const FAILE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

export const FAILE = {
  firstName: "Faile",
  lastName: "Bashere",
  ssn: "400-00-1117",
  street: "4410 Mesa Verde Drive",
  city: "Austin",
  state: "TX",
  zip: "78731",
};

const address = { line1: FAILE.street, city: FAILE.city, state: FAILE.state, zip: FAILE.zip };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: FAILE_USER_ID,
  taxYear: FAILE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Bluebonnet Analytics LLC",
  employerEin: "00-0001117",
  employerAddress: { line1: "300 Congress Ave", city: "Austin", state: "TX", zip: "78701" },
  employee: { firstName: FAILE.firstName, lastName: FAILE.lastName, ssn: FAILE.ssn, address },
  box1: 72000,
  box2: 6900,
  box3: 72000,
  box4: 4464,
  box5: 72000,
  box6: 1044,
};

/* A mutual fund (a RIC): box 8 is blank. */
export const FUND_SLUG = "pecos-global-equity";
export const fundDividends: DividendFactValue = {
  payerName: "Pecos Global Equity Fund",
  payerTin: "00-0011170",
  box1a: 4200,
  box1b: 3100,
  box7: 118.4,
};

/* A brokerage account: interest on Canadian corporate bonds, with tax withheld. */
const brokerInterest: InterestFactValue = {
  payerName: "Lone Star Securities Inc.",
  payerTin: "00-0021170",
  box1: 780,
  box6: 31.2,
  box7: "Canada",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: FAILE_USER_ID, taxYear: FAILE_TAX_YEAR, suffix, value });

export const faileFacts: TaxFactRow[] = [
  idFact("name.first", FAILE.firstName),
  idFact("name.last", FAILE.lastName),
  idFact("ssn", FAILE.ssn),
  idFact("dob", "11/27/1990"),
  idFact("address.street", FAILE.street),
  idFact("address.city", FAILE.city),
  idFact("address.state", FAILE.state),
  idFact("address.zip", FAILE.zip),
  idFact("occupation", "Data analyst"),
  idFact("phone", "512-555-0117"),
  fact("wages", makeW2FactKey("bluebonnet"), w2, "W-2 from Bluebonnet Analytics."),
  fact(
    "investment_income",
    makeDividendFactKey(FUND_SLUG),
    fundDividends,
    "Form 1099-DIV (docs/01-1099-div-pecos.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("lone-star"),
    brokerInterest,
    "Form 1099-INT from Lone Star Securities.",
  ),
];
