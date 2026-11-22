/*
 * Form 8396, Mortgage Interest Credit: one qualified Mortgage Credit Certificate
 * (MCC) from a state or local government
 * (irs-8396-form-2025::sec::who-can-claim-the-credit::b01), and the credit
 * carried forward from the 2024 Form 8396 (lines 4 through 6).
 *
 * The certificate fact holds what the MCC prints (issuer, number, date, credit
 * rate, certified indebtedness), the loan's original amount and the interest
 * paid on the loan in 2025 (in most cases Form 1098 box 1,
 * irs-8396-form-2025::sec::specific-instructions::b01). One certificate is
 * supported: the form has room for one.
 */

export interface ReissuedCertificate {
  /*
   * The credit the original MCC would allow this year: the interest scheduled on
   * the original mortgage times the original rate. It limits line 3
   * (irs-8396-form-2025::sec::refinanced-mortgage::b01).
   */
  creditUnderOriginalCertificate: number;
  /* The original and reissued certificates have different rates in 2025 (a statement is attached). */
  ratesDifferThisYear?: boolean;
}

export interface MortgageCreditCertificateFactValue {
  issuerName: string;
  certificateNumber?: string;
  /* MM/DD/YYYY as the certificate prints it. */
  issueDate?: string;
  /* The certificate credit rate in percent: 20 for 20%. Not the loan's interest rate. */
  creditRatePercent: number;
  /* The certified indebtedness amount on the MCC. */
  certifiedIndebtedness: number;
  /* The original amount of the mortgage loan the MCC covers. */
  originalLoanAmount: number;
  /*
   * Interest paid in 2025 on that loan (in most cases Form 1098 box 1). When
   * someone other than a joint-return spouse also holds an interest in the home,
   * only the filer's share of the interest.
   */
  interestPaid: number;
  /*
   * The filer's share (0 to 1) of the interest in the home when someone other than
   * a joint-return spouse also holds one; absent means the filer holds it all.
   * It divides the $2,000 limit (irs-pub-530-2025::sec::dividing-the-credit::b01).
   */
  ownershipShare?: number;
  /* The main home's address, only when it differs from the return's address. */
  homeAddress?: string;
  /* Set when the mortgage was refinanced and the MCC reissued. */
  reissued?: ReissuedCertificate;
}

export const MORTGAGE_CREDIT_KEYS = {
  certificate: "mortgage.credit_certificate",
  /* Line 4: line 16 of the 2024 Form 8396. */
  carryforwardFrom2022: "prior_year.mortgage_credit_carryforward_2022",
  /* Line 5: line 14 of the 2024 Form 8396. */
  carryforwardFrom2023: "prior_year.mortgage_credit_carryforward_2023",
  /* Line 6: line 17 of the 2024 Form 8396. */
  carryforwardFrom2024: "prior_year.mortgage_credit_carryforward_2024",
} as const;

export const MORTGAGE_CREDIT_CARRYFORWARD_KEYS = [
  MORTGAGE_CREDIT_KEYS.carryforwardFrom2022,
  MORTGAGE_CREDIT_KEYS.carryforwardFrom2023,
  MORTGAGE_CREDIT_KEYS.carryforwardFrom2024,
] as const;

/* The certificate fact, by key (the resolver's factByKey). */
export function getMortgageCreditCertificate(
  factByKey: ReadonlyMap<string, unknown>,
): MortgageCreditCertificateFactValue | undefined {
  const value = factByKey.get(MORTGAGE_CREDIT_KEYS.certificate);
  return typeof value === "object" && value !== null
    ? (value as MortgageCreditCertificateFactValue)
    : undefined;
}
