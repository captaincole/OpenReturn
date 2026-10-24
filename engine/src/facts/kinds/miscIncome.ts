/*
 * 1099-MISC fact kind. One fact = one account's 1099-MISC box totals.
 * A broker's consolidated statement can carry a 1099-MISC section; a
 * standalone 1099-MISC is the same shape with its own account.
 *
 * Convention:
 *   category: "other"
 *   key:      "account.{accountSlug}.misc"
 *   value:    MiscIncomeFactValue
 *
 * Box 3 (other income) is the load-bearing field: it flows to Schedule 1
 * line 8z. Box numbers follow the 2025 Form 1099-MISC.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface MiscIncomeFactValue {
  payerName: string;
  payerTin?: string;
  box1?: number; // Rents
  box2?: number; // Royalties
  box3?: number; // Other income
  box4?: number; // Federal income tax withheld
  box5?: number; // Fishing boat proceeds
  box6?: number; // Medical and health care payments
  box7?: boolean; // Direct sales of $5,000 or more (checkbox)
  box8?: number; // Substitute payments in lieu of dividends or interest
  box9?: number; // Crop insurance proceeds
  box10?: number; // Gross proceeds paid to an attorney
  box11?: number; // Fish purchased for resale
  box12?: number; // Section 409A deferrals
  box13?: boolean; // FATCA filing requirement
  box14?: number; // Excess golden parachute payments
  box15?: number; // Nonqualified deferred compensation
  box16?: number; // State tax withheld
  box17?: string; // State / payer's state number
  box18?: number; // State income
}

export interface MiscIncomeFact {
  accountSlug: string;
  misc: MiscIncomeFactValue;
  sourceFact: TaxFactRow;
}

const MISC_CATEGORY = "other";
const MISC_KEY_RE = /^account\.([^.]+)\.misc$/;

export function makeMiscIncomeFactKey(accountSlug: string): string {
  return `account.${accountSlug}.misc`;
}

export function isMiscIncomeFact(f: TaxFactRow): boolean {
  return f.category === MISC_CATEGORY && MISC_KEY_RE.test(f.key);
}

export function parseMiscIncomeFact(f: TaxFactRow): MiscIncomeFact | null {
  if (f.category !== MISC_CATEGORY) return null;
  const match = f.key.match(MISC_KEY_RE);
  if (!match) return null;
  const [, accountSlug] = match;
  return { accountSlug, misc: f.value as MiscIncomeFactValue, sourceFact: f };
}

export function getMiscIncomeFacts(facts: FactsView): MiscIncomeFact[] {
  const out: MiscIncomeFact[] = [];
  for (const f of facts.byCategory(MISC_CATEGORY)) {
    const parsed = parseMiscIncomeFact(f);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
