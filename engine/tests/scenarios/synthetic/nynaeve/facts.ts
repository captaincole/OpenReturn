/*
 * A made-up 17-year-old (README.md): every name and amount is invented. No
 * input documents: the facts are the boxes as the documents would print them,
 * and the answers the child and her parents state.
 */

import {
  CHILD_UNEARNED_INCOME_KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type InterestFactValue,
  type ParentReturnFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NYNAEVE_USER_ID = "nynaeve-integration";
export const NYNAEVE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const PAYER_TIN = "00-0008615";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NYNAEVE_USER_ID,
  taxYear: NYNAEVE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NYNAEVE = {
  firstName: "Nynaeve",
  lastName: "Thornbury",
  ssn: "400-00-8615",
  street: "2209 West Riverbend Lane",
  city: "Spokane",
  state: "WA",
  zip: "99201",
};

const address = {
  line1: NYNAEVE.street,
  city: NYNAEVE.city,
  state: NYNAEVE.state,
  zip: NYNAEVE.zip,
};

// Her W-2 from a garden center (made up): earned income, so line 1 uses the Child's Unearned Income Worksheet.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Latah Creek Garden Center LLC",
  employerEin: "00-0008616",
  employerAddress: { line1: "4410 South Grove Road", city: "Spokane", state: "WA", zip: "99224" },
  employee: { firstName: NYNAEVE.firstName, lastName: NYNAEVE.lastName, ssn: NYNAEVE.ssn, address },
  box1: 20000,
  box2: 900,
  box3: 20000,
  box4: 1240,
  box5: 20000,
  box6: 290,
};

// 1099-INT from a savings bank (made up).
const interest: InterestFactValue = {
  payerName: "Inland Empire Savings Bank",
  payerTin: PAYER_TIN,
  box1: 2600,
};

// 1099-DIV from a fund she inherited (made up): qualified dividends and capital gain distributions.
const dividends: DividendFactValue = {
  payerName: "Palouse Balanced Fund",
  payerTin: PAYER_TIN,
  box1a: 9400,
  box1b: 6200,
  box2a: 2300,
};

/*
 * The parents' joint 2025 return (made up), as they told her: line 15
 * $238,400, line 16 $41,866 (the Qualified Dividends and Capital Gain Tax
 * Worksheet), line 3a $4,100, net capital gain $7,500. Her brother Tobin's
 * Form 8615 line 5 is $3,400, with $900 of qualified dividends in it.
 */
export const PARENT_RETURN: ParentReturnFactValue = {
  name: "Garrick T. Thornbury",
  ssn: "400-00-8617",
  filingStatus: "married_filing_jointly",
  taxableIncome: 238400,
  tax: 41866,
  qualifiedDividends: 4100,
  netCapitalGain: 7500,
  otherChildren: [{ netUnearnedIncome: 3400, qualifiedDividends: 900, netCapitalGain: 0 }],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NYNAEVE_USER_ID, taxYear: NYNAEVE_TAX_YEAR, suffix, value });

const KEYS = CHILD_UNEARNED_INCOME_KEYS;

export const nynaeveFacts: TaxFactRow[] = [
  idFact("name.first", NYNAEVE.firstName),
  idFact("name.last", NYNAEVE.lastName),
  idFact("ssn", NYNAEVE.ssn),
  idFact("dob", "06/14/2008"),
  idFact("address.street", NYNAEVE.street),
  idFact("address.city", NYNAEVE.city),
  idFact("address.state", NYNAEVE.state),
  idFact("address.zip", NYNAEVE.zip),
  idFact("occupation", "Student"),
  idFact("phone", "509-555-0186"),
  fact("wages", makeW2FactKey("latah-creek-garden"), w2, "W-2 from Latah Creek Garden Center."),
  fact(
    "investment_income",
    makeInterestFactKey("inland-empire-savings"),
    interest,
    "1099-INT from Inland Empire Savings Bank.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("palouse-balanced"),
    dividends,
    "1099-DIV from Palouse Balanced Fund.",
  ),
  fact("other", KEYS.parentAlive, true, "Stated by Nynaeve: both parents are living."),
  fact(
    "other",
    KEYS.claimableAsDependent,
    false,
    "Stated by Nynaeve: she pays more than half of her own support, so nobody can claim her.",
  ),
  fact(
    "other",
    KEYS.parentReturn,
    PARENT_RETURN,
    "Stated by her parents from their 2025 joint Form 1040 and her brother's Form 8615.",
  ),
];
