import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";
import { makeBusinessFactKey } from "./business.js";

export interface MiscIncomeFactValue {
  payerName: string;
  payerTin?: string;
  /* The businessId (business.ts) when the form reports Schedule C income: its boxes are in that business's gross receipts. */
  businessId?: string;
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

export function isMiscIncomeFactKey(key: string): boolean {
  return MISC_KEY_RE.test(key);
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

type Row = { key: string; value: unknown; category: string };

const businessIdOf = (row: Row): string | undefined =>
  (row.value as MiscIncomeFactValue | undefined)?.businessId;

/* The 1099-MISC facts: each with its key and businessId. */
function miscRows(facts: ReadonlyArray<Row>): Row[] {
  return facts.filter((fact) => fact.category === MISC_CATEGORY && MISC_KEY_RE.test(fact.key));
}

/* The 1099-MISCs that pay no business: their box 3 is Schedule 1 line 8z. */
export function miscIncomeNotForBusiness(facts: ReadonlyArray<Row>): Row[] {
  return miscRows(facts).filter((row) => businessIdOf(row) === undefined);
}

/*
 * The keys of the 1099-MISCs whose businessId names no business fact. Cade must
 * ask which business each one belongs to, as for a 1099-NEC.
 */
export function unlinkedMiscIncomeKeys(facts: ReadonlyArray<Row>): string[] {
  const factKeys = new Set(facts.map((fact) => fact.key));
  return miscRows(facts)
    .filter((row) => {
      const businessId = businessIdOf(row);
      return businessId !== undefined && !factKeys.has(makeBusinessFactKey(businessId));
    })
    .map((row) => row.key);
}
