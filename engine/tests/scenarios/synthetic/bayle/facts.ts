/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the final Schedule K-1
 * (Form 1065) would print them, the sale as Form 8949 reports it, and his
 * answers.
 */

import {
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BAYLE_USER_ID = "bayle-integration";
export const BAYLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BAYLE_USER_ID,
  taxYear: BAYLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BAYLE = {
  taxpayer: { firstName: "Bayle", lastName: "Domon", ssn: "400-00-4301" },
  street: "31 Harbor Street",
  city: "Bellingham",
  state: "WA",
  zip: "98225",
};

const address = { line1: BAYLE.street, city: BAYLE.city, state: BAYLE.state, zip: BAYLE.zip };

const bayleW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Illian Freight Brokers",
  employerEin: "00-0004301",
  employerAddress: address,
  employee: { ...BAYLE.taxpayer, address },
  box1: 95000,
  box2: 11000,
  box3: 95000,
  box4: 5890,
  box5: 95000,
  box6: 1377.5,
};

const SHIPPING_ID = "snow-goose-shipping";

/* The final K-1 from a shipping partnership he was a limited partner in until he sold out: a business loss. */
const shippingK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Snow Goose Shipping LP",
  entityEin: "00-0004065",
  finalK1: true,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 0,
  lossPercent: 0,
  capitalPercent: 0,
  boxes: [{ box: "1", amount: -6000 }],
};

/*
 * His answers: he never worked in the business (passive); his basis at the
 * start of 2025 was $20,000; $9,000 of passive losses were carried from 2024
 * (his 2024 Form 8582); on November 14, 2025 he sold his whole interest to a
 * buyer not related to him for $18,000 in cash, a gain of $4,000 over his
 * $14,000 basis at the sale.
 */
const shippingHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 20000,
  carriedLosses: { passive: 9000 },
  disposedOfEntirely: true,
  gainOnDisposition: 4000,
};

/* The sale of the interest: no 1099-B, so Form 8949 box F (the decision). */
export const SALE_TRADE_ID = "snow-goose-interest";
const interestSale: TradeFactValue = {
  tradeId: SALE_TRADE_ID,
  description: "Partnership interest, Snow Goose Shipping LP",
  quantity: 1,
  dateAcquired: "05/01/2018",
  dateSold: "11/14/2025",
  proceeds: 18000,
  costBasis: 14000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BAYLE_USER_ID, taxYear: BAYLE_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-23";

export const bayleFacts: TaxFactRow[] = [
  idFact("name.first", BAYLE.taxpayer.firstName),
  idFact("name.last", BAYLE.taxpayer.lastName),
  idFact("ssn", BAYLE.taxpayer.ssn),
  idFact("dob", "12/01/1969"),
  idFact("address.street", BAYLE.street),
  idFact("address.city", BAYLE.city),
  idFact("address.state", BAYLE.state),
  idFact("address.zip", BAYLE.zip),
  idFact("occupation", "Freight broker"),
  idFact("phone", "360-555-0143"),
  fact("wages", makeW2FactKey("illian-freight"), bayleW2, "W-2 from Illian Freight Brokers."),
  fact(
    "k1",
    makePartnershipK1FactKey(SHIPPING_ID),
    shippingK1,
    "Final Schedule K-1 (Form 1065) from Snow Goose Shipping LP.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(SHIPPING_ID),
    shippingHolding,
    `${VERBAL}: basis and carried passive loss from his 2024 return; the sale from the purchase agreement.`,
  ),
  fact(
    "investment_income",
    makeTradeFactKey("snow-goose-sale", SALE_TRADE_ID),
    interestSale,
    `${VERBAL}: the purchase agreement for his partnership interest (no 1099-B).`,
  ),
];
