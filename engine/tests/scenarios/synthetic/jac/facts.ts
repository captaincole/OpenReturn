/*
 * A made-up single owner of a landscaping business (README.md): every name and
 * amount is invented. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts). The childcare expenditures come from the business's
 * books: no information return reports them, so they are stated answers.
 */

import {
  makeBusinessFactKey,
  makeChildcareExpenditureFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type ChildcareExpenditureFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JAC_USER_ID = "jac-integration";
export const JAC_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JAC_USER_ID,
  taxYear: JAC_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JAC = {
  taxpayer: { firstName: "Jac", lastName: "Mardell", ssn: "400-00-8882" },
  street: "1907 Pecan Hollow Lane",
  city: "Round Rock",
  state: "TX",
  zip: "78664",
};

export const LANDSCAPING_ID = "mardell-grounds-co";
export const LANDSCAPING_KEY = makeBusinessFactKey(LANDSCAPING_ID);

export const CHILDCARE_BUILDING = "On-site childcare center building";
export const REFERRAL_EXPENSE = "Childcare resource and referral service";

/*
 * The business: commercial landscaping, no goods sold. The expense lines hold
 * the childcare amounts before the credit (wages, supplies, employee benefit
 * programs and one Part V expense), and the childcare building is a 2025 asset.
 */
export const landscaping: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Commercial landscaping services",
  code: "561730",
  name: "Mardell Grounds Co.",
  address: { street: "4410 Gattis School Road", city: "Round Rock", state: "TX", zip: "78664" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 2_100_000,
  expenses: {
    employeeBenefitPrograms: 60_000,
    insurance: 40_000,
    legalAndProfessional: 12_000,
    rentOtherProperty: 96_000,
    repairs: 25_000,
    supplies: 140_000,
    taxesAndLicenses: 55_000,
    utilities: 30_000,
    wages: 620_000,
  },
  otherExpenses: [{ description: REFERRAL_EXPENSE, amount: 6_000 }],
  depreciation: {
    assets: [
      {
        description: CHILDCARE_BUILDING,
        placedInService: "2025-06-16",
        cost: 160_000,
        recoveryClass: "nonresidential_real",
        method: "SL",
        convention: "MM",
      },
    ],
    priorYearMacrs: 18_000,
  },
  specifiedService: false,
  w2WagesPaid: 620_000,
  qualifiedPropertyUbia: 400_000,
};

const spent = (value: Omit<ChildcareExpenditureFactValue, "businessKey">) => ({
  businessKey: LANDSCAPING_KEY,
  ...value,
});

/* The business's 2025 childcare expenditures, one fact each (Form 8882 lines 1 and 3). */
export const EXPENDITURES: Array<[string, ChildcareExpenditureFactValue]> = [
  [
    "center-construction",
    spent({
      kind: "facility_property",
      description: "Construction of the on-site childcare center",
      amount: 160_000,
      asset: CHILDCARE_BUILDING,
    }),
  ],
  [
    "center-teachers",
    spent({
      kind: "facility_operating",
      description: "Childcare center teachers' wages",
      amount: 52_000,
      deductedOn: "wages",
    }),
  ],
  [
    "center-supplies",
    spent({
      kind: "facility_operating",
      description: "Childcare center supplies",
      amount: 9_000,
      deductedOn: "supplies",
    }),
  ],
  [
    "infant-care-slots",
    spent({
      kind: "facility_contract",
      description: "Infant care slots at Bright Oak Learning Center",
      amount: 30_000,
      deductedOn: "employeeBenefitPrograms",
    }),
  ],
  [
    "referral-service",
    spent({
      kind: "resource_and_referral",
      description: "Childcare resource and referral service contract",
      amount: 6_000,
      deductedOn: "other_expense",
      otherExpense: REFERRAL_EXPENSE,
    }),
  ],
];

export const STAFFING_ID = "hill-country-staffing";
export const STAFFING_EIN = "00-0008882";

/* A staffing firm Jac runs with two partners: box 15 code AH is its childcare credit. */
export const staffingK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Hill Country Staffing Partners LLC",
  entityEin: STAFFING_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 25,
  lossPercent: 25,
  capitalPercent: 25,
  boxes: [
    { box: "1", amount: 40_000 },
    { box: "15", code: "AH", amount: 3_500 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 90_000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 70_000 }],
  ["2025-06", { date: "2025-06-16", amount: 70_000 }],
  ["2025-09", { date: "2025-09-15", amount: 70_000 }],
  ["2026-01", { date: "2026-01-15", amount: 70_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JAC_USER_ID, taxYear: JAC_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const jacFacts: TaxFactRow[] = [
  idFact("name.first", JAC.taxpayer.firstName),
  idFact("name.last", JAC.taxpayer.lastName),
  idFact("ssn", JAC.taxpayer.ssn),
  idFact("dob", "09/14/1979"),
  idFact("address.street", JAC.street),
  idFact("address.city", JAC.city),
  idFact("address.state", JAC.state),
  idFact("address.zip", JAC.zip),
  idFact("occupation", "Landscaping business owner"),
  idFact("phone", "512-555-0182"),
  fact(
    "self_employment",
    LANDSCAPING_KEY,
    landscaping,
    "Stated by Jac: the business's 2025 books.",
  ),
  ...EXPENDITURES.map(([slug, value]) =>
    fact(
      "self_employment",
      makeChildcareExpenditureFactKey(slug),
      value,
      "Stated by Jac: the business's 2025 childcare center ledger and contracts.",
    ),
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(STAFFING_ID),
    staffingK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-hill-country-staffing.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(STAFFING_ID), holding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
