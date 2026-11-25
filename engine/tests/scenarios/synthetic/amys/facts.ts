/*
 * A made-up married couple (README.md): every name and amount is invented.
 * The foreign statements are in docs/ (generate-docs.ts); the W-2 has no
 * document, its facts are the boxes as it would print them.
 */

import {
  FOREIGN_ASSET_KEYS,
  SPOUSE_KEYS,
  makeDividendFactKey,
  makeForeignFinancialAssetFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type ExceptedFormsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";
import {
  alpenroseFund,
  baselCurrent,
  bolognaInterest,
  bolognaSavings,
  fjordlineDividends,
  fjordlineShares,
  polderInterest,
  polderNote,
  thamesBrokerage,
  thamesDividends,
  thamesSale,
} from "./assets.js";

export const AMYS_USER_ID = "amys-integration";
export const AMYS_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: AMYS_USER_ID,
  taxYear: AMYS_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const AMYS = {
  firstName: "Amys",
  lastName: "Halloran",
  ssn: "400-00-8938",
  street: "3108 Barton Hills Drive",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

export const CORIN = { firstName: "Corin", lastName: "Halloran", ssn: "400-00-8939" };

const address = { line1: AMYS.street, city: AMYS.city, state: AMYS.state, zip: AMYS.zip };

// Amys's W-2 from a made-up Austin engineering firm.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Lonestar Turbine Works Inc",
  employerEin: "00-0008938",
  employerAddress: { line1: "900 Congress Avenue", city: "Austin", state: "TX", zip: "78701" },
  employee: { firstName: AMYS.firstName, lastName: AMYS.lastName, ssn: AMYS.ssn, address },
  box1: 172400,
  box2: 27850,
  box3: 172400,
  box4: 10688.8,
  box5: 172400,
  box6: 2499.8,
};

/* Part IV: the one Form 8621 for the Alpenrose fund. */
const exceptedForms: ExceptedFormsFactValue = { form8621: 1 };

const asset = (slug: string, value: unknown, file: string) =>
  fact(
    "foreign",
    makeForeignFinancialAssetFactKey(slug),
    value,
    `Year-end statement (docs/${file}).`,
  );

/* The amounts and their dates as the statement prints them (assets.ts); the engine looks up the rates. */
const income = (key: string, value: unknown, file: string) =>
  fact("investment_income", key, value, `Year-end statement, page 2 (docs/${file}).`);

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: AMYS_USER_ID, taxYear: AMYS_TAX_YEAR, suffix, value });

export const amysFacts: TaxFactRow[] = [
  idFact("name.first", AMYS.firstName),
  idFact("name.last", AMYS.lastName),
  idFact("ssn", AMYS.ssn),
  idFact("dob", "04/09/1981"),
  idFact("address.street", AMYS.street),
  idFact("address.city", AMYS.city),
  idFact("address.state", AMYS.state),
  idFact("address.zip", AMYS.zip),
  idFact("occupation", "Mechanical engineer"),
  idFact("phone", "512-555-0193"),
  fact("identity", SPOUSE_KEYS.firstName, CORIN.firstName, "Stated by Amys."),
  fact("identity", SPOUSE_KEYS.lastName, CORIN.lastName, "Stated by Amys."),
  fact("identity", SPOUSE_KEYS.ssn, CORIN.ssn, "Stated by Corin."),
  fact("identity", SPOUSE_KEYS.dob, "12/02/1979", "Stated by Corin."),
  fact("identity", SPOUSE_KEYS.occupation, "Translator", "Stated by Corin."),
  fact("wages", makeW2FactKey("lonestar-turbine"), w2, "W-2 from Lonestar Turbine Works Inc."),
  asset("bologna-savings", bolognaSavings, "01-banca-saragozza-savings.pdf"),
  income(makeInterestFactKey("bologna-savings"), bolognaInterest, "01-banca-saragozza-savings.pdf"),
  asset("thames-brokerage", thamesBrokerage, "02-thames-crown-custody.pdf"),
  income(makeDividendFactKey("thames-brokerage"), thamesDividends, "02-thames-crown-custody.pdf"),
  income(
    makeTradeFactKey("thames-brokerage", thamesSale.tradeId),
    thamesSale,
    "02-thames-crown-custody.pdf",
  ),
  asset("basel-current", baselCurrent, "03-rheinknie-current.pdf"),
  asset("fjordline-shares", fjordlineShares, "04-fjordline-register.pdf"),
  income(makeDividendFactKey("fjordline-shares"), fjordlineDividends, "04-fjordline-register.pdf"),
  asset("polder-note", polderNote, "05-polder-grid-note.pdf"),
  income(makeInterestFactKey("polder-note"), polderInterest, "05-polder-grid-note.pdf"),
  asset("alpenrose-fund", alpenroseFund, "06-alpenrose-fund.pdf"),
  fact(
    "foreign",
    FOREIGN_ASSET_KEYS.livesAbroad,
    false,
    "Verbal, 2026-11-23: both live in Austin all year.",
  ),
  fact(
    "foreign",
    FOREIGN_ASSET_KEYS.exceptedForms,
    exceptedForms,
    "Verbal, 2026-11-23: one Form 8621 for the Alpenrose fund.",
  ),
];
