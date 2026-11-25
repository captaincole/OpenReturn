/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * has no PDF. The installment sale facts come from the sales contracts and the
 * Forms 6252 of the years of sale, which have no information return.
 */

import {
  SECTION_1231_KEYS,
  makeInstallmentSaleFactKey,
  makeW2FactKey,
  type InstallmentSaleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BAIN_USER_ID = "bain-integration";
export const BAIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BAIN_USER_ID,
  taxYear: BAIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BAIN = {
  firstName: "Bain",
  lastName: "Thornwell",
  ssn: "400-00-6252",
  street: "418 Mesquite Bend",
  city: "San Angelo",
  state: "TX",
  zip: "76901",
};

const address = { line1: BAIN.street, city: BAIN.city, state: BAIN.state, zip: BAIN.zip };

// W-2 from Concho Valley Freight (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Concho Valley Freight LLC",
  employerEin: "00-0006252",
  employerAddress: { line1: "77 Depot Street", city: "San Angelo", state: "TX", zip: "76903" },
  employee: { firstName: BAIN.firstName, lastName: BAIN.lastName, ssn: BAIN.ssn, address },
  box1: 84000,
  box2: 9800,
  box3: 84000,
  box4: 5208,
  box5: 84000,
  box6: 1218,
};

/*
 * A rental duplex sold in 2024 to his brother, who resold it in September
 * 2025 (Part III). Straight-line depreciation: no recapture on line 12.
 */
export const duplex: InstallmentSaleFactValue = {
  description: "Rental duplex, 1210 Kelly Street, San Angelo TX",
  propertyCode: 4,
  dateAcquired: "2012-06-01",
  dateSold: "2024-05-10",
  use: "business",
  section1250: true,
  sellingPriceDeterminable: true,
  sellingPrice: 480000,
  liabilitiesAssumed: 100000,
  costOrOtherBasis: 300000,
  depreciationAllowed: 90000,
  expensesOfSale: 28800,
  recaptureIncome: 0,
  paymentsThisYear: 30000,
  paymentsPriorYears: 80000,
  relatedParty: {
    name: "Dorian Thornwell",
    address: "52 Pecos Trail, Midland TX 79701",
    identifyingNumber: "400-00-6253",
    resoldThisYear: true,
    secondDisposition: { date: "2025-09-01", amountRealized: 520000 },
  },
};

/*
 * Pasture land farmed until 2022, sold in 2023. Section 1252 recapture from
 * the year of sale that line 24 did not yet absorb: 5,000 left for 2025.
 */
export const pasture: InstallmentSaleFactValue = {
  description: "Pasture, 40 acres, Tom Green County TX",
  propertyCode: 3,
  dateAcquired: "2004-03-20",
  dateSold: "2023-08-15",
  use: "business",
  sellingPriceDeterminable: true,
  sellingPrice: 160000,
  costOrOtherBasis: 64000,
  expensesOfSale: 6000,
  paymentsThisYear: 16000,
  paymentsPriorYears: 48000,
  remainingRecapture: 5000,
};

/* A trailer bought and sold in 2024 (held 1 year or less): Form 4797 line 10. */
export const trailer: InstallmentSaleFactValue = {
  description: "Food truck trailer",
  propertyCode: 4,
  dateAcquired: "2024-02-01",
  dateSold: "2024-12-01",
  use: "business",
  sellingPriceDeterminable: true,
  sellingPrice: 75000,
  costOrOtherBasis: 60000,
  depreciationAllowed: 8000,
  expensesOfSale: 1500,
  recaptureIncome: 8000,
  paymentsThisYear: 20000,
  paymentsPriorYears: 15000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BAIN_USER_ID, taxYear: BAIN_TAX_YEAR, suffix, value });

export const bainFacts: TaxFactRow[] = [
  idFact("name.first", BAIN.firstName),
  idFact("name.last", BAIN.lastName),
  idFact("ssn", BAIN.ssn),
  idFact("dob", "03/02/1971"),
  idFact("address.street", BAIN.street),
  idFact("address.city", BAIN.city),
  idFact("address.state", BAIN.state),
  idFact("address.zip", BAIN.zip),
  idFact("occupation", "Fleet manager"),
  idFact("phone", "325-555-0162"),
  fact("wages", makeW2FactKey("concho-valley-freight"), w2, "W-2 from Concho Valley Freight."),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("kelly-street-duplex"),
    duplex,
    "Sales contract of 2024 and the 2024 Form 6252; 2025 payment and the brother's resale, verbal, 2026-11-24.",
  ),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("tom-green-pasture"),
    pasture,
    "Sales contract of 2023, the 2023 Form 4797 Part III and the 2023–2024 Forms 6252; 2025 payment, verbal.",
  ),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("food-truck-trailer"),
    trailer,
    "Bill of sale of 2024 and the 2024 Form 6252; 2025 payments, verbal.",
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    0,
    "No section 1231 losses in 2020–2024, verbal.",
  ),
];
