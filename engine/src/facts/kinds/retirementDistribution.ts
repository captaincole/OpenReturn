/* One fact per 1099-R. A payer can issue several (e.g. codes G and H from one plan), so the key carries a form id. */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface RetirementDistributionFactValue {
  payerName: string;
  payerTin?: string;
  planName?: string;
  /* Whose 1099-R it is, from the recipient's name. Absent means the taxpayer. Form 8606 is per person. */
  owner?: "taxpayer" | "spouse";
  box1: number; // Gross distribution (1040 line 4a or 5a)
  box2a?: number; // Taxable amount (1040 line 4b or 5b)
  box2b?: {
    taxableAmountNotDetermined?: boolean;
    totalDistribution?: boolean;
  };
  box3?: number; // Capital gain (included in box 2a)
  box4?: number; // Federal income tax withheld
  box5?: number; // Employee contributions / designated Roth contributions
  box6?: number; // Net unrealized appreciation
  /* Up to two codes as printed, e.g. "7", "G", "4G". */
  box7: string;
  /* Checked: 1040 lines 4a/4b. Unchecked: pensions and annuities, lines 5a/5b. */
  box7IraSepSimple: boolean;
  box8?: number; // Other
  box9a?: number; // Your percentage of total distribution
  box9b?: number; // Total employee contributions
  box10?: number; // Amount allocable to IRR within 5 years
  box11?: number; // 1st year of designated Roth contributions
  box12?: boolean; // FATCA filing requirement
  box13?: string; // Date of payment
  box14?: number; // State tax withheld
  box15?: string; // State / payer's state number
  box16?: number; // State distribution
  box17?: number; // Local tax withheld
  box18?: string; // Name of locality
  box19?: number; // Local distribution
}

export interface RetirementDistributionFact {
  payerSlug: string;
  distributionId: string;
  distribution: RetirementDistributionFactValue;
  sourceFact: TaxFactRow;
}

const R_CATEGORY = "retirement";
const R_KEY_RE = /^payer\.([^.]+)\.distributions\.([^.]+)$/;

export function makeRetirementDistributionFactKey(
  payerSlug: string,
  distributionId: string,
): string {
  return `payer.${payerSlug}.distributions.${distributionId}`;
}

export function isRetirementDistributionFactKey(key: string): boolean {
  return R_KEY_RE.test(key);
}

/* Roth IRA distributions (1099-R inst.): the payer leaves box 7 IRA/SEP/SIMPLE blank for them. */
export const ROTH_IRA_CODES = ["J", "Q", "T"] as const;

/* Box 7 holds up to two codes of one character each, e.g. "4G". */
export function hasDistributionCode(
  distribution: RetirementDistributionFactValue,
  codes: readonly string[],
): boolean {
  return codes.some((code) => distribution.box7.includes(code));
}

export function isRetirementDistributionFact(fact: TaxFactRow): boolean {
  return fact.category === R_CATEGORY && R_KEY_RE.test(fact.key);
}

export function parseRetirementDistributionFact(
  fact: TaxFactRow,
): RetirementDistributionFact | null {
  if (fact.category !== R_CATEGORY) return null;
  const match = fact.key.match(R_KEY_RE);
  if (!match) return null;
  const [, payerSlug, distributionId] = match;
  return {
    payerSlug,
    distributionId,
    distribution: fact.value as RetirementDistributionFactValue,
    sourceFact: fact,
  };
}

export function getRetirementDistributionFacts(facts: FactsView): RetirementDistributionFact[] {
  const out: RetirementDistributionFact[] = [];
  for (const fact of facts.byCategory(R_CATEGORY)) {
    const parsed = parseRetirementDistributionFact(fact);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}

/*
 * A disability pension: box 7 code 3 on a 1099-R that is not from an IRA. Before
 * the minimum retirement age set by the employer it is reported on Form 1040
 * line 1h; after it, on lines 5a and 5b (irs-1040-inst-2025::sec::lines-5a-and-5b::b01,
 * irs-1040-inst-2025::sec::line-1h::b02).
 */
export function isDisabilityPension(distribution: RetirementDistributionFactValue): boolean {
  return (
    !distribution.box7IraSepSimple &&
    !hasDistributionCode(distribution, ROTH_IRA_CODES) &&
    hasDistributionCode(distribution, ["3"])
  );
}

const DISABILITY_PREFIX = "retirement.disability_pension.";
const DISABILITY_SUFFIX = ".before_minimum_retirement_age";

/* The answer for one disability pension: true when received before the employer's minimum retirement age. */
export function makeDisabilityBeforeMinimumRetirementAgeKey(
  payerSlug: string,
  distributionId: string,
): string {
  return `${DISABILITY_PREFIX}${payerSlug}.${distributionId}${DISABILITY_SUFFIX}`;
}

export function isDisabilityBeforeMinimumRetirementAgeKey(key: string): boolean {
  if (!key.startsWith(DISABILITY_PREFIX) || !key.endsWith(DISABILITY_SUFFIX)) return false;
  const ids = key.slice(DISABILITY_PREFIX.length, key.length - DISABILITY_SUFFIX.length);
  return ids.split(".").length === 2 && !ids.split(".").includes("");
}
