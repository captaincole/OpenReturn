/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the two W-2s, the 1099-DIV and the
 * 1099-B would print them, and her answers.
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
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

export const NILDRA_USER_ID = "nildra-synthetic";
export const NILDRA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const BROKER = "harbor-light-brokerage";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NILDRA_USER_ID,
  taxYear: NILDRA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NILDRA = {
  firstName: "Nildra",
  lastName: "Venhollow",
  ssn: "400-00-5501",
  street: "2207 Coronado Vista Way",
  city: "San Diego",
  state: "CA",
  zip: "92109",
};

const address = { line1: NILDRA.street, city: NILDRA.city, state: NILDRA.state, zip: NILDRA.zip };
const employee = {
  firstName: NILDRA.firstName,
  lastName: NILDRA.lastName,
  ssn: NILDRA.ssn,
  address,
};

/* January to August, while she lived in Portland: an Oregon employer. */
const portlandW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Willamette Gearworks Inc",
  employerEin: "00-0005501",
  employerAddress: { line1: "900 SW Fifth Avenue", city: "Portland", state: "OR", zip: "97204" },
  employee,
  box1: 78000,
  box2: 9100,
  box3: 78000,
  box4: 4836,
  box5: 78000,
  box6: 1131,
  box15: "OR",
  box16: 78000,
  box17: 6200,
};

/* September to December, in San Diego: the California employer. */
const sanDiegoW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Point Loma Marine Systems Inc",
  employerEin: "00-0005502",
  employerAddress: { line1: "1450 Harbor Drive", city: "San Diego", state: "CA", zip: "92101" },
  employee,
  box1: 36000,
  box2: 4100,
  box3: 36000,
  box4: 2232,
  box5: 36000,
  box6: 522,
  box15: "CA",
  box16: 36000,
  box17: 1400,
};

const dividends: DividendFactValue = {
  payerName: "Harbor Light Brokerage",
  payerTin: "00-0005503",
  box1a: 2400,
  box1b: 1800,
  box2a: 1500,
};

/* The 1099-B, basis reported: two long-term sales (box D) and one short-term (box A). */
export const NILDRA_SALES: TradeFactValue[] = [
  {
    tradeId: "hlb-d-01",
    description: "CASCADE TIMBER CO",
    quantity: 200,
    dateAcquired: "05/04/2016",
    dateSold: "03/18/2025",
    proceeds: 40000,
    costBasis: 30000,
  },
  {
    tradeId: "hlb-d-02",
    description: "LAKESHORE FREIGHT INC",
    quantity: 500,
    dateAcquired: "07/01/1985",
    dateSold: "10/14/2025",
    proceeds: 12000,
    costBasis: 20000,
  },
  {
    tradeId: "hlb-a-01",
    description: "NORTHWIND SOLAR ETF",
    quantity: 80,
    dateAcquired: "02/10/2025",
    dateSold: "11/03/2025",
    proceeds: 6200,
    costBasis: 7000,
  },
];

export const NILDRA_BOXES: Record<string, string> = {
  "hlb-d-01": "partII.boxD",
  "hlb-d-02": "partII.boxD",
  "hlb-a-01": "partI.boxA",
};

/* Part I: she moved from Portland, Oregon to San Diego on September 1, 2025. */
const residency: CaResidencyFactValue = {
  residency: "part_year_resident",
  domicileState: "CA",
  becameResident: { state: "OR", date: "09/01/2025" },
  daysInCalifornia: 128,
  ownedCaliforniaProperty: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NILDRA_USER_ID, taxYear: NILDRA_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-26";

export const nildraFacts: TaxFactRow[] = [
  idFact("name.first", NILDRA.firstName),
  idFact("name.last", NILDRA.lastName),
  idFact("ssn", NILDRA.ssn),
  idFact("dob", "11/02/1961"),
  idFact("address.street", NILDRA.street),
  idFact("address.city", NILDRA.city),
  idFact("address.state", NILDRA.state),
  idFact("address.zip", NILDRA.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Marine engineer"),
  idFact("phone", "619-555-0155"),
  fact(
    "wages",
    makeW2FactKey("willamette-gearworks"),
    portlandW2,
    "W-2 from Willamette Gearworks Inc.",
  ),
  fact(
    "wages",
    makeW2FactKey("point-loma-marine"),
    sanDiegoW2,
    "W-2 from Point Loma Marine Systems Inc.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey(BROKER),
    dividends,
    "Harbor Light Brokerage consolidated 1099-DIV.",
  ),
  ...NILDRA_SALES.map((trade) =>
    fact(
      "investment_income",
      makeTradeFactKey(BROKER, trade.tradeId),
      trade,
      "Harbor Light Brokerage consolidated 1099-B.",
    ),
  ),
  /*
   * Lakeshore Freight was an S corporation when she bought in 1985. California
   * did not recognize S corporations before 1987, so the pre-1987 losses that
   * cut her federal basis never cut her California basis
   * (ca-540nr-sched-d-inst-2025::sec::line-1::b03).
   */
  fact(
    "capital_gains",
    makeCaliforniaBasisFactKey(BROKER, "hlb-d-02"),
    26000,
    `${VERBAL}: her basis records for the Lakeshore Freight shares, California column.`,
  ),
  fact(
    "capital_gains",
    CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm,
    2000,
    `${VERBAL}: 2024 federal Capital Loss Carryover Worksheet line 8.`,
  ),
  /* Line 6: her 2024 carryover restated as if she had been a California resident in all prior years. */
  fact(
    "capital_gains",
    CA_CAPITAL_LOSS_CARRYOVER_KEY,
    6500,
    `${VERBAL}: 2024 carryover restated as if a California resident for all prior years (FTB Pub. 1100).`,
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
    `${VERBAL}: the move and the dates.`,
  ),
  /* Column E: what she earned or received while a California resident (Schedule CA (540NR)). */
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("1a"),
    36000,
    `${VERBAL}: all of the Point Loma wages, none of the Oregon wages.`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("3b"),
    800,
    `${VERBAL}: the dividends paid September to December (her monthly statements).`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("7a"),
    -3000,
    `${VERBAL}: Schedule D (540NR) Worksheet for Part-Year Residents, line 5, column E.`,
  ),
];
