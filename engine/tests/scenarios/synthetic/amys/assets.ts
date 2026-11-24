/*
 * amys's foreign accounts and holdings (README.md), with the income each one
 * pays. Every name, number and amount is made up. The balances are in the
 * account's currency, as the statements print them; the income is in U.S.
 * dollars, as each statement's U.S. tax annex prints it.
 */

import type {
  DividendFactValue,
  ForeignFinancialAssetFactValue,
  InterestFactValue,
  TradeFactValue,
} from "../../../../src/facts/index.js";

/* Treasury-style year-end rates: units of the currency per U.S. dollar (made up). */
const CHF = { currency: "Swiss franc (CHF)", exchangeRate: 0.796 };
const GBP = { currency: "British pound (GBP)", exchangeRate: 0.7432 };
const EUR = { currency: "Euro (EUR)", exchangeRate: 0.852 };
const NOK = { currency: "Norwegian krone (NOK)", exchangeRate: 10.125 };

/* A joint savings account in Zurich: interest, a time-deposit penalty, Swiss withholding tax. */
export const zurichSavings: ForeignFinancialAssetFactValue = {
  part: "deposit_account",
  owner: "joint_with_spouse",
  accountNumber: "CH93 0076 2011 6238 5295 7",
  maximumValue: 98000,
  yearEndValue: 91500,
  conversion: CHF,
  institution: {
    name: "Limmat Kantonal Savings Bank",
    giin: "K7Q2M4.00018.SL.756",
    address: {
      street: "Uraniastrasse 12",
      city: "Zurich",
      country: "Switzerland",
      postalCode: "8001",
    },
  },
};

export const zurichInterest: InterestFactValue = {
  payerName: "Limmat Kantonal Savings Bank",
  box1: 812.4,
  box2: 45,
  box6: 284.34,
  box7: "Switzerland",
};

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
  box1a: 1450.25,
  box1b: 1450.25,
};

export const thamesSale: TradeFactValue = {
  tradeId: "thames-001",
  description: "300 sh Severn Water plc",
  quantity: 300,
  dateAcquired: "03/10/2025",
  dateSold: "09/22/2025",
  proceeds: 18400,
  costBasis: 12150,
};

/* Amys's old current account in Cologne, closed in June: no income in 2025. */
export const rhineCurrent: ForeignFinancialAssetFactValue = {
  part: "deposit_account",
  owner: "taxpayer",
  accountNumber: "DE89 3704 0044 0532 0130 00",
  maximumValue: 14300,
  yearEndValue: 0,
  conversion: EUR,
  closedOrDisposed: "06/30/2025",
  institution: {
    name: "Rheinufer Volksbank eG",
    address: {
      street: "Rheinuferstrasse 7",
      city: "Cologne",
      country: "Germany",
      postalCode: "50667",
    },
  },
};

/* Shares of a Norwegian company that Corin holds on its share register, not in an account. */
export const fjordlineShares: ForeignFinancialAssetFactValue = {
  part: "other_asset",
  owner: "spouse",
  accountNumber: "Share register no. FL-20931",
  description: "22,400 ordinary shares of Fjordline Shipping ASA",
  maximumValue: 2240000,
  yearEndValue: 1100000,
  conversion: NOK,
  entity: {
    name: "Fjordline Shipping ASA",
    type: "corporation",
    address: { street: "Strandkaien 4", city: "Bergen", country: "Norway", postalCode: "5013" },
  },
};

export const fjordlineDividends: DividendFactValue = {
  payerName: "Fjordline Shipping ASA",
  box1a: 1240,
  box1b: 1240,
  box7: 186,
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

export const polderInterest: InterestFactValue = {
  payerName: "Polder Grid Finance B.V.",
  box1: 1912.5,
};

/* Units of a Luxembourg fund that is a PFIC: reported on Form 8621, so not in Part VI. */
export const alpenroseFund: ForeignFinancialAssetFactValue = {
  part: "other_asset",
  owner: "taxpayer",
  accountNumber: "ISIN LU0123456789",
  description: "1,450 units of Alpenrose Equity Fund SICAV",
  maximumValue: 21000,
  yearEndValue: 20000,
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
