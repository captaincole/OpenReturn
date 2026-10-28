/* One fact per 1099-SA. A custodian issues one form per distribution code, so the key carries a form id. */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface HsaDistributionFactValue {
  payerName: string;
  payerTin?: string;
  box1: number; // Gross distribution
  box2?: number; // Earnings on excess contributions
  box3: string; // Distribution code, e.g. "1" (normal distribution)
  box4?: number; // FMV on date of death
  box5: "HSA" | "Archer MSA" | "MA MSA"; // Account type (checkbox)
}

export interface HsaDistributionFact {
  accountSlug: string;
  distributionId: string;
  distribution: HsaDistributionFactValue;
  sourceFact: TaxFactRow;
}

const SA_CATEGORY = "hsa";
const SA_KEY_RE = /^account\.([^.]+)\.hsa_distributions\.([^.]+)$/;

export function makeHsaDistributionFactKey(accountSlug: string, distributionId: string): string {
  return `account.${accountSlug}.hsa_distributions.${distributionId}`;
}

export function isHsaDistributionFact(f: TaxFactRow): boolean {
  return f.category === SA_CATEGORY && SA_KEY_RE.test(f.key);
}

export function parseHsaDistributionFact(f: TaxFactRow): HsaDistributionFact | null {
  if (f.category !== SA_CATEGORY) return null;
  const match = f.key.match(SA_KEY_RE);
  if (!match) return null;
  const [, accountSlug, distributionId] = match;
  return {
    accountSlug,
    distributionId,
    distribution: f.value as HsaDistributionFactValue,
    sourceFact: f,
  };
}

export function getHsaDistributionFacts(facts: FactsView): HsaDistributionFact[] {
  const out: HsaDistributionFact[] = [];
  for (const f of facts.byCategory(SA_CATEGORY)) {
    const parsed = parseHsaDistributionFact(f);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
