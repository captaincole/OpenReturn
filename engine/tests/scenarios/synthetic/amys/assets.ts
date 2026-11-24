/*
 * amys's foreign accounts and holdings (README.md), with the income each one
 * pays. Every name, number and amount is made up. Each amount is in the
 * account's currency, as its statement prints it; the engine converts it with
 * the rate on the fact (facts/kinds/foreignCurrency.ts):
 * - balances: the year-end rate (irs-8938-inst-2025::sec::currency-determination-date::b01);
 * - interest and dividends: the yearly average rate (irs.gov "Yearly average
 *   currency exchange rates"; federal/8938/QUESTIONS.md question 15);
 * - tax withheld: the rate on the day withheld (irs-1116-inst-2025::sec::foreign-currency-conversion::b01);
 * - a sale: the rates on the settlement dates of the sale and the purchase
 *   (26 CFR 1.988-2(a)(2)(iv)).
 * The year-end and day rates are made up; the yearly averages are the IRS
 * table's 2025 values as read on 2026-11-24.
 */

import type {
  DividendFactValue,
  ForeignFinancialAssetFactValue,
  InterestFactValue,
  TradeFactValue,
} from "../../../../src/facts/index.js";
import type { MonthEndBalances } from "../../documents/foreignAssetStatement.js";

/* Treasury-style year-end rates: units of the currency per U.S. dollar (made up). */
const EUR = { currency: "Euro (EUR)", exchangeRate: 0.852 };
const GBP = { currency: "British pound (GBP)", exchangeRate: 0.7432 };
const CHF = { currency: "Swiss franc (CHF)", exchangeRate: 0.796 };
const NOK = { currency: "Norwegian krone (NOK)", exchangeRate: 10.125 };

const YEARLY_AVERAGE = "IRS yearly average currency exchange rates, 2025";

/* A joint time-deposit savings account in Bologna: interest, an early withdrawal penalty, Italian tax. */
export const bolognaSavings: ForeignFinancialAssetFactValue = {
  part: "deposit_account",
  owner: "joint_with_spouse",
  // Check digits 00: not a valid IBAN.
  accountNumber: "IT00 X000 0000 0000 0000 0089 38",
  maximumValue: 104000,
  yearEndValue: 97200,
  conversion: EUR,
  institution: {
    name: "Banca Saragozza S.p.A.",
    giin: "B4S7G2.00031.SL.380",
    address: {
      street: "Via Saragozza 61",
      city: "Bologna",
      country: "Italy",
      postalCode: "40123",
    },
  },
};

/* Credited, and the tax withheld, on 31 December; the time deposit was broken in September. */
export const bolognaInterest: InterestFactValue = {
  payerName: "Banca Saragozza S.p.A.",
  box1: 1180.4,
  box2: 40,
  box6: 118.04,
  box7: "Italy",
  conversion: {
    currency: "Euro (EUR)",
    exchangeRate: 0.886,
    rateSource: YEARLY_AVERAGE,
    taxExchangeRate: 0.852,
    taxRateSource: "Treasury rate for 12/31/2025, the day the tax was withheld",
  },
};

export const bolognaBalances: MonthEndBalances = [
  101250, 101900, 102600, 103300, 104000, 103850, 103700, 103550, 96140, 96060, 96137.64, 97200,
];

/* Amys's custody account at a London broker, opened in 2025: dividends and one sale. */
export const thamesBrokerage: ForeignFinancialAssetFactValue = {
  part: "custodial_account",
  owner: "taxpayer",
  accountNumber: "TB-4417-0925",
  maximumValue: 61200,
  yearEndValue: 47800,
  conversion: GBP,
  openedOrAcquired: "03/03/2025",
  institution: {
    name: "Thames Crown Securities Ltd",
    address: {
      street: "40 Gresham Street",
      city: "London",
      country: "United Kingdom",
      postalCode: "EC2V 7HH",
    },
  },
};

export const thamesDividends: DividendFactValue = {
  payerName: "Thames Crown Securities Ltd",
  box1a: 1100.7,
  box1b: 1100.7,
  conversion: { currency: "British pound (GBP)", exchangeRate: 0.759, rateSource: YEARLY_AVERAGE },
};

/* Traded 03/10 and 09/22; settled two business days later, on 03/12 and 09/24. */
export const thamesSale: TradeFactValue = {
  tradeId: "thames-001",
  description: "300 sh Severn Water plc",
  quantity: 300,
  dateAcquired: "03/10/2025",
  dateSold: "09/22/2025",
  proceeds: 13616,
  costBasis: 9402,
  conversion: {
    currency: "British pound (GBP)",
    saleExchangeRate: 0.7395,
    purchaseExchangeRate: 0.7741,
    rateSource: "Spot rates on the settlement dates, 09/24/2025 and 03/12/2025",
  },
};

export const thamesBalances: MonthEndBalances = [
  undefined,
  undefined,
  52400,
  55100,
  58300,
  61200,
  59800,
  60450,
  47100,
  47650,
  48200,
  47800,
];

/* Amys's old current account in Basel, closed in June: no income in 2025. */
export const baselCurrent: ForeignFinancialAssetFactValue = {
  part: "deposit_account",
  owner: "taxpayer",
  // Check digits 00: not a valid IBAN.
  accountNumber: "CH00 0000 0000 0000 8938 0",
  maximumValue: 13400,
  yearEndValue: 0,
  conversion: CHF,
  closedOrDisposed: "06/30/2025",
  institution: {
    name: "Rheinknie Bank AG",
    address: {
      street: "Rheingasse 18",
      city: "Basel",
      country: "Switzerland",
      postalCode: "4058",
    },
  },
};

export const baselBalances: MonthEndBalances = [
  13400,
  13250,
  13100,
  12900,
  12750,
  0,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
];

/* Shares of a Norwegian company that Corin holds on its share register, not in an account. */
export const fjordlineShares: ForeignFinancialAssetFactValue = {
  part: "other_asset",
  owner: "spouse",
  accountNumber: "Share register no. FL-20931",
  description: "22,400 ordinary shares of Fjordline Shipping ASA",
  maximumValue: 2240000,
  yearEndValue: 1100000,
  conversion: NOK,
  // Stock held on the company's register: not a financial account (Schedule B line 7a).
  financialAccount: false,
  entity: {
    name: "Fjordline Shipping ASA",
    type: "corporation",
    address: { street: "Strandkaien 4", city: "Bergen", country: "Norway", postalCode: "5013" },
  },
};

/* Paid on 05/22/2025, Norwegian tax withheld at 15% that day. */
export const fjordlineDividends: DividendFactValue = {
  payerName: "Fjordline Shipping ASA",
  box1a: 12880,
  box1b: 12880,
  box7: 1932,
  conversion: {
    currency: "Norwegian krone (NOK)",
    exchangeRate: 10.392,
    rateSource: YEARLY_AVERAGE,
    taxExchangeRate: 10.31,
    taxRateSource: "Spot rate on 05/22/2025, the day the tax was withheld",
  },
};

/* A U.S.-dollar note of a Dutch company that Amys bought in March and holds herself. */
export const polderNote: ForeignFinancialAssetFactValue = {
  part: "other_asset",
  owner: "taxpayer",
  accountNumber: "ISIN XS2876543210",
  description: "Bond of Polder Grid Finance B.V., 4.25% notes maturing March 14, 2030",
  maximumValue: 76500,
  yearEndValue: 75900,
  openedOrAcquired: "03/14/2025",
  // A note she holds herself, not in an account: not a financial account.
  financialAccount: false,
  issuers: [
    {
      name: "Polder Grid Finance B.V.",
      role: "issuer",
      type: "corporation",
      usPerson: false,
      address: {
        street: "Zuidas 88",
        city: "Amsterdam",
        country: "Netherlands",
        postalCode: "1082 MD",
      },
    },
  ],
};

/* In U.S. dollars, as the note pays: no conversion. */
export const polderInterest: InterestFactValue = {
  payerName: "Polder Grid Finance B.V.",
  box1: 1912.5,
};

/*
 * Units of a Luxembourg fund that is a PFIC: reported on Form 8621, so not in
 * Part VI. A mutual fund is a financial account for Schedule B line 7a.
 */
export const alpenroseFund: ForeignFinancialAssetFactValue = {
  part: "other_asset",
  owner: "taxpayer",
  accountNumber: "ISIN LU0123456789",
  description: "1,450 units of Alpenrose Equity Fund SICAV",
  maximumValue: 21000,
  yearEndValue: 20000,
  financialAccount: true,
  entity: {
    name: "Alpenrose Equity Fund SICAV",
    type: "corporation",
    address: {
      street: "12 Rue Erasme",
      city: "Luxembourg",
      country: "Luxembourg",
      postalCode: "1468",
    },
  },
  reportedOnOtherForm: true,
};
