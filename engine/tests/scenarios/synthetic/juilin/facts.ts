/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * documents have no PDFs: their facts are the boxes as they would print them.
 * The rest are her answers.
 */

import {
  BUSINESS_LOSS_LIMIT_KEYS,
  OTHER_INCOME_KEYS,
  RENTAL_KEYS,
  makeBusinessFactKey,
  makeDividendFactKey,
  makeK1HoldingFactKey,
  makeRentalFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DividendFactValue,
  type K1HoldingFactValue,
  type RentalFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JUILIN_USER_ID = "juilin-integration";
export const JUILIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JUILIN_USER_ID,
  taxYear: JUILIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JUILIN = {
  taxpayer: { firstName: "Juilin", lastName: "Torvane", ssn: "400-00-4611" },
  street: "461 Tremalking Way",
  city: "Reno",
  state: "NV",
  zip: "89501",
};

const address = { line1: JUILIN.street, city: JUILIN.city, state: JUILIN.state, zip: JUILIN.zip };
const street = { street: JUILIN.street, city: JUILIN.city, state: JUILIN.state, zip: JUILIN.zip };

/* Her W-2 from the shipping company she manages. */
const w2: W2FactValue = {
  employerName: "Sea Folk Shipping Lines, Inc.",
  employerEin: "00-0004611",
  employerAddress: address,
  employee: { ...JUILIN.taxpayer, address },
  box1: 380000,
  box2: 80000,
  box3: 176100,
  box4: 10918.2,
  box5: 380000,
  box6: 7130,
};

/* Her consulting business (Schedule C), with a profit. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Harbor logistics consulting",
  code: "541600",
  name: "Torvane Harbor Consulting",
  address: street,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 60000,
  expenses: { travel: 7000, legalAndProfessional: 5000, supplies: 6000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* A mutual fund: ordinary dividends and a capital gain distribution, no sales. */
const fundDividends: DividendFactValue = {
  payerName: "Illian Harbor Growth Fund",
  payerTin: "00-0004612",
  box1a: 2400,
  box1b: 2000,
  box2a: 30000,
};

/*
 * The K-1 of the shipyard she owns and runs (an S corporation): a large
 * ordinary loss from a new dry dock. No section 199A statement came with it.
 */
const SHIPYARD_ID = "tanchico-dry-dock";
const shipyardK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Tanchico Dry Dock, Inc.",
  entityEin: "00-0004613",
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 1000,
  sharesAtEnd: 1000,
  boxes: [{ box: "1", amount: -650000 }],
};

/* She works in the shipyard full time; all of her money in it is at risk. */
const shipyardHolding: K1HoldingFactValue = {
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 900000,
  stockAcquiredAs: "original_shareholder",
};

/* A house she rents out through a manager: an investment, not a trade or business. */
const rentalHouse: RentalFactValue = {
  propertyType: "single_family",
  address: { street: "12 Mayene Street", city: "Reno", state: "NV", zip: "89502" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 24000,
  expenses: {
    insurance: 1500,
    managementFees: 2400,
    repairs: 2500,
    taxes: 3000,
    depreciationOrDepletion: 2600,
  },
  activeParticipation: true,
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  disposedOfEntirely: false,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
  specifiedService: false,
};

/* Royalties from a book her late uncle wrote: portfolio income, with a loss this year. */
const bookRoyalty: RentalFactValue = {
  propertyType: "royalties",
  royaltiesReceived: 2000,
  expenses: { legalAndProfessional: 3500 },
  royaltyActivity: "portfolio",
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  qualifiedBusiness: false,
  specifiedService: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JUILIN_USER_ID, taxYear: JUILIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-23";

export const juilinFacts: TaxFactRow[] = [
  idFact("name.first", JUILIN.taxpayer.firstName),
  idFact("name.last", JUILIN.taxpayer.lastName),
  idFact("ssn", JUILIN.taxpayer.ssn),
  idFact("dob", "06/21/1975"),
  idFact("address.street", JUILIN.street),
  idFact("address.city", JUILIN.city),
  idFact("address.state", JUILIN.state),
  idFact("address.zip", JUILIN.zip),
  idFact("occupation", "Shipping manager"),
  idFact("phone", "775-555-0461"),
  fact("wages", makeW2FactKey("sea-folk-shipping"), w2, "W-2 from Sea Folk Shipping Lines, Inc."),
  fact(
    "self_employment",
    makeBusinessFactKey("torvane-harbor-consulting"),
    consulting,
    `${VERBAL}: receipts and expenses from her ledger.`,
  ),
  fact(
    "investment_income",
    makeDividendFactKey("illian-harbor"),
    fundDividends,
    "1099-DIV from Illian Harbor Growth Fund.",
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(SHIPYARD_ID),
    shipyardK1,
    "Schedule K-1 (Form 1120-S) from Tanchico Dry Dock, Inc.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(SHIPYARD_ID),
    shipyardHolding,
    `${VERBAL}: stock basis from her 2024 Form 7203 line 15.`,
  ),
  fact(
    "rental",
    makeRentalFactKey("mayene-street"),
    rentalHouse,
    `${VERBAL}: manager's statement.`,
  ),
  fact(
    "rental",
    makeRentalFactKey("book-royalty"),
    bookRoyalty,
    `${VERBAL}: publisher's statement.`,
  ),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, VERBAL),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, VERBAL),
  fact(
    "other",
    OTHER_INCOME_KEYS.otherItems,
    [{ description: "Recovery of a business bad debt (closed design studio)", amount: 6000 }],
    `${VERBAL}: a customer of her closed design studio paid a debt she deducted in 2022.`,
  ),
  fact(
    "other",
    BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome,
    6000,
    `${VERBAL}: the recovery on Schedule 1 line 8z comes from her former business (Form 461 line 8).`,
  ),
];
