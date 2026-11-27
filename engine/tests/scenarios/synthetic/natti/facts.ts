/*
 * A made-up single salon owner (README.md): every name and amount is invented.
 * The Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts). The
 * salon's tip credit amounts come from its payroll records: no information
 * return reports them, so they are stated answers.
 */

import {
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeTipCreditFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type TipCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NATTI_USER_ID = "natti-integration";
export const NATTI_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NATTI_USER_ID,
  taxYear: NATTI_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NATTI = {
  taxpayer: { firstName: "Natti", lastName: "Varrow", ssn: "400-00-8846" },
  street: "2714 Seawall Crescent",
  city: "Galveston",
  state: "TX",
  zip: "77550",
};

export const SALON_ID = "varrow-hair-nail-studio";
export const SALON_KEY = makeBusinessFactKey(SALON_ID);

/* The salon: hair, nail and spa services, no goods sold. Taxes and licenses hold the employer taxes before the credit. */
export const salon: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Hair, nail and spa salon",
  code: "812111",
  name: "Varrow Hair & Nail Studio",
  address: { street: "418 Postoffice Street", city: "Galveston", state: "TX", zip: "77550" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 985000,
  expenses: {
    advertising: 8500,
    insurance: 14500,
    legalAndProfessional: 6200,
    office: 3800,
    rentOtherProperty: 120000,
    repairs: 7400,
    supplies: 168000,
    taxesAndLicenses: 56200,
    utilities: 21400,
    wages: 452000,
  },
  specifiedService: false,
  w2WagesPaid: 452000,
  qualifiedPropertyUbia: 0,
};

/*
 * The salon's payroll records for Form 8846. Three employee months paid below
 * $7.25 an hour (an assistant in training, a new shampoo assistant), one month
 * paid above it (no amount), and a senior stylist whose wages and tips passed
 * the $176,100 wage base in October.
 */
export const salonTips: TipCreditFactValue = {
  businessKey: SALON_KEY,
  kind: "beauty_service",
  tipsReceived: 184600.4,
  belowRateMonths: [
    { employee: "Ilse Moran", month: 3, hoursWorked: 120, wagesExcludingTips: 360, tips: 1450 },
    { employee: "Ilse Moran", month: 4, hoursWorked: 130, wagesExcludingTips: 390, tips: 1600 },
    { employee: "Teodor Lusk", month: 7, hoursWorked: 80, wagesExcludingTips: 170.4, tips: 300 },
    { employee: "Teodor Lusk", month: 8, hoursWorked: 100, wagesExcludingTips: 800, tips: 410 },
  ],
  employeeOverWageBase: true,
  tipsSubjectOnlyToMedicare: 21480,
};

export const OYSTER_BAR_ID = "saltgrass-oyster-bar";
export const OYSTER_BAR_EIN = "00-0008846";

/* A seafood restaurant Natti runs with two partners: box 15 code N is its tip credit. */
export const oysterBarK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Saltgrass Oyster Bar LLC",
  entityEin: OYSTER_BAR_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 30,
  lossPercent: 30,
  capitalPercent: 30,
  boxes: [
    { box: "1", amount: 12000 },
    { box: "15", code: "N", amount: 2350 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 6000 }],
  ["2025-06", { date: "2025-06-16", amount: 6000 }],
  ["2025-09", { date: "2025-09-15", amount: 6000 }],
  ["2026-01", { date: "2026-01-15", amount: 6000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NATTI_USER_ID, taxYear: NATTI_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const nattiFacts: TaxFactRow[] = [
  idFact("name.first", NATTI.taxpayer.firstName),
  idFact("name.last", NATTI.taxpayer.lastName),
  idFact("ssn", NATTI.taxpayer.ssn),
  idFact("dob", "06/02/1981"),
  idFact("address.street", NATTI.street),
  idFact("address.city", NATTI.city),
  idFact("address.state", NATTI.state),
  idFact("address.zip", NATTI.zip),
  idFact("occupation", "Salon owner"),
  idFact("phone", "409-555-0184"),
  fact("self_employment", SALON_KEY, salon, "Stated by Natti: the salon's 2025 books."),
  fact(
    "self_employment",
    makeTipCreditFactKey(SALON_ID),
    salonTips,
    "Stated by Natti: the salon's 2025 payroll tip report and the stylist's wage base computation.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(OYSTER_BAR_ID),
    oysterBarK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-saltgrass-oyster-bar.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(OYSTER_BAR_ID), holding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
