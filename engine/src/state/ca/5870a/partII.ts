/*
 * Parts II and III of one FTB 5870A: a distribution to an otherwise contingent
 * beneficiary, averaged over the earlier years (R&TC section 17745(b) and (d);
 * ca-5870a-inst-2025::sec::part-ii-tax-on-distributions-of-previously-untaxed-trust-income::b01,
 * ::section-a, ::section-b, ::section-a-2, ::section-b-2).
 */

import type { CaliforniaTrustDistribution } from "../../../facts/index.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { Column, Form5870AResult, PartIIILines, ResidentYear } from "./filingInfo.js";
import {
  BEHAVIORAL_HEALTH_TAX_FLOOR,
  partIIIApplies,
  partIIIColumn,
  partIIITotal,
  partIITotal,
  PRECEDING_YEARS,
  SECTION_A_MINIMUM_YEARS,
  sectionAShare,
  sectionBShare,
  type YearColumn,
} from "./lines.js";
import {
  answeredYear,
  caYears,
  columnOf,
  GAP_CAPITAL_GAIN,
  isMissingList,
  type CaYear,
} from "./years.js";

/* Section A or Section B, its first lines, and the years its columns cover. */
function sectionOf(distribution: number, years: number) {
  if (years >= SECTION_A_MINIMUM_YEARS) {
    const { line1, line2 } = sectionAShare(distribution);
    return { section: "A" as const, line1, share: line2, years: PRECEDING_YEARS };
  }
  const { line1, line2a, line3, line4 } = sectionBShare(distribution, years);
  return {
    section: "B" as const,
    line1,
    share: line4,
    years: PRECEDING_YEARS.slice(0, years),
    averagingFactor: line3,
    accumulated: line2a,
  };
}

/*
 * Part II line 3 (Section B line 5): "Check 'Yes' in each column for the years
 * that you were either a California resident or part-year resident. Check 'No'
 * for the years that you were a nonresident" (section-a::b02).
 */
const isYes = (fact: CaYear) => fact.residency !== "nonresident";

/* Part III line 4 of a year: stated, or none with taxable income of $1,000,000 or less. */
function behavioralHealthTaxPaid(fact: CaYear): number | undefined {
  if (fact.behavioralHealthTaxPaid !== undefined) return fact.behavioralHealthTaxPaid;
  return (fact.taxableIncome ?? 0) <= BEHAVIORAL_HEALTH_TAX_FLOOR ? 0 : undefined;
}

/* Part III, or the keys it waits for; undefined when no recomputed income is over $1,000,000. */
function partIII(yes: CaYear[], columns: YearColumn[]): PartIIILines | string[] | undefined {
  if (!partIIIApplies(columns)) return undefined;
  const paid = yes.map(behavioralHealthTaxPaid);
  const missing = yes.filter((_, index) => paid[index] === undefined).map((fact) => fact.key);
  if (missing.length > 0) return missing;
  const rows = columns.map((entry, index) =>
    partIIIColumn(entry.year, entry.recomputed, paid[index] ?? 0),
  );
  return { columns: rows, line6: partIIITotal(rows) };
}

/* Part II and Part III, or what they wait for. */
export function partIIResult(
  inputs: ResolverInputs,
  california: CaliforniaTrustDistribution,
  trustKey: string,
): Form5870AResult {
  const { accumulationDistribution, accumulationYears } = california;
  if (accumulationDistribution === undefined || accumulationYears === undefined)
    return { kind: "waits", missing: [trustKey] };
  if (accumulationYears < 1) return { kind: "waits", missing: [trustKey] };
  const section = sectionOf(accumulationDistribution, accumulationYears);
  const years = caYears(inputs, section.years);
  if (isMissingList(years)) return { kind: "waits", missing: years };
  const yes = years.filter(isYes);
  const answered = yes.map(answeredYear);
  const unanswered = yes.filter((_, index) => answered[index] === undefined);
  if (unanswered.length > 0) return { kind: "waits", missing: unanswered.map((fact) => fact.key) };
  const formGap = california.capitalGain === true ? GAP_CAPITAL_GAIN : undefined;
  const columns: Column[] = answered.flatMap((fact) =>
    fact === undefined ? [] : [columnOf(fact, section.share, formGap)],
  );
  const lines = columns.flatMap((entry) => (entry.lines ? [entry.lines] : []));
  const taxGap = columns.find((entry) => entry.gap)?.gap;
  const residentYears: ResidentYear[] = years.map((fact) => ({
    year: fact.year,
    resident: isYes(fact),
  }));
  const partII = {
    section: section.section,
    line1: section.line1,
    share: section.share,
    years: section.section === "B" ? section.accumulated : undefined,
    averagingFactor: section.section === "B" ? section.averagingFactor : undefined,
    residentYears,
    columns,
    total: taxGap === undefined ? partIITotal(lines) : undefined,
  };
  const third = taxGap === undefined ? partIII(yes, lines) : undefined;
  if (Array.isArray(third)) return { kind: "waits", missing: third };
  // A gap year whose stated recomputed income is over $1,000,000 leaves Part III unknown too.
  const bhstGap = taxGap !== undefined && partIIIApplies(lines) ? taxGap : undefined;
  return { kind: "figured", lines: { partII, partIII: third }, taxGap, bhstGap };
}
