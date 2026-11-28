/*
 * A made-up single freight hauler (README.md): every name and amount is
 * invented. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts). The business's agri-biodiesel gallons come from its own
 * production records, and the K-1's statement answers from the partnership's
 * attached statement: no information return reports them, so they are stated
 * answers.
 */

import {
  makeAgriBiodieselFactKey,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1BiodieselCreditKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type AgriBiodieselProductionFactValue,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type K1BiodieselCreditAnswer,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NELA_USER_ID = "nela-integration";
export const NELA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NELA_USER_ID,
  taxYear: NELA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NELA = {
  taxpayer: { firstName: "Nela", lastName: "Quarrendine", ssn: "400-00-8864" },
  street: "1907 Cottonseed Row",
  city: "Lubbock",
  state: "TX",
  zip: "79403",
};

export const HAULING_ID = "quarrendine-freight";
export const HAULING_KEY = makeBusinessFactKey(HAULING_ID);

/*
 * The freight business: truckload hauling, no goods sold. It presses and
 * refines soybean oil into agri-biodiesel at its yard and burns all of it in
 * its own trucks, so the feedstock is in supplies and no fuel is sold.
 */
export const hauling: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Truckload freight hauling",
  code: "484121",
  name: "Quarrendine Freight",
  address: { street: "6200 East Loop Road", city: "Lubbock", state: "TX", zip: "79403" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 640000,
  expenses: {
    insurance: 31200,
    legalAndProfessional: 7200,
    office: 3100,
    rentVehiclesMachinery: 72000,
    repairs: 38400,
    supplies: 96500,
    taxesAndLicenses: 24600,
    utilities: 9800,
    wages: 168000,
  },
  specifiedService: false,
  w2WagesPaid: 168000,
  qualifiedPropertyUbia: 0,
};

/*
 * The yard's production records: gallons of agri-biodiesel made from
 * Texas-grown soybeans and used as fuel in the trucks, before July 1 and
 * after June 30. A capacity of 250,000 gallons a year, registered on Form 637,
 * and $5,000 of the second-half credit sold to a buyer under section 6418.
 */
export const yardProduction: AgriBiodieselProductionFactValue = {
  businessKey: HAULING_KEY,
  gallonsBeforeJuly: 61480,
  gallonsAfterJune: 74215,
  productiveCapacityGallons: 250000,
  registeredOnForm637: true,
  transfer: { registrationNumber: "AGB25-0104857", amount: 5000 },
};

export const CRUSH_ID = "prairie-crush-biofuels";
export const CRUSH_EIN = "00-0008864";
export const CRUSH_K1_KEY = makePartnershipK1FactKey(CRUSH_ID);

/*
 * A fiscal-year partnership (October 1, 2024, to September 30, 2025) that
 * makes biodiesel and blends aviation fuel: box 15 code AC holds its
 * sustainable aviation fuel credit for 2024 fuel and its small agri-biodiesel
 * producer credit for 2025 fuel.
 */
export const crushK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Prairie Crush Biofuels LLC",
  entityEin: CRUSH_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 4,
  lossPercent: 4,
  capitalPercent: 4,
  boxes: [
    { box: "1", amount: 6500 },
    { box: "15", code: "AC", amount: 4180 },
  ],
};

/* The partnership's attached statement: $1,300 of SAF credit, and 14,400 gallons for the producer credit. */
export const crushStatement: K1BiodieselCreditAnswer = {
  safCredit: 1300,
  agriBiodiesel: { gallons: 14400, productiveCapacityGallons: 1800000 },
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 52000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9000 }],
  ["2025-06", { date: "2025-06-16", amount: 9000 }],
  ["2025-09", { date: "2025-09-15", amount: 9000 }],
  ["2026-01", { date: "2026-01-15", amount: 9000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NELA_USER_ID, taxYear: NELA_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const nelaFacts: TaxFactRow[] = [
  idFact("name.first", NELA.taxpayer.firstName),
  idFact("name.last", NELA.taxpayer.lastName),
  idFact("ssn", NELA.taxpayer.ssn),
  idFact("dob", "09/14/1977"),
  idFact("address.street", NELA.street),
  idFact("address.city", NELA.city),
  idFact("address.state", NELA.state),
  idFact("address.zip", NELA.zip),
  idFact("occupation", "Freight carrier"),
  idFact("phone", "806-555-0164"),
  fact("self_employment", HAULING_KEY, hauling, "Stated by Nela: the business's 2025 books."),
  fact(
    "self_employment",
    makeAgriBiodieselFactKey(HAULING_ID),
    yardProduction,
    "Stated by Nela: the yard's 2025 production and fuel-use log, Form 637 registration and the transfer election.",
  ),
  fact(
    "k1",
    CRUSH_K1_KEY,
    crushK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-prairie-crush-biofuels.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(CRUSH_ID), holding, VERBAL),
  fact(
    "k1",
    makeK1BiodieselCreditKey(CRUSH_K1_KEY),
    crushStatement,
    "The partnership's statement attached to the K-1, box 15 code AC.",
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
