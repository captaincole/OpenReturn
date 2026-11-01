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

export function isMiscIncomeFact(fact: TaxFactRow): boolean {
  return fact.category === MISC_CATEGORY && MISC_KEY_RE.test(fact.key);
}

export function parseMiscIncomeFact(fact: TaxFactRow): MiscIncomeFact | null {
  if (fact.category !== MISC_CATEGORY) return null;
  const match = fact.key.match(MISC_KEY_RE);
  if (!match) return null;
  const [, accountSlug] = match;
  return { accountSlug, misc: fact.value as MiscIncomeFactValue, sourceFact: fact };
}

export function getMiscIncomeFacts(facts: FactsView): MiscIncomeFact[] {
  const out: MiscIncomeFact[] = [];
  for (const fact of facts.byCategory(MISC_CATEGORY)) {
    const parsed = parseMiscIncomeFact(fact);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
