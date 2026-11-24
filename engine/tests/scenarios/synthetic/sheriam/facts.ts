/*
 * A made-up married couple (README.md): every name and amount is invented.
 * The W-2 holds the boxes as the form prints them. Each fund's statement
 * (docs/) prints its shares, value, sale and QEF amounts; the basis and the
 * unreversed inclusions are the couple's own records, stated.
 */

import {
  SPOUSE_KEYS,
  makePficFundFactKey,
  makeW2FactKey,
  type PficFundFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SHERIAM_USER_ID = "sheriam-integration";
export const SHERIAM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SHERIAM_USER_ID,
  taxYear: SHERIAM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const SHERIAM = {
  firstName: "Sheriam",
  lastName: "Okonde",
  ssn: "400-00-8622",
  street: "415 Heron Point Lane",
  city: "Sarasota",
  state: "FL",
  zip: "34236",
};

export const TAVIN = { firstName: "Tavin", lastName: "Okonde", ssn: "400-00-8623" };

const address = {
  line1: SHERIAM.street,
  city: SHERIAM.city,
  state: SHERIAM.state,
  zip: SHERIAM.zip,
};

// Sheriam's W-2 from Gulfline Marine Engineering (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Gulfline Marine Engineering LLC",
  employerEin: "00-0008622",
  employerAddress: { line1: "1200 Main Street", city: "Sarasota", state: "FL", zip: "34236" },
  employee: { firstName: SHERIAM.firstName, lastName: SHERIAM.lastName, ssn: SHERIAM.ssn, address },
  box1: 280000,
  box2: 52000,
  box3: 176100,
  box4: 10918.2,
  box5: 280000,
  box6: 4780,
  box13: { retirementPlan: false },
};

/*
 * A Swiss fund bought in February 2025 and made a QEF the same year (Election
 * A), with a section 1.1411-10(g) election for the net investment income tax.
 * The statement shows a section 1293(g) exclusion.
 */
export const alpineBalanced: PficFundFactValue = {
  fundName: "Alpine Balanced Fund AG",
  fundAddress: "Bahnhofstrasse 52, 8001 Zurich, Switzerland",
  country: "Switzerland",
  fundEin: "98-0008622",
  shareClass: "Registered shares, class B",
  acquiredDate: "2025-02-03",
  currencyCode: "CHF",
  sharesAtYearEnd: 600,
  // CHF 57,600 at 1.25 USD per franc on December 31: $72,000 (line 4(b)).
  valueAtYearEnd: 57600,
  yearEndUsdPerUnit: 1.25,
  regime: "qef",
  elections: { qef: true },
  qef: {
    ordinaryEarnings: 5000,
    ordinaryEarningsExcluded: 400,
    netCapitalGain: 1200,
    section1411gElection: true,
  },
};

/* A section 1291 fund the couple owned together since 2022 and sold in September 2025. */
export const capeHorizon: PficFundFactValue = {
  fundName: "Cape Horizon Income Fund",
  fundAddress: "3 Dock Road, Cape Town 8001, South Africa",
  country: "South Africa",
  referenceId: "SOCAPE2022",
  shareClass: "Class R income units",
  jointlyOwnedWithSpouse: true,
  acquiredDate: "2022-02-01",
  currencyCode: "ZAR",
  sharesAtYearEnd: 0,
  valueAtYearEnd: 0,
  regime: "section_1291",
  // ZAR 827,586.21 at 0.058 USD per rand on the sale date: $48,000 (line 15f).
  disposition: {
    date: "2025-09-30",
    amountRealized: 827586.21,
    usdPerUnit: 0.058,
    adjustedBasis: 39500,
  },
};

/* An Estonian ETF marked to market since 2020: a year-end loss larger than the unreversed inclusions. */
export const balticTech: PficFundFactValue = {
  fundName: "Baltic Tech Leaders ETF",
  fundAddress: "Narva mnt 7, 10117 Tallinn, Estonia",
  country: "Estonia",
  referenceId: "SOBALTIC2020",
  shareClass: "Accumulating shares",
  acquiredDate: "2020-11-05",
  currencyCode: "EUR",
  sharesAtYearEnd: 1500,
  // EUR 51,959.11 at 1.174 USD per euro on December 31: $61,000 (line 10a).
  valueAtYearEnd: 51959.11,
  yearEndUsdPerUnit: 1.174,
  regime: "mark_to_market",
  markToMarket: { adjustedBasisAtYearEnd: 70000, unreversedInclusions: 5500 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SHERIAM_USER_ID, taxYear: SHERIAM_TAX_YEAR, suffix, value });

export const sheriamFacts: TaxFactRow[] = [
  idFact("name.first", SHERIAM.firstName),
  idFact("name.last", SHERIAM.lastName),
  idFact("ssn", SHERIAM.ssn),
  idFact("dob", "02/14/1978"),
  idFact("address.street", SHERIAM.street),
  idFact("address.city", SHERIAM.city),
  idFact("address.state", SHERIAM.state),
  idFact("address.zip", SHERIAM.zip),
  idFact("occupation", "Naval architect"),
  idFact("phone", "941-555-0142"),
  fact("identity", SPOUSE_KEYS.firstName, TAVIN.firstName, "Stated by Sheriam."),
  fact("identity", SPOUSE_KEYS.lastName, TAVIN.lastName, "Stated by Sheriam."),
  fact("identity", SPOUSE_KEYS.ssn, TAVIN.ssn, "Stated by Tavin."),
  fact("identity", SPOUSE_KEYS.dob, "09/30/1979", "Stated by Tavin."),
  fact("wages", makeW2FactKey("gulfline-marine"), w2, "W-2 from Gulfline Marine Engineering."),
  fact(
    "foreign",
    makePficFundFactKey("alpine-balanced"),
    alpineBalanced,
    "PFIC Annual Information Statement (docs/01-pfic-alpine-balanced.pdf); the elections are the couple's.",
  ),
  fact(
    "foreign",
    makePficFundFactKey("cape-horizon"),
    capeHorizon,
    "Fund statement (docs/02-pfic-cape-horizon.pdf); basis from the couple's records.",
  ),
  fact(
    "foreign",
    makePficFundFactKey("baltic-tech"),
    balticTech,
    "Fund statement (docs/03-pfic-baltic-tech.pdf); basis and unreversed inclusions from the couple's earlier Forms 8621.",
  ),
];
