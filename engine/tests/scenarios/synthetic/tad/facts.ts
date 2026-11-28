/*
 * A made-up single filer in Texas (README.md): every name and amount is
 * invented. No input documents beyond the W-2 amounts: the solar farm's
 * amounts are the filer's answers from the business's books, the utility's
 * meter statements, the county loan statement and the domestic content and
 * energy community records. No IRS form reports them.
 */

import {
  makeBusinessFactKey,
  makeCleanElectricityFacilityFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type CleanElectricityFacilityFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TAD_USER_ID = "tad-integration";
export const TAD_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TAD_USER_ID,
  taxYear: TAD_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TAD = {
  firstName: "Tad",
  lastName: "Brannock",
  ssn: "400-00-7211",
  street: "2210 Caprock Ranch Road",
  city: "Snyder",
  state: "TX",
  zip: "79549",
};

const address = { line1: TAD.street, city: TAD.city, state: TAD.state, zip: TAD.zip };

/* His engineering job (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Llano Grid Engineering LLC",
  employerEin: "00-0007211",
  employerAddress: { line1: "900 Permian Plaza", city: "Midland", state: "TX", zip: "79701" },
  employee: { firstName: TAD.firstName, lastName: TAD.lastName, ssn: TAD.ssn, address },
  box1: 210000,
  box2: 39500,
  box3: 176100,
  box4: 10918.2,
  box5: 210000,
  box6: 3135,
};

/* The solar farm on his ranch land: he sells all its output to the local utility. */
const solarFarm: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Solar electricity generation, sold to a utility",
  code: "221114",
  name: "Brannock Caprock Solar",
  address: { street: "2210 Caprock Ranch Road", city: "Snyder", state: "TX", zip: "79549" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: true,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 79639,
  expenses: {
    depreciation: 52000,
    insurance: 3400,
    otherInterest: 7200,
    repairs: 2100,
    taxesAndLicenses: 4800,
  },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 1440000,
};

/*
 * The facility: a 950 kW ac ground-mounted array, so under 1 MW (line 7a) and
 * the alternative amount, 3 cents for 2025. It sits in a census tract whose
 * coal mine closed (line 8) and its steel, iron and manufactured products are
 * certified as made in the United States (line 9). A county green-energy loan
 * from tax-exempt bonds paid for part of it (line 6a).
 */
export const CAPROCK_SOLAR: CleanElectricityFacilityFactValue = {
  description: "950 kW ac ground-mounted solar array with single-axis trackers",
  address: "2210 Caprock Ranch Road, Snyder, TX 79549",
  coordinates: { latitude: 32.718342, longitude: -100.917226 },
  constructionBegan: "2024-09-16",
  placedInService: "2025-03-10",
  netOutputUnder1Mw: true,
  prevailingWageAndApprenticeship: false,
  energyCommunity: true,
  domesticContent: true,
  kilowattHours: 1284500,
  financing: { proceeds: 180000, capitalAccountAdditions: 1440000 },
  otherCreditClaimed: false,
  passive: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TAD_USER_ID, taxYear: TAD_TAX_YEAR, suffix, value });

export const tadFacts: TaxFactRow[] = [
  idFact("name.first", TAD.firstName),
  idFact("name.last", TAD.lastName),
  idFact("ssn", TAD.ssn),
  idFact("dob", "06/02/1981"),
  idFact("address.street", TAD.street),
  idFact("address.city", TAD.city),
  idFact("address.state", TAD.state),
  idFact("address.zip", TAD.zip),
  idFact("occupation", "Electrical engineer"),
  idFact("phone", "325-555-0172"),
  fact("wages", makeW2FactKey("llano-grid"), w2, "W-2 from Llano Grid Engineering LLC."),
  fact(
    "self_employment",
    makeBusinessFactKey("caprock-solar"),
    solarFarm,
    "Stated by Tad, from the solar farm's books.",
  ),
  fact(
    "other",
    makeCleanElectricityFacilityFactKey("caprock-solar"),
    CAPROCK_SOLAR,
    "Stated by Tad: the utility's meter statements, the county loan statement, the domestic content certification and the energy community tract record.",
  ),
];
