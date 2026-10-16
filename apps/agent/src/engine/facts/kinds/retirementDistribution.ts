/*
 * 1099-R fact kind. One fact = one Form 1099-R. A payer can issue more
 * than one 1099-R in a year (for example a code G and a code H rollover
 * from the same plan), so the key carries a per-form id.
 *
 * Convention:
 *   category: "retirement"
 *   key:      "payer.{payerSlug}.distributions.{distributionId}"
 *   value:    RetirementDistributionFactValue
 *
 * Box numbers follow the 2025 Form 1099-R.
 */

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
  /*
   * Box 7 distribution code(s) as printed, e.g. "7", "G", "H", "4G".
   * Up to two codes.
   */
  box7: string;
  /*
   * Box 7 IRA/SEP/SIMPLE checkbox. Checked ⇒ the distribution goes on
   * 1040 lines 4a/4b. Unchecked ⇒ pensions and annuities, lines 5a/5b.
   */
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

export function isRetirementDistributionFact(f: TaxFactRow): boolean {
  return f.category === R_CATEGORY && R_KEY_RE.test(f.key);
}

export function parseRetirementDistributionFact(f: TaxFactRow): RetirementDistributionFact | null {
  if (f.category !== R_CATEGORY) return null;
  const match = f.key.match(R_KEY_RE);
  if (!match) return null;
  const [, payerSlug, distributionId] = match;
  return {
    payerSlug,
    distributionId,
    distribution: f.value as RetirementDistributionFactValue,
    sourceFact: f,
  };
}

export function getRetirementDistributionFacts(facts: FactsView): RetirementDistributionFact[] {
  const out: RetirementDistributionFact[] = [];
  for (const f of facts.byCategory(R_CATEGORY)) {
    const parsed = parseRetirementDistributionFact(f);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
