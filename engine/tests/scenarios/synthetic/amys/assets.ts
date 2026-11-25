/*
 * amys's foreign accounts and holdings (README.md), with the income each one
 * pays. Every name, number and amount is made up. Each amount is in the
 * account's currency, as its statement prints it, with the dates the rules
 * need (facts/kinds/foreignCurrency.ts). The facts hold no rate: the engine
 * looks each one up in its tables (currency/rates.ts):
 * - balances: the Treasury rate on 12/31/2025 (irs-8938-inst-2025::sec::currency-determination-date::b01);
 * - interest: the couple's method, the yearly average (the Board's G.5A 2025 average);
 * - each dividend, the penalty and tax withheld: the H.10 rate of its day;
 * - a sale: the H.10 rates on the settlement dates of the sale and the purchase
 *   (26 CFR 1.988-2(a)(2)(iv)).
 */

import type {
  DividendFactValue,
  ForeignFinancialAssetFactValue,
  InterestFactValue,
  TradeFactValue,
} from "../../../../src/facts/index.js";
import type { MonthEndBalances } from "../../documents/foreignAssetStatement.js";

const EUR = { code: "EUR" };
const GBP = { code: "GBP" };
const CHF = { code: "CHF" };
const NOK = { code: "NOK" };

/* A joint time-deposit savings account in Bologna: interest, an early withdrawal penalty, Italian tax. */
export const bolognaSavings: ForeignFinancialAssetFactValue = {
  part: "deposit_account",
  owner: "joint_with_spouse",
  // Check digits 00: not a valid IBAN.
  accountNumber: "IT00 X000 0000 0000 0000 0089 38",
  maximumValue: 104000,
  yearEndValue: 97200,
  foreignCurrency: EUR,
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

/*
 * The time deposit was broken on 15 September (the penalty); the interest was
 * credited, and the Italian tax withheld, on 31 December.
 */
export const bolognaInterest: InterestFactValue = {
  payerName: "Banca Saragozza S.p.A.",
  box1: 1180.4,
  box2: 40,
  box6: 118.04,
  box7: "Italy",
  foreignCurrency: {
    ...EUR,
    byDate: [
      { date: "09/15/2025", amounts: { box2: 40 } },
      { date: "12/31/2025", amounts: { box1: 1180.4, box6: 118.04 } },
    ],
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
  foreignCurrency: GBP,
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
  // Two dividends of Severn Water plc, both qualified.
  foreignCurrency: {
    ...GBP,
    byDate: [
      { date: "06/13/2025", amounts: { box1a: 520.3, box1b: 520.3 } },
      { date: "11/14/2025", amounts: { box1a: 580.4, box1b: 580.4 } },
    ],
  },
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
  foreignCurrency: { ...GBP, saleSettled: "09/24/2025", purchaseSettled: "03/12/2025" },
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
  foreignCurrency: CHF,
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
  foreignCurrency: NOK,
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
  foreignCurrency: {
    ...NOK,
    byDate: [{ date: "05/22/2025", amounts: { box1a: 12880, box1b: 12880, box7: 1932 } }],
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

/* In U.S. dollars, as the note pays: no foreign currency. */
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
