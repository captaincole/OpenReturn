/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are her business's books, her premium statements as
 * she reads them, and her answers.
 */

import {
  ADJUSTMENT_KEYS,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeSelfEmployedHealthPlanFactKey,
  type BusinessFactValue,
  type SelfEmployedHealthPlanFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ISPAN_USER_ID = "ispan-integration";
export const ISPAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Ispan, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ISPAN_USER_ID,
  taxYear: ISPAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ISPAN = {
  firstName: "Ispan",
  lastName: "Corvane",
  ssn: "400-00-7206",
  street: "4410 Sagebrush Hollow Court",
  city: "Reno",
  state: "NV",
  zip: "89511",
};

const BUSINESS_KEY = makeBusinessFactKey("corvane-landscape");

/* Her landscape design practice (Schedule C): one business, so it is the plan's and line 16's. */
const landscapeDesign: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Landscape architecture",
  code: "541320",
  name: "Corvane Landscape Design",
  address: { street: ISPAN.street, city: ISPAN.city, state: ISPAN.state, zip: ISPAN.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 131500,
  expenses: { advertising: 2200, supplies: 6400, office: 3100, legalAndProfessional: 1800 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * Her individual health policy, in her own name, bought outside the
 * Marketplace: medical and dental for herself and her son Teodor (24, not a
 * dependent: a child under 27 counts). A long-term care contract covers her.
 * No employer plan was open to either of them in any month.
 */
const healthPlan: SelfEmployedHealthPlanFactValue = {
  description: "Silver Peak Mutual individual PPO and dental",
  establishedUnder: { kind: "schedule_c", factKey: BUSINESS_KEY },
  healthPremiums: 14260.4,
  longTermCare: [{ person: "Ispan Corvane", ageAtYearEnd: 58, premiumsPaid: 2315.75 }],
  throughMarketplace: false,
};

/* Four estimated tax payments, each on time. */
const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 5000 }],
  ["2025-q2", { date: "2025-06-16", amount: 5000 }],
  ["2025-q3", { date: "2025-09-15", amount: 5000 }],
  ["2025-q4", { date: "2026-01-15", amount: 5000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ISPAN_USER_ID, taxYear: ISPAN_TAX_YEAR, suffix, value });

export const ispanFacts: TaxFactRow[] = [
  idFact("name.first", ISPAN.firstName),
  idFact("name.last", ISPAN.lastName),
  idFact("ssn", ISPAN.ssn),
  idFact("dob", "05/14/1967"),
  idFact("address.street", ISPAN.street),
  idFact("address.city", ISPAN.city),
  idFact("address.state", ISPAN.state),
  idFact("address.zip", ISPAN.zip),
  idFact("occupation", "Landscape architect"),
  idFact("phone", "775-555-0172"),
  fact(
    "self_employment",
    BUSINESS_KEY,
    landscapeDesign,
    `${VERBAL}: her books for Corvane Landscape Design.`,
  ),
  fact(
    "health_coverage",
    makeSelfEmployedHealthPlanFactKey("silver-peak-ppo"),
    healthPlan,
    `${VERBAL}: Silver Peak Mutual premium statements and her long-term care insurer's annual notice.`,
  ),
  fact(
    "other",
    ADJUSTMENT_KEYS.selfEmployedPlanDeduction,
    15000,
    `${VERBAL}: SEP-IRA contribution for 2025, Pub. 560 worksheet.`,
  ),
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
    0,
    `${VERBAL}: no 2024 overpayment applied.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 17800, `${VERBAL}: 2024 return.`),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    104000,
    `${VERBAL}: 2024 Form 1040 line 11.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
];
