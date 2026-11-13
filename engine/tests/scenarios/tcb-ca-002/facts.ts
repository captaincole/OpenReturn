/*
 * Source: TaxCalcBench ty25-ca-002 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  makeBusinessFactKey,
  makeDependentFactKey,
  makeInterestFactKey,
  makeSocialSecurityFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentFactValue,
  type InterestFactValue,
  type SocialSecurityFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_002_USER_ID = "tcb-ca-002-integration";
export const TCB_CA_002_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_002_USER_ID,
  taxYear: TCB_CA_002_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the documents print her (generate-docs.ts reads it too). */
export const TAXPAYER = { firstName: "Carol", lastName: "Johnson", ssn: "900-45-6789" };
export const HOME = {
  street: "333 N 3rd",
  apt: "897",
  city: "Juneau",
  state: "CA",
  zip: "94612",
  county: "Yuba",
};
const address = { line1: HOME.street, city: HOME.city, state: HOME.state, zip: HOME.zip };

// docs/01-employer-name-w2.pdf
const w2: W2FactValue = {
  employerName: "Employer Name",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "124 S Street", city: "Juneau", state: "AK", zip: "99801" },
  employee: { ...TAXPAYER, address },
  box1: 65111,
  box2: 7471,
  box3: 15111,
  box4: 937,
  box5: 15111,
  box6: 219,
  box15: "CA",
  box16: 65111,
  box17: 1079,
};

// docs/02-payer-name-1099-int.pdf: box 2 is the penalty on early withdrawal of savings.
const interest: InterestFactValue = {
  payerName: "Payer Name",
  box1: 6222,
  box2: 1212,
  box4: 89,
};

/*
 * docs/03-ssa-1099.pdf (made by us from the answers; generate-docs.ts). The answers
 * give box 5; box 3 assumes no benefits were repaid, as for tcb-us-003.
 */
export const ssa: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 15500,
  box5: 15500,
};

/* irs1040_schedulec[0]: gig delivery work, cash method. */
const delivery: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Gig Work",
  code: "541310", // business_code "Architectural services"
  name: "Carol's Delivery",
  ein: PAYER_TIN,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false, // Not in the answers: no cost of goods sold or inventory is given.
  grossReceipts: 25322,
  expenses: { insurance: 234, legalAndProfessional: 6522 },
  specifiedService: false,
};

/*
 * irs1040.dependent_detail[0] and ca_form3532: the son, born 12/12/2024, in the
 * home all year. The name and SSN are the 3532 answers'; the relationship is the
 * key's 540 dependent row ("Son"; the 3532 answer says "Stepson", README.md).
 */
const son: DependentFactValue = {
  firstName: "Only",
  lastName: "Johnson",
  ssn: "900-45-6789",
  relationship: "Son",
  dob: "12/12/2024",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

const idFact = (suffix: string, value: string, sourceNote?: string) =>
  identityFact({
    userId: TCB_CA_002_USER_ID,
    taxYear: TCB_CA_002_TAX_YEAR,
    suffix,
    value,
    sourceNote,
  });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "12/12/1993", `${ANSWERS}: irs1040.tp_date_of_birth.`),
  idFact("address.street", HOME.street),
  idFact("address.apt", HOME.apt, "The key's header (AptNumber)."),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", HOME.county, `${ANSWERS}: ca_form540.county_in_ca.`),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("employer-name"),
    w2,
    "W-2 from Employer Name (docs/01-employer-name-w2.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("payer-name"),
    interest,
    "1099-INT from Payer Name (docs/02-payer-name-1099-int.pdf).",
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), ssa, "SSA-1099 (docs/03-ssa-1099.pdf)."),
];

const ANSWER_FACTS: TaxFactRow[] = [
  fact(
    "self_employment",
    makeBusinessFactKey("carols-delivery"),
    delivery,
    `${ANSWERS}: irs1040_schedulec[0].`,
  ),
  fact(
    "dependents",
    makeDependentFactKey("only-johnson"),
    son,
    `${ANSWERS}: irs1040.dependent_detail[0] and ca_form3532.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
];

export const tcbCa002Facts: TaxFactRow[] = [...IDENTITY, ...DOCUMENTS, ...ANSWER_FACTS];
