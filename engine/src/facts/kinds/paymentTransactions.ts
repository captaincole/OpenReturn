/*
 * One fact per Form 1099-K (payment card and third party network transactions),
 * from a card processor or a platform such as a rideshare app. Box 1a is the
 * gross amount "without regard to any adjustments for … fees, refunded amounts"
 * (irs-1099k-form-2025::sec::instructions-for-payee::b02), so it is where
 * Schedule C line 1 starts, not the line itself: the user confirms gross
 * receipts in the business fact. businessId names the business (business.ts)
 * the payments were for.
 */

import { makeBusinessFactKey } from "./business.js";

type FactRow = { key: string; value: unknown; category: string };

export interface PaymentTransactionsFactValue {
  filerName: string;
  filerTin?: string;
  /* "Check to indicate if FILER is a (an)": a payment settlement entity, or an electronic payment facilitator or other third party. */
  filerType?: "payment_settlement_entity" | "electronic_payment_facilitator";
  /* "Check to indicate transactions reported are". */
  transactionType?: "payment_card" | "third_party_network";
  accountNumber?: string;
  /* The businessId of the business these payments were for. */
  businessId?: string;
  box1a: number; // Gross amount of payment card/third party network transactions
  box1b?: number; // Card not present transactions
  box2?: string; // Merchant category code
  box3?: number; // Number of payment transactions
  box4?: number; // Federal income tax withheld
  box6?: string; // State
  box7?: string; // State identification no.
  box8?: number; // State income tax withheld
}

const PAYMENT_TRANSACTIONS_CATEGORY = "self_employment";

/* One filer can send several 1099-Ks (one per account), so the key also holds an id for the form. */
export function makePaymentTransactionsFactKey(payerSlug: string, formId: string): string {
  return `payer.${payerSlug}.1099k.${formId}`;
}

export function isPaymentTransactionsFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "payer" && parts[2] === "1099k";
}

export function getPaymentTransactionsFacts(
  facts: ReadonlyArray<FactRow>,
): Array<{ key: string; value: PaymentTransactionsFactValue }> {
  return facts
    .filter(
      (fact) =>
        fact.category === PAYMENT_TRANSACTIONS_CATEGORY && isPaymentTransactionsFactKey(fact.key),
    )
    .map((fact) => ({ key: fact.key, value: fact.value as PaymentTransactionsFactValue }));
}

/*
 * The keys of the 1099-Ks that name no business: no businessId, or a businessId
 * with no business fact. Cade must ask which business each one belongs to.
 */
export function unlinkedPaymentTransactionsKeys(facts: ReadonlyArray<FactRow>): string[] {
  const factKeys = new Set(facts.map((fact) => fact.key));
  return getPaymentTransactionsFacts(facts)
    .filter(
      (form) =>
        form.value.businessId === undefined ||
        !factKeys.has(makeBusinessFactKey(form.value.businessId)),
    )
    .map((form) => form.key);
}
