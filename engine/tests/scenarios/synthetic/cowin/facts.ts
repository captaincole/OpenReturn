/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * business and its research are what Cowin states from the lab's books and
 * its research records; no official form holds them. The Schedule K-1 (Form
 * 1065) is a made PDF in docs/ (generate-docs.ts).
 */

import {
  GENERAL_BUSINESS_CREDIT_KEYS,
  RESEARCH_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type K1ResearchCreditAnswer,
  type PartnershipK1FactValue,
  type ResearchCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const COWIN_USER_ID = "cowin-synthetic";
export const COWIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: COWIN_USER_ID,
  taxYear: COWIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const COWIN = {
  firstName: "Cowin",
  lastName: "Marrowdale",
  ssn: "400-00-6765",
  street: "4410 Fremont Avenue North",
  city: "Seattle",
  state: "WA",
  zip: "98103",
};

export const LAB_ID = "marrowdale-sensor-lab";
export const LAB_KEY = makeBusinessFactKey(LAB_ID);
export const OPTICS_ID = "larkspur-optics-partners";
export const OPTICS_EIN = "00-0006766";

/* His sensor laboratory (Schedule C), which designs and sells industrial sensors. */
export const lab: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Industrial sensor design and manufacturing",
  code: "334510",
  name: "Marrowdale Sensor Lab",
  ein: "00-0006765",
  address: { street: "1900 Westlake Avenue North", city: "Seattle", state: "WA", zip: "98109" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 2600000,
  expenses: {
    contractLabor: 90000,
    insurance: 25000,
    legalAndProfessional: 15000,
    office: 12000,
    rentVehiclesMachinery: 30000,
    rentOtherProperty: 96000,
    supplies: 120000,
    taxesAndLicenses: 70000,
    utilities: 18000,
    // Line 26 before the research credit: every wage the lab paid.
    wages: 1500000,
  },
  specifiedService: false,
  w2WagesPaid: 1500000,
  qualifiedPropertyUbia: 0,
};

/*
 * The research of 2025 (Form 6765). Section A, the regular credit; no
 * section 280C election, so line 28 comes off the lab's wages. 2025 is the
 * lab's 7th tax year with QREs: its fixed-base percentage is the 2023 and
 * 2024 QREs over those years' gross receipts, divided by 3.
 */
export const research: ResearchCreditFactValue = {
  businessKey: LAB_KEY,
  reducedCreditElection: false,
  controlledGroup: false,
  method: "regular",
  energyConsortiaPayments: 5000,
  businessComponents: [
    {
      name: "CAL-7 calibration firmware",
      type: "all_others",
      software: "non_ius",
      directResearchWages: 80000,
      directSupervisionWages: 20000,
      directSupportWages: 5000,
      supplies: 2000,
      computerRental: 6000,
      contractResearch: { researchConsortium: 20000 },
    },
    {
      name: "SENSE-200 vibration sensor",
      type: "product",
      directResearchWages: 120000,
      directSupervisionWages: 30000,
      directSupportWages: 10000,
      supplies: 18000,
      contractResearch: { other: 40000 },
    },
    {
      name: "Thin-film coating process",
      type: "process",
      directResearchWages: 40000,
      directSupervisionWages: 10000,
      supplies: 9000,
      contractResearch: { energyResearch: 8000 },
    },
    {
      name: "Aggregate Business Components",
      aggregate: true,
      directResearchWages: 15000,
      directSupportWages: 3000,
      supplies: 1000,
    },
  ],
  businessComponentCount: 7,
  fixedBase: {
    kind: "start_up",
    yearWithQres: 7,
    baseYears: [
      { qualifiedResearchExpenses: 240000, grossReceipts: 2200000 },
      { qualifiedResearchExpenses: 290000, grossReceipts: 2400000 },
    ],
  },
  grossReceiptsPriorYears: [1800000, 2000000, 2200000, 2400000],
  acquiredOrDisposed: false,
  newExpenseCategories: true,
  attributableTaxableIncome: 480000,
};

/* The optics partnership he helps run: ordinary income and its research credit (box 15 code M). */
export const opticsK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Larkspur Optics Partners LP",
  entityEin: OPTICS_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 4,
  lossPercent: 4,
  capitalPercent: 4,
  boxes: [
    { box: "1", amount: 24000 },
    { box: "15", code: "M", amount: 3000 },
    { box: "20", code: "Z" },
  ],
  section199A: {
    businessName: "Larkspur Optics Partners LP",
    qualifiedBusinessIncome: 24000,
    w2Wages: 40000,
    qualifiedPropertyUbia: 0,
    specifiedService: false,
  },
};

const opticsHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

/* The partnership's average gross receipts are over $50 million: not an eligible small business (line 1c). */
const opticsResearch: K1ResearchCreditAnswer = {
  eligibleSmallBusiness: false,
  attributableTaxableIncome: 18000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 48000 }],
  ["2025-06", { date: "2025-06-16", amount: 48000 }],
  ["2025-09", { date: "2025-09-15", amount: 48000 }],
  ["2026-01", { date: "2026-01-15", amount: 48000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: COWIN_USER_ID, taxYear: COWIN_TAX_YEAR, suffix, value });

export const cowinFacts: TaxFactRow[] = [
  idFact("name.first", COWIN.firstName),
  idFact("name.last", COWIN.lastName),
  idFact("ssn", COWIN.ssn),
  idFact("dob", "09/14/1979"),
  idFact("address.street", COWIN.street),
  idFact("address.city", COWIN.city),
  idFact("address.state", COWIN.state),
  idFact("address.zip", COWIN.zip),
  idFact("occupation", "Sensor engineer"),
  idFact("phone", "206-555-0167"),
  fact("self_employment", LAB_KEY, lab, `${VERBAL}: the lab's books and payroll.`),
  fact(
    "self_employment",
    RESEARCH_CREDIT_KEY,
    research,
    `${VERBAL}: the lab's research records, by business component.`,
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(OPTICS_ID),
    opticsK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-larkspur-optics-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(OPTICS_ID), opticsHolding, VERBAL),
  fact(
    "other",
    GENERAL_BUSINESS_CREDIT_KEYS.k1Research(makePartnershipK1FactKey(OPTICS_ID)),
    opticsResearch,
    `${VERBAL}: the partnership's statement for its research credit.`,
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
