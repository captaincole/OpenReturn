/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * business and its retirement plan are what Gill states from the company's
 * books, the payroll and the plan's records; no official form holds them. The
 * Schedule K-1 (Form 1120-S) is a made PDF in docs/ (generate-docs.ts).
 */

import {
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeSmallEmployerPlanFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type SmallEmployerPlanFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GILL_USER_ID = "gill-synthetic";
export const GILL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GILL_USER_ID,
  taxYear: GILL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const GILL = {
  firstName: "Gill",
  lastName: "Brannock",
  ssn: "400-00-8881",
  street: "4718 Harwood Lane",
  city: "Fort Worth",
  state: "TX",
  zip: "76109",
};

export const CATERING_ID = "brannock-catering";
export const CATERING_KEY = makeBusinessFactKey(CATERING_ID);
export const PLAN_KEY = makeSmallEmployerPlanFactKey("brannock-catering-401k");
export const KITCHEN_ID = "trinity-commissary-kitchen";
export const KITCHEN_EIN = "00-0008882";

/* His catering company (Schedule C), with kitchen and event staff. */
export const catering: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Event catering",
  code: "722320",
  name: "Brannock Catering",
  address: { street: "900 Vickery Boulevard", city: "Fort Worth", state: "TX", zip: "76104" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 2_960_000,
  expenses: {
    advertising: 18_400,
    insurance: 41_000,
    // Line 17 before the Form 8881 line 5 credit: the plan administrator's fees are in it.
    legalAndProfessional: 26_500,
    // Line 19 before the Form 8881 line 6g credit: the employer contributions to the 401(k) plan.
    pensionAndProfitSharing: 14_250,
    rentOtherProperty: 96_000,
    supplies: 612_000,
    taxesAndLicenses: 138_000,
    utilities: 44_800,
    wages: 1_540_000,
  },
  specifiedService: false,
  w2WagesPaid: 1_540_000,
  qualifiedPropertyUbia: 0,
};

/*
 * The company's 401(k) plan, first effective in 2023: 2025 is the third year
 * of the startup costs credit and of the contributions credit. An automatic
 * enrollment arrangement was added in 2025.
 */
export const plan: SmallEmployerPlanFactValue = {
  name: "Brannock Catering 401(k) Plan",
  activityKey: CATERING_KEY,
  precedingYearEmployees: 58,
  startupCosts: {
    creditYear: 3,
    employeesBeforeFirstCreditYear: 54,
    qualifiedCosts: 3_800,
    eligibleNonHighlyCompensated: 40,
    deductedOn: "legalAndProfessional",
  },
  contributions: {
    planYear: 3,
    employees: [
      { contributions: 800, wages: 42_000 },
      { contributions: 950.5, wages: 51_000 },
      { contributions: 1_000, wages: 38_000 },
      { contributions: 1_200, wages: 61_000 },
      { contributions: 2_500, wages: 88_000 },
      // Paid more than $105,000: not counted.
      { contributions: 1_500, wages: 112_000 },
      { contributions: 600, wages: 130_000 },
      // Exactly $105,000 is not "in excess of" it.
      { contributions: 3_000, wages: 105_000 },
    ],
  },
  autoEnrollmentCreditYear: 1,
  militarySpouses: [
    { participationYear: 1, contributions: 250 },
    { participationYear: 2, contributions: 420 },
    // Joined the plan in 2022: past the 3 years.
    { participationYear: 4, contributions: 500 },
  ],
};

/*
 * The commissary kitchen S corporation he owns a fifth of and helps run. Its
 * K-1 items are box 13 codes AE, AF and AG: his share of its own plan's credits.
 */
export const kitchenK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Trinity Commissary Kitchen, Inc.",
  entityEin: KITCHEN_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 20,
  sharesAtStart: 200,
  sharesAtEnd: 200,
  boxes: [
    { box: "13", code: "AE", amount: 640 },
    { box: "13", code: "AF", amount: 100 },
    { box: "13", code: "AG", amount: 90 },
  ],
};

const kitchenHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 40_000,
  stockAcquiredAs: "purchased",
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 28_000 }],
  ["2025-06", { date: "2025-06-16", amount: 28_000 }],
  ["2025-09", { date: "2025-09-15", amount: 28_000 }],
  ["2026-01", { date: "2026-01-15", amount: 28_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GILL_USER_ID, taxYear: GILL_TAX_YEAR, suffix, value });

export const gillFacts: TaxFactRow[] = [
  idFact("name.first", GILL.firstName),
  idFact("name.last", GILL.lastName),
  idFact("ssn", GILL.ssn),
  idFact("dob", "11/02/1974"),
  idFact("address.street", GILL.street),
  idFact("address.city", GILL.city),
  idFact("address.state", GILL.state),
  idFact("address.zip", GILL.zip),
  idFact("occupation", "Caterer"),
  idFact("phone", "817-555-0181"),
  fact("self_employment", CATERING_KEY, catering, `${VERBAL}: the company's books and payroll.`),
  fact(
    "self_employment",
    PLAN_KEY,
    plan,
    `${VERBAL}: the plan's records, the payroll and the employees' military spouse certifications.`,
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(KITCHEN_ID),
    kitchenK1,
    "Schedule K-1 (Form 1120-S) (docs/01-schedule-k1-trinity-commissary-kitchen.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(KITCHEN_ID), kitchenHolding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
