/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * W-2 holds the boxes as the form prints them. Each fund's statement
 * (docs/) prints its shares, value, distributions and QEF amounts; the
 * basis, exchange rates, earlier distributions and earlier elections are
 * Leane's own records, stated.
 */

import {
  PRIOR_YEAR_KEYS,
  makePficFundFactKey,
  makeW2FactKey,
  type PficFundFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LEANE_USER_ID = "leane-integration";
export const LEANE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LEANE_USER_ID,
  taxYear: LEANE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LEANE = {
  firstName: "Leane",
  lastName: "Varrow",
  ssn: "400-00-8621",
  street: "2208 Bluebonnet Ridge",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const address = { line1: LEANE.street, city: LEANE.city, state: LEANE.state, zip: LEANE.zip };

// Leane's W-2 from Colorado Bend Analytics (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Colorado Bend Analytics Inc",
  employerEin: "00-0008621",
  employerAddress: { line1: "900 Congress Avenue", city: "Austin", state: "TX", zip: "78701" },
  employee: { firstName: LEANE.firstName, lastName: LEANE.lastName, ssn: LEANE.ssn, address },
  box1: 310000,
  box2: 64000,
  box3: 176100,
  box4: 10918.2,
  box5: 310000,
  box6: 5485,
  box13: { retirementPlan: false },
};

/*
 * A section 1291 fund in euros, held since March 2021: two distributions in
 * 2025 with tax withheld at source. The excess over 125% of the 2022–2024
 * average goes on Part V and line 16.
 */
export const rhineValley: PficFundFactValue = {
  fundName: "Rhine Valley Equity Fund SICAV",
  fundAddress: "14 Rue des Tilleuls, L-2540 Luxembourg, Luxembourg",
  country: "Luxembourg",
  referenceId: "LVRHINE2021",
  shareClass: "Class D distributing shares",
  acquiredDate: "2021-03-15",
  currencyCode: "EUR",
  sharesAtYearEnd: 2000,
  // EUR 155,000 at 1.1742 USD per euro on December 31: $182,001 (line 4(d)).
  valueAtYearEnd: 155000,
  yearEndUsdPerUnit: 1.1742,
  regime: "section_1291",
  section1291: {
    distributions: [
      { date: "2025-06-20", amount: 6000, usdPerUnit: 1.15, foreignTaxWithheld: 900 },
      { date: "2025-12-12", amount: 4000, usdPerUnit: 1.17, foreignTaxWithheld: 600 },
    ],
    precedingDistributions: 9600,
  },
};

/*
 * A Swedish ETF marked to market since 2019: a year-end gain on the shares
 * held, and a sale of part of them at a loss within the unreversed inclusions.
 */
export const nordicIndex: PficFundFactValue = {
  fundName: "Nordic Broad Index ETF",
  fundAddress: "Kungsgatan 31, 111 56 Stockholm, Sweden",
  country: "Sweden",
  referenceId: "LVNORDIC2019",
  shareClass: "Ordinary shares, USD listing",
  acquiredDate: "2019-05-02",
  sharesAtYearEnd: 3500,
  valueAtYearEnd: 268450,
  regime: "mark_to_market",
  markToMarket: { adjustedBasisAtYearEnd: 241300 },
  disposition: {
    date: "2025-08-14",
    amountRealized: 30000,
    adjustedBasis: 34500,
    unreversedInclusions: 6200,
  },
};

/*
 * A QEF since 2020 with its PFIC Annual Information Statement, and two section
 * 1294 elections from earlier years: the 2022 one ends in part in 2025.
 */
export const pacificRim: PficFundFactValue = {
  fundName: "Pacific Rim Growth Fund Ltd",
  fundAddress: "88 Harbour Road, Wan Chai, Hong Kong",
  country: "Hong Kong",
  fundEin: "98-0008621",
  shareClass: "Ordinary participating shares, USD class",
  acquiredDate: "2020-08-10",
  currencyCode: "USD",
  sharesAtYearEnd: 1200,
  valueAtYearEnd: 95000,
  regime: "qef",
  /*
   * The statement's amounts per unit per day; Leane held 1,200 units all 365
   * days (438,000 unit days). One distribution of $6.75 a unit: $8,100.
   */
  qef: {
    perUnitPerDay: { ordinaryEarnings: 0.0087685388, netCapitalGain: 0.0050579909 },
    unitDays: 438000,
    distributionsPerUnit: [{ date: "2025-11-14", amountPerUnit: 6.75, units: 1200 }],
  },
  /*
   * The $8,100 distribution is first out of 2025's earnings ($6,056, lines 6c
   * + 7c), then out of the most recent earnings: $2,044 of the 2023 election's
   * (irs-8621-inst-2025::sec::line-8::b01–b02, ::line-22::b01).
   */
  prior1294Elections: [
    { taxYear: 2022, undistributedEarnings: 5000, deferredTax: 1850 },
    {
      taxYear: 2023,
      undistributedEarnings: 3200,
      deferredTax: 1184,
      terminatingEvent: "Distribution",
      earningsDistributed: 2044,
    },
  ],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LEANE_USER_ID, taxYear: LEANE_TAX_YEAR, suffix, value });

export const leaneFacts: TaxFactRow[] = [
  idFact("name.first", LEANE.firstName),
  idFact("name.last", LEANE.lastName),
  idFact("ssn", LEANE.ssn),
  idFact("dob", "07/09/1981"),
  idFact("address.street", LEANE.street),
  idFact("address.city", LEANE.city),
  idFact("address.state", LEANE.state),
  idFact("address.zip", LEANE.zip),
  idFact("occupation", "Data scientist"),
  idFact("phone", "512-555-0186"),
  fact("wages", makeW2FactKey("colorado-bend"), w2, "W-2 from Colorado Bend Analytics."),
  fact(
    "foreign",
    makePficFundFactKey("rhine-valley"),
    rhineValley,
    "Fund statement (docs/01-pfic-rhine-valley.pdf); basis, exchange rates and 2022–2024 distributions from Leane's records.",
  ),
  fact(
    "foreign",
    makePficFundFactKey("nordic-index"),
    nordicIndex,
    "Fund statement (docs/02-pfic-nordic-index.pdf); basis and unreversed inclusions from Leane's earlier Forms 8621.",
  ),
  fact(
    "foreign",
    makePficFundFactKey("pacific-rim"),
    pacificRim,
    "PFIC Annual Information Statement (docs/03-pfic-pacific-rim.pdf) and account statement (docs/04-pfic-pacific-rim-account.pdf); unit days and section 1294 elections from Leane's records and earlier Forms 8621.",
  ),
  fact("other", PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive, 0, "Verbal, 2026-11-23: none."),
  fact("other", PRIOR_YEAR_KEYS.foreignLossAccounts, false, "Verbal, 2026-11-23: none."),
];
