/*
 * One fact per Form 1099-G (certain government payments). Box 1 goes on
 * Schedule 1 line 7 (irs-1040-inst-2025::sec::line-7::b01) and on Schedule CA
 * (540) line 7 column B, as California does not tax it. Box 4 goes on Form 1040
 * line 25b. The other boxes are held as printed; no line reads them yet.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface GovernmentPaymentsFactValue {
  payerName: string;
  payerTin?: string;
  accountNumber?: string;
  box1?: number; // Unemployment compensation
  box2?: number; // State or local income tax refunds, credits, or offsets
  box3?: string; // Box 2 amount is for tax year
  box4?: number; // Federal income tax withheld
  box5?: number; // RTAA payments
  box6?: number; // Taxable grants
  box7?: number; // Agriculture payments
  box8?: boolean; // Box 2 is trade or business income (checkbox)
  box9?: number; // Market gain
  box10a?: string; // State
  box10b?: string; // State identification no.
  box11?: number; // State income tax withheld
}

const GOVERNMENT_PAYMENTS_CATEGORY = "other";

/* One payer can send several 1099-Gs (one per spouse or account), so the key also holds an id for the form. */
export function makeGovernmentPaymentsFactKey(payerSlug: string, formId: string): string {
  return `payer.${payerSlug}.1099g.${formId}`;
}

export function isGovernmentPaymentsFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "payer" && parts[2] === "1099g";
}

export function getGovernmentPaymentsFacts(
  facts: ReadonlyArray<FactRow>,
): GovernmentPaymentsFactValue[] {
  return facts
    .filter(
      (fact) =>
        fact.category === GOVERNMENT_PAYMENTS_CATEGORY && isGovernmentPaymentsFactKey(fact.key),
    )
    .map((fact) => fact.value as GovernmentPaymentsFactValue);
}
