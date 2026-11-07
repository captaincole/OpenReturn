/*
 * Source: TaxCalcBench ty25-us-004 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  GAMBLING_KEYS,
  INVESTMENT_INTEREST_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeSocialSecurityFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type SocialSecurityFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_US_004_USER_ID = "tcb-us-004-integration";
export const TCB_US_004_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-06T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_US_004_USER_ID,
  taxYear: TCB_US_004_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The couple as the documents print them (generate-docs.ts reads it too). */
export const HOUSEHOLD = {
  taxpayer: { firstName: "Madison", lastName: "Gray", ssn: "900-45-6789" },
  spouse: { firstName: "Salvester", lastName: "Slone", ssn: "900-45-6789" },
  street: "110 Maitland HWY",
  city: "Knoxville",
  state: "TN",
  zip: "37922",
};

const address = { line1: HOUSEHOLD.street, city: HOUSEHOLD.city, state: "TN", zip: "37922" };

// docs/01-employers-name-w2.pdf
const madisonW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Employers Name",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "1010 Forks Hwy", city: "City", state: "SC", zip: "29020" },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 160368,
  box2: 28027,
  box3: 164772,
  box4: 10216,
  box5: 164772,
  box6: 2389,
  box12: [{ code: "D", amount: 4403 }],
  box13: { retirementPlan: true },
  box15: "TN",
  box16: 160368,
  box17: 6794,
};

// docs/02-temp-agency-w2.pdf (the spouse's)
const salvesterW2: W2FactValue = {
  owner: "spouse",
  employerName: "Temp agency",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "202 Concord Blvd", city: "City", state: "NY", zip: "10003" },
  employee: { ...HOUSEHOLD.spouse, address },
  box1: 34000,
  box2: 3400,
  box3: 40000,
  box4: 2480,
  box5: 40000,
  box6: 580,
  box15: "TN",
  box16: 34000,
  box17: 1287,
};

// docs/03-social-finance-1099-int.pdf
const interest: InterestFactValue = { payerName: "Social Finance", payerTin: PAYER_TIN, box1: 330 };

// docs/04-ibm-1099-div.pdf
const dividends: DividendFactValue = {
  payerName: "IBM",
  payerTin: PAYER_TIN,
  box1a: 4870,
  box1b: 4870,
};

/* docs/05-etrade-1099-b.pdf: one long-term sale, basis reported to the IRS (box D). */
export const ETRADE_TRADE_ID = "etr-d-01";
const intuitSale: TradeFactValue = {
  tradeId: ETRADE_TRADE_ID,
  description: "intuit stock",
  dateAcquired: "12/01/2021",
  dateSold: "11/27/2025",
  proceeds: 76100,
  costBasis: 38991,
};

/*
 * docs/06-ssa-1099.pdf (made by us from the answers; generate-docs.ts). The answers
 * give boxes 5 and 6; box 3 assumes no benefits were repaid, as for tcb-us-003.
 */
export const ssa: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 19860,
  box5: 19860,
  box6: 1986,
};

/* irs1040.dependent_detail[0]: the niece, born 2014, in the home all year. Names and SSN from the key's header. */
const niece: DependentFactValue = {
  firstName: "Jessica",
  lastName: "Davies",
  ssn: "900-45-6789",
  relationship: "Niece",
  dob: "08/12/2014",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

/* irs1040_schedulec[0]: a consulting business with receipts and no expenses. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "consultant",
  code: "541219", // business_code "Other accounting services"; the key's PrincipalBusinessActivityCd
  address: {
    street: HOUSEHOLD.street,
    city: HOUSEHOLD.city,
    state: HOUSEHOLD.state,
    zip: HOUSEHOLD.zip,
  },
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  sellsGoods: false, // Not in the answers: a consultant sells a service; the key has no Part III.
  grossReceipts: 3882,
  specifiedService: true, // Accounting is a specified service; taxable income is under the threshold.
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_US_004_USER_ID, taxYear: TCB_US_004_TAX_YEAR, suffix, value });

export const tcbUs004Facts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "03/10/1983"),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  fact(
    "identity",
    SPOUSE_KEYS.firstName,
    HOUSEHOLD.spouse.firstName,
    "W-2 from Temp agency (docs/02).",
  ),
  fact(
    "identity",
    SPOUSE_KEYS.lastName,
    HOUSEHOLD.spouse.lastName,
    "W-2 from Temp agency (docs/02).",
  ),
  fact("identity", SPOUSE_KEYS.ssn, HOUSEHOLD.spouse.ssn, "W-2 from Temp agency (docs/02)."),
  fact("identity", SPOUSE_KEYS.dob, "09/22/1986", `${ANSWERS}: sp_date_of_birth.`),
  fact(
    "wages",
    makeW2FactKey("employers-name"),
    madisonW2,
    "W-2 from Employers Name (docs/01-employers-name-w2.pdf).",
  ),
  fact(
    "wages",
    makeW2FactKey("temp-agency"),
    salvesterW2,
    "W-2 from Temp agency (docs/02-temp-agency-w2.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("social-finance"),
    interest,
    "1099-INT from Social Finance (docs/03-social-finance-1099-int.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("ibm"),
    dividends,
    "1099-DIV from IBM (docs/04-ibm-1099-div.pdf).",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("etrade", ETRADE_TRADE_ID),
    intuitSale,
    "1099-B from Etrade (docs/05-etrade-1099-b.pdf).",
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), ssa, "SSA-1099 (docs/06-ssa-1099.pdf)."),
  fact(
    "self_employment",
    makeBusinessFactKey("consulting"),
    consulting,
    `${ANSWERS}: irs1040_schedulec[0].`,
  ),
  fact(
    "dependents",
    makeDependentFactKey("jessica-davies"),
    niece,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name and SSN from the key's header.`,
  ),
  /* f4952: no interest paid this year; a $650 carryover; $320 of qualified dividends elected as investment income. */
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    650,
    `${ANSWERS}: f4952.COfromBefore.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
    320,
    `${ANSWERS}: f4952.qualDivLineElectedInvest.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.investmentExpenses,
    0,
    `${ANSWERS}: no investment expenses given.`,
  ),
  fact(
    "state_local_tax",
    "state_local_tax.allocable_to_investment_income",
    1326,
    `${ANSWERS}: f8960.stateIncTax.`,
  ),
  fact(
    "other",
    GAMBLING_KEYS.winningsNotOnW2G,
    700,
    `${ANSWERS}: addtl_income.OtherGamblingIncomeAmtTP (no W-2G).`,
  ),
  /* Schedule A answers (scha_gft, med_exp). Medical is the four med_exp boxes added. */
  fact("charitable", "charitable.cash", 25000, `${ANSWERS}: scha_gft.qualifiedContrCash.`),
  fact(
    "charitable",
    "charitable.noncash",
    5000,
    `${ANSWERS}: scha_gft.nonCash50 (the 11 f8283list items' FMVs add to the same 5,000).`,
  ),
  fact(
    "medical",
    "medical.expenses_total",
    8286,
    `${ANSWERS}: med_exp 4,550 + 130 + 3,556 + 50 (doctors and dentists, prescriptions).`,
  ),
];
