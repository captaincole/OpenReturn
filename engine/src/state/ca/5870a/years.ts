/*
 * The earlier years' California returns, as FTB 5870A's columns read them
 * (ca_earlier_year_return.<year>): which facts are missing, and one year's
 * column of the recomputation.
 */

import { caEarlierYearTax } from "../../../data/caEarlierYearRates.js";
import {
  makeCaEarlierYearReturnFactKey,
  type CaEarlierYearReturnFactValue,
} from "../../../facts/index.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { FilingStatus } from "../../../values.js";
import type { Column } from "./filingInfo.js";
import { taxableIncomeAmount, yearColumn } from "./lines.js";

export type CaYear = CaEarlierYearReturnFactValue & { key: string; year: number };

/* A year with the answers its column needs. */
export type AnsweredYear = CaYear & {
  taxableIncome: number;
  filingStatus: FilingStatus;
  taxBeforeCredits: number;
};

export const GAP_NET_OPERATING_LOSS =
  "The distribution changes the year's net operating loss or its carryover: the taxable income must be refigured (ca-5870a-inst-2025::sec::section-a::b02), and the engine does not refigure an earlier year's loss.";
export const GAP_CAPITAL_GAIN =
  "A capital gain distribution: each year's capital loss and its carryover must be refigured (ca-5870a-inst-2025::sec::section-a::b03), and the engine does not refigure an earlier year's capital loss.";
export const GAP_NONRESIDENT_YEAR =
  "A computation year when the beneficiary was a nonresident or part-year resident: Part I skips lines 12 to 20 and takes line 21 from a Form 540NR refigured for that year (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b01), which the engine does not prepare.";

/* The years' facts in the order given, or the keys of the missing ones. */
export function caYears(inputs: ResolverInputs, years: readonly number[]): CaYear[] | string[] {
  const keys = years.map(makeCaEarlierYearReturnFactKey);
  const missing = keys.filter((key) => !inputs.factByKey.has(key));
  if (missing.length > 0) return missing;
  return keys.map((key, index) => ({
    key,
    year: years[index],
    ...(inputs.factByKey.get(key) as CaEarlierYearReturnFactValue),
  }));
}

export const isMissingList = (years: CaYear[] | string[]): years is string[] =>
  years.some((entry) => typeof entry === "string");

/* The year's answers for a column, or undefined while one is missing. */
export function answeredYear(fact: CaYear): AnsweredYear | undefined {
  const { taxableIncome, filingStatus, taxBeforeCredits } = fact;
  if (taxableIncome === undefined || filingStatus === undefined || taxBeforeCredits === undefined)
    return undefined;
  return { ...fact, taxableIncome, filingStatus, taxBeforeCredits };
}

/*
 * One column: the year's taxable income (not less than zero), the share of
 * the distribution, and the tax at the year's rates unless a gap applies.
 */
export function columnOf(fact: AnsweredYear, share: number, formGap?: string): Column {
  const gap =
    formGap ?? (fact.netOperatingLossChanges === true ? GAP_NET_OPERATING_LOSS : undefined);
  const lines = yearColumn({
    year: fact.year,
    taxableIncome: taxableIncomeAmount(fact.taxableIncome),
    share,
    taxOn: (income) =>
      gap === undefined ? caEarlierYearTax(fact.year, fact.filingStatus, income) : undefined,
    taxBeforeCredits: fact.taxBeforeCredits,
    creditChange: fact.creditChange,
    minimumTaxChange: fact.minimumTaxChange,
  });
  return { year: fact.year, lines, gap };
}
