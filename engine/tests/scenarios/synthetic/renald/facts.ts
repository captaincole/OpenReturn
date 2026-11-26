/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * two Schedules K-1 (Form 1065) are made PDFs in docs/ (generate-docs.ts); the
 * W-2 has none: its facts are the boxes as it would print them. The credit
 * carryovers come from last year's return, which the product does not read yet
 * (#79): they are stated answers.
 */

import {
  GENERAL_BUSINESS_CREDIT_KEYS,
  makeCreditCarryoverFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type CreditCarryoverFactValue,
  type K1HoldingFactValue,
  type K1ResearchCreditAnswer,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RENALD_USER_ID = "renald-integration";
export const RENALD_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RENALD_USER_ID,
  taxYear: RENALD_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const RENALD = {
  taxpayer: { firstName: "Renald", lastName: "Fanwick", ssn: "400-00-3801" },
  street: "48 Mesquite Bend Road",
  city: "San Angelo",
  state: "TX",
  zip: "76901",
};

const address = { line1: RENALD.street, city: RENALD.city, state: RENALD.state, zip: RENALD.zip };

/* Renald's W-2 as a structural engineer. */
const engineerW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Concho Valley Structural Group",
  employerEin: "00-0003800",
  employerAddress: address,
  employee: { ...RENALD.taxpayer, address },
  box1: 380000,
  box2: 92000,
  box3: 176100,
  box4: 10918.2,
  box5: 380000,
  box6: 6440,
};

export const WORKS_ID = "coldwater-furniture-works";
export const WORKS_EIN = "00-0003801";
export const CLINIC_ID = "riverbend-clinic-partners";
export const CLINIC_EIN = "00-0003802";
export const OUTFITTER_ID = "pecos-trail-outfitters";
export const OUTFITTER_EIN = "00-0003803";

/*
 * The furniture workshop Renald runs with two partners. Box 15 credits: the
 * research credit (code M) and the disabled access credit (code K).
 */
export const worksK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Coldwater Furniture Works LLC",
  entityEin: WORKS_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 40,
  lossPercent: 40,
  capitalPercent: 40,
  boxes: [
    { box: "1", amount: 85000 },
    { box: "15", code: "K", amount: 3000 },
    { box: "15", code: "M", amount: 25000 },
  ],
};

/* A physical therapy clinic Renald helps manage on weekends. Box 15: codes K and BA. */
export const clinicK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Riverbend Clinic Partners LLC",
  entityEin: CLINIC_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 25,
  lossPercent: 25,
  capitalPercent: 25,
  boxes: [
    { box: "1", amount: 24000 },
    { box: "15", code: "K", amount: 4000 },
    { box: "15", code: "BA", amount: 1800 },
  ],
};

/*
 * A river outfitter in an empowerment zone, where Renald leads trips each
 * summer. Box 15: the empowerment zone employment credit (code L) and the work
 * opportunity credit (code J).
 */
export const outfitterK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Pecos Trail Outfitters LLC",
  entityEin: OUTFITTER_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 20,
  lossPercent: 20,
  capitalPercent: 20,
  boxes: [
    { box: "1", amount: 18000 },
    { box: "15", code: "L", amount: 1500 },
    { box: "15", code: "J", amount: 2400 },
  ],
};

const holding = (basis: number): K1HoldingFactValue => ({
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: basis,
});

/* The research credit answers for the workshop's code M (Form 3800 lines 1c and 4i). */
const worksResearch: K1ResearchCreditAnswer = {
  eligibleSmallBusiness: false,
  attributableTaxableIncome: 80000,
};

const carryover = (value: CreditCarryoverFactValue) => value;

/* Last year's Form 3800 Part IV column (i): what carried to 2025. */
export const CARRYOVERS: Record<string, CreditCarryoverFactValue> = {
  "disabled-access-2022": carryover({
    sourceForm: "8826",
    line: "1e",
    originYear: 2022,
    amount: 900,
    passive: false,
    passThroughEin: WORKS_EIN,
    changedFromOriginal: true,
  }),
  "disabled-access-2023": carryover({
    sourceForm: "8826",
    line: "1e",
    originYear: 2023,
    amount: 1100,
    passive: false,
    passThroughEin: WORKS_EIN,
  }),
  "empowerment-zone-2024": carryover({
    sourceForm: "8844",
    line: "3",
    originYear: 2024,
    amount: 700,
    passive: false,
    passThroughEin: OUTFITTER_EIN,
  }),
  "work-opportunity-2021": carryover({
    sourceForm: "5884",
    line: "4b",
    originYear: 2021,
    amount: 1200,
    passive: false,
    passThroughEin: OUTFITTER_EIN,
    changedFromOriginal: true,
    recapturedOrAdjusted: 200,
  }),
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RENALD_USER_ID, taxYear: RENALD_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-25";
const LAST_YEAR = "2024 Form 3800 Part IV column (i), from last year's return (stated; #79).";

export const renaldFacts: TaxFactRow[] = [
  idFact("name.first", RENALD.taxpayer.firstName),
  idFact("name.last", RENALD.taxpayer.lastName),
  idFact("ssn", RENALD.taxpayer.ssn),
  idFact("dob", "09/14/1978"),
  idFact("address.street", RENALD.street),
  idFact("address.city", RENALD.city),
  idFact("address.state", RENALD.state),
  idFact("address.zip", RENALD.zip),
  idFact("occupation", "Structural engineer"),
  idFact("phone", "325-555-0138"),
  fact(
    "wages",
    makeW2FactKey("concho-valley-structural"),
    engineerW2,
    "W-2 from Concho Valley Structural Group.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(WORKS_ID),
    worksK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-coldwater-furniture-works.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(WORKS_ID), holding(80000), VERBAL),
  fact(
    "k1",
    makePartnershipK1FactKey(CLINIC_ID),
    clinicK1,
    "Schedule K-1 (Form 1065) (docs/02-schedule-k1-riverbend-clinic-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(CLINIC_ID), holding(30000), VERBAL),
  fact(
    "k1",
    makePartnershipK1FactKey(OUTFITTER_ID),
    outfitterK1,
    "Schedule K-1 (Form 1065) (docs/03-schedule-k1-pecos-trail-outfitters.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(OUTFITTER_ID), holding(20000), VERBAL),
  fact(
    "other",
    GENERAL_BUSINESS_CREDIT_KEYS.k1Research(makePartnershipK1FactKey(WORKS_ID)),
    worksResearch,
    VERBAL,
  ),
  ...Object.entries(CARRYOVERS).map(([slug, value]) =>
    fact("other", makeCreditCarryoverFactKey(slug), value, LAST_YEAR),
  ),
];
