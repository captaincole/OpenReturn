/*
 * A made-up taxpayer (README.md): every name and amount is invented. The farm
 * amounts are what she states from the farm's books. The W-2, 1099-INT,
 * 1099-DIV and 1099-B amounts are boxes as the documents would print them.
 * The NOL answers come from her earlier returns.
 */

import {
  BUSINESS_LOSS_LIMIT_KEYS,
  EIC_KEYS,
  makeDividendFactKey,
  makeFarmFactKey,
  makeInterestFactKey,
  makeNolCarrybackYearFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  NOL_KEYS,
  type DividendFactValue,
  type FarmFactValue,
  type InterestFactValue,
  type NolCarrybackYearValue,
  type NolCarryoverRow,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GALINA_USER_ID = "galina-integration";
export const GALINA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GALINA_USER_ID,
  taxYear: GALINA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const GALINA = {
  firstName: "Galina",
  lastName: "Venkirk",
  ssn: "400-00-1722",
  street: "4120 County Road 21",
  city: "Brookings",
  state: "SD",
  zip: "57006",
};

const address = { line1: GALINA.street, city: GALINA.city, state: GALINA.state, zip: GALINA.zip };

// Her winter job at a grain elevator (made up).
const elevatorW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Sioux River Grain Elevator LLC",
  employerEin: "00-0001721",
  employerAddress: { line1: "200 Depot Street", city: "Brookings", state: "SD", zip: "57006" },
  employee: { firstName: GALINA.firstName, lastName: GALINA.lastName, ssn: GALINA.ssn, address },
  box1: 20000,
  box2: 1000,
  box3: 20000,
  box4: 1240,
  box5: 20000,
  box6: 290,
};

/*
 * Her corn and soybean farm (cash method, material participation). A dry
 * summer cut the crop: $60,000 of sales against $140,000 of costs, a loss of
 * $80,000 on Schedule F line 34.
 */
export const FARM_ID = "venkirk-home-farm";
export const farm: FarmFactValue = {
  owner: "taxpayer",
  activity: "Corn and soybeans",
  code: "111150",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  productSales: 60000,
  expenses: {
    chemicals: 30000,
    fertilizersAndLime: 30000,
    seedsAndPlants: 40000,
    laborHired: 25000,
    repairs: 15000,
  },
  newDepreciableProperty: false,
  allInvestmentAtRisk: true,
};

const interest: InterestFactValue = {
  payerName: "Brookings Farmers Bank",
  payerTin: "00-0001723",
  box1: 1200,
};

const dividends: DividendFactValue = {
  payerName: "Big Sioux Index Funds",
  payerTin: "00-0001724",
  box1a: 800,
  box1b: 300,
  box2a: 500,
};

const BROKER = "big-sioux-brokerage";
export const SHORT_SALE_ID = "galina-st-001";
export const LONG_SALE_ID = "galina-lt-001";
export const COOP_SALE_ID = "galina-coop-001";

const shortSale: TradeFactValue = {
  tradeId: SHORT_SALE_ID,
  description: "200 sh Prairie Wind Energy Corp",
  quantity: 200,
  dateAcquired: "02/03/2025",
  dateSold: "08/14/2025",
  proceeds: 11000,
  costBasis: 20000,
};

const longSale: TradeFactValue = {
  tradeId: LONG_SALE_ID,
  description: "80 sh Big Sioux Total Market Fund",
  quantity: 80,
  dateAcquired: "05/10/2019",
  dateSold: "06/02/2025",
  proceeds: 8000,
  costBasis: 6000,
};

/* Her equity in the farm supply cooperative, a capital asset of the farm: no 1099-B, Form 8949 box F. */
const coopSale: TradeFactValue = {
  tradeId: COOP_SALE_ID,
  description: "Equity in Plains Farm Supply Cooperative",
  quantity: 1,
  dateAcquired: "04/01/2015",
  dateSold: "10/20/2025",
  proceeds: 500,
  costBasis: 2000,
};

/* What is left of her 2016 farm loss after 2023 and 2024 used part of it. */
const carryovers: NolCarryoverRow[] = [{ yearOfLoss: 2016, carryoverTo2025: 5000 }];

/* Her 2023 return, as filed: she itemized, with a capital loss and a QBI deduction. */
export const return2023: NolCarrybackYearValue = {
  taxableIncome: 28000,
  netCapitalLossDeduction: 3000,
  qbiDeduction: 4000,
  agiAdjustment: 0,
  itemized: true,
  agi: 50000,
  medicalBeforeLimit: 6000,
  medicalAfterLimit: 2250,
  nolDeducted: 25000,
  charitableContributions: 5000,
  cashGiftsTo60PercentOrganizations: 5000,
  casualtyDeduction: 4000,
  casualtyBeforeLimit: 9000,
};

/* Her 2024 return, as filed. */
export const return2024: NolCarrybackYearValue = {
  taxableIncome: 15000,
  netCapitalLossDeduction: 1500,
  qbiDeduction: 2000,
  agiAdjustment: 0,
  itemized: true,
  agi: 40000,
  medicalBeforeLimit: 5000,
  medicalAfterLimit: 2000,
  nolDeducted: 10000,
  charitableContributions: 3000,
  cashGiftsTo60PercentOrganizations: 3000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GALINA_USER_ID, taxYear: GALINA_TAX_YEAR, suffix, value });

const trade = (value: TradeFactValue, note: string) =>
  fact("investment_income", makeTradeFactKey(BROKER, value.tradeId), value, note);

export const galinaFacts: TaxFactRow[] = [
  idFact("name.first", GALINA.firstName),
  idFact("name.last", GALINA.lastName),
  idFact("ssn", GALINA.ssn),
  idFact("dob", "07/19/1979"),
  idFact("address.street", GALINA.street),
  idFact("address.city", GALINA.city),
  idFact("address.state", GALINA.state),
  idFact("address.zip", GALINA.zip),
  idFact("occupation", "Farmer"),
  idFact("phone", "605-555-0172"),
  fact(
    "wages",
    makeW2FactKey("sioux-river-grain"),
    elevatorW2,
    "W-2 from Sioux River Grain Elevator.",
  ),
  fact("self_employment", makeFarmFactKey(FARM_ID), farm, `${VERBAL}: the farm's books.`),
  fact(
    "investment_income",
    makeInterestFactKey("brookings-farmers-bank"),
    interest,
    "1099-INT from Brookings Farmers Bank.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey(BROKER),
    dividends,
    "1099-DIV from Big Sioux Index Funds.",
  ),
  trade(shortSale, "1099-B from Big Sioux Index Funds, short-term, basis reported."),
  trade(longSale, "1099-B from Big Sioux Index Funds, long-term, basis reported."),
  trade(coopSale, `${VERBAL}: the cooperative's redemption letter (no 1099-B).`),
  fact(
    "other",
    BUSINESS_LOSS_LIMIT_KEYS.businessCapitalGain,
    -1500,
    `${VERBAL}: the cooperative equity was held for the farm; no other capital asset was a business's.`,
  ),
  fact(
    "other",
    NOL_KEYS.carryovers,
    carryovers,
    `${VERBAL}: the carryover statement with her 2024 return.`,
  ),
  fact(
    "other",
    NOL_KEYS.waiveFarmingCarryback,
    false,
    `${VERBAL}: she carries the farm loss back.`,
  ),
  fact("other", makeNolCarrybackYearFactKey(2023), return2023, `${VERBAL}: her 2023 Form 1040.`),
  fact("other", makeNolCarrybackYearFactKey(2024), return2024, `${VERBAL}: her 2024 Form 1040.`),
  fact("other", EIC_KEYS.nonresidentAlien, false, VERBAL),
  fact("other", EIC_KEYS.qualifyingChildOfAnother, false, VERBAL),
  fact("other", EIC_KEYS.mainHomeInUs, true, VERBAL),
  fact("other", EIC_KEYS.claimableAsDependent, false, VERBAL),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, VERBAL),
  fact("other", EIC_KEYS.barredByIrs, false, VERBAL),
];
