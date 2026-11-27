/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2, the 1099-DIV and the 1099-B
 * would print them, and her answers.
 */

import {
  CA_RESIDENCY_FACT_KEYS,
  caCaliforniaAmountKey,
  makeCaliforniaBasisFactKey,
  makeDividendFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type CaResidencyFactValue,
  type DividendFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const OLMIRA_USER_ID = "olmira-synthetic";
export const OLMIRA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const BROKER = "comstock-brokerage";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: OLMIRA_USER_ID,
  taxYear: OLMIRA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const OLMIRA = {
  firstName: "Olmira",
  lastName: "Strandmoor",
  ssn: "400-00-5511",
  street: "64 Juniper Ridge Court",
  city: "Reno",
  state: "NV",
  zip: "89523",
};

const address = { line1: OLMIRA.street, city: OLMIRA.city, state: OLMIRA.state, zip: OLMIRA.zip };

/* A Truckee employer: 60 of her 240 workdays at its California yard (box 16). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Donner Pass Surveying Inc",
  employerEin: "00-0005511",
  employerAddress: { line1: "10100 Donner Pass Road", city: "Truckee", state: "CA", zip: "96161" },
  employee: { firstName: OLMIRA.firstName, lastName: OLMIRA.lastName, ssn: OLMIRA.ssn, address },
  box1: 90000,
  box2: 10800,
  box3: 90000,
  box4: 5580,
  box5: 90000,
  box6: 1305,
  box15: "CA",
  box16: 22500,
  box17: 700,
};

const dividends: DividendFactValue = {
  payerName: "Comstock Brokerage",
  payerTin: "00-0005512",
  box1a: 1000,
  box1b: 600,
  box2a: 800,
};

/* The 1099-B, basis reported: two long-term sales (box D). */
export const OLMIRA_SALES: TradeFactValue[] = [
  {
    tradeId: "csb-d-01",
    description: "HIGH DESERT MINING CORP",
    quantity: 300,
    dateAcquired: "04/12/2017",
    dateSold: "05/20/2025",
    proceeds: 50000,
    costBasis: 35000,
  },
  {
    tradeId: "csb-d-02",
    description: "SILVER STATE UTILITIES",
    quantity: 100,
    dateAcquired: "08/03/2020",
    dateSold: "09/09/2025",
    proceeds: 5000,
    costBasis: 6000,
  },
];

export const OLMIRA_BOXES: Record<string, string> = {
  "csb-d-01": "partII.boxD",
  "csb-d-02": "partII.boxD",
};

/* Part I: a Nevada resident all year since she left Sacramento in 2022; 60 workdays in Truckee. */
const residency: CaResidencyFactValue = {
  residency: "nonresident",
  domicileState: "NV",
  nonresidentAllYearState: "NV",
  daysInCalifornia: 60,
  ownedCaliforniaProperty: false,
  priorResidency: { begin: "06/01/2010", end: "07/31/2022" },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: OLMIRA_USER_ID, taxYear: OLMIRA_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-26";

export const olmiraFacts: TaxFactRow[] = [
  idFact("name.first", OLMIRA.firstName),
  idFact("name.last", OLMIRA.lastName),
  idFact("ssn", OLMIRA.ssn),
  idFact("dob", "06/19/1983"),
  idFact("address.street", OLMIRA.street),
  idFact("address.city", OLMIRA.city),
  idFact("address.state", OLMIRA.state),
  idFact("address.zip", OLMIRA.zip),
  idFact("occupation", "Land surveyor"),
  idFact("phone", "775-555-0168"),
  fact("wages", makeW2FactKey("donner-pass-surveying"), w2, "W-2 from Donner Pass Surveying Inc."),
  fact(
    "investment_income",
    makeDividendFactKey(BROKER),
    dividends,
    "Comstock Brokerage consolidated 1099-DIV.",
  ),
  ...OLMIRA_SALES.map((trade) =>
    fact(
      "investment_income",
      makeTradeFactKey(BROKER, trade.tradeId),
      trade,
      "Comstock Brokerage consolidated 1099-B.",
    ),
  ),
  /*
   * High Desert Mining: a California credit she claimed in 2019, while a
   * resident, reduced her California basis by $7,000 ("Special Credits",
   * ca-540nr-sched-d-inst-2025::sec::line-1::b03).
   */
  fact(
    "capital_gains",
    makeCaliforniaBasisFactKey(BROKER, "csb-d-01"),
    28000,
    `${VERBAL}: her basis records for the High Desert Mining shares, California column.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer coverage all year.`,
  ),
  fact(
    "identity",
    CA_RESIDENCY_FACT_KEYS.taxpayer,
    residency,
    `${VERBAL}: a Nevada resident all year.`,
  ),
  /* Column E: her California-source amounts as a nonresident (Schedule CA (540NR)). */
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("1a"),
    22500,
    `${VERBAL}: the wages for her 60 Truckee workdays (W-2 box 16).`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("3b"),
    0,
    `${VERBAL}: dividends of a Nevada resident have no California source.`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("7a"),
    0,
    `${VERBAL}: Schedule D (540NR) Worksheet for Nonresidents, column B: no California-source sale.`,
  ),
];
