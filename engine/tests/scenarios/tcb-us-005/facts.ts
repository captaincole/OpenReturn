/*
 * Source: TaxCalcBench ty25-us-005 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  RENTAL_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type RentalFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_US_005_USER_ID = "tcb-us-005-integration";
export const TCB_US_005_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-11T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_US_005_USER_ID,
  taxYear: TCB_US_005_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The couple as the documents print them. */
const HOUSEHOLD = {
  taxpayer: { firstName: "Real", lastName: "Professional", ssn: "900-45-6789" },
  spouse: { firstName: "Spouse", lastName: "Last", ssn: "900-45-6789" },
  street: "1 address",
  city: "city",
  state: "FL",
  zip: "33003",
};

const address = { line1: HOUSEHOLD.street, city: HOUSEHOLD.city, state: "FL", zip: "33003" };

// docs/01-employer-w2.pdf
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "employer",
  employerEin: "12-3456789",
  employerAddress: { line1: "1 add", city: "city", state: "AK", zip: "99999" },
  employee: {
    firstName: HOUSEHOLD.taxpayer.firstName,
    lastName: HOUSEHOLD.taxpayer.lastName,
    ssn: HOUSEHOLD.taxpayer.ssn,
    address,
  },
  box1: 420000,
  box2: 5000,
  box3: 168600,
  box4: 10453,
  box5: 420000,
  box6: 8070,
};

// docs/02-int-1099-int.pdf (the spouse's; the form prints no payer TIN)
const interest: InterestFactValue = { payerName: "int", box1: 600 };

// docs/03-div-1099-div.pdf (joint; the form prints no payer TIN)
const dividends: DividendFactValue = { payerName: "div", box1a: 1500, box1b: 1500 };

/* irs1040.dependent_detail[0]: the son, born 2021, in the home all year. Names and SSN from the key. */
const son: DependentFactValue = {
  firstName: "dependent",
  lastName: "last",
  ssn: "900-45-6789",
  relationship: "Son",
  dob: "12/12/2021",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

/* irs1040_schedulec[0]: receipts, no expenses, $200,000 of W-2 wages paid. */
const business: BusinessFactValue = {
  owner: "taxpayer",
  activity: "business",
  code: "999000", // "Unclassified establishments"; the key's PrincipalBusinessActivityCd
  address: {
    street: HOUSEHOLD.street,
    city: HOUSEHOLD.city,
    state: HOUSEHOLD.state,
    zip: HOUSEHOLD.zip,
  },
  accountingMethod: "cash",
  materiallyParticipated: true,
  sellsGoods: false, // Not in the answers; the key has no Part III.
  grossReceipts: 50000,
  specifiedService: false,
  w2WagesPaid: 200000,
  qualifiedPropertyUbia: 0, // Not in the answers; the key's Form 8995-A line 7 is blank.
};

/* scherentslist[0]: the jointly owned multi-family rental. */
export const multiFamily: RentalFactValue = {
  owner: "joint",
  propertyType: "multi_family",
  address: { street: "1 Add", city: "City", state: "FL", zip: "33003" },
  fairRentalDays: 365,
  personalUseDays: 0,
  qualifiedJointVenture: true, // Not in the answers; the key checks the QJV box (README, Needs a decision).
  rentsReceived: 1000,
  expenses: { advertising: 30000 },
  activeParticipation: true,
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0, // Not in the answers; the key's Form 8582 has none.
  disposedOfEntirely: false,
  qualifiedBusiness: true,
  // Not in the answers; the key takes the rental out of net investment income on Form 8960 line 4b.
  tradeOrBusiness: true,
  specifiedService: false,
  w2WagesPaid: 0, // Not in the answers; the key's Form 8995-A column A has no wages.
  qualifiedPropertyUbia: 0, // Not in the answers; likewise.
};

/* scherentslist[1]: the spouse's royalty, a passive activity. */
export const royalty: RentalFactValue = {
  owner: "spouse",
  propertyType: "royalties",
  royaltiesReceived: 2000,
  expenses: { legalAndProfessional: 5000 },
  royaltyActivity: "passive", // royalty_passive_portfolio "Passive"
  allInvestmentAtRisk: true, // Not in the answers; the key files no Form 6198.
  priorYearUnallowedLoss: 0, // Not in the answers; the key's Form 8582 has none.
  qualifiedBusiness: false,
  specifiedService: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_US_005_USER_ID, taxYear: TCB_US_005_TAX_YEAR, suffix, value });

export const tcbUs005Facts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "11/11/1981"),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  fact("identity", SPOUSE_KEYS.firstName, HOUSEHOLD.spouse.firstName, "1099-INT (docs/02)."),
  fact("identity", SPOUSE_KEYS.lastName, HOUSEHOLD.spouse.lastName, "1099-INT (docs/02)."),
  fact("identity", SPOUSE_KEYS.ssn, HOUSEHOLD.spouse.ssn, "Answer key header (SpouseSSN)."),
  fact("identity", SPOUSE_KEYS.dob, "12/12/1991", `${ANSWERS}: sp_date_of_birth.`),
  fact("wages", makeW2FactKey("employer"), w2, "W-2 from employer (docs/01-employer-w2.pdf)."),
  fact(
    "investment_income",
    makeInterestFactKey("int"),
    interest,
    "1099-INT from int (docs/02-int-1099-int.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("div"),
    dividends,
    "1099-DIV from div (docs/03-div-1099-div.pdf).",
  ),
  fact(
    "dependents",
    makeDependentFactKey("dependent-last"),
    son,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name and SSN from the key's DependentDetail.`,
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("business"),
    business,
    `${ANSWERS}: irs1040_schedulec[0].`,
  ),
  fact("rental", makeRentalFactKey("1-add"), multiFamily, `${ANSWERS}: scherentslist[0].`),
  fact("rental", makeRentalFactKey("royalties"), royalty, `${ANSWERS}: scherentslist[1].`),
  fact("rental", RENTAL_KEYS.realEstateProfessional, true, `${ANSWERS}: sche_gen.REProfessional.`),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, `${ANSWERS}: sche_gen.require1099.`),
];
