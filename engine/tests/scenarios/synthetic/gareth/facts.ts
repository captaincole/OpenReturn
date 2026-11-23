/*
 * A made-up couple (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2, the Form 1098 and the
 * Schedule K-1 (Form 1120-S) would print them, and the couple's answers.
 */

import {
  MORTGAGE_KEYS,
  SPOUSE_KEYS,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GARETH_USER_ID = "gareth-integration";
export const GARETH_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GARETH_USER_ID,
  taxYear: GARETH_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const GARETH = {
  taxpayer: { firstName: "Gareth", lastName: "Bryne", ssn: "400-00-3201" },
  spouse: { firstName: "Leane", lastName: "Bryne", ssn: "400-00-3202" },
  street: "48 Kore Springs Drive",
  city: "Reno",
  state: "NV",
  zip: "89501",
};

const address = { line1: GARETH.street, city: GARETH.city, state: GARETH.state, zip: GARETH.zip };

const STABLES_EIN = "00-0007204";
const STABLES_ID = "kore-springs-stables";

/* Gareth's W-2 from the S corporation he owns and runs. */
const garethW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Kore Springs Stables, Inc.",
  employerEin: STABLES_EIN,
  employerAddress: address,
  employee: { ...GARETH.taxpayer, address },
  box1: 90000,
  box2: 9800,
  box3: 90000,
  box4: 5580,
  box5: 90000,
  box6: 1305,
};

/*
 * The K-1 for 2025: ordinary business income, a little interest, a cash gift
 * to a 60% charity and a cash distribution. The section 199A statement gives
 * this year's QBI.
 */
const stablesK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Kore Springs Stables, Inc.",
  entityEin: STABLES_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 1000,
  sharesAtEnd: 1000,
  boxes: [
    { box: "1", amount: 45000 },
    { box: "4", amount: 300 },
    { box: "12", code: "A", amount: 800 },
    { box: "16", code: "D", amount: 20000 },
    { box: "17", code: "V" },
  ],
  section199A: {
    businessName: "Kore Springs Stables, Inc.",
    qualifiedBusinessIncome: 45000,
    w2Wages: 90000,
    qualifiedPropertyUbia: 0,
    specifiedService: false,
  },
};

/*
 * Gareth's answers: he runs the stables full time and all of his money in it is
 * at risk. His 2024 loss was more than his basis: his 2024 Form 7203 ended at
 * a stock basis of 0 (line 15) and carried an ordinary loss of $12,000 and a
 * cash contribution of $600 (Part III column (e)). The whole carried loss came
 * from the business in 2024, so all of it is qualified (QBI). No loans.
 */
const stablesHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 0,
  stockAcquiredAs: "purchased",
  carriedLosses: {
    basis: { ordinaryBusinessLoss: 12000, cashCharitableContributions: 600 },
  },
  carriedQualifiedBusinessLoss: 12000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GARETH_USER_ID, taxYear: GARETH_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const garethFacts: TaxFactRow[] = [
  idFact("name.first", GARETH.taxpayer.firstName),
  idFact("name.last", GARETH.taxpayer.lastName),
  idFact("ssn", GARETH.taxpayer.ssn),
  idFact("dob", "05/21/1971"),
  idFact("address.street", GARETH.street),
  idFact("address.city", GARETH.city),
  idFact("address.state", GARETH.state),
  idFact("address.zip", GARETH.zip),
  idFact("occupation", "Horse breeder"),
  idFact("phone", "775-555-0148"),
  fact("identity", SPOUSE_KEYS.firstName, GARETH.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, GARETH.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, GARETH.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "10/09/1974", VERBAL),
  fact(
    "wages",
    makeW2FactKey("kore-springs-stables"),
    garethW2,
    "W-2 from Kore Springs Stables, Inc. (Gareth's).",
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(STABLES_ID),
    stablesK1,
    "Schedule K-1 (Form 1120-S) from Kore Springs Stables, Inc. (Gareth's).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(STABLES_ID),
    stablesHolding,
    `${VERBAL}: basis and carryovers from Gareth's 2024 Form 7203 and QBI Loss Tracking Worksheet.`,
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    24000,
    "Form 1098 from Caemlyn Home Lending, box 1.",
  ),
  fact("mortgage", MORTGAGE_KEYS.outstandingPrincipalForm1098, 520000, "Form 1098, box 2."),
  fact("mortgage", MORTGAGE_KEYS.originationDateForm1098, "04/02/2020", "Form 1098, box 3."),
  fact(
    "state_local_tax",
    "state_local_tax.real_estate",
    6000,
    "Washoe County property tax bill, 2025.",
  ),
  fact("state_local_tax", "state_local_tax.personal_property", 0, `${VERBAL}: none.`),
  fact("medical", "medical.expenses_total", 0, `${VERBAL}: none.`),
  fact("charitable", "charitable.cash", 2000, "Receipts from the county food bank."),
  fact("charitable", "charitable.noncash", 0, `${VERBAL}: none.`),
  fact("charitable", "charitable.carryover", 0, `${VERBAL}: none.`),
];
