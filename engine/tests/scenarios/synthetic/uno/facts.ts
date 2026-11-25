/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * has no PDF. The installment sale fact comes from the 2023 sales contract and
 * the buyer's payment record, which have no information return the engine reads.
 */

import {
  makeInstallmentSaleFactKey,
  makeW2FactKey,
  type InstallmentSaleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const UNO_USER_ID = "uno-synthetic";
export const UNO_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: UNO_USER_ID,
  taxYear: UNO_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const UNO = {
  firstName: "Uno",
  lastName: "Halloway",
  ssn: "400-00-3807",
  street: "77 Mesa Verde Drive",
  city: "Fresno",
  state: "CA",
  zip: "93711",
};

const address = { line1: UNO.street, city: UNO.city, state: UNO.state, zip: UNO.zip };

// W-2 from a made-up Fresno employer.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "San Joaquin Freight Lines",
  employerEin: "00-0003807",
  employerAddress: { line1: "3100 Railyard Road", city: "Fresno", state: "CA", zip: "93706" },
  employee: { firstName: UNO.firstName, lastName: UNO.lastName, ssn: UNO.ssn, address },
  box1: 70000,
  box2: 7200,
  box3: 70000,
  box4: 4340,
  box5: 70000,
  box6: 1015,
  box14: [{ label: "CA SDI", amount: 840 }],
  box15: "CA",
  box16: 70000,
  box17: 2600,
};

/*
 * A vacant lot sold to his sister in August 2023, paid over several years.
 * 2025 is the second year after the sale, so Part III is completed; she has not
 * resold it (line 28 "No"). He got the lot in a 1986 exchange that California
 * treated differently, so his California basis is $30,000 higher
 * (ca-540-sched-d-inst-2025::sec::line-1::b02).
 */
export const orchardLot: InstallmentSaleFactValue = {
  description: "Vacant lot, 5 Orchard Gap Road, Clovis CA",
  propertyCode: 4,
  dateAcquired: "1986-04-02",
  dateSold: "2023-08-15",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 400000,
  costOrOtherBasis: 120000,
  expensesOfSale: 10000,
  paymentsThisYear: 40000,
  paymentsPriorYears: 120000,
  relatedParty: {
    name: "Marisol Halloway",
    address: "9 Cedar Bluff Lane, Clovis CA 93619",
    identifyingNumber: "400-00-3808",
    resoldThisYear: false,
  },
  california: { costOrOtherBasis: 150000 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: UNO_USER_ID, taxYear: UNO_TAX_YEAR, suffix, value });

export const unoFacts: TaxFactRow[] = [
  idFact("name.first", UNO.firstName),
  idFact("name.last", UNO.lastName),
  idFact("ssn", UNO.ssn),
  idFact("dob", "09/03/1968"),
  idFact("address.street", UNO.street),
  idFact("address.city", UNO.city),
  idFact("address.state", UNO.state),
  idFact("address.zip", UNO.zip),
  idFact("occupation", "Dispatcher"),
  idFact("phone", "559-555-0162"),
  fact("wages", makeW2FactKey("san-joaquin-freight"), w2, "W-2 from San Joaquin Freight Lines."),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("orchard-gap-lot"),
    orchardLot,
    "Sales contract of August 2023 and the buyer's payment record; California basis from his California records.",
  ),
];
