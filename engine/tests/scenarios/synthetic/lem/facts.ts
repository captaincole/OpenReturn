/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts); the W-2
 * is its boxes as the form would print them; the holding answers are his own.
 */

import {
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LEM_USER_ID = "lem-integration";
export const LEM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LEM_USER_ID,
  taxYear: LEM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LEM = {
  taxpayer: { firstName: "Lem", lastName: "Harrowgate", ssn: "400-00-6478" },
  street: "2210 W 41st Street",
  city: "Sioux Falls",
  state: "SD",
  zip: "57105",
};

const address = { line1: LEM.street, city: LEM.city, state: LEM.state, zip: LEM.zip };

// Lem's W-2 from a grain elevator company (made up).
const lemW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Prairie Elevator Co",
  employerEin: "00-0006477",
  employerAddress: {
    line1: "800 N Minnesota Avenue",
    city: "Sioux Falls",
    state: "SD",
    zip: "57104",
  },
  employee: {
    firstName: LEM.taxpayer.firstName,
    lastName: LEM.taxpayer.lastName,
    ssn: LEM.taxpayer.ssn,
    address,
  },
  box1: 88000,
  box2: 11500,
  box3: 88000,
  box4: 5456,
  box5: 88000,
  box6: 1276,
};

export const CELLULOSE_ID = "big-sioux-cellulose-fuels";
export const CELLULOSE_EIN = "00-0006478";

/*
 * A cellulosic ethanol plant, a limited partnership where Lem is a limited
 * partner: a limited partner's share of ordinary income is not
 * self-employment income, so the K-1 has no box 14. Its tax year ran from
 * July 1, 2024 to June 30, 2025, so it ends in Lem's 2025 tax year, and its
 * fuel sold from July to December 2024 still earned the credit. Box 15 code
 * I: his share of the biofuel producer credit. Box 20 code Z: the section
 * 199A statement.
 */
export const celluloseK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Big Sioux Cellulose Fuels LP",
  entityEin: CELLULOSE_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  boxes: [
    { box: "1", amount: 12600 },
    { box: "15", code: "I", amount: 2474 },
    { box: "20", code: "Z" },
  ],
  section199A: {
    businessName: "Big Sioux Cellulose Fuels LP",
    qualifiedBusinessIncome: 12600,
    w2Wages: 41000,
    qualifiedPropertyUbia: 380000,
    specifiedService: false,
  },
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LEM_USER_ID, taxYear: LEM_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const lemFacts: TaxFactRow[] = [
  idFact("name.first", LEM.taxpayer.firstName),
  idFact("name.last", LEM.taxpayer.lastName),
  idFact("ssn", LEM.taxpayer.ssn),
  idFact("dob", "09/14/1981"),
  idFact("address.street", LEM.street),
  idFact("address.city", LEM.city),
  idFact("address.state", LEM.state),
  idFact("address.zip", LEM.zip),
  idFact("occupation", "Grain merchandiser"),
  idFact("phone", "605-555-0164"),
  fact("wages", makeW2FactKey("prairie-elevator"), lemW2, "W-2 from Prairie Elevator Co."),
  fact(
    "k1",
    makePartnershipK1FactKey(CELLULOSE_ID),
    celluloseK1,
    "Schedule K-1 (Form 1065) for the tax year July 1, 2024 to June 30, 2025 (docs/01-schedule-k1-big-sioux-cellulose-fuels.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(CELLULOSE_ID), holding, VERBAL),
];
