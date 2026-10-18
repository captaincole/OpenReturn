/*
 * Social Security Benefits Worksheet — Lines 6a and 6b.
 *
 * Implements the 18-line worksheet from the 2025 Form 1040
 * Instructions (page 32). Returns the taxable amount (line 18, the
 * 1040 line 6b value) and every intermediate line, so callers can audit
 * or test any step.
 *
 * Corpus section:
 * irs-1040-inst-2025::sec::social-security-benefits-worksheet-lines-6a-and-6b.
 *
 * Not modeled: the lump-sum election (line 6c, Pub. 915) and the
 * Exception cases that send the taxpayer to Pub. 915 instead.
 */

import { atLeast, roundDollars } from "../money.js";
import type { FilingStatus } from "../values.js";

export interface SocialSecurityInputs {
  /** Line 1: total of box 5 of all SSA-1099 forms (RRB-1099 is not supported). */
  benefits: number;
  /** Line 3: 1040 lines 1z + 2b + 3b + 4b + 5b + 7a + 8. */
  otherIncome: number;
  /** Line 4: 1040 line 2a (tax-exempt interest). */
  taxExemptInterest: number;
  /** Line 6: Schedule 1 lines 11 through 20, plus 23 and 25. */
  adjustments: number;
  filingStatus: FilingStatus;
  /** Married filing separately only: lived apart from the spouse all year. */
  livedApartAllYear?: boolean;
}

export interface SocialSecurityBreakdown {
  line2: number;
  line5: number;
  line7: number;
  /** Undefined when MFS lived with the spouse (lines 8–15 are skipped). */
  line8?: number;
  line16: number;
  line17: number;
  /** Taxable benefits: 1040 line 6b. */
  taxable: number;
}

/* Lines 8 and 10: the base and adjusted base amounts. */
function bases(i: SocialSecurityInputs): { base: number; adjusted: number } | undefined {
  if (i.filingStatus === "married_filing_jointly") return { base: 32000, adjusted: 12000 };
  if (i.filingStatus === "married_filing_separately" && i.livedApartAllYear !== true) {
    return undefined;
  }
  return { base: 25000, adjusted: 9000 };
}

export function socialSecurityTaxable(i: SocialSecurityInputs): SocialSecurityBreakdown {
  const line2 = roundDollars(i.benefits * 0.5);
  const line5 = line2 + i.otherIncome + i.taxExemptInterest;
  const line17 = roundDollars(i.benefits * 0.85);
  // Line 7: none taxable unless line 6 is less than line 5.
  if (!(i.adjustments < line5)) {
    return { line2, line5, line7: 0, line16: 0, line17, taxable: 0 };
  }
  const line7 = line5 - i.adjustments;
  const b = bases(i);
  if (b === undefined) {
    // MFS and lived with the spouse: skip lines 8–15; line 16 = line 7 × 85%.
    const line16 = roundDollars(line7 * 0.85);
    return { line2, line5, line7, line16, line17, taxable: Math.min(line16, line17) };
  }
  // Line 9: none taxable unless line 8 is less than line 7.
  if (!(b.base < line7)) {
    return { line2, line5, line7, line8: b.base, line16: 0, line17, taxable: 0 };
  }
  const line9 = line7 - b.base;
  const line11 = atLeast(0, line9 - b.adjusted);
  const line12 = Math.min(line9, b.adjusted);
  const line13 = roundDollars(line12 * 0.5);
  const line14 = Math.min(line2, line13);
  const line15 = roundDollars(line11 * 0.85);
  const line16 = line14 + line15;
  return { line2, line5, line7, line8: b.base, line16, line17, taxable: Math.min(line16, line17) };
}
