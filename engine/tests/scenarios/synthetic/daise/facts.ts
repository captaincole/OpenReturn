/*
 * A made-up taxpayer (README.md): every name and amount is invented. The farm
 * amounts are what she states from the ranch's books; the totals include her
 * Forms 1099-PATR, CCC-1099-G, 1099-A and 1099-MISC (crop insurance), as the
 * Schedule F instructions say. The SSA-1099 and 1099-INT are boxes as the
 * documents would print them.
 */

import {
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  makeInterestFactKey,
  makeSocialSecurityFactKey,
  type DatedAmountFactValue,
  type FarmFactValue,
  type InterestFactValue,
  type SocialSecurityFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DAISE_USER_ID = "daise-integration";
export const DAISE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const VERBAL = "Verbal, 2026-11-25";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DAISE_USER_ID,
  taxYear: DAISE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DAISE = {
  firstName: "Daise",
  lastName: "Thornbury",
  ssn: "400-00-7311",
  street: "18450 Ranch Road 1376",
  city: "Fredericksburg",
  state: "TX",
  zip: "78624",
};

export const FARM_ID = "thornbury-creek";

/*
 * Her cattle and hay ranch (cash method, material participation). Line 4a
 * holds $12,000 of CRP payments she received while on social security
 * (Schedule SE line 1b), a $1,800 market gain under her CCC loan election
 * and $1,500 of excluded cost-sharing payments. She deferred $7,000 of
 * drought insurance to 2026 and brings in $3,250 deferred from 2024.
 */
export const ranch: FarmFactValue = {
  owner: "taxpayer",
  activity: "Beef cattle and hay",
  code: "112111",
  ein: "00-0007311",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  purchasedItemSales: 64000,
  purchasedItemBasis: 41500,
  productSales: 286400,
  cooperativeDistributions: 4800,
  cooperativeDistributionsNotTaxable: 600,
  agriculturalProgramPayments: 21300,
  marketGain: 1800,
  costShareExclusion: 1500,
  crpPaymentsWhileReceivingSocialSecurity: 12000,
  cccLoanElection: true,
  cccLoansReported: 15000,
  cccLoansForfeited: 9000,
  cccForfeitedCommodityBasis: 8200,
  cropInsurance: 18600,
  cropInsuranceDeferred: 7000,
  cropInsuranceFrom2024: 3250,
  customHireIncome: 6900,
  otherIncome: 1140,
  vehicles: [{ businessMiles: 6200, standardMileageRate: true, parkingAndTolls: 85 }],
  conservation: { expenses: 6500, carryover: 1000 },
  expenses: {
    chemicals: 3900,
    customHire: 5200,
    depreciation: 18400,
    employeeBenefitPrograms: 4800,
    feed: 46700,
    fertilizersAndLime: 12300,
    freightAndTrucking: 3450,
    gasolineFuelAndOil: 9800,
    insurance: 7600,
    mortgageInterest: 14200,
    otherInterest: 3100,
    laborHired: 52000,
    pensionAndProfitSharing: 2600,
    rentVehiclesMachinery: 4100,
    rentOther: 9000,
    repairs: 8750,
    seedsAndPlants: 6300,
    storageAndWarehousing: 1850,
    supplies: 5400,
    taxes: 6900,
    utilities: 3800,
    veterinaryBreedingMedicine: 7250,
  },
  newDepreciableProperty: false,
  otherExpenses: [
    { description: "Accounting and tax preparation", amount: 2400 },
    { description: "Bank fees", amount: 380 },
    { description: "Small tools", amount: 960 },
    { description: "Cattle association dues", amount: 450 },
    { description: "Advertising", amount: 600 },
  ],
  section263ACapitalized: 2200,
  w2WagesPaid: 52000,
  qualifiedPropertyUbia: 310000,
};

const socialSecurity: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 34800,
  box5: 34800,
};

const interest: InterestFactValue = {
  payerName: "Pedernales Valley Bank",
  payerTin: "00-0007312",
  box1: 85000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 16500 }],
  ["2025-06", { date: "2025-06-16", amount: 16500 }],
  ["2025-09", { date: "2025-09-15", amount: 16500 }],
  ["2026-01", { date: "2026-01-15", amount: 16500 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DAISE_USER_ID, taxYear: DAISE_TAX_YEAR, suffix, value });

export const daiseFacts: TaxFactRow[] = [
  idFact("name.first", DAISE.firstName),
  idFact("name.last", DAISE.lastName),
  idFact("ssn", DAISE.ssn),
  idFact("dob", "03/12/1958"),
  idFact("address.street", DAISE.street),
  idFact("address.city", DAISE.city),
  idFact("address.state", DAISE.state),
  idFact("address.zip", DAISE.zip),
  idFact("occupation", "Rancher"),
  idFact("phone", "830-555-0173"),
  fact(
    "self_employment",
    makeFarmFactKey(FARM_ID),
    ranch,
    `${VERBAL}: the ranch's books, with her Forms 1099-PATR, CCC-1099-G, 1099-A and 1099-MISC.`,
  ),
  fact(
    "retirement",
    makeSocialSecurityFactKey("ssa"),
    socialSecurity,
    "SSA-1099 from the Social Security Administration.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("pedernales-valley"),
    interest,
    "1099-INT from Pedernales Valley Bank.",
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
