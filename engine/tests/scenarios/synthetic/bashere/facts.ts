/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * Form 1098-T has a PDF in docs/ (generate-docs.ts); the W-2, the 1099-R and
 * the Form 1098 have none: their facts are the boxes as they would print them.
 * The rest are the filer's answers, the estimated tax payments and the
 * Schedule AI periods among them.
 */

import {
  ESTIMATED_TAX_KEYS,
  MORTGAGE_KEYS,
  PRIOR_YEAR_KEYS,
  makeAnnualizedPeriodFactKey,
  makeBusinessFactKey,
  makeEducationCreditStudentFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeForm1098TFactKey,
  makeRetirementDistributionFactKey,
  makeW2FactKey,
  type AnnualizedPeriodFactValue,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type EducationCreditStudentFactValue,
  type Form1098TFactValue,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BASHERE_USER_ID = "bashere-integration";
export const BASHERE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const VERBAL = "Verbal, 2026-11-23";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BASHERE_USER_ID,
  taxYear: BASHERE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BASHERE = {
  firstName: "Bashere",
  lastName: "Calloway",
  ssn: "400-00-2210",
  street: "3318 Mission Arbor Lane",
  city: "San Antonio",
  state: "TX",
  zip: "78210",
};

const address = {
  line1: BASHERE.street,
  city: BASHERE.city,
  state: BASHERE.state,
  zip: BASHERE.zip,
};
export const STUDENT_CITY_STATE_ZIP = `${BASHERE.city}, ${BASHERE.state} ${BASHERE.zip}`;

// A part-time job from January through June (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Riverwalk Event Rentals LLC",
  employerEin: "00-0002210",
  employerAddress: { line1: "410 Alamo Plaza", city: "San Antonio", state: "TX", zip: "78205" },
  employee: { firstName: BASHERE.firstName, lastName: BASHERE.lastName, ssn: BASHERE.ssn, address },
  box1: 24000,
  box2: 1800,
  box3: 24000,
  box4: 1488,
  box5: 24000,
  box6: 348,
};

// A February withdrawal from a traditional IRA at 35: code 1, no exception.
const ira: RetirementDistributionFactValue = {
  owner: "taxpayer",
  payerName: "Alamo Heights Savings Bank",
  payerTin: "00-0002211",
  box1: 8000,
  box2a: 8000,
  box4: 800,
  box7: "1",
  box7IraSepSimple: true,
};

// The seasonal business: most of the year's work is from September to December.
const lightsBusiness: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Holiday and event lighting installation",
  code: "238210",
  name: "Calloway Lights",
  address: { street: BASHERE.street, city: BASHERE.city, state: BASHERE.state, zip: BASHERE.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 55000,
  expenses: { advertising: 2000, supplies: 8000 },
  specifiedService: false,
};

// Fall 2025 tuition, paid in August.
export const college1098T: Form1098TFactValue = {
  filerName: "Mission Trail Community College",
  filerAddress: { line1: "1300 Roosevelt Avenue", city: "San Antonio", state: "TX", zip: "78210" },
  filerEin: "00-0002212",
  studentName: `${BASHERE.firstName} ${BASHERE.lastName}`,
  studentTin: "XXX-XX-2210",
  box1: 4000,
  box8: true,
};

export const COLLEGE_1098T_KEY = makeForm1098TFactKey("mission-trail-cc", "bashere");

const student: EducationCreditStudentFactValue = {
  studentName: `${BASHERE.firstName} ${BASHERE.lastName}`,
  studentSsn: BASHERE.ssn,
  institutions: [{ form1098TKey: COLLEGE_1098T_KEY, received2024Form1098TBox7: false }],
  aocClaimedFourPriorYears: false,
  enrolledHalfTimeInProgram: true,
  completedFirstFourYears: false,
  felonyDrugConviction: false,
  academicPeriods: [
    { description: "Fall 2025, Mission Trail", tuitionAndFeesPaid: 4000, taxFreeAssistance: 0 },
  ],
};

/* 2025 Forms 1040-ES payments (no April payment; June 15 was a Sunday). */
const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-06", { date: "2025-06-16", amount: 100 }],
  ["2025-09", { date: "2025-09-15", amount: 1500 }],
  ["2026-01", { date: "2026-01-15", amount: 4000 }],
];

/*
 * Schedule AI periods (a)–(c), from January 1: wages, the IRA withdrawal, the
 * business's profit, less half the period's self-employment tax; property tax
 * paid in January and the monthly mortgage interest; the QBI deduction figured
 * on each period's annualized income; the 10% additional tax from February;
 * the American opportunity credit from the August tuition.
 */
export const PERIODS: Record<"a" | "b" | "c", AnnualizedPeriodFactValue> = {
  a: {
    adjustedGrossIncome: 21859,
    itemizedDeductions: 8950,
    qbiDeduction: 1487,
    otherTaxes: 800,
    credits: 0,
    selfEmploymentProfit: 2000,
    socialSecurityWages: 12000,
  },
  b: {
    adjustedGrossIncome: 31717,
    itemizedDeductions: 10583,
    qbiDeduction: 1784,
    otherTaxes: 800,
    credits: 0,
    selfEmploymentProfit: 4000,
    socialSecurityWages: 20000,
  },
  c: {
    adjustedGrossIncome: 40364,
    itemizedDeductions: 13033,
    qbiDeduction: 2509,
    otherTaxes: 800,
    credits: 2500,
    selfEmploymentProfit: 9000,
    socialSecurityWages: 24000,
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BASHERE_USER_ID, taxYear: BASHERE_TAX_YEAR, suffix, value });

const estimatedTaxFacts: TaxFactRow[] = [
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: IRS Direct Pay confirmation.`,
    ),
  ),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied,
    300,
    `${VERBAL}: 2024 Form 1040 line 36.`,
  ),
  ...(["a", "b", "c"] as const).map((period) =>
    fact(
      "estimated_payments",
      makeAnnualizedPeriodFactKey(period),
      PERIODS[period],
      `${VERBAL}: books and pay stubs through the period's end.`,
    ),
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 9000, `${VERBAL}: 2024 return.`),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    70000,
    `${VERBAL}: 2024 Form 1040 line 11.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
];

export const bashereFacts: TaxFactRow[] = [
  idFact("name.first", BASHERE.firstName),
  idFact("name.last", BASHERE.lastName),
  idFact("ssn", BASHERE.ssn),
  idFact("dob", "07/19/1990"),
  idFact("address.street", BASHERE.street),
  idFact("address.city", BASHERE.city),
  idFact("address.state", BASHERE.state),
  idFact("address.zip", BASHERE.zip),
  idFact("occupation", "Lighting installer"),
  idFact("phone", "210-555-0122"),
  fact("wages", makeW2FactKey("riverwalk-event-rentals"), w2, "W-2 from Riverwalk Event Rentals."),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("alamo-heights-savings", "ira"),
    ira,
    "1099-R from Alamo Heights Savings Bank.",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("calloway-lights"),
    lightsBusiness,
    `${VERBAL}: receipts and expenses from the business ledger.`,
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    9800,
    "Form 1098 from Bexar Home Lending, box 1.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    214000,
    "Form 1098 from Bexar Home Lending, box 2.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "05/02/2019",
    "Form 1098 from Bexar Home Lending, box 3.",
  ),
  fact(
    "state_local_tax",
    "state_local_tax.real_estate",
    6500,
    "Bexar County tax bill, paid January 2025.",
  ),
  fact("charitable", "charitable.cash", 0, `${VERBAL}: no gifts to charity.`),
  fact("charitable", "charitable.noncash", 0, `${VERBAL}: no gifts to charity.`),
  fact("charitable", "charitable.carryover", 0, `${VERBAL}: no carryover from 2024.`),
  fact("medical", "medical.expenses_total", 0, `${VERBAL}: small medical bills only.`),
  fact("state_local_tax", "state_local_tax.personal_property", 0, `${VERBAL}: none.`),
  fact("education", COLLEGE_1098T_KEY, college1098T, "1098-T (docs/01-mission-trail-1098-t.pdf)."),
  fact(
    "education",
    makeEducationCreditStudentFactKey("bashere"),
    student,
    `${VERBAL}: degree program at least half-time, no AOC before, fall tuition paid in August.`,
  ),
  ...estimatedTaxFacts,
];
