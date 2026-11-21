/*
 * Synthetic: the Morgan family is made up (README.md). No document or answer
 * key stands behind these facts; each sourceNote names the made-up document.
 */

import {
  SPOUSE_KEYS,
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MORGAN_USER_ID = "morgan-integration";
export const MORGAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";
const PAYER_TIN = "00-0000000";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MORGAN_USER_ID,
  taxYear: MORGAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const TAXPAYER = { firstName: "Avery", lastName: "Morgan", ssn: "900-71-4401" };
const SPOUSE = { firstName: "Riley", lastName: "Morgan", ssn: "900-71-4402" };
const HOME = { line1: "418 Cedar Hollow Dr", city: "Round Rock", state: "TX", zip: "78664" };

const averyW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Juniper Freight Co",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "200 Depot St", city: "Austin", state: "TX", zip: "78701" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 142350,
  box2: 14200,
  box3: 142350,
  box4: 8825.7,
  box5: 142350,
  box6: 2064.08,
};

const parentsInterest: InterestFactValue = {
  payerName: "Pecan Savings Bank",
  payerTin: PAYER_TIN,
  box1: 612,
};

/* Box 1a $1,240 alone is under Schedule B's $1,500; Form 8814 line 9 takes it over. */
const parentsDividends: DividendFactValue = {
  payerName: "Bluebonnet Index Fund",
  payerTin: PAYER_TIN,
  box1a: 1240,
  box1b: 980,
  box2a: 215,
};

/* One long-term sale, basis reported to the IRS (box D): Schedule D files. */
export const BROKER_TRADE_ID = "brk-d-01";
const fundSale: TradeFactValue = {
  tradeId: BROKER_TRADE_ID,
  description: "120 sh Bluebonnet Index Fund",
  dateAcquired: "03/15/2019",
  dateSold: "08/20/2025",
  proceeds: 18450,
  costBasis: 12175,
};

const child = (firstName: string, ssn: string, dob: string): DependentFactValue => ({
  firstName,
  lastName: "Morgan",
  ssn,
  relationship: "Daughter",
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

export const ELLIS = "ellis-morgan";
export const WREN = "wren-morgan";

/*
 * Child A, Ellis: line 4 $5,620 is over the $2,700 base amount, so lines 6–12
 * fill, and line 14 is $1,350 or more, so line 15 is the $135 maximum.
 */
const ellisIncome: ChildInvestmentIncomeFactValue = {
  taxableInterest: 1237,
  taxExemptInterest: 318,
  ordinaryDividends: 3486,
  qualifiedDividends: 2719,
  capitalGainDistributions: 897,
  estimatedTaxPaid: false,
  hadOtherIncome: false,
};

/* Child B, Wren: interest only, line 4 $2,085, between $1,350 and $2,700: line 15 is 10% of line 14. */
const wrenIncome: ChildInvestmentIncomeFactValue = {
  taxableInterest: 2085,
  estimatedTaxPaid: false,
  hadOtherIncome: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MORGAN_USER_ID, taxYear: MORGAN_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "06/04/1982"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, MADE_UP),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, MADE_UP),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, MADE_UP),
  fact("identity", SPOUSE_KEYS.dob, "11/23/1984", MADE_UP),
];

const PARENTS_INCOME: TaxFactRow[] = [
  fact("wages", makeW2FactKey("juniper-freight"), averyW2, `W-2 from Juniper Freight, ${MADE_UP}.`),
  fact(
    "investment_income",
    makeInterestFactKey("pecan-savings"),
    parentsInterest,
    `1099-INT from Pecan Savings Bank, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeDividendFactKey("bluebonnet"),
    parentsDividends,
    `1099-DIV from Bluebonnet Index Fund, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeTradeFactKey("pecan-brokerage", BROKER_TRADE_ID),
    fundSale,
    `1099-B from Pecan Brokerage, ${MADE_UP}.`,
  ),
];

const CHILDREN: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey(ELLIS),
    child("Ellis", "900-71-4403", "03/14/2011"),
    MADE_UP,
  ),
  fact(
    "dependents",
    makeDependentFactKey(WREN),
    child("Wren", "900-71-4404", "09/02/2015"),
    MADE_UP,
  ),
  fact(
    "dependents",
    makeChildInvestmentIncomeFactKey(ELLIS),
    ellisIncome,
    `Ellis's 1099-INT and 1099-DIV, and the parents' answers, ${MADE_UP}.`,
  ),
  fact(
    "dependents",
    makeChildInvestmentIncomeFactKey(WREN),
    wrenIncome,
    `Wren's 1099-INT, and the parents' answers, ${MADE_UP}.`,
  ),
];

export const morganFacts: TaxFactRow[] = [...IDENTITY, ...PARENTS_INCOME, ...CHILDREN];
