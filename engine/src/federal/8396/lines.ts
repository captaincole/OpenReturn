import type { MortgageCreditCertificateFactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";

/* Line 2: "The certificate credit rate cannot be less than 10% or more than 50%" (irs-8396-form-2025::sec::line-2::b01). */
export const MIN_CREDIT_RATE_PERCENT = 10;
export const MAX_CREDIT_RATE_PERCENT = 50;

/*
 * Line 3: above a 20% rate, "do not enter more than $2,000 on line 3"; a
 * co-owner (not a joint-return spouse) gets the $2,000 in proportion to the
 * interest held (irs-8396-form-2025::sec::line-3::b01;
 * irs-pub-530-2025::sec::dividing-the-credit::b01).
 */
export const LIMITED_RATE_ABOVE_PERCENT = 20;
export const HIGH_RATE_CREDIT_LIMIT = 2_000;

const PERCENT = 100;

export const REFINANCE_STATEMENT =
  "The original and reissued certificates have different credit rates in 2025: lines 1 to 3 need an attached statement with two calculations (irs-8396-form-2025::sec::refinanced-mortgage::b02), which the engine does not make.";

/*
 * Line 1 (irs-8396-form-2025::sec::specific-instructions::b01): the interest on
 * the certified indebtedness. A loan larger than the certified indebtedness
 * counts only that fraction of the interest: certified indebtedness over the
 * original loan amount (irs-pub-530-2025::sec::figuring-the-credit::b01:
 * $7,500 × $100,000 / $125,000 = $6,000).
 */
export function certifiedInterest(certificate: MortgageCreditCertificateFactValue): number {
  const { interestPaid, certifiedIndebtedness, originalLoanAmount } = certificate;
  const fraction =
    originalLoanAmount > certifiedIndebtedness ? certifiedIndebtedness / originalLoanAmount : 1;
  return roundDollars(interestPaid * fraction);
}

/* Line 2 as the form prints it, before its printed "%": 20 → "20". */
export const creditRateText = (certificate: MortgageCreditCertificateFactValue): string =>
  String(certificate.creditRatePercent);

/* The rate the instructions allow, else the reason line 3 cannot be figured. */
export function rateProblem(
  certificate: MortgageCreditCertificateFactValue,
): Unsupported | undefined {
  const rate = certificate.creditRatePercent;
  if (rate >= MIN_CREDIT_RATE_PERCENT && rate <= MAX_CREDIT_RATE_PERCENT) return undefined;
  return unsupported(
    `The certificate credit rate is ${rate}%: a qualified certificate has a rate of 10% to 50% (irs-8396-form-2025::sec::line-2::b01). Check the rate on the certificate.`,
  );
}

/* The $2,000 limit, or the filer's share of it when another person holds an interest. */
export function highRateLimit(certificate: MortgageCreditCertificateFactValue): number {
  const share = certificate.ownershipShare ?? 1;
  return roundDollars(HIGH_RATE_CREDIT_LIMIT * share);
}

/*
 * Line 3: line 1 × line 2 (nearest dollar); above 20%, at most the $2,000 limit.
 * A reissued certificate can give no more than the original one would
 * (irs-8396-form-2025::sec::refinanced-mortgage::b01): the smaller amount.
 */
export function line3Credit(
  certificate: MortgageCreditCertificateFactValue,
  line1: number,
): number | Unsupported {
  const problem = rateProblem(certificate);
  if (problem) return problem;
  if (certificate.reissued?.ratesDifferThisYear === true) return unsupported(REFINANCE_STATEMENT);
  const rate = certificate.creditRatePercent;
  const product = roundDollars((line1 * rate) / PERCENT);
  const limited =
    rate > LIMITED_RATE_ABOVE_PERCENT ? Math.min(product, highRateLimit(certificate)) : product;
  const original = certificate.reissued?.creditUnderOriginalCertificate;
  return typeof original === "number" ? Math.min(limited, roundDollars(original)) : limited;
}

/* Lines 1 and 3 from the certificate, or why line 3 cannot be figured. */
export function certificateCredit(
  certificate: MortgageCreditCertificateFactValue,
): { line1: number; line3: number } | Unsupported {
  const line1 = certifiedInterest(certificate);
  const line3 = line3Credit(certificate, line1);
  return typeof line3 === "number" ? { line1, line3 } : line3;
}

/*
 * The Line 8 Credit Limit Worksheet (irs-8396-form-2025::sec::line-8-credit-limit-worksheet::b01):
 * line 1 is Form 1040 line 18, line 2 the credits figured before this one,
 * line 3 their difference; zero or less enters -0-.
 */
export interface CreditLimit {
  line1: number;
  line2: number;
  line3: number;
}

export function creditLimit(form1040Line18: number, otherCredits: number): CreditLimit {
  return {
    line1: form1040Line18,
    line2: otherCredits,
    line3: atLeast(0, form1040Line18 - otherCredits),
  };
}

/* Lines 3 through 6, the inputs of Part I's totals. Lines 4 to 6 are 0 when blank. */
export interface CreditInputs {
  line3: number;
  line4: number;
  line5: number;
  line6: number;
}

/* Line 7: add lines 3 through 6 (irs-8396-form-2025::sec::part-i-current-year-mortgage-interest-credit::b01). */
export const totalCredit = (inputs: CreditInputs): number =>
  sum(inputs.line3, inputs.line4, inputs.line5, inputs.line6);

/* Line 9: the smaller of line 7 or line 8 (…::b02). */
export const currentYearCredit = (line7: number, line8: number): number => Math.min(line7, line8);

export interface PartIIResult {
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  line16: number;
  line17: number;
}

/*
 * Part II, "Complete only if line 9 is less than line 7"
 * (irs-8396-form-2025::sec::part-i-current-year-mortgage-interest-credit::b02).
 * The current-year credit is used first, then the prior years from the earliest
 * (irs-8396-form-2025::sec::part-ii-mortgage-interest-credit-carryforward-to-2026::b01):
 * the 2022 credit (line 4) ends with 2025, so it has no carryforward line.
 */
export function partII(inputs: CreditInputs, line9: number): PartIIResult | undefined {
  const line7 = totalCredit(inputs);
  if (line9 >= line7) return undefined;
  const line10 = sum(inputs.line3, inputs.line4);
  const line11 = line7;
  const line12 = Math.max(line9, line10);
  const line13 = line11 - line12;
  const line14 = Math.min(inputs.line6, line13);
  const line15 = line13 - line14;
  const line16 = Math.min(inputs.line5, line15);
  const line17 = atLeast(0, inputs.line3 - line9);
  return { line10, line11, line12, line13, line14, line15, line16, line17 };
}
