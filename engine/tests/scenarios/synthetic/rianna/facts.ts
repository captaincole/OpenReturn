/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the 1099-INT would print
 * them, the rental as she states it, and her answers.
 */

import {
  CA_RESIDENCY_FACT_KEYS,
  RENTAL_KEYS,
  caCaliforniaAmountKey,
  makeCaPassiveCarryoverKey,
  makeInterestFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  type CaResidencyFactValue,
  type InterestFactValue,
  type RentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RIANNA_USER_ID = "rianna-integration";
export const RIANNA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RIANNA_USER_ID,
  taxYear: RIANNA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const RIANNA = {
  firstName: "Rianna",
  lastName: "Tolvane",
  ssn: "400-00-5402",
  street: "77 Juniper Ridge Court",
  city: "Reno",
  state: "NV",
  zip: "89511",
};

const address = { line1: RIANNA.street, city: RIANNA.city, state: RIANNA.state, zip: RIANNA.zip };

/*
 * A Reno employer whose staff also work at its Truckee, California yard: box
 * 16 holds the wages for her 52 workdays there.
 */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Sierra Crest Logistics LLC",
  employerEin: "00-0005403",
  employerAddress: { line1: "250 Kietzke Lane", city: "Reno", state: "NV", zip: "89502" },
  employee: { firstName: RIANNA.firstName, lastName: RIANNA.lastName, ssn: RIANNA.ssn, address },
  box1: 142000,
  box2: 19400,
  box3: 142000,
  box4: 8804,
  box5: 142000,
  box6: 2059,
  box15: "CA",
  box16: 29600,
  box17: 1180,
};

/* A Reno bank account: no California source. */
const bankInterest: InterestFactValue = { payerName: "Truckee Meadows Savings Bank", box1: 900 };

/* A house in Sacramento she rents out all year. */
const sacramentoRental: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "single_family",
  address: { street: "2915 Riverside Boulevard", city: "Sacramento", state: "CA", zip: "95818" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 33600,
  expenses: {
    insurance: 1450,
    repairs: 2150,
    taxes: 4300,
    managementFees: 2690,
    depreciationOrDepletion: 7600,
  },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* Part I: a Nevada resident all year; 52 workdays in Truckee and 6 days at the rental. */
const residency: CaResidencyFactValue = {
  residency: "nonresident",
  domicileState: "NV",
  nonresidentAllYearState: "NV",
  daysInCalifornia: 58,
  ownedCaliforniaProperty: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RIANNA_USER_ID, taxYear: RIANNA_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-26";

export const riannaFacts: TaxFactRow[] = [
  idFact("name.first", RIANNA.firstName),
  idFact("name.last", RIANNA.lastName),
  idFact("ssn", RIANNA.ssn),
  idFact("dob", "09/22/1979"),
  idFact("address.street", RIANNA.street),
  idFact("address.city", RIANNA.city),
  idFact("address.state", RIANNA.state),
  idFact("address.zip", RIANNA.zip),
  idFact("occupation", "Operations manager"),
  idFact("phone", "775-555-0162"),
  fact("wages", makeW2FactKey("sierra-crest"), w2, "W-2 from Sierra Crest Logistics LLC."),
  fact(
    "investment_income",
    makeInterestFactKey("truckee-meadows-savings"),
    bankInterest,
    "1099-INT from Truckee Meadows Savings Bank.",
  ),
  fact(
    "rental",
    makeRentalFactKey("riverside-house"),
    sacramentoRental,
    `${VERBAL}: rents and expenses from her property manager's year-end statement.`,
  ),
  fact(
    "rental",
    makeCaPassiveCarryoverKey(makeRentalFactKey("riverside-house")),
    0,
    `${VERBAL}: the house has made a profit every year; no FTB 3801 carryover.`,
  ),
  fact(
    "rental",
    RENTAL_KEYS.realEstateProfessional,
    false,
    `${VERBAL}: not a real estate professional.`,
  ),
  fact(
    "rental",
    RENTAL_KEYS.paymentsRequire1099,
    false,
    `${VERBAL}: no payments that need a 1099.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer coverage all year.`,
  ),
  fact("identity", CA_RESIDENCY_FACT_KEYS.taxpayer, residency, `${VERBAL}: residency and days.`),
  /* Column E: her California-source amounts as a nonresident (Schedule CA (540NR)). */
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("1a"),
    29600,
    `${VERBAL}: the wages for her Truckee workdays (W-2 box 16).`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("2b"),
    0,
    `${VERBAL}: a Nevada bank account, not used in a California business.`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("b5"),
    15410,
    `${VERBAL}: the Sacramento rental is California property: all of its profit.`,
  ),
];
