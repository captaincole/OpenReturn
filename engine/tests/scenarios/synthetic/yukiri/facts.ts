/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * W-2 fact is the boxes as the document would print them. The bond is
 * Yukiri's answer from her own records: no Form 1097-BTC or 1099-INT reports
 * its credit, so the credit is interest she adds herself.
 */

import {
  makeTaxCreditBondFactKey,
  makeW2FactKey,
  type TaxCreditBondFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const YUKIRI_USER_ID = "yukiri-integration";
export const YUKIRI_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: YUKIRI_USER_ID,
  taxYear: YUKIRI_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const YUKIRI = {
  firstName: "Yukiri",
  lastName: "Thornbury",
  ssn: "400-00-8921",
  street: "917 West Riverside Avenue",
  city: "Spokane",
  state: "WA",
  zip: "99201",
};

const address = { line1: YUKIRI.street, city: YUKIRI.city, state: YUKIRI.state, zip: YUKIRI.zip };

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Inland Empire Library Services",
  employerEin: "00-0089126",
  employerAddress: { line1: "25 North Wall Street", city: "Spokane", state: "WA", zip: "99201" },
  employee: { firstName: YUKIRI.firstName, lastName: YUKIRI.lastName, ssn: YUKIRI.ssn, address },
  box1: 58000,
  box2: 5200,
  box3: 58000,
  box4: 3596,
  box5: 58000,
  box6: 841,
};

/* A qualified school construction bond held all year: 25% for each of the four credit allowance dates. */
export const SCHOOL_BOND: TaxCreditBondFactValue = {
  source: "held",
  bondType: "qscb",
  issuerNameCityState: "Cascade Valley School District No. 41, Cheney, WA",
  issuerEin: "00-0089127",
  issueDate: "2010-11-01",
  maturityDate: "2027-11-01",
  rows: [{ identifier: "99999QSC6", outstandingAmount: 20000, creditRate: 0.0455 }],
  creditOnForm1099Int: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: YUKIRI_USER_ID, taxYear: YUKIRI_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", YUKIRI.firstName),
  idFact("name.last", YUKIRI.lastName),
  idFact("ssn", YUKIRI.ssn),
  idFact("dob", "03/21/1991"),
  idFact("address.street", YUKIRI.street),
  idFact("address.city", YUKIRI.city),
  idFact("address.state", YUKIRI.state),
  idFact("address.zip", YUKIRI.zip),
  idFact("occupation", "Librarian"),
  idFact("phone", "509-555-0127"),
];

export const yukiriFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact("wages", makeW2FactKey("inland-empire-library"), w2, `W-2, ${MADE_UP}.`),
  fact(
    "investment_income",
    makeTaxCreditBondFactKey("cascade-valley-qscb"),
    SCHOOL_BOND,
    "Yukiri's bond records: the bond's terms and the Treasury credit rate; no information return reports the credit.",
  ),
];
