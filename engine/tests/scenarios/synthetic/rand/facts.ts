/*
 * A made-up single hydrogen producer (README.md): every name and amount is
 * invented. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts). The facility's answers (its processes, emissions rates,
 * kilograms, bond financing, wage and apprenticeship records, the credit
 * transfer) come from its records, its verification report and its
 * 45VH2-GREET results: no information return reports them, so they are
 * stated answers.
 */

import {
  makeBusinessFactKey,
  makeCleanHydrogenFacilityFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type CleanHydrogenFacilityFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RAND_USER_ID = "rand-integration";
export const RAND_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RAND_USER_ID,
  taxYear: RAND_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const RAND = {
  taxpayer: { firstName: "Rand", lastName: "Kerrow", ssn: "400-00-7210" },
  street: "1180 Bayside Terrace",
  city: "Pasadena",
  state: "TX",
  zip: "77506",
};

export const WORKS_ID = "kerrow-hydrogen-works";
export const WORKS_KEY = makeBusinessFactKey(WORKS_ID);
export const FACILITY_KEY = makeCleanHydrogenFacilityFactKey(WORKS_ID);

/*
 * The business: it sells the facility's hydrogen by pipeline as it is made,
 * so it keeps no inventory. Interest on the bonds is in the interest expense.
 */
export const works: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Hydrogen production",
  code: "325120",
  name: "Kerrow Hydrogen Works",
  ein: "00-0007210",
  address: { street: "4400 Channel Industrial Road", city: "Pasadena", state: "TX", zip: "77506" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 486000,
  expenses: {
    insurance: 18400,
    otherInterest: 5400,
    repairs: 12600,
    supplies: 14800,
    taxesAndLicenses: 9800,
    utilities: 61200,
    wages: 54000,
  },
  specifiedService: false,
  w2WagesPaid: 54000,
  qualifiedPropertyUbia: 2400000,
};

/*
 * The facility, held through Kerrow Hydrogen LLC (a single-member LLC). Four
 * processes, one in each emissions band; part of the cost was financed by a
 * tax-exempt bond issue. Construction began after January 29, 2023, so the
 * increased credit needs both the wage and the apprenticeship requirements.
 * Rand sold part of the credit to an unrelated buyer under section 6418.
 */
export const facility: CleanHydrogenFacilityFactValue = {
  address: "4400 Channel Industrial Road, Pasadena, TX 77506",
  description: "Kerrow Channel H2 Plant: 5 MW PEM electrolysis with steam methane reformer",
  owner: { name: "Kerrow Hydrogen LLC", tin: "00-0007210" },
  coordinates: { latitude: 29.7342, longitude: -95.1517 },
  registrationNumber: "H2R-0072105",
  constructionBegan: "2023-05-15",
  placedInService: "2024-09-03",
  processes: [
    { emissionsRate: 0.38, kilograms: 9400 },
    { emissionsRate: 1.12, kilograms: 6300 },
    { emissionsRate: 2.05, kilograms: 4800 },
    { emissionsRate: 3.6, kilograms: 3600 },
  ],
  prevailingWageMet: true,
  apprenticeshipMet: true,
  carbonCaptureCredit: false,
  energyPropertyElection: false,
  financing: { proceeds: 120000, capitalAccountAdditions: 2400000 },
  passive: false,
  transfer: { direction: "sold", amount: 15000, registrationNumber: "H2R-0072105" },
};

export const PARTNERS_ID = "gulf-coast-hydrogen-partners";
export const PARTNERS_EIN = "00-0017210";

/*
 * A hydrogen fueling partnership Rand runs with two partners: box 15 code Y is
 * its credit. A general partner's K-1 would also show box 14 code A
 * (self-employment earnings); the engine has no route for that code yet, so
 * the K-1 leaves it off and Schedule SE takes only Schedule C (README.md).
 */
export const partnersK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Gulf Coast Hydrogen Partners LP",
  entityEin: PARTNERS_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 20,
  lossPercent: 20,
  capitalPercent: 20,
  boxes: [
    { box: "1", amount: 8000 },
    { box: "15", code: "Y", amount: 2750 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9000 }],
  ["2025-06", { date: "2025-06-16", amount: 9000 }],
  ["2025-09", { date: "2025-09-15", amount: 9000 }],
  ["2026-01", { date: "2026-01-15", amount: 9000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RAND_USER_ID, taxYear: RAND_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const randFacts: TaxFactRow[] = [
  idFact("name.first", RAND.taxpayer.firstName),
  idFact("name.last", RAND.taxpayer.lastName),
  idFact("ssn", RAND.taxpayer.ssn),
  idFact("dob", "03/14/1979"),
  idFact("address.street", RAND.street),
  idFact("address.city", RAND.city),
  idFact("address.state", RAND.state),
  idFact("address.zip", RAND.zip),
  idFact("occupation", "Hydrogen producer"),
  idFact("phone", "713-555-0172"),
  fact("self_employment", WORKS_KEY, works, "Stated by Rand: the business's 2025 books."),
  fact(
    "other",
    FACILITY_KEY,
    facility,
    "Stated by Rand: the facility's 2025 verification report, 45VH2-GREET results, bond records, payroll and apprenticeship records, and the transfer agreement.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(PARTNERS_ID),
    partnersK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-gulf-coast-hydrogen-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(PARTNERS_ID), holding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
