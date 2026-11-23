/*
 * A made-up taxpayer (README.md): every name and amount is invented. The two
 * 1099-DIVs and the fund's foreign income statement are in docs/ (made by
 * generate-docs.ts from the values below); the other facts are the boxes as
 * the W-2, the 1099-INTs and the Form 1098 would print them.
 */

import {
  MORTGAGE_KEYS,
  PRIOR_YEAR_KEYS,
  makeDividendFactKey,
  makeForeignIncomeStatementKey,
  makeInterestFactKey,
  makeStatedForeignTaxKey,
  makeW2FactKey,
  type DividendFactValue,
  type ForeignIncomeStatementValue,
  type InterestFactValue,
  type StatedForeignTaxValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RAND_USER_ID = "rand-synthetic";
export const RAND_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

export const RAND = {
  firstName: "Rand",
  lastName: "Ostrander",
  ssn: "400-00-1116",
  street: "2817 Fremont Terrace N",
  city: "Seattle",
  state: "WA",
  zip: "98103",
};

const address = { line1: RAND.street, city: RAND.city, state: RAND.state, zip: RAND.zip };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RAND_USER_ID,
  taxYear: RAND_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* W-2: box 1 holds the wages for the London assignment too (the stated UK tax below). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Cascade Lumen Instruments, Inc.",
  employerEin: "00-0001116",
  employerAddress: { line1: "900 Westlake Ave N", city: "Seattle", state: "WA", zip: "98109" },
  employee: { firstName: RAND.firstName, lastName: RAND.lastName, ssn: RAND.ssn, address },
  box1: 185000,
  box2: 33600,
  box3: 176100,
  box4: 10918.2,
  box5: 185000,
  box6: 2682.5,
  box12: [{ code: "D", amount: 23500 }],
};

/* A mutual fund (a RIC): box 8 is blank, so line i says "RIC". */
export const FUND_SLUG = "larchmont-international";
export const fundDividends: DividendFactValue = {
  payerName: "Larchmont International Index Fund",
  payerTin: "00-0011160",
  box1a: 28640,
  box1b: 23915.4,
  box2a: 1240,
  box7: 2436.85,
};

/* The fund's year-end foreign income statement: the foreign-source part of box 1a and box 1b. */
export const fundForeignIncome: ForeignIncomeStatementValue = {
  grossIncome: 26880.25,
  qualifiedDividends: 21412.6,
};

/* A brokerage account holding one Dutch company's shares. */
export const BROKER_SLUG = "northgate-brokerage";
export const brokerDividends: DividendFactValue = {
  payerName: "Northgate Brokerage LLC",
  payerTin: "00-0021160",
  box1a: 3150,
  box1b: 3150,
  box7: 472.5,
};

/* Box 8 of the 1099-DIV names the Netherlands; the statement fact holds it. */
export const brokerForeignIncome: ForeignIncomeStatementValue = {
  grossIncome: 3150,
  qualifiedDividends: 3150,
  country: "Netherlands",
};

/* The same brokerage: interest on Australian government bonds. */
const brokerInterest: InterestFactValue = {
  payerName: "Northgate Brokerage LLC",
  payerTin: "00-0021160",
  box1: 4280,
  box6: 428,
  box7: "Australia",
};

const brokerInterestForeignIncome: ForeignIncomeStatementValue = { grossIncome: 4280 };

/* A U.S. bank: a certificate of deposit closed early (box 2, the penalty). */
const bankInterest: InterestFactValue = {
  payerName: "Puget Harbor Savings Bank",
  payerTin: "00-0031160",
  box1: 1860.4,
  box2: 85,
};

/* UK income tax on the wages for a three-month London assignment (general category). */
const ukTax: StatedForeignTaxValue = {
  payer: "Cascade Lumen Instruments, Inc. (London assignment)",
  country: "United Kingdom",
  category: "general",
  incomeKind: "other",
  description: "Wages",
  grossIncome: 42500,
  foreignTaxPaid: 9860,
  foreignTaxInForeignCurrency: 7712,
  datePaid: "Various",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RAND_USER_ID, taxYear: RAND_TAX_YEAR, suffix, value });

const dividendKey = (slug: string) => makeDividendFactKey(slug);
const interestKey = (slug: string) => makeInterestFactKey(slug);

export const randFacts: TaxFactRow[] = [
  idFact("name.first", RAND.firstName),
  idFact("name.last", RAND.lastName),
  idFact("ssn", RAND.ssn),
  idFact("dob", "03/09/1983"),
  idFact("address.street", RAND.street),
  idFact("address.city", RAND.city),
  idFact("address.state", RAND.state),
  idFact("address.zip", RAND.zip),
  idFact("occupation", "Optical engineer"),
  idFact("phone", "206-555-0116"),
  fact("wages", makeW2FactKey("cascade-lumen"), w2, "W-2 from Cascade Lumen Instruments."),
  fact(
    "investment_income",
    dividendKey(FUND_SLUG),
    fundDividends,
    "Form 1099-DIV (docs/01-1099-div-larchmont.pdf).",
  ),
  fact(
    "investment_income",
    makeForeignIncomeStatementKey(dividendKey(FUND_SLUG)),
    fundForeignIncome,
    "Larchmont foreign income statement (docs/02-foreign-income-larchmont.pdf).",
  ),
  fact(
    "investment_income",
    dividendKey(BROKER_SLUG),
    brokerDividends,
    "Form 1099-DIV (docs/03-1099-div-northgate.pdf).",
  ),
  fact(
    "investment_income",
    makeForeignIncomeStatementKey(dividendKey(BROKER_SLUG)),
    brokerForeignIncome,
    "Form 1099-DIV box 8 (docs/03-1099-div-northgate.pdf); verbal, 2026-11-22: the Dutch shares are the account's only dividends, all foreign source.",
  ),
  fact(
    "investment_income",
    interestKey(BROKER_SLUG),
    brokerInterest,
    "Form 1099-INT from Northgate.",
  ),
  fact(
    "investment_income",
    makeForeignIncomeStatementKey(interestKey(BROKER_SLUG)),
    brokerInterestForeignIncome,
    "Verbal, 2026-11-22: the interest is all from the Australian bonds.",
  ),
  fact(
    "investment_income",
    interestKey("puget-harbor"),
    bankInterest,
    "Form 1099-INT from Puget Harbor.",
  ),
  fact(
    "foreign",
    makeStatedForeignTaxKey("uk-assignment-2025"),
    ukTax,
    "Verbal, 2026-11-22: HMRC P60 for the London assignment; GBP 7,712 at the payment dates' rates.",
  ),
  fact(
    "other",
    PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive,
    310,
    "2024 Schedule B (Form 1116), line 4.",
  ),
  fact("other", PRIOR_YEAR_KEYS.foreignTaxCarryoverGeneral, 0, "Verbal, 2026-11-22: none."),
  fact("other", PRIOR_YEAR_KEYS.foreignLossAccounts, false, "Verbal, 2026-11-22: none."),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    16480,
    "Form 1098 from Rainier Home Loans, box 1.",
  ),
  fact("mortgage", MORTGAGE_KEYS.outstandingPrincipalForm1098, 410000, "Form 1098, box 2."),
  fact("mortgage", MORTGAGE_KEYS.originationDateForm1098, "06/14/2019", "Form 1098, box 3."),
  fact(
    "state_local_tax",
    "state_local_tax.real_estate",
    7240,
    "King County property tax bill, 2025.",
  ),
  fact(
    "state_local_tax",
    "state_local_tax.general_sales_tax",
    2315,
    "IRS sales tax calculator for Seattle, 2025.",
  ),
  fact("medical", "medical.expenses_total", 0, "Verbal, 2026-11-22: none."),
  fact("charitable", "charitable.cash", 1500, "Receipts from two charities."),
  fact("charitable", "charitable.noncash", 0, "Verbal, 2026-11-22: none."),
  fact("charitable", "charitable.carryover", 0, "Verbal, 2026-11-22: none."),
];
