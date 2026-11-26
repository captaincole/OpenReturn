/*
 * FTB 5805F answers: what a California farmer or fisherman paid, and when,
 * toward the one estimated tax payment due January 15, 2026
 * (ca-5805f-inst-2025::sec::c-required-estimate-payment::b01). Category
 * estimated_payments. The 2025 Form 540-ES total is CA_PAYMENT_KEYS.estimatedTax.
 */

export const CA_FARMER_ESTIMATED_TAX_KEYS = {
  /*
   * Line 11: the part of the 2025 Form 540-ES payments (CA_PAYMENT_KEYS.estimatedTax)
   * made on or before January 15, 2026, a number. Asked when that total is above 0.
   */
  estimatedTaxByJanuary15: "ca_farmer_estimated_tax.estimated_tax_by_january_15",
  /*
   * Exception 1: true when the 2025 return is filed and the full tax due is paid
   * by March 2, 2026 (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01).
   * Asked whenever FTB 5805F files.
   */
  filedAndPaidByMarch2: "ca_farmer_estimated_tax.filed_and_paid_by_march_2",
  /*
   * Line 13: the day the line 12 underpayment was paid in full, "YYYY-MM-DD".
   * Recorded only when it was paid before April 15, 2026; absent, line 13 is
   * April 15, 2026, the latest day the line allows.
   */
  underpaymentPaidOn: "ca_farmer_estimated_tax.underpayment_paid_on",
  /* Line 16: a request to waive part or all of the penalty (CaFarmerWaiverFactValue). */
  waiver: "ca_farmer_estimated_tax.waiver",
} as const;

/*
 * Line 16 and General Information E (ca-5805f-inst-2025::sec::e-waiver-of-the-penalty::b01):
 * a casualty, disaster or other unusual circumstance, or a retirement after age
 * 62 or a disability in 2024 or 2025 with reasonable cause.
 */
export interface CaFarmerWaiverFactValue {
  /* The amount to waive, written in parentheses next to line 16. */
  amount: number;
  /* The explanation printed below line 16. */
  explanation: string;
}

export function isCaFarmerWaiver(value: unknown): value is CaFarmerWaiverFactValue {
  if (typeof value !== "object" || value === null) return false;
  const waiver = value as Partial<CaFarmerWaiverFactValue>;
  return (
    typeof waiver.amount === "number" &&
    Number.isFinite(waiver.amount) &&
    waiver.amount >= 0 &&
    typeof waiver.explanation === "string"
  );
}
