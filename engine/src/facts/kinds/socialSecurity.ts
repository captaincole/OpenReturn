/* SSA-1099 only. RRB-1099 box numbers differ (withholding is box 10). */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface SocialSecurityFactValue {
  payerName: string;
  box3?: number; // Benefits paid in 2025
  box4?: number; // Benefits repaid to SSA in 2025
  box5: number; // Net benefits for 2025 (box 3 minus box 4)
  box6?: number; // Voluntary federal income tax withheld
}

const SS_CATEGORY = "retirement";
const SS_KEY_RE = /^payer\.([^.]+)\.social_security$/;

export function makeSocialSecurityFactKey(payerSlug: string): string {
  return `payer.${payerSlug}.social_security`;
}

export function isSocialSecurityFactKey(key: string): boolean {
  return SS_KEY_RE.test(key);
}

export function isSocialSecurityFact(fact: TaxFactRow): boolean {
  return fact.category === SS_CATEGORY && SS_KEY_RE.test(fact.key);
}

export function getSocialSecurityFacts(facts: FactsView): SocialSecurityFactValue[] {
  return facts
    .byCategory(SS_CATEGORY)
    .filter(isSocialSecurityFact)
    .map((fact) => fact.value as SocialSecurityFactValue);
}
