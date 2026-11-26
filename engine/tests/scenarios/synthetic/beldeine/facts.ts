/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts); the W-2
 * has none: its facts are the boxes as it would print them. The low-income
 * housing credit (Form 8586) and last year's unallowed credits are the
 * taxpayer's answers: the engine does not figure Form 8586, and the product
 * does not read last year's return yet (#79).
 */

import {
  makeCreditCarryoverFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type CreditCarryoverFactValue,
  type GeneralBusinessCreditFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type PassiveCreditActivity,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BELDEINE_USER_ID = "beldeine-synthetic";
export const BELDEINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

export const BELDEINE = {
  taxpayer: { firstName: "Beldeine", lastName: "Harrowgate", ssn: "400-00-8583" },
  street: "1409 Barton Hills Dr",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const HOME = {
  line1: BELDEINE.street,
  city: BELDEINE.city,
  state: BELDEINE.state,
  zip: BELDEINE.zip,
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BELDEINE_USER_ID,
  taxYear: BELDEINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BELDEINE_USER_ID, taxYear: BELDEINE_TAX_YEAR, suffix, value });

/* Beldeine's W-2 as an engineering director. */
const directorW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Colorado River Software Inc.",
  employerEin: "00-0858301",
  employerAddress: { line1: "300 Congress Ave", city: "Austin", state: "TX", zip: "78701" },
  employee: { ...BELDEINE.taxpayer, address: HOME },
  box1: 380000,
  box2: 88000,
  box3: 176100,
  box4: 10918.2,
  box5: 380000,
  // 1.45% of wages plus the 0.9% Additional Medicare Tax on wages over $200,000.
  box6: 7130,
};

export const BAKERY_ID = "llano-bakery-partners";
export const BAKERY_EIN = "00-0858302";

/*
 * A bakery in an empowerment zone that Beldeine invested in and does not work
 * in: a passive trade or business. Box 1 income and two box 15 credits, the
 * empowerment zone employment credit (code L) and the work opportunity credit
 * (code J).
 */
export const bakeryK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Llano Bakery Partners LLC",
  entityEin: BAKERY_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 15,
  lossPercent: 15,
  capitalPercent: 15,
  boxes: [
    { box: "1", amount: 10000 },
    { box: "15", code: "L", amount: 1500 },
    { box: "15", code: "J", amount: 3000 },
  ],
};

const bakeryHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

/* The two passive activities of the stated credits (Form 8582-CR Worksheets 3 and 4). */
const MESA_VERDE: PassiveCreditActivity = {
  name: "Mesa Verde Senior Housing",
  rentalRealEstate: true,
  before1990: false,
};
const BAKERY: PassiveCreditActivity = {
  name: "Llano Bakery Partners LLC",
  rentalRealEstate: false,
};

/* A low-income housing building Beldeine owns a share of, placed in service in 2018 (Form 8586). */
export const CREDITS: Record<string, GeneralBusinessCreditFactValue> = {
  "mesa-verde-low-income-housing": {
    sourceForm: "8586",
    line: "4d",
    amount: 9000,
    passive: true,
    passiveActivity: MESA_VERDE,
  },
};

/* Last year's unallowed passive credits (2024 Form 8582-CR Worksheet 9 column (b)). */
export const CARRYOVERS: Record<string, CreditCarryoverFactValue> = {
  "mesa-verde-low-income-housing-2024": {
    sourceForm: "8586 post-2007",
    line: "4d",
    originYear: 2024,
    amount: 2000,
    passive: true,
    passiveActivity: MESA_VERDE,
  },
  "llano-bakery-work-opportunity-2024": {
    sourceForm: "5884",
    line: "4b",
    originYear: 2024,
    amount: 600,
    passive: true,
    passiveActivity: BAKERY,
    passThroughEin: BAKERY_EIN,
  },
};

const VERBAL = "Verbal, 2026-11-26";
const LAST_YEAR =
  "2024 Form 8582-CR Worksheet 9 column (b), from last year's return (stated; #79).";

export const beldeineFacts: TaxFactRow[] = [
  idFact("name.first", BELDEINE.taxpayer.firstName),
  idFact("name.last", BELDEINE.taxpayer.lastName),
  idFact("ssn", BELDEINE.taxpayer.ssn),
  idFact("dob", "07/30/1976"),
  idFact("address.street", BELDEINE.street),
  idFact("address.city", BELDEINE.city),
  idFact("address.state", BELDEINE.state),
  idFact("address.zip", BELDEINE.zip),
  idFact("occupation", "Engineering director"),
  idFact("phone", "512-555-0177"),
  fact(
    "wages",
    makeW2FactKey("colorado-river-software"),
    directorW2,
    "W-2 from Colorado River Software Inc.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(BAKERY_ID),
    bakeryK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-llano-bakery-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(BAKERY_ID), bakeryHolding, VERBAL),
  ...Object.entries(CREDITS).map(([slug, value]) =>
    fact(
      "other",
      makeGeneralBusinessCreditFactKey(slug),
      value,
      `${VERBAL}: Form ${value.sourceForm}.`,
    ),
  ),
  ...Object.entries(CARRYOVERS).map(([slug, value]) =>
    fact("other", makeCreditCarryoverFactKey(slug), value, LAST_YEAR),
  ),
];
