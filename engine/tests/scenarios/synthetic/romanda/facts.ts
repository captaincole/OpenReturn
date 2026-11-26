/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the 1099 facts are the boxes as the documents would print them,
 * and the business and Form 2555 facts hold Romanda's answers.
 */

import {
  makeBusinessFactKey,
  makeForeignEarnedIncomeFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  type BusinessFactValue,
  type ForeignEarnedIncomeFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ROMANDA_USER_ID = "romanda-integration";
export const ROMANDA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const VERBAL = "Verbal, 2026-11-25";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ROMANDA_USER_ID,
  taxYear: ROMANDA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ROMANDA = {
  firstName: "Romanda",
  lastName: "Cassalane",
  ssn: "400-00-2557",
  street: "418 Cuesta Ridge Road",
  city: "San Luis Obispo",
  state: "CA",
  zip: "93405",
};

/* Her consulting practice: personal services only, billed in dollars to U.S. clients. */
const practice: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Water systems engineering consulting",
  code: "541330",
  name: "Cassalane Water Consulting",
  address: { street: ROMANDA.street, city: ROMANDA.city, state: ROMANDA.state, zip: ROMANDA.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 150000,
  expenses: { travel: 8000, legalAndProfessional: 5000, office: 4000, insurance: 3000 },
  specifiedService: false,
};

const pension: RetirementDistributionFactValue = {
  payerName: "Morro Bay Retirement Trust",
  owner: "taxpayer",
  box1: 30000,
  box2a: 30000,
  box4: 3000,
  box7: "7",
  box7IraSepSimple: true,
};

const interest: InterestFactValue = { payerName: "Los Osos Credit Union", box1: 2000 };

/*
 * Romanda's Form 2555 answers: physically present in Portugal for a 12-month
 * contract from March 2025; a 2024 housing deduction she could not use in full.
 */
const form2555: ForeignEarnedIncomeFactValue = {
  foreignAddress: "Rua das Amendoeiras 14, 8000-123 Faro, Portugal",
  occupation: "Water systems engineer",
  employer: {
    name: "Cassalane Water Consulting (self-employed)",
    usAddress: "418 Cuesta Ridge Road, San Luis Obispo, CA 93405",
    types: ["self"],
  },
  lastYearFiled: 2024,
  citizenship: "United States",
  taxHomes: [{ location: "Faro, Portugal", established: "03/01/2025" }],
  physicalPresence: {
    from: "03/01/2025",
    through: "02/28/2026",
    principalCountry: "Portugal",
    stays: [
      { country: "Portugal", arrived: "02/28/2025", left: "07/30/2025", fullDays: 151 },
      { country: "United States", arrived: "07/30/2025", left: "08/12/2025", fullDays: 12 },
      { country: "Portugal", arrived: "08/13/2025", left: "04/30/2026", fullDays: 199 },
    ],
  },
  business: { grossIncome: 150000, expenses: 20000, capitalMaterial: false },
  allSelfEmploymentOnForm: true,
  // Rent and utilities on the Faro flat, paid in euros.
  housing: { expenses: { amount: 30000, currency: "EUR" } },
  priorYearHousing: { line46: 12000, line48: 9500 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ROMANDA_USER_ID, taxYear: ROMANDA_TAX_YEAR, suffix, value });

export const romandaFacts: TaxFactRow[] = [
  idFact("name.first", ROMANDA.firstName),
  idFact("name.last", ROMANDA.lastName),
  idFact("ssn", ROMANDA.ssn),
  idFact("dob", "02/11/1959"),
  idFact("address.street", ROMANDA.street),
  idFact("address.city", ROMANDA.city),
  idFact("address.state", ROMANDA.state),
  idFact("address.zip", ROMANDA.zip),
  idFact("occupation", "Water systems engineer"),
  idFact("phone", "805-555-0157"),
  fact(
    "self_employment",
    makeBusinessFactKey("cassalane-water"),
    practice,
    `${VERBAL}: receipts and expenses from her ledger.`,
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("morro-bay-retirement", "code-7"),
    pension,
    "1099-R from Morro Bay Retirement Trust, a normal IRA distribution.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("los-osos-cu"),
    interest,
    "1099-INT from Los Osos Credit Union.",
  ),
  fact(
    "foreign",
    makeForeignEarnedIncomeFactKey("taxpayer"),
    form2555,
    `${VERBAL}: Romanda's answers for Form 2555; her 2024 Form 2555 lines 46 and 48.`,
  ),
];
