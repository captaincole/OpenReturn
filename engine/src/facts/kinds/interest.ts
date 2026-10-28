/* TODO: Schedule B Part I (interest over $1,500) needs repeating binding rows; unsupported until then. */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface InterestFactValue {
  payerName: string;
  payerTin?: string;
  box1?: number; // Interest income
  box2?: number; // Early withdrawal penalty (an above-the-line deduction)
  box3?: number; // US savings bond and Treasury interest
  box4?: number; // Federal income tax withheld
  box5?: number; // Investment expenses
  box6?: number; // Foreign tax paid
  box7?: string; // Foreign country or US territory
  box8?: number; // Tax-exempt interest (flows to 1040 line 2a)
  box9?: number; // Specified private activity bond interest (AMT-relevant)
  box10?: number; // Market discount
  box11?: number; // Bond premium
  box12?: number; // Bond premium on Treasury obligations
  box13?: number; // Bond premium on tax-exempt bonds
  box15?: string; // State
  box16?: string; // State identification number
  box17?: number; // State income tax withheld
}

export interface InterestFact {
  accountSlug: string;
  interest: InterestFactValue;
  sourceFact: TaxFactRow;
}

const INT_CATEGORY = "investment_income";
const INT_KEY_RE = /^account\.([^.]+)\.interest$/;

export function makeInterestFactKey(accountSlug: string): string {
  return `account.${accountSlug}.interest`;
}

/* Keeps 1099-INT box sums apart from 1099-DIV boxes with the same number. */
export function isInterestFactKey(key: string): boolean {
  return INT_KEY_RE.test(key);
}

export function isInterestFact(f: TaxFactRow): boolean {
  return f.category === INT_CATEGORY && INT_KEY_RE.test(f.key);
}

export function parseInterestFact(f: TaxFactRow): InterestFact | null {
  if (f.category !== INT_CATEGORY) return null;
  const match = f.key.match(INT_KEY_RE);
  if (!match) return null;
  const [, accountSlug] = match;
  return {
    accountSlug,
    interest: f.value as InterestFactValue,
    sourceFact: f,
  };
}

export function getInterestFacts(facts: FactsView): InterestFact[] {
  const out: InterestFact[] = [];
  for (const f of facts.byCategory(INT_CATEGORY)) {
    const parsed = parseInterestFact(f);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
