/*
 * A made-up couple (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the Schedule K-1 (Form
 * 1120-S) would print them, and the couple's answers.
 */

import {
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELAIDA_USER_ID = "elaida-integration";
export const ELAIDA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELAIDA_USER_ID,
  taxYear: ELAIDA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ELAIDA = {
  taxpayer: { firstName: "Elaida", lastName: "Roihan", ssn: "400-00-3101" },
  spouse: { firstName: "Daved", lastName: "Roihan", ssn: "400-00-3102" },
  street: "2210 Red Ajah Road",
  city: "Spokane",
  state: "WA",
  zip: "99201",
};

const address = { line1: ELAIDA.street, city: ELAIDA.city, state: ELAIDA.state, zip: ELAIDA.zip };
const businessAddress = {
  street: ELAIDA.street,
  city: ELAIDA.city,
  state: ELAIDA.state,
  zip: ELAIDA.zip,
};

const GLASS_EIN = "00-0007203";
const GLASS_ID = "white-tower-glass";

/* Daved's W-2 from the S corporation he owns and works in. */
const davedW2: W2FactValue = {
  owner: "spouse",
  employerName: "White Tower Glassworks, Inc.",
  employerEin: GLASS_EIN,
  employerAddress: address,
  employee: { ...ELAIDA.spouse, address },
  box1: 40000,
  box2: 2400,
  box3: 40000,
  box4: 2480,
  box5: 40000,
  box6: 580,
};

/* Elaida's two small businesses (Schedule C), both with a profit. */
const calligraphy: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Calligraphy commissions",
  code: "711510",
  name: "Tar Valon Calligraphy",
  address: businessAddress,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 900,
  expenses: { supplies: 720 },
  specifiedService: false,
};

const driedFlowers: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Dried flower arrangements",
  code: "453110",
  name: "Amyrlin Dried Flowers",
  address: businessAddress,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 1000,
  expenses: { advertising: 280, supplies: 500 },
  specifiedService: false,
};

/*
 * The K-1 the corporation issued to Daved: a large ordinary loss, a small net
 * long-term capital loss, a cash gift to a 60% charity, nondeductible expenses
 * and a cash distribution. The section 199A statement gives the loss as QBI.
 */
const glassK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "White Tower Glassworks, Inc.",
  entityEin: GLASS_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 500,
  sharesAtEnd: 500,
  boxes: [
    { box: "1", amount: -60000 },
    { box: "8a", amount: -1500 },
    { box: "12", code: "A", amount: 1100 },
    { box: "16", code: "C", amount: 500 },
    { box: "16", code: "D", amount: 4000 },
    { box: "17", code: "V" },
  ],
  section199A: {
    businessName: "White Tower Glassworks, Inc.",
    qualifiedBusinessIncome: -60000,
    w2Wages: 40000,
    qualifiedPropertyUbia: 0,
    specifiedService: false,
  },
};

/*
 * Daved's answers: he runs the glassworks full time, all of his money in it is
 * at risk, his stock basis at the start of 2025 was $20,000 (his 2024 Form
 * 7203 line 15), he put $15,000 more into the company in 2025, and he has
 * never lent it money.
 */
const glassHolding: K1HoldingFactValue = {
  owner: "spouse",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 20000,
  capitalContributions: 15000,
  stockAcquiredAs: "original_shareholder",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELAIDA_USER_ID, taxYear: ELAIDA_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const elaidaFacts: TaxFactRow[] = [
  idFact("name.first", ELAIDA.taxpayer.firstName),
  idFact("name.last", ELAIDA.taxpayer.lastName),
  idFact("ssn", ELAIDA.taxpayer.ssn),
  idFact("dob", "03/14/1979"),
  idFact("address.street", ELAIDA.street),
  idFact("address.city", ELAIDA.city),
  idFact("address.state", ELAIDA.state),
  idFact("address.zip", ELAIDA.zip),
  idFact("occupation", "Calligrapher"),
  idFact("phone", "509-555-0131"),
  fact("identity", SPOUSE_KEYS.firstName, ELAIDA.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, ELAIDA.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, ELAIDA.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "08/02/1977", VERBAL),
  fact(
    "wages",
    makeW2FactKey("white-tower-glass"),
    davedW2,
    "W-2 from White Tower Glassworks, Inc. (Daved's).",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("tar-valon-calligraphy"),
    calligraphy,
    `${VERBAL}: Elaida's calligraphy, receipts and expenses from her ledger.`,
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("amyrlin-dried-flowers"),
    driedFlowers,
    `${VERBAL}: Elaida's dried flowers, receipts and expenses from her ledger.`,
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(GLASS_ID),
    glassK1,
    "Schedule K-1 (Form 1120-S) from White Tower Glassworks, Inc. (Daved's).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(GLASS_ID),
    glassHolding,
    `${VERBAL}: Daved's basis from his 2024 Form 7203; the 2025 contribution from the bank transfer.`,
  ),
];
