/*
 * The income facts of a foreign account in U.S. dollars, before any form reads
 * them. An interest, dividend or trade fact with `foreignCurrency`
 * (facts/kinds/foreignCurrency.ts) holds its amounts in the account's
 * currency; each amount takes a rate from the engine's tables
 * (currency/rates.ts), is divided by it and kept to the cent (money.ts
 * dollarsFromForeign). The forms round where they round. A fact with no
 * `foreignCurrency` passes through as it is.
 *
 * The rate of each amount:
 * - interest that accrues through the year (every 1099-INT amount but the
 *   events below): the return's method, FOREIGN_INCOME_RATE_METHOD_KEY. The
 *   yearly average (the default) is the Board's G.5A average for the tax
 *   year; the daily method takes the H.10 rate of each day credited (`byDate`).
 * - an event, which happens on one day: each dividend (every 1099-DIV
 *   amount), the early withdrawal penalty, and tax withheld take the H.10 rate
 *   of their day (`byDate`). The decision behind this (federal/8938/QUESTIONS.md
 *   question 15) reads the IRS practice unit "Definition of Appropriate
 *   Exchange Rate": an item over a period takes an average rate for the
 *   period; a dividend, an event on one day, takes that day's rate. Foreign tax:
 *   "the rate of exchange in effect on the day you paid the foreign taxes (or
 *   on the day the tax was withheld)" (irs-1116-inst-2025::sec::foreign-currency-conversion::b01;
 *   26 CFR 1.986(a)-1). Taxes claimed on an accrual basis take "the average
 *   exchange rate for the tax year to which the taxes relate" (the same block).
 * - a sale: the proceeds at the H.10 rate of the settlement date of the sale,
 *   the cost at that of the purchase (26 CFR 1.988-2(a)(2)(iv)).
 *
 * The two views the forms read convert: the resolvers' inputs
 * (resolverInputs.ts makeResolverInputs) and the bindings' facts (types.ts
 * makeFactsView), and evaluateScenario for the pending inputs.
 *
 * A fact that cannot be converted keeps no amount (no form adds a foreign
 * amount as dollars) and keeps its `foreignCurrency`:
 * - it waits when a date the rule needs is missing, or the dated amounts do
 *   not add up to the box: its key is a pending input (pendingInputs.ts) and
 *   the lines that list it are blank (waitsForExchangeRate);
 * - it is a gap when the currency is not supported or the tables have no
 *   rate: `foreignCurrency.gap` says why, and the lines that list it are
 *   unsupported (exchangeRateGap).
 * Converting twice changes nothing: a converted value has no
 * `foreignCurrency`, and one not converted has no amount.
 */

import { supportedCurrency, unsupportedCurrencyReason } from "./currency/currencies.js";
import { dailyRate, isoDayOf, yearlyAverageRate } from "./currency/rates.js";
import {
  FOREIGN_INCOME_RATE_METHOD_KEY,
  FOREIGN_INCOME_RATE_METHODS,
  FOREIGN_TAX_CREDIT_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  isTradeFact,
  type DatedAmounts,
  type ForeignIncomeRateMethod,
  type IncomeInForeignCurrency,
  type SaleInForeignCurrency,
  type TradeFactValue,
} from "./facts/index.js";
import type { TaxFactRow } from "./facts/rows.js";
import { dollarsFromForeign, sum } from "./money.js";

type FactRow = { key: string; value: unknown; category: string };
type DecisionRow = { decisionKey: string; decision: unknown };

export interface DollarFacts<Row extends FactRow> {
  /** The facts the forms read: every foreign-currency amount in dollars. */
  facts: Row[];
  /** The income facts that wait for a date: each is a pending input. */
  waitingForRate: string[];
}

/* The year of the G.5A average: the engine prepares 2025 returns (as each form's own TAX_YEAR). */
const TAX_YEAR = 2025;
const INCOME_CATEGORY = "investment_income";

/* 1099-INT amounts that happen on one day: the penalty, and the taxes withheld. */
const INTEREST_EVENT_BOXES = ["box2", "box4", "box6", "box17"];
const INTEREST_FOREIGN_TAX_BOX = "box6";
const DIVIDEND_FOREIGN_TAX_BOX = "box7";

type Outcome = { dollars: number } | { waits: true } | { gap: string };
type Rate = "yearly_average" | "by_date";

const WAITS: Outcome = { waits: true };

/* A trade's share count is a number, not an amount. */
const isAmount = ([field, amount]: [string, unknown]) =>
  typeof amount === "number" && field !== "quantity";

/* Dated amounts add up to the box when they agree to the cent. */
const HALF_CENT = 0.005;
const sameAmount = (left: number, right: number) => Math.abs(left - right) < HALF_CENT;

/* A box at the rate of each day it lists: the dated amounts must add up to it. */
function byDateDollars(
  box: string,
  total: number,
  code: string,
  byDate: ReadonlyArray<DatedAmounts> | undefined,
): Outcome {
  const dated = (byDate ?? []).flatMap((entry) => {
    const amount = entry.amounts[box];
    return typeof amount === "number" ? [{ date: entry.date, amount }] : [];
  });
  if (dated.length === 0 || !sameAmount(sum(...dated.map((entry) => entry.amount)), total)) {
    return WAITS;
  }
  const parts: number[] = [];
  for (const { date, amount } of dated) {
    const day = isoDayOf(date);
    if (day === undefined) return WAITS;
    const found = dailyRate(code, day);
    if (!found.ok) return { gap: found.gap };
    parts.push(dollarsFromForeign(amount, found.rate));
  }
  return { dollars: sum(...parts) };
}

function averageDollars(total: number, code: string): Outcome {
  const found = yearlyAverageRate(code, TAX_YEAR);
  return found.ok ? { dollars: dollarsFromForeign(total, found.rate) } : { gap: found.gap };
}

/* The value in dollars, or why not: the first gap, else waiting when any box waits. */
function boxesInDollars(
  value: Record<string, unknown>,
  currency: IncomeInForeignCurrency,
  rateOf: (box: string) => Rate,
): Record<string, unknown> | Outcome {
  if (supportedCurrency(currency.code) === undefined) {
    return { gap: unsupportedCurrencyReason(currency.code) };
  }
  const out: Record<string, unknown> = {};
  const outcomes: Outcome[] = [];
  for (const [field, amount] of Object.entries(value)) {
    if (field === "foreignCurrency") continue;
    if (typeof amount !== "number") {
      out[field] = amount;
      continue;
    }
    const outcome =
      rateOf(field) === "yearly_average"
        ? averageDollars(amount, currency.code)
        : byDateDollars(field, amount, currency.code, currency.byDate);
    outcomes.push(outcome);
    if ("dollars" in outcome) out[field] = outcome.dollars;
  }
  return firstNotConverted(outcomes) ?? out;
}

/* The first gap, else the first box that waits. */
const firstNotConverted = (outcomes: Outcome[]): Outcome | undefined =>
  outcomes.find((outcome) => "gap" in outcome) ?? outcomes.find((outcome) => "waits" in outcome);

/* The proceeds at the sale's settlement date, the cost at the purchase's; quantity and dates as they are. */
function saleInDollars(
  value: TradeFactValue,
  currency: SaleInForeignCurrency,
): TradeFactValue | Outcome {
  if (supportedCurrency(currency.code) === undefined) {
    return { gap: unsupportedCurrencyReason(currency.code) };
  }
  const atSettlement = (amount: number, settled: string | undefined): Outcome => {
    const day = isoDayOf(settled);
    if (day === undefined) return WAITS;
    const found = dailyRate(currency.code, day);
    return found.ok ? { dollars: dollarsFromForeign(amount, found.rate) } : { gap: found.gap };
  };
  const proceeds = atSettlement(value.proceeds, currency.saleSettled);
  const cost =
    value.costBasis === undefined
      ? undefined
      : atSettlement(value.costBasis, currency.purchaseSettled);
  const notConverted = firstNotConverted([proceeds, ...(cost === undefined ? [] : [cost])]);
  if (notConverted !== undefined) return notConverted;
  const dollars: TradeFactValue = { ...value, proceeds: (proceeds as { dollars: number }).dollars };
  delete dollars.foreignCurrency;
  return cost === undefined
    ? dollars
    : { ...dollars, costBasis: (cost as { dollars: number }).dollars };
}

interface ReturnRules {
  method: ForeignIncomeRateMethod | { gap: string };
  /* Form 1116 taxes claimed on an accrual basis (FOREIGN_TAX_CREDIT_KEYS.claimAccrued). */
  taxesAccrued: boolean;
}

function returnRules(
  facts: ReadonlyArray<FactRow>,
  decisions: ReadonlyArray<DecisionRow>,
): ReturnRules {
  const decided = decisions.find((row) => row.decisionKey === FOREIGN_INCOME_RATE_METHOD_KEY);
  const choice = decided?.decision ?? "yearly_average";
  const method = FOREIGN_INCOME_RATE_METHODS.includes(choice as ForeignIncomeRateMethod)
    ? (choice as ForeignIncomeRateMethod)
    : { gap: `${FOREIGN_INCOME_RATE_METHOD_KEY} is neither "yearly_average" nor "daily".` };
  const accrued = facts.find((row) => row.key === FOREIGN_TAX_CREDIT_KEYS.claimAccrued);
  return { method, taxesAccrued: accrued?.value === true };
}

/*
 * DECISION (2026-11-24): income through the year takes the return's method
 * (the yearly average or the rate of each day); a single event takes the rate
 * of its day. Texts: "In general, use the exchange rate prevailing (i.e., the
 * spot rate) when you receive, pay or accrue the item"; the same page
 * publishes yearly averages and says the IRS "accepts any posted exchange rate
 * that is used consistently" (irs.gov "Yearly average currency exchange
 * rates"); the IRS practice unit "Definition of Appropriate Exchange Rate"
 * treats an item over a period at an average and a dividend as a one-day
 * event. The engine follows both: either method is accepted when used
 * consistently, and an average does not describe one day.
 */
function interestRate(box: string, method: ForeignIncomeRateMethod, rules: ReturnRules): Rate {
  if (box === INTEREST_FOREIGN_TAX_BOX && rules.taxesAccrued) return "yearly_average";
  if (INTEREST_EVENT_BOXES.includes(box)) return "by_date";
  return method === "daily" ? "by_date" : "yearly_average";
}

/* The fact's value in dollars, or why it is not converted. */
function valueInDollars(row: FactRow, value: Record<string, unknown>, rules: ReturnRules) {
  const currency = value.foreignCurrency as IncomeInForeignCurrency & SaleInForeignCurrency;
  if (isTradeFact(row as TaxFactRow)) {
    return saleInDollars(value as unknown as TradeFactValue, currency);
  }
  if (isDividendFactKey(row.key)) {
    return boxesInDollars(value, currency, (box) =>
      box === DIVIDEND_FOREIGN_TAX_BOX && rules.taxesAccrued ? "yearly_average" : "by_date",
    );
  }
  const { method } = rules;
  if (typeof method !== "string") return method;
  return boxesInDollars(value, currency, (box) => interestRate(box, method, rules));
}

const isOutcome = (converted: unknown): converted is Outcome =>
  typeof converted === "object" &&
  converted !== null &&
  ("waits" in converted || "gap" in converted);

/* The value with no amount: the payer, the description and the dates stay, with the currency (and a gap). */
function notConvertedValue(value: Record<string, unknown>, gap: string | undefined) {
  const kept = Object.fromEntries(Object.entries(value).filter((entry) => !isAmount(entry)));
  if (gap === undefined) return kept;
  return { ...kept, foreignCurrency: { ...(value.foreignCurrency as object), gap } };
}

/* An income fact whose value is in a foreign currency; undefined for any other row. */
function inForeignCurrency(row: FactRow): Record<string, unknown> | undefined {
  if (row.category !== INCOME_CATEGORY) return undefined;
  const income =
    isInterestFactKey(row.key) || isDividendFactKey(row.key) || isTradeFact(row as TaxFactRow);
  if (!income || typeof row.value !== "object" || row.value === null) return undefined;
  const value = row.value as Record<string, unknown>;
  return value.foreignCurrency === undefined ? undefined : value;
}

export function incomeInDollars<Row extends FactRow>(
  facts: ReadonlyArray<Row>,
  decisions: ReadonlyArray<DecisionRow> = [],
): DollarFacts<Row> {
  const rules = returnRules(facts, decisions);
  const waitingForRate: string[] = [];
  const converted = facts.map((row) => {
    const value = inForeignCurrency(row);
    if (value === undefined) return row;
    // Not converted before: a fact in a foreign currency that has no amount.
    if (!Object.entries(value).some(isAmount)) {
      if (waitsForExchangeRate(value)) waitingForRate.push(row.key);
      return row;
    }
    const dollars = valueInDollars(row, value, rules);
    if (!isOutcome(dollars)) return { ...row, value: dollars };
    if ("waits" in dollars) waitingForRate.push(row.key);
    const gap = "gap" in dollars ? dollars.gap : undefined;
    return { ...row, value: notConvertedValue(value, gap) };
  });
  return { facts: converted, waitingForRate };
}

const currencyOf = (value: unknown): { gap?: unknown } | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const currency = (value as { foreignCurrency?: unknown }).foreignCurrency;
  return typeof currency === "object" && currency !== null
    ? (currency as { gap?: unknown })
    : undefined;
};

/*
 * After incomeInDollars, an income fact that still carries its currency was
 * not converted. It waits for a date when it has no gap: the line that lists
 * it is blank.
 */
export function waitsForExchangeRate(value: unknown): boolean {
  const currency = currencyOf(value);
  return currency !== undefined && typeof currency.gap !== "string";
}

/* Why an income fact could not be converted (an unsupported currency, a rate the tables lack): the line that lists it is unsupported. */
export function exchangeRateGap(value: unknown): string | undefined {
  const gap = currencyOf(value)?.gap;
  return typeof gap === "string" ? gap : undefined;
}
