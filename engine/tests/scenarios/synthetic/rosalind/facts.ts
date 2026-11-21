/*
 * Made-up taxpayer (README.md): a W-2, one brokerage 1099-DIV and 1099-B with
 * three stock sales, and a California capital loss carryover from 2024 that the
 * federal return does not have. Amounts are whole dollars so that no rounding
 * hides a difference. No input documents: the facts are the only source.
 */

import {
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  makeDividendFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ROSALIND_USER_ID = "rosalind-synthetic";
export const ROSALIND_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";
const BROKER = "summit-brokerage";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ROSALIND_USER_ID,
  taxYear: ROSALIND_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ROSALIND_USER_ID, taxYear: ROSALIND_TAX_YEAR, suffix, value });

const w2: W2FactValue = {
  employerName: "Riverbend Analytics, Inc.",
  employerEin: "12-3456789",
  employerAddress: { line1: "200 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" },
  box1: 120000,
  box2: 17500,
  box3: 120000,
  box4: 7440,
  box5: 120000,
  box6: 1740,
  box14: [{ label: "CA SDI", amount: 1440 }],
  box15: "CA",
  box16: 120000,
  box17: 6800,
};

const dividends: DividendFactValue = {
  payerName: "Summit Brokerage",
  payerTin: "12-3456780",
  box1a: 1200,
  box1b: 900,
  box2a: 800,
};

/* The 1099-B: two long-term sales (box D) and one short-term sale (box A), basis reported. */
export const ROSALIND_SALES: TradeFactValue[] = [
  {
    tradeId: "smt-d-01",
    description: "ALPHA INDUSTRIES INC",
    quantity: 100,
    dateAcquired: "03/15/22",
    dateSold: "06/10/25",
    proceeds: 12000,
    costBasis: 8000,
  },
  {
    tradeId: "smt-d-02",
    description: "BETA MATERIALS CORP",
    quantity: 50,
    dateAcquired: "01/10/23",
    dateSold: "09/05/25",
    proceeds: 5000,
    costBasis: 6500,
  },
  {
    tradeId: "smt-a-01",
    description: "GAMMA ROBOTICS INC",
    quantity: 30,
    dateAcquired: "02/01/25",
    dateSold: "08/20/25",
    proceeds: 3000,
    costBasis: 2000,
  },
];

export const ROSALIND_BOXES: Record<string, string> = {
  "smt-d-01": "partII.boxD",
  "smt-d-02": "partII.boxD",
  "smt-a-01": "partI.boxA",
};

export const rosalindFacts: TaxFactRow[] = [
  idFact("name.first", "Rosalind"),
  idFact("name.last", "Okafor"),
  idFact("ssn", "400-00-0207"),
  idFact("dob", "05/14/1985"),
  idFact("address.street", "418 Juniper Lane"),
  idFact("address.city", "Sacramento"),
  idFact("address.state", "CA"),
  idFact("address.zip", "95818"),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Data analyst"),
  idFact("phone", "916-555-0142"),
  fact("wages", makeW2FactKey("riverbend-analytics"), w2, "W-2 from Riverbend Analytics, Inc."),
  fact(
    "investment_income",
    makeDividendFactKey(BROKER),
    dividends,
    "Summit Brokerage consolidated 1099-DIV.",
  ),
  ...ROSALIND_SALES.map((trade) =>
    fact(
      "investment_income",
      makeTradeFactKey(BROKER, trade.tradeId),
      trade,
      "Summit Brokerage consolidated 1099-B.",
    ),
  ),
  fact(
    "capital_gains",
    CA_CAPITAL_LOSS_CARRYOVER_KEY,
    2500,
    "Verbal: 2024 California Schedule D (540) carryover worksheet line 8. The federal return carries no loss over.",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    "Verbal: employer plan covered all of 2025.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
