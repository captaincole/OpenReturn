/*
 * Zerah Okonkwo-Hale, a made-up single walnut grower in Yuba City, California
 * (README.md). Every name, number and address is invented. The orchard
 * amounts are what she states from its books; the Form 1099-R is in docs/
 * (generate-docs.ts); the 2024 amounts are her answers from last year's return.
 */

import {
  CA_FARMER_ESTIMATED_TAX_KEYS,
  CA_LUMP_SUM_OWN_KEY,
  CA_PAYMENT_KEYS,
  FARMER_OR_FISHERMAN_KEYS,
  makeFarmFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  PRIOR_YEAR_KEYS,
  type CaFarmerWaiverFactValue,
  type CaLumpSumDistributionFactValue,
  type FarmerGrossIncomeFactValue,
  type FarmFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ZERAH_USER_ID = "zerah-synthetic";
export const ZERAH_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";
const HOME = { line1: "2710 Garden Highway", city: "Yuba City", state: "CA", zip: "95991" };
const TAXPAYER = { firstName: "Zerah", lastName: "Okonkwo-Hale", ssn: "400-00-0583" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ZERAH_USER_ID,
  taxYear: ZERAH_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ZERAH_USER_ID, taxYear: ZERAH_TAX_YEAR, suffix, value });

/* Her walnut orchard, cash method, material participation, a profit. */
const orchard: FarmFactValue = {
  owner: "taxpayer",
  activity: "Walnuts",
  code: "111330",
  ein: "00-0000583",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  productSales: 262000,
  agriculturalProgramPayments: 6000,
  customHireIncome: 4000,
  expenses: {
    chemicals: 9800,
    customHire: 7400,
    depreciation: 12500,
    fertilizersAndLime: 11200,
    gasolineFuelAndOil: 6300,
    insurance: 4100,
    laborHired: 30000,
    repairs: 5200,
    supplies: 2900,
    taxes: 3600,
    utilities: 4800,
  },
  newDepreciableProperty: false,
  w2WagesPaid: 30000,
  qualifiedPropertyUbia: 240000,
};

/* Her whole pension from the cannery paid out in 2025; $4,000 is from participation before 1974. */
export const PENSION_PAYER = "sutter-basin-cannery-pension";
export const PENSION_ID = "r-1";
const pension: RetirementDistributionFactValue = {
  payerName: "Sutter Basin Cannery Pension Plan",
  payerTin: "00-0000584",
  planName: "Sutter Basin Cannery Retirement Plan",
  owner: "taxpayer",
  box1: 40000,
  box2a: 36000,
  box2b: { totalDistribution: true },
  box3: 4000,
  box4: 3600,
  box5: 4000,
  box7: "7",
  box7IraSepSimple: false,
  box14: 1000,
  box15: "CA",
  box16: 36000,
};

/* California only: Schedule G-1 with the 5.5% capital gain election and 10-year averaging. */
const lumpSum: CaLumpSumDistributionFactValue = {
  distributions: [{ payerSlug: PENSION_PAYER, distributionId: PENSION_ID }],
  entireBalance: true,
  rolledOver: false,
  beneficiaryOfParticipantBornBefore1936: false,
  participantBornBefore1936FiveYears: true,
  usedScheduleG1After1986: false,
  capitalGainElection: true,
  tenYearAveraging: true,
};

const savings: InterestFactValue = { payerName: "Feather River Farm Credit", box1: 2600 };

/*
 * The two-thirds test: Schedule F line 9 ($272,000) of her gross income from
 * all sources (that, the $36,000 taxable pension and the $2,600 of interest).
 */
const grossIncome2025: FarmerGrossIncomeFactValue = {
  totalGrossIncome: 310600,
  farmingOrFishingGrossIncome: 272000,
};
const grossIncome2024: FarmerGrossIncomeFactValue = {
  totalGrossIncome: 251000,
  farmingOrFishingGrossIncome: 248500,
};

const waiver: CaFarmerWaiverFactValue = {
  amount: 20,
  explanation:
    "A flood of the Feather River in January 2026 closed the orchard road and the bank for three weeks; I could not make the full payment on time. I ask that $20 of the penalty be waived.",
};

const FARMER = "estimated_payments";

export const zerahFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "05/21/1934"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sutter"),
  idFact("occupation", "Walnut grower"),
  idFact("phone", "530-555-0158"),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: Medicare all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
  fact(
    "self_employment",
    makeFarmFactKey("garden-highway-orchard"),
    orchard,
    `${VERBAL}: the orchard's books.`,
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey(PENSION_PAYER, PENSION_ID),
    pension,
    "1099-R from the Sutter Basin Cannery Pension Plan (docs/01-sutter-basin-cannery-1099-r.pdf).",
  ),
  fact(
    "retirement",
    CA_LUMP_SUM_OWN_KEY,
    lumpSum,
    `${VERBAL}: all of the plan paid out in 2025, none rolled over, in the plan since 1961, no earlier Schedule G-1; both California elections.`,
  ),
  fact(
    "investment_income",
    makeInterestFactKey("feather-river"),
    savings,
    "1099-INT, Feather River Farm Credit.",
  ),
  fact(
    "self_employment",
    FARMER_OR_FISHERMAN_KEYS.grossIncome2025,
    grossIncome2025,
    `${VERBAL}: the 2025 return's income amounts.`,
  ),
  fact(
    "self_employment",
    FARMER_OR_FISHERMAN_KEYS.grossIncome2024,
    grossIncome2024,
    `${VERBAL}: her 2024 return's income amounts.`,
  ),
  fact(
    FARMER,
    PRIOR_YEAR_KEYS.caTax,
    9100,
    `${VERBAL}: 2024 Form 540 lines 48, 61 and 62, less the line 34 tax.`,
  ),
  fact(
    FARMER,
    PRIOR_YEAR_KEYS.caLumpSumTax,
    310,
    `${VERBAL}: 2024 Form 540 line 34, FTB 5870A tax on a trust's accumulation distribution.`,
  ),
  fact(FARMER, PRIOR_YEAR_KEYS.caWithholding, 900, `${VERBAL}: 2024 Form 540 line 71.`),
  fact(FARMER, CA_PAYMENT_KEYS.estimatedTax, 2000, `${VERBAL}: one 2025 Form 540-ES payment.`),
  fact(
    FARMER,
    CA_PAYMENT_KEYS.priorYearOverpaymentApplied,
    300,
    `${VERBAL}: her 2024 overpayment applied to 2025.`,
  ),
  fact(
    FARMER,
    CA_FARMER_ESTIMATED_TAX_KEYS.estimatedTaxByJanuary15,
    2000,
    `${VERBAL}: the Form 540-ES payment, made January 12, 2026.`,
  ),
  fact(
    FARMER,
    CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2,
    false,
    `${VERBAL}: she files and pays on April 6, 2026.`,
  ),
  fact(
    FARMER,
    CA_FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn,
    "2026-04-06",
    `${VERBAL}: paid with the return.`,
  ),
  fact(FARMER, CA_FARMER_ESTIMATED_TAX_KEYS.waiver, waiver, `${VERBAL}: the flood.`),
];
