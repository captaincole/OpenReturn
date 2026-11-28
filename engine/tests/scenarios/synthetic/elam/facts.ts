/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * climbing gym and its disabled access expenditures are what Elam states from
 * the gym's books and invoices; no official form holds them. The Schedule K-1
 * (Form 1065) is a made PDF in docs/ (generate-docs.ts).
 */

import {
  DISABLED_ACCESS_KEYS,
  makeBusinessFactKey,
  makeDisabledAccessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type DisabledAccessFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELAM_USER_ID = "elam-synthetic";
export const ELAM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELAM_USER_ID,
  taxYear: ELAM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ELAM = {
  firstName: "Elam",
  lastName: "Varrowind",
  ssn: "400-00-8826",
  street: "1450 Plumas Street",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

export const GYM_ID = "varrowind-climbing";
export const GYM_KEY = makeBusinessFactKey(GYM_ID);

/* His indoor climbing gym (Schedule C), in a leased building opened in 1984. */
export const gym: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Indoor climbing gym",
  code: "713900",
  name: "Varrowind Climbing",
  address: { street: "880 East Fourth Street", city: "Reno", state: "NV", zip: "89512" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 410000,
  expenses: {
    advertising: 6200,
    // Line 11 before the credit: holds the $1,250 sign language interpreter.
    contractLabor: 4600,
    insurance: 9800,
    legalAndProfessional: 3200,
    rentOtherProperty: 48000,
    // Line 21 before the credit: holds the $7,400 entrance ramp and restroom doors.
    repairs: 15900,
    supplies: 12300,
    taxesAndLicenses: 13900,
    utilities: 14500,
    wages: 168000,
  },
  specifiedService: false,
  w2WagesPaid: 168000,
  qualifiedPropertyUbia: 0,
};

/* The eligible access expenditures, by slug (Form 8826 line 1). */
export const ACCESS_EXPENDITURES: Record<string, DisabledAccessFactValue> = {
  // Removing barriers: a ramp at the entrance and wider restroom doors.
  "entrance-ramp": { businessKey: GYM_KEY, expenditures: 7400, deductedOn: "repairs" },
  // A qualified interpreter for the gym's beginner classes.
  "class-interpreter": { businessKey: GYM_KEY, expenditures: 1250, deductedOn: "contractLabor" },
};

export const PARTNERSHIP_ID = "sierra-bouldering";
export const PARTNERSHIP_EIN = "88-4418826";

/*
 * The bouldering park partnership he helps run. Its only K-1 item is box 15
 * code K, his share of the disabled access credit of its own expenditures.
 */
export const partnershipK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Sierra Bouldering Park LLC",
  entityEin: PARTNERSHIP_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 20,
  lossPercent: 20,
  capitalPercent: 20,
  boxes: [{ box: "15", code: "K", amount: 600 }],
};

const partnershipHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 30000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 4000 }],
  ["2025-06", { date: "2025-06-16", amount: 4000 }],
  ["2025-09", { date: "2025-09-15", amount: 4000 }],
  ["2026-01", { date: "2026-01-15", amount: 4000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELAM_USER_ID, taxYear: ELAM_TAX_YEAR, suffix, value });

export const elamFacts: TaxFactRow[] = [
  idFact("name.first", ELAM.firstName),
  idFact("name.last", ELAM.lastName),
  idFact("ssn", ELAM.ssn),
  idFact("dob", "09/14/1982"),
  idFact("address.street", ELAM.street),
  idFact("address.city", ELAM.city),
  idFact("address.state", ELAM.state),
  idFact("address.zip", ELAM.zip),
  idFact("occupation", "Climbing gym owner"),
  idFact("phone", "775-555-0186"),
  fact("self_employment", GYM_KEY, gym, `${VERBAL}: the gym's books and payroll.`),
  ...Object.entries(ACCESS_EXPENDITURES).map(([slug, value]) =>
    fact(
      "self_employment",
      makeDisabledAccessFactKey(slug),
      value,
      `${VERBAL}: the gym's books and the contractor's and interpreter's invoices.`,
    ),
  ),
  fact(
    "self_employment",
    DISABLED_ACCESS_KEYS.priorYearGrossReceipts,
    385000,
    `${VERBAL}: 2024 Schedule C line 3.`,
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(PARTNERSHIP_ID),
    partnershipK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-sierra-bouldering-park.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(PARTNERSHIP_ID), partnershipHolding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
