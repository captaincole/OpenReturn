/*
 * Source: TaxCalcBench ty25-ca-004 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  BLINDNESS_KEYS,
  CA_EITC_KEYS,
  EIC_KEYS,
  ELDERLY_OR_DISABLED_KEYS,
  SPOUSE_KEYS,
  STUDENT_LOAN_KEYS,
  makeDependentFactKey,
  makeInterestFactKey,
  makeSocialSecurityFactKey,
  makeStudentLoanInterestFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type InterestFactValue,
  type SocialSecurityFactValue,
  type StudentLoanInterestFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_004_USER_ID = "tcb-ca-004-integration";
export const TCB_CA_004_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-13T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_004_USER_ID,
  taxYear: TCB_CA_004_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The couple as the documents print them (generate-docs.ts reads it too). */
export const HOUSEHOLD = {
  taxpayer: { firstName: "Sam", lastName: "Legend", ssn: "900-45-6789" },
  spouse: { firstName: "Lisa", lastName: "Legend", ssn: "900-45-6789" },
  street: "111 Sunnydale Ln",
  city: "San Francisco",
  state: "CA",
  zip: "94117",
  county: "San Francisco",
};
const address = {
  line1: HOUSEHOLD.street,
  city: HOUSEHOLD.city,
  state: HOUSEHOLD.state,
  zip: HOUSEHOLD.zip,
};

// docs/01-college-employer-w2.pdf (the spouse's)
const w2: W2FactValue = {
  owner: "spouse",
  employerName: "College Employer",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "111 College St", city: "San Francisco", state: "CA", zip: "94117" },
  employee: { ...HOUSEHOLD.spouse, address },
  box1: 5500,
  box2: 0,
  box3: 5500,
  box4: 341,
  box5: 5500,
  box6: 80,
  box7: 0,
  box8: 0,
  box10: 0,
  box11: 0,
  box15: "CA",
  box16: 5500,
  box17: 0,
};

// docs/02-ally-bank-1099-int.pdf (the taxpayer's)
const interest: InterestFactValue = {
  payerName: "ally bank",
  box1: 35,
  box2: 0,
  box3: 0,
  box4: 0,
};

// docs/03-column-student-loan-servicing-1098-e.pdf (the taxpayer's): box 2 is not checked.
const studentLoan: StudentLoanInterestFactValue = {
  lenderName: "Column Student Loan Servicing",
  box1: 1800,
  box2: false,
};

/*
 * docs/04-ssa-1099-sam.pdf and docs/05-ssa-1099-lisa.pdf (made by us from the
 * answers; generate-docs.ts). The answers give box 5 for each spouse; box 3
 * assumes nothing was repaid (box 3 = box 5), as for tcb-us-003.
 */
export const ssaTaxpayer: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 32000,
  box5: 32000,
};
export const ssaSpouse: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 28000,
  box5: 28000,
};

/*
 * irs1040.dependent_detail[0]: the grandchild, born 2024, in the home all year.
 * The name, SSN and relationship come from the key's dependent row.
 */
const grandchild: DependentFactValue = {
  firstName: "Grogu",
  lastName: "Legend",
  ssn: "900-45-6789",
  relationship: "Grandchild",
  dob: "09/10/2024",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

const idFact = (suffix: string, value: string, sourceNote?: string) =>
  identityFact({
    userId: TCB_CA_004_USER_ID,
    taxYear: TCB_CA_004_TAX_YEAR,
    suffix,
    value,
    sourceNote,
  });

const BLIND_NOTE =
  "Not in the answers: the key's Form 540 line 8 (Exemptions/Blind count 2), as last year's return checks both blind boxes.";

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.middle_initial", "I", "The key's header (Primary/MiddleInitial)."),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "03/14/1960", `${ANSWERS}: irs1040.tp_date_of_birth.`),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("address.county", HOUSEHOLD.county, `${ANSWERS}: ca_form540.county_in_ca.`),
  fact("identity", SPOUSE_KEYS.firstName, HOUSEHOLD.spouse.firstName, "W-2 (docs/01)."),
  fact("identity", SPOUSE_KEYS.middleInitial, "a", "The key's header (SpouseRDP/MiddleInitial)."),
  fact("identity", SPOUSE_KEYS.lastName, HOUSEHOLD.spouse.lastName, "W-2 (docs/01)."),
  fact("identity", SPOUSE_KEYS.ssn, HOUSEHOLD.spouse.ssn, "W-2 (docs/01)."),
  fact("identity", SPOUSE_KEYS.dob, "07/20/1944", `${ANSWERS}: irs1040.sp_date_of_birth.`),
  fact("identity", BLINDNESS_KEYS.taxpayer, true, BLIND_NOTE),
  fact("identity", BLINDNESS_KEYS.spouse, true, BLIND_NOTE),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("college-employer"),
    w2,
    "W-2 from College Employer (docs/01-college-employer-w2.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("ally-bank"),
    interest,
    "1099-INT from ally bank (docs/02-ally-bank-1099-int.pdf).",
  ),
  fact(
    "education",
    makeStudentLoanInterestFactKey("column-student-loan-servicing"),
    studentLoan,
    "Form 1098-E from Column Student Loan Servicing (docs/03-column-student-loan-servicing-1098-e.pdf).",
  ),
  fact(
    "retirement",
    makeSocialSecurityFactKey("ssa"),
    ssaTaxpayer,
    "SSA-1099, Sam (docs/04-ssa-1099-sam.pdf).",
  ),
  fact(
    "retirement",
    makeSocialSecurityFactKey("ssa-spouse"),
    ssaSpouse,
    "SSA-1099, Lisa (docs/05-ssa-1099-lisa.pdf).",
  ),
];

const ANSWER_FACTS: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey("grogu-legend"),
    grandchild,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name, SSN and relationship from the key.`,
  ),
  fact(
    "education",
    STUDENT_LOAN_KEYS.claimedAsDependent,
    false,
    `${ANSWERS}: irs1040.tp_dependent and sp_dependent are false.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  /* The earned income credit answers (1040 line 27a, FTB 3514 Steps 1 and 4). */
  fact("other", EIC_KEYS.nonresidentAlien, false, `${ANSWERS}: irs1040.nonresident_alien.`),
  fact("other", EIC_KEYS.mainHomeInUs, true, `${ANSWERS}: irs1040.main_home_not_us is false.`),
  fact("other", EIC_KEYS.claimableAsDependent, false, `${ANSWERS}: irs1040.tp_dependent.`),
  fact(
    "other",
    EIC_KEYS.qualifyingChildOfAnother,
    false,
    "Not in the case: the key's FTB 3514 credit means neither spouse is a qualifying child of another person.",
  ),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, `${ANSWERS}: irs1040.credit_denied_reduced.`),
  fact("other", EIC_KEYS.barredByIrs, false, `${ANSWERS}: irs1040.eic_not_allowed.`),
  fact(
    "other",
    ELDERLY_OR_DISABLED_KEYS.nontaxablePensions,
    0,
    "Not in the case: the answers list no pension or disability benefit other than Social Security (Schedule R line 13b).",
  ),
  fact(
    "other",
    CA_EITC_KEYS.ftbDisallowedEarlierYear,
    false,
    `${ANSWERS}: ca_form3514.prior_disallow_ca_eic_input.`,
  ),
];

export const tcbCa004Facts: TaxFactRow[] = [...IDENTITY, ...DOCUMENTS, ...ANSWER_FACTS];
