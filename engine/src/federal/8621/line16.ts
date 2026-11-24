/*
 * Form 8621 Part V, line 16: each excess distribution or gain spread over the
 * days of the holding period (irs-8621-inst-2025::sec::lines-16a-and-16b::b01),
 * the increase in tax for each PFIC year (::line-16c::b01), the foreign tax
 * credit (::line-16d::b01–b02), and the interest (::line-16f::b01–b02).
 */

import { roundDollars, sum } from "../../money.js";
import { compoundedInterest, daysBetween, returnDueDate } from "./interest.js";
import { TAX_YEAR, type ExcessEvent } from "./line15.js";

/*
 * The highest rate under section 1 for each calendar year
 * (irs-8621-inst-2025::sec::tax-rates::b01).
 */
const TOP_RATES: ReadonlyArray<{ from: number; to: number; rate: number }> = [
  { from: 2018, to: 2025, rate: 0.37 },
  { from: 2013, to: 2017, rate: 0.396 },
  { from: 2003, to: 2012, rate: 0.35 },
  { from: 2002, to: 2002, rate: 0.386 },
  { from: 2001, to: 2001, rate: 0.391 },
  { from: 1993, to: 2000, rate: 0.396 },
  { from: 1991, to: 1992, rate: 0.31 },
  { from: 1988, to: 1990, rate: 0.28 },
  { from: 1987, to: 1987, rate: 0.385 },
];

export function topRateOf(year: number): number | undefined {
  return TOP_RATES.find((row) => year >= row.from && year <= row.to)?.rate;
}

export interface Line16 {
  line16b: number;
  line16c: number;
  line16d: number;
  line16e: number;
  line16f: number;
  /* The distributions' amounts allocated to 2025 and pre-PFIC years, cents kept: foreign-source income. */
  currentYearDistributionsUsd: number;
  /* The excess distribution taxes allocated to 2025 and pre-PFIC years: the general credit rules. */
  generalRulesForeignTaxUsd: number;
  generalRulesForeignTax: number;
}

/* What one tax year of the holding period gets of one event. */
interface YearShare {
  year: number;
  amount: number;
  taxUsd: number;
  tax: number;
  fromDistribution: boolean;
}

/* The days of the holding period that fall in each tax year; the period ends on the event date. */
function yearShares(event: ExcessEvent, holdingStart: Date): YearShare[] | string {
  const holdingDays = daysBetween(holdingStart, event.date) + 1;
  if (holdingDays <= 0)
    return "A distribution or disposition is dated before the holding period starts.";
  const shares: YearShare[] = [];
  for (let year = holdingStart.getUTCFullYear(); year <= event.date.getUTCFullYear(); year++) {
    const first = Math.max(holdingStart.getTime(), Date.UTC(year, 0, 1));
    const last = Math.min(event.date.getTime(), Date.UTC(year, 11, 31));
    const days = daysBetween(new Date(first), new Date(last)) + 1;
    const fraction = days / holdingDays;
    shares.push({
      year,
      amount: event.amountUsd * fraction,
      taxUsd: event.foreignTaxUsd * fraction,
      tax: event.foreignTax * fraction,
      fromDistribution: event.fromDistribution,
    });
  }
  return shares;
}

interface PficYear {
  increase: number;
  credit: number;
  interest: number;
}

/*
 * A PFIC year: the increase in tax at the year's top rate, less the excess
 * distribution taxes allocated to it ("only reduce the increase in tax figured
 * for that tax year (but not below zero). No carryover", ::line-16d::b02), and
 * interest on the net increase from that year's due date to the due date of
 * the 2025 return (::line-16f::b01).
 */
function pficYear(share: YearShare): PficYear | string {
  const rate = topRateOf(share.year);
  if (rate === undefined)
    return `The holding period reaches ${share.year}, before the rate table of line 16c starts (1987).`;
  const increase = share.amount * rate;
  const credit = Math.min(share.taxUsd, increase);
  const interest = compoundedInterest(
    increase - credit,
    returnDueDate(share.year),
    returnDueDate(TAX_YEAR),
  );
  if (interest === undefined) return "The interest runs past the section 6621 rate table.";
  return { increase, credit, interest };
}

/*
 * Lines 16b–16f for every excess distribution and gain of one block. Years
 * before firstPficYear are pre-PFIC years: with 2025 they are line 16b,
 * "ordinary income" (::lines-16a-and-16b::b01).
 */
export function line16Of(
  events: ReadonlyArray<ExcessEvent>,
  holdingStart: Date,
  firstPficYear: number,
): Line16 | string {
  const current: YearShare[] = [];
  const pfic: PficYear[] = [];
  for (const event of events) {
    const shares = yearShares(event, holdingStart);
    if (typeof shares === "string") return shares;
    for (const share of shares) {
      if (share.year === TAX_YEAR || share.year < firstPficYear) {
        current.push(share);
        continue;
      }
      const year = pficYear(share);
      if (typeof year === "string") return year;
      pfic.push(year);
    }
  }
  const line16c = roundDollars(sum(...pfic.map((year) => year.increase)));
  const line16d = roundDollars(sum(...pfic.map((year) => year.credit)));
  const distributionShares = current.filter((share) => share.fromDistribution);
  return {
    line16b: roundDollars(sum(...current.map((share) => share.amount))),
    line16c,
    line16d,
    line16e: line16c - line16d,
    line16f: roundDollars(sum(...pfic.map((year) => year.interest))),
    currentYearDistributionsUsd: sum(...distributionShares.map((share) => share.amount)),
    generalRulesForeignTaxUsd: sum(...current.map((share) => share.taxUsd)),
    generalRulesForeignTax: sum(...current.map((share) => share.tax)),
  };
}
