/*
 * Form 8621 Part V, lines 15a–15f, for one block of shares of a section 1291
 * fund (irs-8621-inst-2025::sec::part-v::b01). Amounts on lines 15a–15e(1) are
 * in the currency of the distributions (::line-15::b01); line 15e(2) and line
 * 15f are in U.S. dollars.
 */

import type { PficDisposition, PficDistribution } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { addDays, utcDate } from "./interest.js";

export const TAX_YEAR = 2025;
/* Line 15c: "Divide line 15b by 3.0", or by the fewer preceding years (::line-15c::b01). */
export const PRECEDING_YEARS = 3;
/* Line 15d: "Multiply line 15c by 125% (1.25)". */
export const NONEXCESS_MULTIPLIER = 1.25;
export const US_DOLLAR = "USD";

/* One amount that line 16 allocates over the holding period: an excess distribution or a gain. */
export interface ExcessEvent {
  amountUsd: number;
  date: Date;
  /* The foreign tax on this excess distribution, in U.S. dollars (line 16d). */
  foreignTaxUsd: number;
  /* The same tax in the fund's currency, for the foreign tax credit's Part II. */
  foreignTax: number;
  /* A distribution (foreign-source income), not a gain on a disposition. */
  fromDistribution: boolean;
}

export interface Line15 {
  currencyCode?: string;
  line15a?: number;
  line15b?: number;
  line15c?: number;
  line15d?: number;
  line15e1?: number;
  line15e2?: number;
  line15f?: number;
  /* The nonexcess distributions (or a first year's distributions): a dividend, in U.S. dollars, cents kept. */
  dividendsUsd: number;
  /* The foreign tax on those dividends: the general foreign tax credit rules (::line-16d::b01). */
  dividendForeignTaxUsd: number;
  dividendForeignTax: number;
  events: ExcessEvent[];
}

export interface Line15Input {
  holdingStart: Date;
  currencyCode: string;
  distributions: PficDistribution[];
  precedingDistributions?: number;
  disposition?: PficDisposition;
}

interface Dated {
  amount: number;
  usdPerUnit: number;
  tax: number;
  date: Date;
}

/* The holding period starts the day after the acquisition date (QUESTIONS.md, question 4). */
export function holdingStartOf(acquiredDate: string): Date | undefined {
  const acquired = utcDate(acquiredDate);
  return acquired === undefined ? undefined : addDays(acquired, 1);
}

function datedDistributions(input: Line15Input): Dated[] | string {
  const dated: Dated[] = [];
  for (const each of input.distributions) {
    const date = utcDate(each.date);
    if (date === undefined || date.getUTCFullYear() !== TAX_YEAR)
      return `A distribution date (${each.date}) is not a date in ${TAX_YEAR}.`;
    const usdPerUnit = each.usdPerUnit ?? (input.currencyCode === US_DOLLAR ? 1 : undefined);
    if (usdPerUnit === undefined)
      return `A distribution in ${input.currencyCode} states no U.S. dollar rate for its date (line 15e(2)).`;
    dated.push({ amount: each.amount, usdPerUnit, tax: each.foreignTaxWithheld ?? 0, date });
  }
  return dated;
}

/*
 * The first tax year of the holding period: "No part of a distribution ...
 * during the first tax year of the shareholder's holding period ... will be
 * treated as an excess distribution" (::tax-consequences-for-shareholders-of-a-section::b01).
 * Line 15a only, taxed under section 301 (::line-15a::b01).
 */
function firstYearDistributions(dated: Dated[]): Omit<Line15, "line15f"> {
  return {
    line15a: roundDollars(sum(...dated.map((each) => each.amount))),
    dividendsUsd: sum(...dated.map((each) => each.amount * each.usdPerUnit)),
    dividendForeignTaxUsd: sum(...dated.map((each) => each.tax * each.usdPerUnit)),
    dividendForeignTax: sum(...dated.map((each) => each.tax)),
    events: [],
  };
}

/*
 * Lines 15a–15e(2) after the first year. The excess (line 15e(1), not below
 * 0) "is apportioned among all actual distributions" (::line-15c::b01), in
 * proportion to each distribution (QUESTIONS.md, question 2). Each part
 * converts at its distribution's rate (::line-15::b01); the foreign tax on a
 * distribution splits in the same proportion (::line-16d::b01).
 */
function laterYearDistributions(dated: Dated[], precedingYears: number, preceding: number) {
  const total = sum(...dated.map((each) => each.amount));
  const line15a = roundDollars(total);
  const line15b = roundDollars(preceding);
  const line15c = roundDollars(line15b / precedingYears);
  const line15d = roundDollars(line15c * NONEXCESS_MULTIPLIER);
  const line15e1 = atLeast(0, line15a - line15d);
  const share = (each: Dated) => (total > 0 ? (line15e1 * each.amount) / total : 0);
  const events = dated
    .filter((each) => share(each) > 0)
    .map((each) => {
      const taxShare = each.amount > 0 ? (each.tax * share(each)) / each.amount : 0;
      return {
        amountUsd: share(each) * each.usdPerUnit,
        date: each.date,
        foreignTaxUsd: taxShare * each.usdPerUnit,
        foreignTax: taxShare,
        fromDistribution: true,
      };
    });
  const nonexcess = (each: Dated) => each.amount - share(each);
  const nonexcessTax = (each: Dated) =>
    each.amount > 0 ? each.tax - (each.tax * share(each)) / each.amount : each.tax;
  return {
    line15a,
    line15b,
    line15c,
    line15d,
    line15e1,
    line15e2: roundDollars(sum(...events.map((event) => event.amountUsd))),
    dividendsUsd: sum(...dated.map((each) => nonexcess(each) * each.usdPerUnit)),
    dividendForeignTaxUsd: sum(...dated.map((each) => nonexcessTax(each) * each.usdPerUnit)),
    dividendForeignTax: sum(...dated.map(nonexcessTax)),
    events,
  };
}

/* Line 15f (::line-15f::b01): the gain or loss; a gain is an excess distribution, a loss is not. */
function dispositionLine(sale: PficDisposition): { line15f: number; event?: ExcessEvent } | string {
  const date = utcDate(sale.date);
  if (date === undefined) return `The disposition date (${sale.date}) is not a date.`;
  const line15f = roundDollars(sale.amountRealized) - roundDollars(sale.adjustedBasis);
  if (line15f <= 0) return { line15f };
  return {
    line15f,
    event: { amountUsd: line15f, date, foreignTaxUsd: 0, foreignTax: 0, fromDistribution: false },
  };
}

/* The tax years of the holding period before 2025, at most 3 (line 15c). */
export function precedingYearsOf(holdingStart: Date): number {
  return Math.min(PRECEDING_YEARS, atLeast(0, TAX_YEAR - holdingStart.getUTCFullYear()));
}

const NO_LINE_15B =
  "The fund fact does not state the distributions of the preceding years (line 15b).";

/* Lines 15a–15f, or why they cannot be figured. */
export function line15Of(input: Line15Input): Line15 | string {
  const dated = datedDistributions(input);
  if (typeof dated === "string") return dated;
  const years = precedingYearsOf(input.holdingStart);
  let lines: Line15 = {
    dividendsUsd: 0,
    dividendForeignTaxUsd: 0,
    dividendForeignTax: 0,
    events: [],
  };
  if (dated.length > 0 && years === 0) lines = firstYearDistributions(dated);
  if (dated.length > 0 && years > 0) {
    if (input.precedingDistributions === undefined) return NO_LINE_15B;
    lines = laterYearDistributions(dated, years, input.precedingDistributions);
  }
  if (dated.length > 0) lines = { ...lines, currencyCode: input.currencyCode };
  if (input.disposition === undefined) return lines;
  const sale = dispositionLine(input.disposition);
  if (typeof sale === "string") return sale;
  const events = sale.event ? [...lines.events, sale.event] : lines.events;
  return { ...lines, line15f: sale.line15f, events };
}
