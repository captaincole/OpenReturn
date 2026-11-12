/*
 * One fact per Form 1099-NEC (nonemployee compensation). Box 1 is pay for work
 * done as a nonemployee; Schedule C line 1 must include it, and a box 1 total
 * above line 1 needs a statement (irs-1040sc-inst-2025::sec::line-1::b01). So,
 * as for a 1099-K, box 1 is where gross receipts start, not the line itself:
 * the user confirms gross receipts in the business fact. businessId names the
 * business (business.ts) the pay was for.
 */

import { makeBusinessFactKey } from "./business.js";

type FactRow = { key: string; value: unknown; category: string };

export interface NonemployeeCompensationFactValue {
  payerName: string;
  payerTin?: string;
  accountNumber?: string;
  /* The businessId of the business this pay was for. */
  businessId?: string;
  box1?: number; // Nonemployee compensation
  box2?: boolean; // Payer made direct sales totaling $5,000 or more (checkbox)
  box3?: number; // Excess golden parachute payments
  box4?: number; // Federal income tax withheld
  box5?: number; // State tax withheld
  box6?: string; // State/Payer's state no.
  box7?: number; // State income
}

const NONEMPLOYEE_COMPENSATION_CATEGORY = "self_employment";

/* One payer can send several 1099-NECs (one per account), so the key also holds an id for the form. */
export function makeNonemployeeCompensationFactKey(payerSlug: string, formId: string): string {
  return `payer.${payerSlug}.1099nec.${formId}`;
}

export function isNonemployeeCompensationFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "payer" && parts[2] === "1099nec";
}

export function getNonemployeeCompensationFacts(
  facts: ReadonlyArray<FactRow>,
): Array<{ key: string; value: NonemployeeCompensationFactValue }> {
  return facts
    .filter(
      (fact) =>
        fact.category === NONEMPLOYEE_COMPENSATION_CATEGORY &&
        isNonemployeeCompensationFactKey(fact.key),
    )
    .map((fact) => ({ key: fact.key, value: fact.value as NonemployeeCompensationFactValue }));
}

/*
 * The keys of the 1099-NECs that name no business: no businessId, or a
 * businessId with no business fact. Cade must ask which business each one
 * belongs to.
 */
export function unlinkedNonemployeeCompensationKeys(facts: ReadonlyArray<FactRow>): string[] {
  const factKeys = new Set(facts.map((fact) => fact.key));
  return getNonemployeeCompensationFacts(facts)
    .filter(
      (form) =>
        form.value.businessId === undefined ||
        !factKeys.has(makeBusinessFactKey(form.value.businessId)),
    )
    .map((form) => form.key);
}
