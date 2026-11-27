/*
 * Lines 8, 12 and 16: the tax on a base year's income with its third of the
 * elected farm income, at that year's rates. The instructions give the choice:
 * "The 2022 Tax Rate Schedules below; The 2022 Qualified Dividends and
 * Capital Gain Tax Worksheet, later; The 2022 Schedule D Tax Worksheet ...; or
 * The 2022 Foreign Earned Income Tax Worksheet, later"
 * (irs-1040sj-inst-2025::sec::line-8::b01; line-12::b01 and line-16::b01 for
 * 2023 and 2024). The rate schedules and the capital gain ceilings of those
 * years are data/earlierYearRates.ts; the stacked worksheet is Form 4970's
 * (federal/4970/earlierYearTax.ts), the same worksheet lines 1 to 27.
 */

import { earlierYearRates } from "../../data/earlierYearRates.js";
import { atLeast, roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { earlierYearIncomeTax, rateScheduleTax } from "../4970/earlierYearTax.js";
import type { BaseYear } from "./baseYears.js";
import { noTaxOn, type Line } from "./lines.js";

/* A base year's third of lines 2b and 2c. */
export interface GainShare {
  netCapitalGain: number;
  unrecapturedSection1250Gain: number;
}

const scheduleDWorksheetGap = (year: number) =>
  `The ${year} tax must use the ${year} Schedule D Tax Worksheet (a third of Schedule J line 2c, or a ${year} 28% rate gain or unrecaptured section 1250 gain; irs-1040sj-inst-2025::sec::line-8::b01, line-12::b01, line-16::b01), and neither the corpus nor the engine has the ${year} Schedule D instructions.`;

const noRatesGap = (year: number) =>
  `The engine has no ${year} Tax Rate Schedule for this filing status.`;

/*
 * QDCG worksheet lines 2 to 6: the year's qualified dividends and net capital
 * gain less its Form 4952 line 4g, not below 0
 * (2022-qualified-dividends-and-capital-gain-tax-worksheet-line-8::b01, b02).
 */
function ownPreferentialIncome(base: BaseYear): number {
  const { qualifiedDividends, capitalGain, investmentIncomeElection } = base.fact;
  const line4 = roundDollars(qualifiedDividends ?? 0) + atLeast(0, roundDollars(capitalGain ?? 0));
  return atLeast(0, line4 - roundDollars(investmentIncomeElection ?? 0));
}

/*
 * The Foreign Earned Income Tax Worksheet of the year
 * (2022-foreign-earned-income-tax-worksheet-line-8::b01–b03): line 3 adds the
 * excluded income (line 2c) to the amount, line 4 is the tax on line 3, line 5
 * the rate-schedule tax on line 2c, line 6 = line 4 − line 5, not below 0. With
 * a capital gain excess, the second worksheet takes it off the qualified
 * dividends and net capital gain, which leaves the preferential income no more
 * than the amount itself (line 1).
 */
function foreignWorksheetTax(base: BaseYear, amount: number, preferential: number): Line {
  const { year, fact } = base;
  const exclusion = fact.foreignExclusion!;
  const rates = earlierYearRates(year, fact.filingStatus);
  const line2c = atLeast(
    0,
    roundDollars(exclusion.excluded) - roundDollars(exclusion.deductionsNotClaimed ?? 0),
  );
  const line4 = earlierYearIncomeTax(
    year,
    fact.filingStatus,
    amount + line2c,
    Math.min(preferential, amount),
  );
  if (line4 === undefined || rates === undefined) return unsupported(noRatesGap(year));
  const line5 = roundDollars(rateScheduleTax(line2c, rates));
  return atLeast(0, line4 - line5);
}

/*
 * The tax on line 7, 11 or 15. Zero or less enters 0. With part of line 2b,
 * "you must use the ... Schedule D Tax Worksheet" (line-8::b01): with no 25% or
 * 28% gain in it, that worksheet's tax is the QDCG worksheet's on the same
 * preferential income, so the engine adds the year's third of line 2b to the
 * year's own (QUESTIONS.md question 3).
 */
export function baseYearTax(base: BaseYear, amount: number, share: GainShare): Line {
  if (noTaxOn(amount)) return 0;
  const { year, fact } = base;
  if (share.unrecapturedSection1250Gain > 0 || fact.usedScheduleDTaxWorksheet === true) {
    return unsupported(scheduleDWorksheetGap(year));
  }
  const preferential = ownPreferentialIncome(base) + share.netCapitalGain;
  if (fact.foreignExclusion !== undefined) return foreignWorksheetTax(base, amount, preferential);
  const tax = earlierYearIncomeTax(year, fact.filingStatus, amount, preferential);
  return tax === undefined ? unsupported(noRatesGap(year)) : tax;
}
