/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts); the
 * business, the farm and the employees are the taxpayer's own answers from
 * the books and the payroll records.
 */

import {
  makeBusinessFactKey,
  makeEmpowermentZoneEmployeeFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type EmpowermentZoneEmployeeFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JARET_USER_ID = "jaret-integration";
export const JARET_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JARET_USER_ID,
  taxYear: JARET_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JARET = {
  taxpayer: { firstName: "Jaret", lastName: "Quillon", ssn: "400-00-8844" },
  street: "1215 Magoffin Avenue",
  city: "El Paso",
  state: "TX",
  zip: "79901",
};

const BUSINESS_ID = "sunset-heights-cleaning";
export const BUSINESS_KEY = makeBusinessFactKey(BUSINESS_ID);

/* A commercial cleaning service in the El Paso empowerment zone: services only, no inventory. */
const cleaning: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Commercial cleaning services",
  code: "561720",
  name: "Sunset Heights Cleaning Co.",
  ein: "00-0008844",
  address: { street: "900 S Oregon Street", city: "El Paso", state: "TX", zip: "79901" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 236000,
  expenses: {
    advertising: 2400,
    insurance: 6800,
    supplies: 14200,
    utilities: 3100,
    wages: 98000,
  },
  specifiedService: false,
  w2WagesPaid: 98000,
  qualifiedPropertyUbia: 0,
};

export const employee = (
  value: Omit<
    EmpowermentZoneEmployeeFactValue,
    "fivePercentOwner" | "relatedToTaxpayer" | "excludedBusiness"
  > &
    Partial<EmpowermentZoneEmployeeFactValue>,
): EmpowermentZoneEmployeeFactValue => ({
  fivePercentOwner: false,
  relatedToTaxpayer: false,
  excludedBusiness: false,
  ...value,
});

/* The payroll records: who lived and worked in a zone, and the 2025 wages for that time. */
export const EMPLOYEES: Record<string, EmpowermentZoneEmployeeFactValue> = {
  "rosa-ibarra": employee({
    name: "Rosa Ibarra",
    employerKey: BUSINESS_KEY,
    zone: "El Paso, TX",
    livesAndWorksInZone: true,
    employedAtLeast90Days: true,
    zoneWages: 32000,
  }),
  "tomas-garay": employee({
    name: "Tomas Garay",
    employerKey: BUSINESS_KEY,
    zone: "El Paso, TX",
    livesAndWorksInZone: true,
    employedAtLeast90Days: true,
    zoneWages: 9800.5,
  }),
  // Hired in October and still employed at year end: fewer than 90 days.
  "lena-ortiz": employee({
    name: "Lena Ortiz",
    employerKey: BUSINESS_KEY,
    zone: "El Paso, TX",
    livesAndWorksInZone: true,
    employedAtLeast90Days: false,
    zoneWages: 7200,
  }),
  // Jaret's nephew: a relative under section 152(d)(2).
  "marco-quillon": employee({
    name: "Marco Quillon",
    employerKey: BUSINESS_KEY,
    zone: "El Paso, TX",
    livesAndWorksInZone: true,
    employedAtLeast90Days: true,
    relatedToTaxpayer: true,
    zoneWages: 21000,
  }),
  // Ended in her sixth week for misconduct (Texas unemployment law): the 90-day rule does not apply.
  "dalia-roque": employee({
    name: "Dalia Roque",
    employerKey: BUSINESS_KEY,
    zone: "El Paso, TX",
    livesAndWorksInZone: true,
    employedAtLeast90Days: false,
    earlyTermination: "misconduct",
    zoneWages: 3400,
  }),
};

export const OUTFITTER_ID = "franklin-ridge-outfitters";
export const OUTFITTER_EIN = "00-0008845";

/* A trail outfitter in the El Paso zone where Jaret is a general partner. Box 15 code L. */
export const outfitterK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Franklin Ridge Outfitters LLC",
  entityEin: OUTFITTER_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 25,
  lossPercent: 25,
  capitalPercent: 25,
  boxes: [
    { box: "1", amount: 14000 },
    { box: "15", code: "L", amount: 1200 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 30000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JARET_USER_ID, taxYear: JARET_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";
const PAYROLL = `${VERBAL}: the 2025 payroll records and each employee's address and start date.`;

export const jaretFacts: TaxFactRow[] = [
  idFact("name.first", JARET.taxpayer.firstName),
  idFact("name.last", JARET.taxpayer.lastName),
  idFact("ssn", JARET.taxpayer.ssn),
  idFact("dob", "05/22/1976"),
  idFact("address.street", JARET.street),
  idFact("address.city", JARET.city),
  idFact("address.state", JARET.state),
  idFact("address.zip", JARET.zip),
  idFact("occupation", "Cleaning service owner"),
  idFact("phone", "915-555-0184"),
  fact("self_employment", BUSINESS_KEY, cleaning, `${VERBAL}: the cleaning company's books.`),
  ...Object.entries(EMPLOYEES).map(([slug, value]) =>
    fact("self_employment", makeEmpowermentZoneEmployeeFactKey(slug), value, PAYROLL),
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(OUTFITTER_ID),
    outfitterK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-franklin-ridge-outfitters.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(OUTFITTER_ID), holding, VERBAL),
];
