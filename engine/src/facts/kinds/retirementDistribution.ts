/* One fact per 1099-R. A payer can issue several (e.g. codes G and H from one plan), so the key carries a form id. */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface RetirementDistributionFactValue {
  payerName: string;
  payerTin?: string;
  planName?: string;
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
