/*
 * A made-up landowner (README.md): every name and amount is invented. No input
 * documents: the W-2 holds its boxes as printed, and the farm rental fact holds
 * the amounts Keille states from the farm's records.
 */

import {
  makeFarmRentalFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type FarmRentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const KEILLE_USER_ID = "keille-integration";
export const KEILLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: KEILLE_USER_ID,
  taxYear: KEILLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const KEILLE = {
  firstName: "Keille",
  lastName: "Ravensworth",
  ssn: "400-00-4836",
  street: "4410 Live Oak Hammock Road",
  city: "Ocala",
  state: "FL",
  zip: "34482",
};

const address = { line1: KEILLE.street, city: KEILLE.city, state: KEILLE.state, zip: KEILLE.zip };

// W-2 from Marion Land Brokers, the real estate brokerage Keille owns 60% of (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Marion Land Brokers Inc",
  employerEin: "00-0004836",
  employerAddress: {
    line1: "22 Silver Springs Boulevard",
    city: "Ocala",
    state: "FL",
    zip: "34470",
  },
  employee: { firstName: KEILLE.firstName, lastName: KEILLE.lastName, ssn: KEILLE.ssn, address },
  box1: 112000,
  box2: 16800,
  box3: 112000,
  box4: 6944,
  box5: 112000,
  box6: 1624,
};

/*
 * A pasture and hay farm near Ocala, rented to a tenant for half the hay.
 * Keille decides the rental terms and the repairs herself, more than 100 hours
 * and more than anyone else, so she materially participates under the passive
 * activity rules; she does no farm work, so not for self-employment tax. The
 * year's repairs and taxes make a loss. All of her investment is at risk.
 */
const farm: FarmRentalFactValue = {
  farmName: "Ravensworth hay farm, Marion County, FL",
  activelyParticipated: true,
  productionIncome: 18000,
  cropInsuranceReceived: 1200,
  expenses: {
    depreciation: 9000,
    fertilizersAndLime: 3000,
    insurance: 2100,
    mortgageInterest: 5200,
    repairsAndMaintenance: 6400,
    taxes: 4500,
  },
  priorYearUnallowedLoss: 0,
  allInvestmentAtRisk: true,
  materiallyParticipated: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: KEILLE_USER_ID, taxYear: KEILLE_TAX_YEAR, suffix, value });

export const keilleFacts: TaxFactRow[] = [
  idFact("name.first", KEILLE.firstName),
  idFact("name.last", KEILLE.lastName),
  idFact("ssn", KEILLE.ssn),
  idFact("dob", "01/19/1971"),
  idFact("address.street", KEILLE.street),
  idFact("address.city", KEILLE.city),
  idFact("address.state", KEILLE.state),
  idFact("address.zip", KEILLE.zip),
  idFact("occupation", "Real estate broker"),
  idFact("phone", "352-555-0161"),
  fact("wages", makeW2FactKey("marion-land-brokers"), w2, "W-2 from Marion Land Brokers."),
  fact(
    "rental",
    RENTAL_KEYS.realEstateProfessional,
    true,
    "Stated by Keille: more than 750 hours and more than half her working time in real property trades as a 60% owner of her brokerage.",
  ),
  fact(
    "rental",
    makeFarmRentalFactKey("ravensworth-hay-farm"),
    farm,
    "Stated by Keille from the farm's records: hay share sales, Form 1099-MISC box 9, and the expenses.",
  ),
];
