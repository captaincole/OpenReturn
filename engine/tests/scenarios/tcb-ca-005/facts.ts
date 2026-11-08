/*
 * Source: TaxCalcBench ty25-ca-005 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  AMT_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  INVESTMENT_INTEREST_KEYS,
  MORTGAGE_KEYS,
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  makeSocialSecurityFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_005_USER_ID = "tcb-ca-005-integration";
export const TCB_CA_005_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-07T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_005_USER_ID,
  taxYear: TCB_CA_005_TAX_YEAR,
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
  street: "1111 Grove Park Rd",
  city: "Los Angeles",
  state: "CA",
  zip: "90210",
  county: "Los Angeles",
};

const address = { line1: HOUSEHOLD.street, city: HOUSEHOLD.city, state: "CA", zip: "90210" };

// docs/01-employers-name-w2.pdf
const madisonW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Employers Name",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "111 Test St", city: "Los Angeles", state: "CA", zip: "90210" },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 160368,
  box2: 28027,
  box3: 164772,
  box4: 10216,
  box5: 164772,
  box6: 2389,
  box12: [{ code: "D", amount: 4403 }],
  box13: { retirementPlan: true },
  box15: "CA",
  box16: 160368,
  box17: 6794,
};

// docs/02-temp-agency-w2.pdf (the spouse's)
const salvesterW2: W2FactValue = {
  owner: "spouse",
  employerName: "Temp agency",
  employerEin: PAYER_TIN,
  employerAddress: {
    line1: "222 California Ave",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
  },
  employee: { ...HOUSEHOLD.spouse, address },
  box1: 34000,
  box2: 3400,
  box3: 40000,
  box4: 2480,
  box5: 40000,
  box6: 580,
  box15: "CA",
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

/* docs/05-etrade-1099-b.pdf: the spouse's long-term sale, basis reported to the IRS (box D). */
export const ETRADE_TRADE_ID = "etr-d-01";
const intuitSale: TradeFactValue = {
  tradeId: ETRADE_TRADE_ID,
  description: "intuit stock",
  dateAcquired: "12/01/2021",
  dateSold: "11/27/2025",
  proceeds: 76100,
  costBasis: 38991,
};

/* docs/06-adp-services-1099-r.pdf: the spouse's early distribution (code 1) from a pension plan. */
export const ADP_DISTRIBUTION_ID = "adp-1";
const pension: RetirementDistributionFactValue = {
  payerName: "ADP Services",
  payerTin: PAYER_TIN,
  owner: "spouse",
  box1: 18773,
  box2a: 11207,
  box4: 1121,
  box5: 7566,
  box7: "1",
  box7IraSepSimple: false,
};

/*
 * docs/08-ssa-1099.pdf (made by us from the answers; generate-docs.ts). The answers
 * give boxes 5 and 6; box 3 assumes no benefits were repaid, as for tcb-us-003.
 */
export const ssa: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 19860,
  box5: 19860,
  box6: 1986,
};

/* irs1040.dependent_detail[0]: the niece, born 2014, in the home all year. Names and SSN from the key. */
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

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_CA_005_USER_ID, taxYear: TCB_CA_005_TAX_YEAR, suffix, value });

export const tcbCa005Facts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "03/10/1983"),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("address.county", HOUSEHOLD.county),
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
  fact(
    "retirement",
    makeRetirementDistributionFactKey("adp-services", ADP_DISTRIBUTION_ID),
    pension,
    "1099-R from ADP Services (docs/06-adp-services-1099-r.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    8059,
    "Form 1098 from Chase Bank, box 1; no points in box 6 (docs/07-chase-bank-1098.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    245552,
    "Form 1098 from Chase Bank, box 2 (docs/07-chase-bank-1098.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "10/10/2021",
    "Form 1098 from Chase Bank, box 3 (docs/07-chase-bank-1098.pdf).",
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), ssa, "SSA-1099 (docs/08-ssa-1099.pdf)."),
  fact(
    "dependents",
    makeDependentFactKey("jessica-davies"),
    niece,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name and SSN from the key's header.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  fact(
    "other",
    CA_MISC_DEDUCTION_KEYS.investmentFees,
    0,
    `${ANSWERS}: no investment fees among the deductions (Schedule CA Part II line 21).`,
  ),
  /* Schedule A answers (scha_tax, scha_gft, med_exp). Medical is the four med_exp boxes added. */
  fact("state_local_tax", "state_local_tax.real_estate", 1900, `${ANSWERS}: scha_tax.taxRE.`),
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
  /* f4952: $1,250 of interest paid, a $650 carryover, $1,570 of qualified dividends elected as investment income. */
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.expensePaid,
    1250,
    `${ANSWERS}: f4952.currentYearExpenses.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    650,
    `${ANSWERS}: f4952.COfromBefore.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
    1570,
    `${ANSWERS}: f4952.qualDivLineElectedInvest.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.investmentExpenses,
    0,
    `${ANSWERS}: no investment expenses given.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.caDisallowedCarryover,
    650,
    "The key's FTB 3526 line 2: the answers give one carryover (f4952.COfromBefore), and the key applies it to California.",
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.caAmtDisallowedCarryover,
    650,
    "The key's Schedule P line 7 is blank: the AMT carryover equals the regular one.",
  ),
  fact(
    "state_local_tax",
    "state_local_tax.allocable_to_investment_income",
    1151,
    `${ANSWERS}: f8960.stateIncTax.`,
  ),
  /* f6251.stockOption: the incentive stock option spread (Schedule P (540) and Form 6251). */
  fact("other", AMT_KEYS.isoExerciseSpread, 275000, `${ANSWERS}: f6251.stockOption.`),
];
