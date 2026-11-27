/*
 * Lines 5, 9 and 13 (each base year's taxable income) and lines 19, 20 and 21
 * (each base year's tax), from the base-year facts. Each line takes the latest
 * Schedule J that covered the year, else that year's own return
 * (irs-1040sj-inst-2025::sec::line-5::b01, line-9::b01, line-13::b01; the
 * face, lines 19 to 21). Facts only: the resolver figures these.
 */

import {
  FARM_AVERAGING_BASE_YEARS,
  makeFarmAveragingBaseYearFactKey,
  type EarlierScheduleJLines,
  type FarmAveragingBaseYear,
  type FarmAveragingBaseYearFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { taxableIncomeWorksheet, type TaxableIncomeWorksheet } from "./lines.js";

/* One base year: its facts, and the amounts for its income line and its tax line. */
export interface BaseYear {
  year: FarmAveragingBaseYear;
  factKey: string;
  fact: FarmAveragingBaseYearFactValue;
  /* Line 5, 9 or 13. */
  income: number;
  /* Line 19, 20 or 21. */
  tax: number;
  /* The Taxable Income Worksheet, when the income came from it. */
  worksheet?: TaxableIncomeWorksheet;
  /* The year whose Schedule J gave the amounts; undefined: the year's own return. */
  fromScheduleJOf?: FarmAveragingBaseYear;
}

export type BaseYearsResult =
  { kind: "known"; years: BaseYear[] } | { kind: "waits"; missing: string[] };

type Pair = readonly [keyof EarlierScheduleJLines, keyof EarlierScheduleJLines];

/*
 * Which lines of a later year's Schedule J hold a base year, by how many years
 * the base year comes before it: the year itself is its line 3 and line 4; the
 * year before is its third base year (lines 15 and 16); two years before, its
 * second (lines 11 and 12). As the face: 2024 Schedule J lines 11, 15 and 3 for
 * 2022, 2023 and 2024; 2023 Schedule J lines 15 and 3 for 2022 and 2023.
 */
const LINES_BY_YEARS_BEFORE: Record<number, Pair> = {
  0: ["line3", "line4"],
  1: ["line15", "line16"],
  2: ["line11", "line12"],
};

type Facts = Map<FarmAveragingBaseYear, FarmAveragingBaseYearFactValue>;
type Amounts = Pick<BaseYear, "income" | "tax" | "worksheet" | "fromScheduleJOf">;

/*
 * The latest of the years from this base year to 2024 whose tax used Schedule
 * J ("If you used Schedule J to figure your tax for: 2024 ... 2023 but not
 * 2024 ... 2022 but not 2023 or 2024", the face).
 */
function latestScheduleJ(year: FarmAveragingBaseYear, facts: Facts) {
  const later = [...FARM_AVERAGING_BASE_YEARS].reverse().filter((each) => each >= year);
  return later.find((each) => facts.get(each)?.scheduleJ !== undefined);
}

function fromEarlierScheduleJ(
  year: FarmAveragingBaseYear,
  from: FarmAveragingBaseYear,
  facts: Facts,
): Amounts | undefined {
  const lines = facts.get(from)!.scheduleJ!;
  const [incomeLine, taxLine] = LINES_BY_YEARS_BEFORE[from - year];
  const income = lines[incomeLine];
  const tax = lines[taxLine];
  if (income === undefined || tax === undefined) return undefined;
  return { income: roundDollars(income), tax: roundDollars(tax), fromScheduleJOf: from };
}

/*
 * The year's own return: its taxable income, or with zero or less the Taxable
 * Income Worksheet ("But if that amount is zero or less, complete the ...
 * Taxable Income Worksheet", line-5::b01), and its section 1 tax.
 */
function fromOwnReturn(fact: FarmAveragingBaseYearFactValue): Amounts | undefined {
  const { taxableIncome, sectionOneTax, belowZero } = fact;
  if (taxableIncome === undefined || sectionOneTax === undefined) return undefined;
  const tax = roundDollars(sectionOneTax);
  if (taxableIncome > 0) return { income: roundDollars(taxableIncome), tax };
  if (belowZero === undefined) return undefined;
  const worksheet = taxableIncomeWorksheet(belowZero);
  return { income: worksheet.baseIncome, tax, worksheet };
}

/* The three base years, or the keys of the facts that are missing or lack an answer. */
export function baseYears(inputs: ResolverInputs): BaseYearsResult {
  const facts: Facts = new Map();
  const missing: string[] = [];
  for (const year of FARM_AVERAGING_BASE_YEARS) {
    const value = inputs.factByKey.get(makeFarmAveragingBaseYearFactKey(year));
    if (value === undefined) missing.push(makeFarmAveragingBaseYearFactKey(year));
    else facts.set(year, value as FarmAveragingBaseYearFactValue);
  }
  if (missing.length > 0) return { kind: "waits", missing };
  const years: BaseYear[] = [];
  for (const year of FARM_AVERAGING_BASE_YEARS) {
    const from = latestScheduleJ(year, facts);
    const amounts =
      from === undefined
        ? fromOwnReturn(facts.get(year)!)
        : fromEarlierScheduleJ(year, from, facts);
    const answeredBy = makeFarmAveragingBaseYearFactKey(from ?? year);
    if (amounts === undefined) missing.push(answeredBy);
    else
      years.push({
        year,
        factKey: makeFarmAveragingBaseYearFactKey(year),
        fact: facts.get(year)!,
        ...amounts,
      });
  }
  return missing.length > 0
    ? { kind: "waits", missing: [...new Set(missing)] }
    : { kind: "known", years };
}
