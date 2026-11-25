/*
 * A made-up couple (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the Schedule K-1 (Form
 * 1065) would print them, and the couple's answers.
 */

import {
  SPOUSE_KEYS,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TAM_USER_ID = "tam-integration";
export const TAM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TAM_USER_ID,
  taxYear: TAM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TAM = {
  taxpayer: { firstName: "Tam", lastName: "Thorne", ssn: "400-00-4101" },
  spouse: { firstName: "Kari", lastName: "Thorne", ssn: "400-00-4102" },
  street: "12 Westwood Lane",
  city: "Amarillo",
  state: "TX",
  zip: "79101",
};

const address = { line1: TAM.street, city: TAM.city, state: TAM.state, zip: TAM.zip };

/* Tam's W-2 from the mill where he works; under $250,000 of Medicare wages, so no Form 8959. */
const tamW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Emond Field Milling Co.",
  employerEin: "00-0004101",
  employerAddress: address,
  employee: { ...TAM.taxpayer, address },
  box1: 240000,
  box2: 48000,
  box3: 176100,
  box4: 10918.2,
  box5: 240000,
  box6: 3480,
};

const TIMBER_ID = "two-rivers-timber";
const TIMBER_EIN = "00-0001065";

/*
 * The K-1 from a timber fund Tam invests in as a limited partner: ordinary
 * business income, interest, dividends, a long-term gain, tax-exempt interest,
 * a cash distribution and the section 199A statement. The fund has no debt
 * (item K1 blank).
 */
const timberK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Two Rivers Timber Fund LP",
  entityEin: TIMBER_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 2,
  lossPercent: 2,
  capitalPercent: 2,
  boxes: [
    { box: "1", amount: 40000 },
    { box: "5", amount: 1200 },
    { box: "6a", amount: 3000 },
    { box: "6b", amount: 2000 },
    { box: "9a", amount: 6000 },
    { box: "18", code: "A", amount: 500 },
    { box: "19", code: "A", amount: 20000 },
    { box: "20", code: "Z" },
  ],
  section199A: {
    businessName: "Two Rivers Timber Fund LP",
    qualifiedBusinessIncome: 40000,
    w2Wages: 0,
    qualifiedPropertyUbia: 0,
    specifiedService: false,
  },
};

/*
 * Tam's answers: he does not work in the fund (a passive activity); his basis
 * at the start of 2025 was $100,000 (his 2024 worksheet line 18); no passive
 * loss was carried from 2024.
 */
const timberHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 100000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TAM_USER_ID, taxYear: TAM_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-23";

export const tamFacts: TaxFactRow[] = [
  idFact("name.first", TAM.taxpayer.firstName),
  idFact("name.last", TAM.taxpayer.lastName),
  idFact("ssn", TAM.taxpayer.ssn),
  idFact("dob", "02/11/1972"),
  idFact("address.street", TAM.street),
  idFact("address.city", TAM.city),
  idFact("address.state", TAM.state),
  idFact("address.zip", TAM.zip),
  idFact("occupation", "Mill manager"),
  idFact("phone", "806-555-0141"),
  fact("identity", SPOUSE_KEYS.firstName, TAM.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, TAM.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.occupation, "Veterinarian", VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, TAM.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "06/30/1974", VERBAL),
  fact("wages", makeW2FactKey("emond-field-milling"), tamW2, "W-2 from Emond Field Milling Co."),
  fact(
    "k1",
    makePartnershipK1FactKey(TIMBER_ID),
    timberK1,
    "Schedule K-1 (Form 1065) from Two Rivers Timber Fund LP (Tam's).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(TIMBER_ID),
    timberHolding,
    `${VERBAL}: Tam's basis from his 2024 partner's basis worksheet.`,
  ),
];
