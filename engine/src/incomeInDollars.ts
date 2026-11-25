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
 * - income (interest, dividends, and the early withdrawal penalty): the H.10
 *   rate of its day when the fact dates it (`byDate`); the part of a box with
 *   no date takes the IRS yearly average for the tax year.
 * - tax withheld: the H.10 rate of the day withheld: "the rate of exchange in
 *   effect on the day you paid the foreign taxes (or on the day the tax was
 *   withheld)" (irs-1116-inst-2025::sec::foreign-currency-conversion::b01;
 *   26 CFR 1.986(a)-1). Its date is required. Foreign taxes claimed on an
 *   accrual basis take "the average exchange rate for the tax year to which
 *   the taxes relate" (the same block).
 * - a sale: the proceeds at the H.10 rate of the settlement date of the sale,
 *   the cost at that of the purchase (26 CFR 1.988-2(a)(2)(iv)). Both dates
 *   are required.
 *
 * The two views the forms read convert: the resolvers' inputs
 * (resolverInputs.ts makeResolverInputs) and the bindings' facts (types.ts
 * makeFactsView), and evaluateScenario for the pending inputs.
 *
 * A fact that cannot be converted keeps no amount (no form adds a foreign
 * amount as dollars) and keeps its `foreignCurrency`:
 * - it waits when a date the rule needs is missing, or when the dated amounts
 *   do not fit the box: its key is a pending input (pendingInputs.ts) and the
 *   lines that list it are blank (waitsForExchangeRate);
 * - it is a gap when the currency is not supported or a table has no rate for
 *   a date or a year: `foreignCurrency.gap` says why, and the lines that list
 *   it are unsupported (exchangeRateGap).
 * Converting twice changes nothing: a converted value has no
 * `foreignCurrency`, and one not converted has no amount.
 */

import { supportedCurrency, unsupportedCurrencyReason } from "./currency/currencies.js";
import { dailyRate, isoDayOf, yearlyAverageRate } from "./currency/rates.js";
import {
  FOREIGN_TAX_CREDIT_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  isTradeFact,
  type DatedAmounts,
  type IncomeInForeignCurrency,
  type SaleInForeignCurrency,
  type TradeFactValue,
} from "./facts/index.js";
import type { TaxFactRow } from "./facts/rows.js";
import { dollarsFromForeign, roundToPlaces, sum } from "./money.js";

type FactRow = { key: string; value: unknown; category: string };

export interface DollarFacts<Row extends FactRow> {
  /** The facts the forms read: every foreign-currency amount in dollars. */
  facts: Row[];
  /** The income facts that wait for a date: each is a pending input. */
  waitingForRate: string[];
}

/* The year of the IRS yearly average: the engine prepares 2025 returns (as each form's own TAX_YEAR). */
const TAX_YEAR = 2025;
const INCOME_CATEGORY = "investment_income";

/* Taxes withheld: federal (box 4), foreign (box 6 or 7), state (1099-INT box 17). */
const INTEREST_TAX_BOXES = ["box4", "box6", "box17"];
const DIVIDEND_TAX_BOXES = ["box4", "box7"];
const FOREIGN_TAX_BOXES = ["box6", "box7"];

type Outcome = { dollars: number } | { waits: true } | { gap: string };
/* "withheld": the day withheld, required; "average": the yearly average; "income": the day when dated, else the average. */
type Rate = "withheld" | "average" | "income";

const WAITS: Outcome = { waits: true };
const CENT_PLACES = 2;

/* A trade's share count is a number, not an amount. */
const isAmount = ([field, amount]: [string, unknown]) =>
  typeof amount === "number" && field !== "quantity";

/* Two amounts agree when they differ by less than half a cent. */
const HALF_CENT = 0.005;
const sameAmount = (left: number, right: number) => Math.abs(left - right) < HALF_CENT;

/* The amounts the fact dates for one box. */
const datedOf = (box: string, byDate: ReadonlyArray<DatedAmounts> | undefined) =>
  (byDate ?? []).flatMap((entry) => {
    const amount = entry.amounts[box];
    return typeof amount === "number" ? [{ date: entry.date, amount }] : [];
  });

/* Each dated amount at the H.10 rate of its day; a date that is not a calendar date waits. */
function dayDollars(code: string, dated: ReadonlyArray<{ date: string; amount: number }>): Outcome {
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

/* The IRS yearly average. Every supported currency has one (currency/currencies.ts). */
function averageDollars(amount: number, code: string): Outcome {
  const found = yearlyAverageRate(code, TAX_YEAR);
  return found.ok ? { dollars: dollarsFromForeign(amount, found.rate) } : { gap: found.gap };
}

/* Tax withheld: the dated amounts must add up to the box. */
function withheldDollars(box: string, total: number, currency: IncomeInForeignCurrency): Outcome {
  const dated = datedOf(box, currency.byDate);
  const datedTotal = sum(...dated.map((entry) => entry.amount));
  if (dated.length === 0 || !sameAmount(datedTotal, total)) return WAITS;
  return dayDollars(currency.code, dated);
}

/*
 * DECISION (2026-11-24): an amount with a date takes the rate of that day; an
 * amount with no date takes the yearly average of the tax year. Texts: "In
 * general, use the exchange rate prevailing (i.e., the spot rate) when you
 * receive, pay or accrue the item"; the same page says the IRS "accepts any
 * posted exchange rate that is used consistently" and publishes the yearly
 * average table (irs.gov "Yearly average currency exchange rates"). The engine
 * follows both, by what the fact knows: the spot rate when the date is known,
 * the IRS average when it is not.
 */
function incomeDollars(box: string, total: number, currency: IncomeInForeignCurrency): Outcome {
  const dated = datedOf(box, currency.byDate);
  const datedTotal = sum(...dated.map((entry) => entry.amount));
  if (Math.abs(datedTotal) > Math.abs(total) + HALF_CENT) return WAITS;
  const atDays = dayDollars(currency.code, dated);
  if (!("dollars" in atDays)) return atDays;
  const undated = roundToPlaces(total - datedTotal, CENT_PLACES);
  if (sameAmount(undated, 0)) return atDays;
  const atAverage = averageDollars(undated, currency.code);
  return "dollars" in atAverage ? { dollars: sum(atDays.dollars, atAverage.dollars) } : atAverage;
}

function boxDollars(rate: Rate, box: string, total: number, currency: IncomeInForeignCurrency) {
  if (rate === "average") return averageDollars(total, currency.code);
  if (rate === "withheld") return withheldDollars(box, total, currency);
  return incomeDollars(box, total, currency);
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
    const outcome = boxDollars(rateOf(field), field, amount, currency);
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

/* The rule of each box: a tax withheld, a foreign tax claimed on an accrual basis, or income. */
function rateRule(taxBoxes: readonly string[], taxesAccrued: boolean) {
  return (box: string): Rate => {
    if (taxesAccrued && FOREIGN_TAX_BOXES.includes(box)) return "average";
    return taxBoxes.includes(box) ? "withheld" : "income";
  };
}

/* The fact's value in dollars, or why it is not converted. */
function valueInDollars(row: FactRow, value: Record<string, unknown>, taxesAccrued: boolean) {
  const currency = value.foreignCurrency as IncomeInForeignCurrency & SaleInForeignCurrency;
  if (isTradeFact(row as TaxFactRow)) {
    return saleInDollars(value as unknown as TradeFactValue, currency);
  }
  const taxBoxes = isDividendFactKey(row.key) ? DIVIDEND_TAX_BOXES : INTEREST_TAX_BOXES;
  return boxesInDollars(value, currency, rateRule(taxBoxes, taxesAccrued));
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

export function incomeInDollars<Row extends FactRow>(facts: ReadonlyArray<Row>): DollarFacts<Row> {
  // Form 1116 taxes claimed on an accrual basis take the yearly average.
  const accrued = facts.find((row) => row.key === FOREIGN_TAX_CREDIT_KEYS.claimAccrued);
  const taxesAccrued = accrued?.value === true;
  const waitingForRate: string[] = [];
  const converted = facts.map((row) => {
    const value = inForeignCurrency(row);
    if (value === undefined) return row;
    // Not converted before: a fact in a foreign currency that has no amount.
    if (!Object.entries(value).some(isAmount)) {
      if (waitsForExchangeRate(value)) waitingForRate.push(row.key);
      return row;
    }
    const dollars = valueInDollars(row, value, taxesAccrued);
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
