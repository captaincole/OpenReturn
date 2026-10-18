/*
 * SSA-1099 fact kind. One fact = one benefit statement. Form RRB-1099
 * is not supported: its box numbers differ (withholding is box 10).
 *
 * Convention:
 *   category: "retirement"
 *   key:      "payer.{payerSlug}.social_security" (e.g. "payer.ssa.social_security")
 *   value:    SocialSecurityFactValue
 *
 * Box 5 (net benefits) feeds Form 1040 line 6a and the Social Security
 * Benefits Worksheet (1040 instructions, lines 6a and 6b). Box numbers
 * follow the 2025 Form SSA-1099.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface SocialSecurityFactValue {
  payerName: string; // "Social Security Administration"
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

export function isSocialSecurityFact(f: TaxFactRow): boolean {
  return f.category === SS_CATEGORY && SS_KEY_RE.test(f.key);
}

export function getSocialSecurityFacts(facts: FactsView): SocialSecurityFactValue[] {
  return facts
    .byCategory(SS_CATEGORY)
    .filter(isSocialSecurityFact)
    .map((f) => f.value as SocialSecurityFactValue);
}
