/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * has no PDF. The installment sale facts come from the sales contracts, which
 * have no information return the engine reads.
 */

import {
  makeInstallmentSaleFactKey,
  makeW2FactKey,
  type InstallmentSaleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const CHIAD_USER_ID = "chiad-integration";
export const CHIAD_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CHIAD_USER_ID,
  taxYear: CHIAD_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CHIAD = {
  firstName: "Chiad",
  lastName: "Marrowby",
  ssn: "400-00-6254",
  street: "9 Heron Point Lane",
  city: "Sarasota",
  state: "FL",
  zip: "34236",
};

const address = { line1: CHIAD.street, city: CHIAD.city, state: CHIAD.state, zip: CHIAD.zip };

// W-2 from Gulfline Marine Supply (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Gulfline Marine Supply Co",
  employerEin: "00-0006254",
  employerAddress: { line1: "300 Harbor Road", city: "Sarasota", state: "FL", zip: "34236" },
  employee: { firstName: CHIAD.firstName, lastName: CHIAD.lastName, ssn: CHIAD.ssn, address },
  box1: 72000,
  box2: 7900,
  box3: 72000,
  box4: 4464,
  box5: 72000,
  box6: 1044,
};

/*
 * Her main home, sold in April 2025 with seller financing. The buyer took over
 * her mortgage, which was more than her installment sale basis (line 17).
 */
export const home: InstallmentSaleFactValue = {
  description: "Main home, 9 Heron Point Lane, Sarasota FL",
  propertyCode: 2,
  dateAcquired: "2010-08-01",
  dateSold: "2025-04-15",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 1200000,
  liabilitiesAssumed: 500000,
  costOrOtherBasis: 400000,
  expensesOfSale: 60000,
  excludedGain: 250000,
  paymentsThisYear: 200000,
};

/* A sculpture bought in January 2025 and sold in October 2025 (held 1 year or less). */
export const sculpture: InstallmentSaleFactValue = {
  description: "Bronze sculpture, 'Tidewater'",
  propertyCode: 4,
  dateAcquired: "2025-01-20",
  dateSold: "2025-10-05",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 90000,
  costOrOtherBasis: 60000,
  expensesOfSale: 4500,
  paymentsThisYear: 30000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CHIAD_USER_ID, taxYear: CHIAD_TAX_YEAR, suffix, value });

export const chiadFacts: TaxFactRow[] = [
  idFact("name.first", CHIAD.firstName),
  idFact("name.last", CHIAD.lastName),
  idFact("ssn", CHIAD.ssn),
  idFact("dob", "11/30/1966"),
  idFact("address.street", CHIAD.street),
  idFact("address.city", CHIAD.city),
  idFact("address.state", CHIAD.state),
  idFact("address.zip", CHIAD.zip),
  idFact("occupation", "Purchasing agent"),
  idFact("phone", "941-555-0174"),
  fact("wages", makeW2FactKey("gulfline-marine"), w2, "W-2 from Gulfline Marine Supply."),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("heron-point-home"),
    home,
    "Sales contract and closing statement of April 2025; excluded gain from the Pub. 523 worksheet, verbal.",
  ),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("tidewater-sculpture"),
    sculpture,
    "Bill of sale of October 2025 and the gallery's purchase invoice of January 2025.",
  ),
];
