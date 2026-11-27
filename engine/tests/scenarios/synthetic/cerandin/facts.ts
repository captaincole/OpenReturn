/*
 * A made-up cattle rancher in Wyoming (README.md): every name and amount is
 * invented. No input documents: the W-2 holds its boxes as printed, the farm
 * fact holds the ranch's books, and the rest are her answers.
 */

import {
  ESTIMATED_TAX_KEYS,
  FARMER_ESTIMATED_TAX_KEYS,
  FARMER_OR_FISHERMAN_KEYS,
  PRIOR_YEAR_KEYS,
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  makeFuelTaxActivityFactKey,
  makeW2FactKey,
  type FarmFactValue,
  type FarmerGrossIncomeFactValue,
  type FuelTaxActivityFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const CERANDIN_USER_ID = "cerandin-integration";
export const CERANDIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Cerandin, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CERANDIN_USER_ID,
  taxYear: CERANDIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CERANDIN = {
  firstName: "Cerandin",
  lastName: "Marrowby",
  ssn: "400-00-2210",
  street: "17 Antelope Draw Road",
  city: "Lusk",
  state: "WY",
  zip: "82225",
};

const address = {
  line1: CERANDIN.street,
  city: CERANDIN.city,
  state: CERANDIN.state,
  zip: CERANDIN.zip,
};

/* Her winter job at the feed store in town (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Niobrara Feed & Seed LLC",
  employerEin: "00-0002210",
  employerAddress: { line1: "210 South Main Street", city: "Lusk", state: "WY", zip: "82225" },
  employee: {
    firstName: CERANDIN.firstName,
    lastName: CERANDIN.lastName,
    ssn: CERANDIN.ssn,
    address,
  },
  box1: 14000,
  box2: 1200,
  box3: 14000,
  box4: 868,
  box5: 14000,
  box6: 203,
};

const FARM_KEY = makeFarmFactKey("antelope-draw-ranch");

/* The cow-calf ranch (cash method, material participation, no new property). */
const ranch: FarmFactValue = {
  owner: "taxpayer",
  activity: "Beef cattle (cow-calf)",
  code: "112111",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 248000,
  agriculturalProgramPayments: 12000,
  expenses: {
    depreciation: 21000,
    feed: 52000,
    gasolineFuelAndOil: 14400,
    insurance: 6800,
    otherInterest: 9600,
    repairs: 11200,
    seedsAndPlants: 4300,
    supplies: 7900,
    taxes: 5100,
    utilities: 3700,
    veterinaryBreedingMedicine: 12000,
  },
  newDepreciableProperty: false,
};

/* Undyed diesel bought for the ranch's tractors, used on the ranch for farming (line 3b). */
const ranchFuel: FuelTaxActivityFactValue = {
  kind: "business",
  businessKey: FARM_KEY,
  equipment: { make: "John Deere", model: "6155M", type: "Farm tractor" },
  claims: [{ line: "3b", gallons: 4000, actualFuelCost: 14400 }],
};

/* Gross income from all sources and from farming: the income (not loss) amounts of each return. */
const grossIncome2025: FarmerGrossIncomeFactValue = {
  totalGrossIncome: 274000,
  farmingOrFishingGrossIncome: 260000,
};
const grossIncome2024: FarmerGrossIncomeFactValue = {
  totalGrossIncome: 251000,
  farmingOrFishingGrossIncome: 236000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CERANDIN_USER_ID, taxYear: CERANDIN_TAX_YEAR, suffix, value });

export const cerandinFacts: TaxFactRow[] = [
  idFact("name.first", CERANDIN.firstName),
  idFact("name.last", CERANDIN.lastName),
  idFact("ssn", CERANDIN.ssn),
  idFact("dob", "03/11/1971"),
  idFact("address.street", CERANDIN.street),
  idFact("address.city", CERANDIN.city),
  idFact("address.state", CERANDIN.state),
  idFact("address.zip", CERANDIN.zip),
  idFact("occupation", "Rancher"),
  idFact("phone", "307-555-0122"),
  fact("wages", makeW2FactKey("niobrara-feed"), w2, "W-2 from Niobrara Feed & Seed LLC."),
  fact("self_employment", FARM_KEY, ranch, `${VERBAL}: the ranch's cash books.`),
  fact(
    "other",
    makeFuelTaxActivityFactKey("antelope-draw-ranch"),
    ranchFuel,
    `${VERBAL}: her 2025 fuel invoices, off-road gallons.`,
  ),
  fact(
    "self_employment",
    FARMER_OR_FISHERMAN_KEYS.grossIncome2025,
    grossIncome2025,
    `${VERBAL}: wages $14,000 and Schedule F line 9 $260,000.`,
  ),
  fact(
    "self_employment",
    FARMER_OR_FISHERMAN_KEYS.grossIncome2024,
    grossIncome2024,
    `${VERBAL}: her 2024 return's income amounts.`,
  ),
  fact(
    "estimated_payments",
    makeEstimatedTaxPaymentFactKey("2025-farmer"),
    { date: "2026-01-12", amount: 9000 },
    `${VERBAL}: IRS Direct Pay confirmation.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 21400, `${VERBAL}: her 2024 return.`),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    121000,
    `${VERBAL}: 2024 Form 1040 line 11.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2,
    false,
    `${VERBAL}: she files and pays on March 20, 2026.`,
  ),
  fact(
    "estimated_payments",
    FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn,
    "2026-03-20",
    `${VERBAL}: the balance is paid with the return.`,
  ),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.waiverRequest,
    "part",
    `${VERBAL}: an October barn fire destroyed the ranch's records for weeks.`,
  ),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.waiverAmount,
    40,
    `${VERBAL}: the part of the penalty she asks to waive.`,
  ),
];
