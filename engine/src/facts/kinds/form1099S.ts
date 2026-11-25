/*
 * Form 1099-S, Proceeds From Real Estate Transactions: the settlement agent's
 * report of a real estate sale. One fact per form. Form 4797 line 1a adds box 2
 * for each sale it includes (irs-4797-inst-2025::sec::line-1a::b01); a sale fact
 * names its form (businessPropertySale.ts, form1099SKey).
 */

type FactRow = { key: string; value: unknown; category: string };

export interface Form1099SFactValue {
  /* The filer: the settlement agent or other person responsible for the closing. */
  filerName: string;
  filerTin?: string;
  box1?: string; // Date of closing, YYYY-MM-DD
  box2: number; // Gross proceeds
  box3?: string; // Address or legal description of the property
  box4?: boolean; // The transferor received or will receive property or services as part of the consideration
  box5?: boolean; // The transferor is a foreign person
  box6?: number; // Buyer's part of real estate tax
}

export interface Form1099SFact {
  key: string;
  value: Form1099SFactValue;
}

const FORM_1099S_CATEGORY = "other";
const FORM_1099S_KEY_END = "1099s";

export function makeForm1099SFactKey(payerSlug: string, formId: string): string {
  return `payer.${payerSlug}.${FORM_1099S_KEY_END}.${formId}`;
}

export function isForm1099SFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 4 &&
    parts[0] === "payer" &&
    parts[1] !== "" &&
    parts[2] === FORM_1099S_KEY_END &&
    parts[3] !== ""
  );
}

const isForm = (value: unknown): value is Form1099SFactValue =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Record<string, unknown>).box2 === "number" &&
  Number.isFinite((value as Record<string, unknown>).box2) &&
  ((value as Record<string, unknown>).box2 as number) >= 0;

/* Every well-formed Form 1099-S fact, by key. */
export function getForm1099SFacts(facts: ReadonlyArray<FactRow>): Map<string, Form1099SFactValue> {
  return new Map(
    facts
      .filter((row) => row.category === FORM_1099S_CATEGORY && isForm1099SFactKey(row.key))
      .filter((row) => isForm(row.value))
      .map((row) => [row.key, row.value as Form1099SFactValue]),
  );
}
