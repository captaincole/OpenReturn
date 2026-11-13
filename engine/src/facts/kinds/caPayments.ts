/*
 * Form 540 line 72 answers: California payments toward the 2025 tax, each a total
 * in dollars, category estimated_payments
 * (ca-540-inst-2025::sec::line-72-2025-california-estimated-tax-and-other-payments::b01).
 * Cade records each one only when the taxpayer made that payment. Estimated tax
 * paid for the taxpayer by an estate, trust or S corporation (a K-1) has no key yet.
 */

export const CA_PAYMENT_KEYS = {
  /* 2025 Form 540-ES payments, electronic funds withdrawal, Web Pay or credit card. */
  estimatedTax: "ca_payments.estimated_tax",
  /* The 2024 California overpayment applied to 2025 estimated tax. */
  priorYearOverpaymentApplied: "ca_payments.prior_year_overpayment_applied",
  /* The payment sent with FTB 3519 (the automatic extension). */
  extensionPayment: "ca_payments.extension_payment",
} as const;
