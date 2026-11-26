/*
 * One person's Form 2555 from the person's fact: every amount in dollars,
 * then the lines (lines.ts). Line 44's share of the self-employment tax
 * deduction needs Schedule SE, so results.ts adds it after the forms settle.
 */

import { yearlyAverageRate } from "../../currency/rates.js";
import type {
  ForeignAmount,
  ForeignEarnedIncomeFact,
  ForeignEarnedIncomeFactValue,
  ForeignEarnedIncomeOwner,
} from "../../facts/index.js";
import { dollarsFromForeign, roundDollars, sum } from "../../money.js";
import { qualifyingDays } from "./dates.js";
import {
  partIVLines,
  partIXLines,
  partVIILines,
  partVILines,
  standardHousingLimit,
  type PartIVAmounts,
  type PartIVLines,
  type PartIXLines,
  type PartVIILines,
  type PartVILines,
} from "./lines.js";

const TAX_YEAR = 2025;

const CAPITAL_MATERIAL =
  "Capital is a material income-producing factor of the business: line 20 takes a reasonable allowance for services of at most 30% of the net profits after the deduction for the employer-equivalent part of self-employment tax (irs-2555-inst-2025::sec::line-20::b01), and the engine figures that deduction only on Schedule SE for all businesses together.";
const LISTED_LOCATION =
  "The housing location is listed in Notice 2025-16: line 29b takes that location's limit from the notice's table (irs-2555-inst-2025::sec::line-29b::b01), which is not in the engine.";

/* How line 44 takes the deductible part of self-employment tax (Schedule 1 line 15). */
export type SelfEmploymentShare = "none" | "included" | "waiting" | "other";

/* Parts V to IX of one person's form. */
export interface ExclusionLines {
  line27: number;
  claimsHousing: boolean;
  partVI?: PartVILines;
  partVII?: PartVIILines;
  /* Part VIII line 43; undefined when neither exclusion is claimed. */
  line43?: number;
  /* Line 44 before the self-employment tax share: the related deductions in dollars. */
  relatedDeductions: number;
  selfEmployment: SelfEmploymentShare;
  partIX?: PartIXLines;
}

export interface Form2555Filer {
  key: string;
  owner: ForeignEarnedIncomeOwner;
  answers: ForeignEarnedIncomeFactValue;
  partIV?: PartIVLines;
  /* Why Part IV cannot be figured (a currency the engine lacks, a business with material capital). */
  partIVGap?: string;
  exclusion?: ExclusionLines;
  /* Why Parts V to IX cannot be figured. */
  exclusionGap?: string;
  /* Line 14 column (d) and line 18 column (f), in whole dollars, one per row. */
  usBusinessIncome: Array<number | undefined>;
  /* Lines 31 and 38. */
  days: number;
}

type Dollars = { dollars: number | undefined } | { gap: string };

/*
 * A foreign amount at the IRS yearly average of 2025: the fact names no day,
 * and decision row 10 of docs/rule-decisions.md takes the average for an
 * amount with no date (incomeInDollars.ts). Part IV asks for "the exchange
 * rates in effect when you actually or constructively received the income"
 * (irs-2555-face-2025::sec::face-part-iv::b01); see QUESTIONS.md.
 */
function dollarsOf(amount: ForeignAmount | undefined): Dollars {
  if (amount === undefined) return { dollars: undefined };
  if (typeof amount === "number") return { dollars: amount };
  const found = yearlyAverageRate(amount.currency, TAX_YEAR);
  return found.ok ? { dollars: dollarsFromForeign(amount.amount, found.rate) } : { gap: found.gap };
}

/* Each named amount in dollars, or the first gap. */
function convertAll<Key extends string>(
  amounts: Record<Key, ForeignAmount | undefined>,
): Record<Key, number | undefined> | { gap: string } {
  const out = {} as Record<Key, number | undefined>;
  for (const [name, amount] of Object.entries(amounts) as Array<[Key, ForeignAmount | undefined]>) {
    const converted = dollarsOf(amount);
    if ("gap" in converted) return converted;
    out[name] = converted.dollars;
  }
  return out;
}

/* Part IV's amounts from the fact (lines 19 to 25). */
function partIVAmounts(value: ForeignEarnedIncomeFactValue): PartIVAmounts | { gap: string } {
  if (value.business?.capitalMaterial || value.partnership?.capitalMaterial) {
    return { gap: CAPITAL_MATERIAL };
  }
  return convertAll({
    wages: value.wages,
    business: value.business?.grossIncome,
    partnership: value.partnership?.grossIncome,
    lodging: value.noncash?.lodging,
    meals: value.noncash?.meals,
    car: value.noncash?.car,
    otherNoncash: value.noncash?.other?.amount,
    costOfLiving: value.allowances?.costOfLiving,
    family: value.allowances?.family,
    education: value.allowances?.education,
    homeLeave: value.allowances?.homeLeave,
    quarters: value.allowances?.quarters,
    otherAllowance: value.allowances?.other?.amount,
    otherIncome: value.otherIncome?.amount,
    excludableMealsAndLodging: value.excludableMealsAndLodging,
  });
}

/* Line 44's self-employment tax share: asked only when line 20a or 20b has an amount. */
function selfEmploymentShare(value: ForeignEarnedIncomeFactValue, partIV: PartIVLines) {
  if (sum(partIV.line20a, partIV.line20b) <= 0) return "none";
  if (value.allSelfEmploymentOnForm === undefined) return "waiting";
  return value.allSelfEmploymentOnForm ? "included" : "other";
}

/* Line 34's employer-provided amounts: line 27 less the self-employment income; undefined when nothing is left. */
function employerProvided(partIV: PartIVLines): number | undefined {
  const selfEmployed = sum(partIV.line20a, partIV.line20b);
  const left = partIV.line26 - selfEmployed;
  return selfEmployed > 0 && left <= 0 ? undefined : left;
}

function partVIOf(
  value: ForeignEarnedIncomeFactValue,
  partIV: PartIVLines,
  days: number,
): PartVILines | { gap: string } | undefined {
  if (value.housing === undefined) return undefined;
  if (value.housing.listedLocation !== undefined) return { gap: LISTED_LOCATION };
  const expenses = dollarsOf(value.housing.expenses);
  if ("gap" in expenses) return expenses;
  return partVILines({
    line27: partIV.line26,
    expenses: sum(expenses.dollars),
    limit: standardHousingLimit(days),
    days,
    employerProvided: employerProvided(partIV),
  });
}

/* Parts V to IX (irs-2555-face-2025::sec::face-part-v::b01 to face-part-ix::b01). */
function exclusionLines(
  value: ForeignEarnedIncomeFactValue,
  partIV: PartIVLines,
  days: number,
): ExclusionLines | { gap: string } {
  const partVI = partVIOf(value, partIV, days);
  if (partVI !== undefined && "gap" in partVI) return partVI;
  const deductions = convertAll({
    business: value.business?.expenses,
    partnership: value.partnership?.expenses,
  });
  if ("gap" in deductions) return deductions;
  const line27 = partIV.line26;
  const line36 = partVI?.line36;
  const partVII =
    value.claimsIncomeExclusion === false ? undefined : partVIILines(line27, line36, days);
  const claimed = partVII !== undefined || (line36 ?? 0) > 0;
  const line43 = claimed ? sum(line36, partVII?.line42) : undefined;
  const partIX =
    partVI === undefined || line43 === undefined
      ? undefined
      : partIXLines({
          line27,
          line33: partVI.line33,
          line36: sum(line36),
          line43,
          prior: value.priorYearHousing,
        });
  return {
    line27,
    claimsHousing: value.housing !== undefined,
    partVI,
    partVII,
    line43,
    relatedDeductions: sum(
      deductions.business,
      deductions.partnership,
      value.otherRelatedDeductions,
    ),
    selfEmployment: selfEmploymentShare(value, partIV),
    partIX,
  };
}

/* Line 14 column (d) or line 18 column (f) of each row, in whole dollars. */
function usBusinessIncomeOf(value: ForeignEarnedIncomeFactValue): Array<number | undefined> {
  const rows = value.bonaFideResidence
    ? (value.bonaFideResidence.usVisits ?? []).map((visit) => visit.businessIncome)
    : (value.physicalPresence?.stays ?? []).map((stay) => stay.usBusinessIncome);
  return rows.map((amount) => {
    const converted = dollarsOf(amount);
    return "gap" in converted ? undefined : roundDollars(converted.dollars);
  });
}

/* The person's form; the caller has checked that the person qualifies (qualifies.ts). */
export function form2555Filer(fact: ForeignEarnedIncomeFact): Form2555Filer {
  const days = qualifyingDays(fact.value) ?? 0;
  const base = {
    key: fact.key,
    owner: fact.owner,
    answers: fact.value,
    usBusinessIncome: usBusinessIncomeOf(fact.value),
    days,
  };
  const amounts = partIVAmounts(fact.value);
  if ("gap" in amounts) return { ...base, partIVGap: amounts.gap };
  const partIV = partIVLines(amounts);
  const exclusion = exclusionLines(fact.value, partIV, days);
  return "gap" in exclusion
    ? { ...base, partIV, exclusionGap: exclusion.gap }
    : { ...base, partIV, exclusion };
}
