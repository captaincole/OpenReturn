/*
 * A made-up married person who files separately in Texas (README.md): every
 * name and amount is invented. No input documents: the facts are the boxes as
 * Careane's documents would print them, and her answers about her and her
 * husband's community and separate items (Form 8958).
 */

import {
  COMMUNITY_PROPERTY_KEYS,
  RENTAL_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeCommunityPropertyItemFactKey,
  makeDividendFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeInterestFactKey,
  makeRentalFactKey,
  makeRetirementDistributionFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type CommunityPropertyItemFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type RentalFactValue,
  type RetirementDistributionFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const CAREANE_USER_ID = "careane-integration";
export const CAREANE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";
const STATED = "Stated by Careane, 2026-11-26";
const PAYER_TIN = "00-0008958";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CAREANE_USER_ID,
  taxYear: CAREANE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CAREANE = {
  firstName: "Careane",
  lastName: "Vellacott",
  ssn: "400-00-8958",
  street: "5120 Hondo Pass Drive",
  city: "El Paso",
  state: "TX",
  zip: "79924",
};

export const DAVRAM = { firstName: "Davram", lastName: "Vellacott", ssn: "400-00-8959" };

const address = {
  line1: CAREANE.street,
  city: CAREANE.city,
  state: CAREANE.state,
  zip: CAREANE.zip,
};

// Careane's W-2 from Rio Grande Pediatrics (made up).
const careaneW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Rio Grande Pediatrics PA",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "1600 N Mesa Street", city: "El Paso", state: "TX", zip: "79902" },
  employee: { firstName: CAREANE.firstName, lastName: CAREANE.lastName, ssn: CAREANE.ssn, address },
  box1: 72000,
  box2: 19000,
  box3: 72000,
  box4: 4464,
  box5: 72000,
  box6: 1044,
};

// The community savings account in Careane's name.
const savingsInterest: InterestFactValue = {
  payerName: "Franklin Mountain Credit Union",
  payerTin: PAYER_TIN,
  box1: 1200,
};

// Shares Careane inherited, her separate property: in Texas their dividends are community income.
const inheritedDividends: DividendFactValue = {
  payerName: "Lone Star Energy Corp",
  payerTin: PAYER_TIN,
  box1a: 2000,
  box1b: 2000,
};

export const SALE_TRADE_ID = "brk-d-8958";
// Sale of some of the inherited shares, basis reported (box D): a separate gain.
const inheritedSharesSale: TradeFactValue = {
  tradeId: SALE_TRADE_ID,
  description: "200 sh Lone Star Energy Corp",
  dateAcquired: "06/12/2019",
  dateSold: "09/18/2025",
  proceeds: 15000,
  costBasis: 10000,
};

// Careane's bookkeeping business: a community business she carries on.
const bookkeeping: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Bookkeeping services",
  code: "541219",
  name: "Vellacott Bookkeeping",
  address: { street: CAREANE.street, city: CAREANE.city, state: CAREANE.state, zip: CAREANE.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 36000,
  expenses: { supplies: 2500, insurance: 1500, utilities: 2000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

// Careane's pension: 20 years in the plan, 10 of them married and domiciled in Texas.
const pension: RetirementDistributionFactValue = {
  payerName: "Sun City Water Utility Pension Plan",
  payerTin: PAYER_TIN,
  owner: "taxpayer",
  box1: 12000,
  box2a: 12000,
  box4: 1200,
  box7: "7",
  box7IraSepSimple: false,
};

// A mineral royalty on land Careane inherited: separate property, its income community in Texas.
const royalty: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "royalties",
  royaltiesReceived: 3000,
  royaltyActivity: "portfolio",
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* Form 8958 items: Careane's and Davram's, as she states them (README.md, "Inputs"). */
type Item = CommunityPropertyItemFactValue;
const ITEMS: Array<[string, Item]> = [
  [
    "careane-wages",
    {
      line: "wages",
      description: "Rio Grande Pediatrics (Careane)",
      amount: 72000,
      basis: "community",
      owner: "taxpayer",
      federalWithholding: 19000,
    },
  ],
  [
    "davram-freight-wages",
    {
      line: "wages",
      description: "Franklin Freight Lines (Davram)",
      amount: 48000,
      basis: "community",
      owner: "spouse",
      federalWithholding: 19000,
    },
  ],
  [
    "davram-hardware-wages",
    {
      line: "wages",
      description: "Mesa Hardware (Davram)",
      amount: 24000,
      basis: "community",
      owner: "spouse",
    },
  ],
  [
    "careane-savings",
    {
      line: "interest",
      description: "Franklin Mountain Credit Union (Careane)",
      amount: 1200,
      basis: "community",
      owner: "taxpayer",
    },
  ],
  [
    "davram-savings",
    {
      line: "interest",
      description: "Paso del Norte Bank (Davram)",
      amount: 800,
      basis: "community",
      owner: "spouse",
    },
  ],
  [
    "davram-bonds",
    {
      line: "interest",
      description: "Treasury notes owned before marriage (Davram)",
      amount: 400,
      basis: "separate_property",
      owner: "spouse",
    },
  ],
  [
    "careane-inherited-dividends",
    {
      line: "dividends",
      description: "Lone Star Energy, inherited (Careane)",
      amount: 2000,
      basis: "separate_property",
      owner: "taxpayer",
    },
  ],
  [
    "davram-fund-dividends",
    {
      line: "dividends",
      description: "Index fund owned before marriage (Davram)",
      amount: 2000,
      basis: "separate_property",
      owner: "spouse",
    },
  ],
  [
    "careane-bookkeeping",
    {
      line: "self_employment_income",
      description: "Vellacott Bookkeeping (Careane)",
      amount: 30000,
      basis: "community",
      owner: "taxpayer",
    },
  ],
  [
    "davram-handyman",
    {
      line: "self_employment_income",
      description: "Davram's Home Repair (Davram)",
      amount: 30000,
      basis: "community",
      owner: "spouse",
    },
  ],
  [
    "careane-share-sale",
    {
      line: "capital_gain_or_loss",
      description: "Lone Star Energy shares sold (Careane)",
      amount: 5000,
      basis: "separate",
      owner: "taxpayer",
    },
  ],
  [
    "davram-fund-sale",
    {
      line: "capital_gain_or_loss",
      description: "Index fund shares sold (Davram)",
      amount: -800,
      basis: "separate",
      owner: "spouse",
    },
  ],
  [
    "careane-pension",
    {
      line: "pension",
      description: "Sun City Water pension (Careane)",
      amount: 12000,
      basis: "part_community",
      communityMonths: 120,
      participationMonths: 240,
      owner: "taxpayer",
      federalWithholding: 1200,
    },
  ],
  [
    "davram-pension",
    {
      line: "pension",
      description: "Ironworkers pension (Davram)",
      amount: 6000,
      basis: "community",
      owner: "spouse",
      federalWithholding: 600,
    },
  ],
  [
    "careane-royalty",
    {
      line: "rents_royalties_partnerships_estates_trusts",
      description: "Mineral royalty, inherited land (Careane)",
      amount: 3000,
      basis: "separate_property",
      owner: "taxpayer",
    },
  ],
  [
    "davram-royalty",
    {
      line: "rents_royalties_partnerships_estates_trusts",
      description: "Mineral royalty, land owned before marriage (Davram)",
      amount: 3000,
      basis: "separate_property",
      owner: "spouse",
    },
  ],
  [
    "careane-se-tax",
    {
      line: "self_employment_tax",
      description: "Vellacott Bookkeeping (Careane)",
      amount: 4238,
      basis: "community",
      owner: "taxpayer",
    },
  ],
  [
    "davram-se-tax",
    {
      line: "self_employment_tax",
      description: "Davram's Home Repair (Davram)",
      amount: 4238,
      basis: "community",
      owner: "spouse",
    },
  ],
  [
    "joint-estimated-tax",
    {
      line: "other",
      description: "2025 estimated tax paid jointly",
      amount: 6000,
      kind: "joint_estimated_tax_payments",
      agreedTaxpayerAmount: 2000,
    },
  ],
];

// Careane's agreed third of each joint installment of $1,500 (README.md).
const ESTIMATED_PAYMENTS: Array<[string, string]> = [
  ["q1", "2025-04-15"],
  ["q2", "2025-06-16"],
  ["q3", "2025-09-15"],
  ["q4", "2026-01-15"],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CAREANE_USER_ID, taxYear: CAREANE_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", CAREANE.firstName),
  idFact("name.last", CAREANE.lastName),
  idFact("ssn", CAREANE.ssn),
  idFact("dob", "02/17/1972"),
  idFact("address.street", CAREANE.street),
  idFact("address.city", CAREANE.city),
  idFact("address.state", CAREANE.state),
  idFact("address.zip", CAREANE.zip),
  idFact("occupation", "Medical office manager"),
  idFact("phone", "915-555-0158"),
  fact("identity", SPOUSE_KEYS.firstName, DAVRAM.firstName, STATED),
  fact("identity", SPOUSE_KEYS.lastName, DAVRAM.lastName, STATED),
  fact("identity", SPOUSE_KEYS.occupation, "Freight dispatcher", STATED),
  fact("identity", SPOUSE_KEYS.ssn, DAVRAM.ssn, STATED),
  fact(
    "filing_status",
    SPOUSE_KEYS.livedApartLastSixMonths,
    false,
    `${STATED}: they live together.`,
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
    false,
    `${STATED}: not separated.`,
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.itemizesSeparately,
    false,
    `${STATED}: Davram takes the standard deduction.`,
  ),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("rio-grande-pediatrics"),
    careaneW2,
    `W-2 from Rio Grande Pediatrics, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeInterestFactKey("franklin-mountain-cu"),
    savingsInterest,
    `1099-INT from Franklin Mountain Credit Union, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeDividendFactKey("lone-star-energy"),
    inheritedDividends,
    `1099-DIV from Lone Star Energy, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeTradeFactKey("franklin-brokerage", SALE_TRADE_ID),
    inheritedSharesSale,
    `1099-B from Franklin Brokerage, ${MADE_UP}.`,
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("vellacott-bookkeeping"),
    bookkeeping,
    `${STATED}: her bookkeeping business's books.`,
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("sun-city-water-pension", "code-7"),
    pension,
    `1099-R from Sun City Water Utility Pension Plan, ${MADE_UP}.`,
  ),
  fact(
    "rental",
    makeRentalFactKey("inherited-mineral-royalty"),
    royalty,
    `1099-MISC box 2 from Permian Royalty Co, ${MADE_UP}.`,
  ),
  fact(
    "rental",
    RENTAL_KEYS.paymentsRequire1099,
    false,
    `${STATED}: she paid no one for the royalty.`,
  ),
];

const COMMUNITY_PROPERTY: TaxFactRow[] = [
  fact(
    "other",
    COMMUNITY_PROPERTY_KEYS.domicileState,
    "TX",
    `${STATED}: domiciled in El Paso, Texas, all of 2025.`,
  ),
  ...ITEMS.map(([slug, value]) =>
    fact(
      "other",
      makeCommunityPropertyItemFactKey(slug),
      value,
      `${STATED}; Davram's amounts from his documents.`,
    ),
  ),
  ...ESTIMATED_PAYMENTS.map(([slug, date]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      { date, amount: 500 },
      `${STATED}: her agreed part of the joint payment.`,
    ),
  ),
];

export const careaneFacts: TaxFactRow[] = [...IDENTITY, ...DOCUMENTS, ...COMMUNITY_PROPERTY];
