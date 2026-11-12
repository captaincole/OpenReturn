/*
 * One fact per Form 1095-A (Health Insurance Marketplace Statement), one per
 * policy. Form 8962 reads it: line 11 takes the line 33 annual totals, lines
 * 12–23 the monthly rows (irs-8962-inst-2025::sec::line-11::b01). The two
 * Form 8962 answers a taxpayer states sit in PREMIUM_TAX_CREDIT_KEYS.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface MarketplacePerson {
  name: string;
  ssn?: string;
  /* MM/DD/YYYY. The Marketplace prints it only when it has no SSN. */
  dob?: string;
}

/* Part II, lines 16–20. */
export interface MarketplaceCoveredIndividual extends MarketplacePerson {
  startDate?: string; // column D, MM/DD/YYYY
  endDate?: string; // column E
}

/* One row of Part III: columns A, B and C. A blank cell is undefined. */
export interface MarketplaceCoverageAmounts {
  enrollmentPremium?: number; // A. Monthly enrollment premiums
  slcspPremium?: number; // B. Monthly second lowest cost silver plan (SLCSP) premium
  advancePayment?: number; // C. Monthly advance payment of premium tax credit
}

export interface MarketplaceCoverageFactValue {
  marketplaceId: string; // line 1
  policyNumber: string; // line 2
  issuerName?: string; // line 3
  recipient: MarketplacePerson; // lines 4–6
  recipientSpouse?: MarketplacePerson; // lines 7–9
  policyStartDate?: string; // line 10, MM/DD/YYYY
  policyEndDate?: string; // line 11
  address?: { street: string; city: string; state: string; zip: string }; // lines 12–15
  coveredIndividuals: MarketplaceCoveredIndividual[];
  /* Lines 21–32, January first: always 12 entries, an empty object for a month with no coverage. */
  months: MarketplaceCoverageAmounts[];
  annualTotals: MarketplaceCoverageAmounts; // line 33
}

const MARKETPLACE_CATEGORY = "health_coverage";

/* A taxpayer can get several 1095-As from one Marketplace (one per policy). */
export function makeMarketplaceCoverageFactKey(
  marketplaceSlug: string,
  policySlug: string,
): string {
  return `marketplace.${marketplaceSlug}.1095a.${policySlug}`;
}

export function isMarketplaceCoverageFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "marketplace" && parts[2] === "1095a";
}

export function getMarketplaceCoverageFacts(
  facts: FactsView,
): Array<{ key: string; value: MarketplaceCoverageFactValue }> {
  return facts
    .byCategory(MARKETPLACE_CATEGORY)
    .filter((fact: TaxFactRow) => isMarketplaceCoverageFactKey(fact.key))
    .map((fact) => ({ key: fact.key, value: fact.value as MarketplaceCoverageFactValue }));
}

/* Form 8962 answers the taxpayer states (category "health_coverage"). */
export const PREMIUM_TAX_CREDIT_KEYS = {
  /*
   * Line A: an MFS filer who is a victim of domestic abuse or spousal
   * abandonment (Exception 2) and so may take the PTC. Asked only when MFS.
   */
  mfsException: "health_coverage.ptc.mfs_exception",
  /*
   * Line 9: the taxpayer shares a policy with another tax family (Part IV) or
   * elects the alternative calculation for the year of marriage (Part V).
   */
  allocatesPolicyOrMarriageCalc: "health_coverage.ptc.allocates_policy_or_marriage_calc",
} as const;
