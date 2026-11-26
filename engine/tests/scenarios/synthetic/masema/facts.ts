/*
 * Made-up taxpayer (README.md): a W-2, a credit union 1099-INT, one brokerage
 * 1099-DIV and 1099-B with two stock sales that net to a capital loss, and two
 * California carryovers from her 2024 FTB 3805V: a 2018 disaster loss and a
 * 2020 general NOL. The federal return has no NOL: the CARES Act let her carry
 * both federal losses back, and California allowed no carryback. Every name and
 * number is invented. No input documents: the facts are the only source.
 */

import {
  CA_NOL_CATEGORY,
  CA_NOL_KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type CaNolCarryoverRow,
  type DividendFactValue,
  type InterestFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MASEMA_USER_ID = "masema-synthetic";
export const MASEMA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const BROKER = "redwood-brokerage";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MASEMA_USER_ID,
  taxYear: MASEMA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MASEMA_USER_ID, taxYear: MASEMA_TAX_YEAR, suffix, value });

const w2: W2FactValue = {
  employerName: "Feather River Logistics, Inc.",
  employerEin: "12-3456782",
  employerAddress: { line1: "75 Levee Road", city: "Oroville", state: "CA", zip: "95965" },
  box1: 82000,
  box2: 9100,
  box3: 82000,
  box4: 5084,
  box5: 82000,
  box6: 1189,
  box14: [{ label: "CA SDI", amount: 984 }],
  box15: "CA",
  box16: 82000,
  box17: 2900,
};

const interest: InterestFactValue = { payerName: "Butte Valley Credit Union", box1: 900 };

const dividends: DividendFactValue = {
  payerName: "Redwood Brokerage",
  payerTin: "12-3456783",
  box1a: 1400,
  box1b: 1000,
  box2a: 600,
};

/* The 1099-B: a long-term loss and a long-term gain (box D), basis reported. */
export const MASEMA_SALES: TradeFactValue[] = [
  {
    tradeId: "rwb-d-01",
    description: "DELTA AIRFRAME CORP",
    quantity: 200,
    dateAcquired: "04/02/21",
    dateSold: "05/14/25",
    proceeds: 6000,
    costBasis: 15000,
  },
  {
    tradeId: "rwb-d-02",
    description: "EPSILON FOODS INC",
    quantity: 80,
    dateAcquired: "07/19/22",
    dateSold: "10/03/25",
    proceeds: 9000,
    costBasis: 5000,
  },
];

export const MASEMA_BOXES: Record<string, string> = {
  "rwb-d-01": "partII.boxD",
  "rwb-d-02": "partII.boxD",
};

/* Her 2024 FTB 3805V, Part III column (h): the carryovers to 2025. */
const carryovers: CaNolCarryoverRow[] = [
  { yearOfLoss: 2020, type: "GEN", initialLoss: 95000, carryoverFrom2024: 68000 },
  { yearOfLoss: 2018, code: "107", type: "DIS", initialLoss: 40000, carryoverFrom2024: 22000 },
];

export const masemaFacts: TaxFactRow[] = [
  idFact("name.first", "Masema"),
  idFact("name.last", "Thornwood"),
  idFact("ssn", "400-00-0425"),
  idFact("dob", "09/03/1979"),
  idFact("address.street", "1290 Table Mountain Blvd"),
  idFact("address.city", "Oroville"),
  idFact("address.state", "CA"),
  idFact("address.zip", "95965"),
  idFact("address.county", "Butte"),
  idFact("occupation", "Dispatcher"),
  idFact("phone", "530-555-0188"),
  fact("wages", makeW2FactKey("feather-river"), w2, "W-2 from Feather River Logistics, Inc."),
  fact(
    "investment_income",
    makeInterestFactKey("butte-valley-cu"),
    interest,
    "1099-INT, Butte Valley Credit Union.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey(BROKER),
    dividends,
    "Redwood Brokerage consolidated 1099-DIV.",
  ),
  ...MASEMA_SALES.map((trade) =>
    fact(
      "investment_income",
      makeTradeFactKey(BROKER, trade.tradeId),
      trade,
      "Redwood Brokerage consolidated 1099-B.",
    ),
  ),
  fact(
    CA_NOL_CATEGORY,
    CA_NOL_KEYS.priorYearCarryovers,
    carryovers,
    "Verbal: 2024 FTB 3805V, Part III, column (h): the 2020 general NOL and the 2018 Camp Fire disaster loss (code 107).",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    "Verbal: employer plan covered all of 2025.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
