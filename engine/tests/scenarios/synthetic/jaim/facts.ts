/*
 * A made-up single landscaping company owner (README.md): every name and amount
 * is invented. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts). The Form 8941 amounts come from the company's payroll
 * and its SHOP premium invoices: no information return reports them, so they
 * are stated answers. The average premiums are the Travis County, Texas row of
 * the instructions' 2025 tables (irs-8941-inst-2025::sec::line-19::b67).
 */

import {
  SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type EmployeeHealthCoverage,
  type HealthCreditEmployee,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type SmallEmployerHealthCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JAIM_USER_ID = "jaim-integration";
export const JAIM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JAIM_USER_ID,
  taxYear: JAIM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JAIM = {
  taxpayer: { firstName: "Jaim", lastName: "Tavren", ssn: "400-00-8941" },
  street: "6120 Cedar Bend Loop",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

export const COMPANY_ID = "tavren-landscape-works";
export const COMPANY_KEY = makeBusinessFactKey(COMPANY_ID);

/* The company: lawn care and landscaping, no goods sold. Line 14 holds the employer health premiums ($58,500) and $3,000 of group-term life insurance, before the credit. */
export const company: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Landscaping and lawn care",
  code: "561730",
  name: "Tavren Landscape Works",
  ein: "00-0008941",
  address: { street: "1880 Industrial Oaks Blvd", city: "Austin", state: "TX", zip: "78745" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 1_020_000,
  expenses: {
    advertising: 7_500,
    employeeBenefitPrograms: 61_500,
    insurance: 18_000,
    legalAndProfessional: 5_200,
    repairs: 22_000,
    supplies: 96_000,
    taxesAndLicenses: 38_000,
    utilities: 6_500,
    wages: 457_100,
  },
  specifiedService: false,
  w2WagesPaid: 457_100,
  qualifiedPropertyUbia: 0,
};

/* The SHOP plans: 60% of each plan's premium, for each tier (a qualifying arrangement). */
const employeeOnly = (paid: number): EmployeeHealthCoverage[] => [
  { tier: "employee_only", employerPremiumsPaid: paid, annualPremium: 9_000 },
];
const family: EmployeeHealthCoverage[] = [
  { tier: "family", employerPremiumsPaid: 14_400, annualPremium: 24_000 },
];

const person = (
  name: string,
  hoursOfService: number,
  wages: number,
  coverage?: EmployeeHealthCoverage[],
): HealthCreditEmployee => ({ name, hoursOfService, wages, ...(coverage ? { coverage } : {}) });

/* Worksheet 1: fourteen employees; the owner is not one (column-a-individuals-considered::b02). */
export const employees: HealthCreditEmployee[] = [
  person("Rosalind Ambry", 2_300, 62_000, family),
  person("Dario Fenwick", 2_080, 48_000, family),
  person("Mei Corlan", 2_080, 44_000, employeeOnly(5_400)),
  person("Tobin Hale", 2_080, 38_000, employeeOnly(5_400)),
  person("Anouk Pressly", 2_080, 36_000, employeeOnly(5_400)),
  person("Gus Weatherby", 2_080, 34_000, employeeOnly(5_400)),
  person("Lena Ostrova", 2_080, 33_000, employeeOnly(5_400)),
  // Enrolled after a 26-week waiting period: 26 weekly premiums.
  person("Felix Arbogast", 2_080, 32_000, employeeOnly(2_700)),
  person("Priya Sandoval", 2_080, 30_000),
  person("Owen Talley", 2_080, 29_000),
  person("Hana Kessler", 1_820, 24_500),
  person("Jules Morrow", 1_300, 18_000),
  person("Ines Varga", 1_300, 17_600),
  // A summer mowing hand for 90 days: seasonal, so no hours and no wages on Worksheet 1.
  { name: "Ruben Ashdown", hoursOfService: 720, wages: 11_000, seasonal: true },
];

export const healthCredit: SmallEmployerHealthCreditFactValue = {
  activityKey: COMPANY_KEY,
  shopCoverage: true,
  marketplaceIdentifier: "TX-SHOP-48453-0192",
  employmentTaxEin: "00-0008941",
  creditClaimedBefore2024: false,
  employees,
  // Travis County, Texas (irs-8941-inst-2025::sec::line-19::b67).
  averagePremium: { employeeOnly: 8_000, family: 21_482 },
  // A made-up state premium subsidy the insurer received for the company's plans.
  stateSubsidiesAndCredits: 1_200,
};

export const NURSERY_ID = "barton-creek-nursery";
export const NURSERY_EIN = "00-0018941";

/* A plant nursery Jaim runs with two partners: box 15 code BA is its health insurance credit. */
export const nurseryK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Barton Creek Nursery Partners LLC",
  entityEin: NURSERY_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 25,
  lossPercent: 25,
  capitalPercent: 25,
  boxes: [
    { box: "1", amount: 30_000 },
    { box: "15", code: "BA", amount: 1_850.4 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60_000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 18_000 }],
  ["2025-06", { date: "2025-06-16", amount: 18_000 }],
  ["2025-09", { date: "2025-09-15", amount: 18_000 }],
  ["2026-01", { date: "2026-01-15", amount: 18_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JAIM_USER_ID, taxYear: JAIM_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const jaimFacts: TaxFactRow[] = [
  idFact("name.first", JAIM.taxpayer.firstName),
  idFact("name.last", JAIM.taxpayer.lastName),
  idFact("ssn", JAIM.taxpayer.ssn),
  idFact("dob", "03/14/1979"),
  idFact("address.street", JAIM.street),
  idFact("address.city", JAIM.city),
  idFact("address.state", JAIM.state),
  idFact("address.zip", JAIM.zip),
  idFact("occupation", "Landscaping company owner"),
  idFact("phone", "512-555-0141"),
  fact("self_employment", COMPANY_KEY, company, "Stated by Jaim: the company's 2025 books."),
  fact(
    "self_employment",
    SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
    healthCredit,
    "Stated by Jaim: the 2025 payroll register, the SHOP premium invoices and the Travis County row of the Form 8941 average premium table.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(NURSERY_ID),
    nurseryK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-barton-creek-nursery.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(NURSERY_ID), holding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
