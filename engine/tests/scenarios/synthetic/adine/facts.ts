/*
 * A made-up taxpayer (README.md): every name and amount is invented. The farm
 * amounts are what she states from the farm's books. The base-year amounts are
 * what she states from her 2022, 2023 and 2024 returns (last year's return is
 * not read, #79).
 */

import {
  FARM_INCOME_AVERAGING_KEY,
  makeBusinessPropertySaleFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeFarmAveragingBaseYearFactKey,
  makeFarmFactKey,
  makeInterestFactKey,
  SECTION_1231_KEYS,
  type BusinessPropertySaleFactValue,
  type DatedAmountFactValue,
  type FarmAveragingBaseYearFactValue,
  type FarmFactValue,
  type FarmIncomeAveragingFactValue,
  type InterestFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ADINE_USER_ID = "adine-integration";
export const ADINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ADINE_USER_ID,
  taxYear: ADINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ADINE = {
  firstName: "Adine",
  lastName: "Corrigan",
  ssn: "400-00-7422",
  street: "2210 County Road 17",
  city: "Dalhart",
  state: "TX",
  zip: "79022",
};

export const FARM_ID = "corrigan-plains";

/* Her wheat and cow-calf farm (cash method, material participation). A big wheat year. */
export const farm: FarmFactValue = {
  owner: "taxpayer",
  activity: "Wheat and cow-calf",
  code: "111140",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  productSales: 268500,
  agriculturalProgramPayments: 6200,
  cropInsurance: 9400,
  customHireIncome: 3100,
  conservation: { expenses: 2000, livestockGains: 24000 },
  expenses: {
    chemicals: 7400,
    customHire: 6800,
    depreciation: 15200,
    feed: 9600,
    fertilizersAndLime: 18300,
    freightAndTrucking: 2900,
    gasolineFuelAndOil: 11200,
    insurance: 6400,
    otherInterest: 4100,
    rentOther: 12000,
    repairs: 7300,
    seedsAndPlants: 8900,
    supplies: 2600,
    taxes: 3500,
    utilities: 2100,
    veterinaryBreedingMedicine: 1900,
  },
  newDepreciableProperty: false,
  otherExpenses: [{ description: "Accounting and tax preparation", amount: 1500 }],
  allInvestmentAtRisk: true,
};

/*
 * Ten raised breeding cows sold at the sale barn in October: raised, so no
 * basis and no depreciation, held more than 24 months. A section 1231 gain
 * (Form 4797 Part I), and farm income Schedule J may average
 * (irs-1040sj-inst-2025::sec::specific-instructions::b02).
 */
export const cows: BusinessPropertySaleFactValue = {
  description: "10 raised breeding cows",
  kind: "section_1245",
  dateAcquired: "2020-03-01",
  dateSold: "2025-10-14",
  grossSalesPrice: 24000,
  costOrOtherBasis: 0,
  depreciationAllowed: 0,
};

const interest: InterestFactValue = {
  payerName: "XIT Ranch Country Bank",
  payerTin: "00-0007423",
  box1: 1100,
};

/*
 * The election: $100,000 of her farm income, the cows' $24,000 gain in it.
 * She elects less than all of it (specific-instructions::b04, TIP).
 */
export const election: FarmIncomeAveragingFactValue = {
  electedFarmIncome: 100000,
  netCapitalGain: 24000,
};

/* 2022: a drought year, single. Taxable income and tax from her 2022 Form 1040 lines 15 and 16. */
const base2022: FarmAveragingBaseYearFactValue = {
  filingStatus: "single",
  taxableIncome: 21400,
  sectionOneTax: 2366,
};

/* 2023: single. */
const base2023: FarmAveragingBaseYearFactValue = {
  filingStatus: "single",
  taxableIncome: 34250,
  sectionOneTax: 3893,
};

/* 2024: single, with $1,800 of qualified dividends (her tax used the QDCG worksheet). */
const base2024: FarmAveragingBaseYearFactValue = {
  filingStatus: "single",
  taxableIncome: 52800,
  sectionOneTax: 6549,
  qualifiedDividends: 1800,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 12000 }],
  ["2025-06", { date: "2025-06-16", amount: 12000 }],
  ["2025-09", { date: "2025-09-15", amount: 12000 }],
  ["2026-01", { date: "2026-01-15", amount: 12000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ADINE_USER_ID, taxYear: ADINE_TAX_YEAR, suffix, value });

const baseYear = (year: number, value: FarmAveragingBaseYearFactValue) =>
  fact(
    "other",
    makeFarmAveragingBaseYearFactKey(year),
    value,
    `${VERBAL}: her ${year} Form 1040 (lines 3a, 15 and 16).`,
  );

export const adineFacts: TaxFactRow[] = [
  idFact("name.first", ADINE.firstName),
  idFact("name.last", ADINE.lastName),
  idFact("ssn", ADINE.ssn),
  idFact("dob", "07/09/1979"),
  idFact("address.street", ADINE.street),
  idFact("address.city", ADINE.city),
  idFact("address.state", ADINE.state),
  idFact("address.zip", ADINE.zip),
  idFact("occupation", "Farmer"),
  idFact("phone", "806-555-0144"),
  fact("self_employment", makeFarmFactKey(FARM_ID), farm, `${VERBAL}: the farm's books.`),
  fact(
    "other",
    makeBusinessPropertySaleFactKey("breeding-cows"),
    cows,
    `${VERBAL}: the sale barn's settlement sheet; the cows were raised on the farm.`,
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    0,
    `${VERBAL}: no net section 1231 loss in 2020 to 2024.`,
  ),
  fact(
    "investment_income",
    makeInterestFactKey("xit-ranch-country"),
    interest,
    "1099-INT from XIT Ranch Country Bank.",
  ),
  fact(
    "other",
    FARM_INCOME_AVERAGING_KEY,
    election,
    `${VERBAL}: she elects to average $100,000 of her 2025 farm income.`,
  ),
  baseYear(2022, base2022),
  baseYear(2023, base2023),
  baseYear(2024, base2024),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
