/*
 * The income facts of a foreign account in U.S. dollars, before any form reads
 * them. An interest, dividend or trade fact with a `conversion`
 * (facts/kinds/foreignCurrency.ts) holds its amounts in the account's currency,
 * as the statement prints them; each amount is divided by its rate and kept to
 * the cent (money.ts dollarsFromForeign). The forms round where they round. A
 * fact with no `conversion` passes through as it is.
 *
 * The two views the forms read convert: the resolvers' inputs
 * (resolverInputs.ts makeResolverInputs) and the bindings' facts (types.ts
 * makeFactsView). So does every path that evaluates a return.
 *
 * A fact that lacks a rate for one of its amounts waits: its amounts are taken
 * out (no form adds a foreign amount as dollars), it keeps its `conversion`,
 * and its key is pending (pendingInputs.ts) until the rate is recorded. The
 * forms that list the item leave it blank (waitsForExchangeRate). Converting
 * twice changes nothing: a converted value has no `conversion`, and a waiting
 * value has no amount.
 */

import {
  isDividendFactKey,
  isInterestFactKey,
  isTradeFact,
  type IncomeCurrencyConversion,
  type SaleCurrencyConversion,
  type TradeFactValue,
} from "./facts/index.js";
import type { TaxFactRow } from "./facts/rows.js";
import { dollarsFromForeign } from "./money.js";

type FactRow = { key: string; value: unknown; category: string };

export interface DollarFacts<Row extends FactRow> {
  /** The facts the forms read: every foreign-currency amount in dollars. */
  facts: Row[];
  /** The income facts that lack a rate: each is a pending input. */
  waitingForRate: string[];
}

const INCOME_CATEGORY = "investment_income";

/* 1099-INT box 6 and 1099-DIV box 7: the foreign tax, which takes the tax rate. */
const INTEREST_TAX_BOX = "box6";
const DIVIDEND_TAX_BOX = "box7";

/* A trade's share count is a number, not an amount. */
const isAmount = ([field, amount]: [string, unknown]) =>
  typeof amount === "number" && field !== "quantity";

const isRate = (rate: number | undefined): rate is number =>
  typeof rate === "number" && Number.isFinite(rate) && rate > 0;

/*
 * Every amount of a 1099-INT or 1099-DIV fact is a box. The foreign tax takes
 * taxExchangeRate, the others exchangeRate. Undefined when a rate is missing
 * for an amount on the fact.
 */
function boxesInDollars(
  value: Record<string, unknown>,
  conversion: IncomeCurrencyConversion,
  taxBox: string,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [field, amount] of Object.entries(value)) {
    if (field === "conversion") continue;
    if (typeof amount !== "number") {
      out[field] = amount;
      continue;
    }
    const rate = field === taxBox ? conversion.taxExchangeRate : conversion.exchangeRate;
    if (!isRate(rate)) return undefined;
    out[field] = dollarsFromForeign(amount, rate);
  }
  return out;
}

/* The proceeds at the sale's rate, the cost at the purchase's; quantity and dates as they are. */
function saleInDollars(
  value: TradeFactValue,
  conversion: SaleCurrencyConversion,
): TradeFactValue | undefined {
  const sale = conversion.saleExchangeRate;
  const purchase = conversion.purchaseExchangeRate;
  if (!isRate(sale)) return undefined;
  const dollars: TradeFactValue = { ...value, proceeds: dollarsFromForeign(value.proceeds, sale) };
  delete dollars.conversion;
  if (value.costBasis === undefined) return dollars;
  if (!isRate(purchase)) return undefined;
  return { ...dollars, costBasis: dollarsFromForeign(value.costBasis, purchase) };
}

/* The fact's value in dollars, or undefined while a rate is missing. */
function valueInDollars(row: FactRow, value: Record<string, unknown>): unknown {
  if (isTradeFact(row as TaxFactRow)) {
    const trade = value as unknown as TradeFactValue;
    return saleInDollars(trade, value.conversion as SaleCurrencyConversion);
  }
  const taxBox = isInterestFactKey(row.key) ? INTEREST_TAX_BOX : DIVIDEND_TAX_BOX;
  return boxesInDollars(value, value.conversion as IncomeCurrencyConversion, taxBox);
}

/* The value with no amount: the payer, the description and the dates stay, with the conversion. */
function waitingValue(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter((entry) => !isAmount(entry)));
}

/* An income fact whose value carries a conversion; undefined for any other row. */
function convertible(row: FactRow): Record<string, unknown> | undefined {
  if (row.category !== INCOME_CATEGORY) return undefined;
  const income =
    isInterestFactKey(row.key) || isDividendFactKey(row.key) || isTradeFact(row as TaxFactRow);
  if (!income || typeof row.value !== "object" || row.value === null) return undefined;
  const value = row.value as Record<string, unknown>;
  return value.conversion === undefined ? undefined : value;
}

export function incomeInDollars<Row extends FactRow>(facts: ReadonlyArray<Row>): DollarFacts<Row> {
  const waitingForRate: string[] = [];
  const converted = facts.map((row) => {
    const value = convertible(row);
    if (value === undefined) return row;
    // Already waiting: a fact with a conversion and no amount.
    const dollars = Object.entries(value).some(isAmount) ? valueInDollars(row, value) : undefined;
    if (dollars !== undefined) return { ...row, value: dollars };
    waitingForRate.push(row.key);
    return { ...row, value: waitingValue(value) };
  });
  return { facts: converted, waitingForRate };
}

/*
 * After incomeInDollars, an income fact that still carries its conversion
 * waits for a rate: the line that lists it is blank.
 */
export function waitsForExchangeRate(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { conversion?: unknown }).conversion !== undefined
  );
}
