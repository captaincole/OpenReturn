/*
 * A made-up couple (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1120-S) with its section 199A statement is a made PDF in
 * docs/ (generate-docs.ts); the W-2, the 1099-R and the 1098-E have none:
 * their facts are the boxes as they would print them. The rest are the
 * couple's answers.
 */

import {
  OTHER_INCOME_KEYS,
  SPOUSE_KEYS,
  STUDENT_LOAN_KEYS,
  makeK1HoldingFactKey,
  makeRetirementDistributionFactKey,
  makeSCorporationK1FactKey,
  makeStudentLoanInterestFactKey,
  makeTraditionalIraFactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type RetirementDistributionFactValue,
  type SCorporationK1FactValue,
  type StudentLoanInterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MIN_USER_ID = "min-integration";
export const MIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MIN_USER_ID,
  taxYear: MIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MIN = {
  taxpayer: { firstName: "Min", lastName: "Farshaw", ssn: "400-00-2081" },
  spouse: { firstName: "Thom", lastName: "Farshaw", ssn: "400-00-2082" },
  street: "88 Baerlon Court",
  city: "Spokane",
  state: "WA",
  zip: "99203",
};

const address = { line1: MIN.street, city: MIN.city, state: MIN.state, zip: MIN.zip };

const BINDERY_EIN = "00-0001121";
const BINDERY_ID = "baerlon-bindery";

/* Min's W-2 from her full-time job. */
const minW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Caemlyn Analytics LLC",
  employerEin: "00-0002081",
  employerAddress: { line1: "400 Riverside Avenue", city: "Spokane", state: "WA", zip: "99201" },
  employee: { ...MIN.taxpayer, address },
  box1: 148000,
  box2: 17900,
  box3: 152000,
  box4: 9424,
  box5: 152000,
  box6: 2204,
  box12: [{ code: "D", amount: 4000 }],
  box13: { retirementPlan: true },
};

/* Thom took $3,000 out of his traditional IRA at 41: code 1, no exception. */
const thomIra: RetirementDistributionFactValue = {
  owner: "spouse",
  payerName: "Two Rivers Credit Union",
  payerTin: "00-0002082",
  box1: 3000,
  box2a: 3000,
  box4: 300,
  box7: "1",
  box7IraSepSimple: true,
};

/* Thom's Form 1098-E. */
const thomLoan: StudentLoanInterestFactValue = {
  lenderName: "Tar Valon Student Lending",
  box1: 1850,
};

/*
 * The K-1 the corporation issued to Min, a 25% shareholder who runs its
 * restoration shop on weekends: box 1 and the box 17 code V statement.
 */
export const binderyK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Baerlon Bindery, Inc.",
  entityEin: BINDERY_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 25,
  sharesAtStart: 250,
  sharesAtEnd: 250,
  boxes: [
    { box: "1", amount: 3200 },
    { box: "17", code: "V" },
  ],
  section199A: {
    businessName: "Baerlon Bindery, Inc.",
    qualifiedBusinessIncome: 3200,
    w2Wages: 21000,
    qualifiedPropertyUbia: 9500,
    specifiedService: false,
  },
};

const binderyHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MIN_USER_ID, taxYear: MIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const minFacts: TaxFactRow[] = [
  idFact("name.first", MIN.taxpayer.firstName),
  idFact("name.last", MIN.taxpayer.lastName),
  idFact("ssn", MIN.taxpayer.ssn),
  idFact("dob", "07/14/1988"),
  idFact("address.street", MIN.street),
  idFact("address.city", MIN.city),
  idFact("address.state", MIN.state),
  idFact("address.zip", MIN.zip),
  idFact("occupation", "Data analyst"),
  idFact("phone", "509-555-0181"),
  fact("identity", SPOUSE_KEYS.firstName, MIN.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, MIN.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.occupation, "Musician", VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, MIN.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "03/02/1984", VERBAL),
  fact("wages", makeW2FactKey("caemlyn-analytics"), minW2, "W-2 from Caemlyn Analytics LLC."),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("two-rivers-credit-union", "ira"),
    thomIra,
    "1099-R from Two Rivers Credit Union (Thom's IRA).",
  ),
  fact(
    "education",
    makeStudentLoanInterestFactKey("tar-valon-lending"),
    thomLoan,
    "1098-E from Tar Valon Student Lending (Thom's loan).",
  ),
  fact(
    "retirement",
    makeTraditionalIraFactKey("spouse"),
    { basisPriorYears: 0 },
    `${VERBAL}: Thom never made a nondeductible IRA contribution (no Form 8606 basis).`,
  ),
  fact("education", STUDENT_LOAN_KEYS.claimedAsDependent, false, VERBAL),
  fact("other", OTHER_INCOME_KEYS.juryDutyPay, 640, `${VERBAL}: Spokane County jury duty pay.`),
  fact(
    "k1",
    makeSCorporationK1FactKey(BINDERY_ID),
    binderyK1,
    "Schedule K-1 (Form 1120-S) from Baerlon Bindery, Inc., with its box 17 code V statement (docs/01-schedule-k1-baerlon-bindery.pdf).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(BINDERY_ID),
    binderyHolding,
    `${VERBAL}: Min runs the shop every weekend, more than 500 hours a year.`,
  ),
];
