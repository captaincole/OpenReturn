/*
 * FTB 3510 arithmetic, pure: numbers in, line values out. Part I reads the
 * stated 2024 Schedule P figures (CaPriorYearAmtExclusionsFactValue); Part II
 * adds the 2025 amounts the bindings read from Form 540 and Schedule P (540).
 * Rules: the blank form, and ca-3510-inst-2025::sec::specific-line-instructions::b01 to ::b05.
 */

import type {
  CaPriorYearAmtExclusionsFactValue,
  CaPriorYearAmtNonresidentLines,
} from "../../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../../money.js";
import type { FilingStatus } from "../../../values.js";

/*
 * Lines 5 and 6: lines 1 and 3 of the 2024 Exemption Worksheet (2024
 * Schedule P (540) instructions, line 22; the 2024 Schedule P (540) and
 * (540NR) line 22 chart prints the same amounts). The form gives the
 * separate-return pair itself for Schedule P (541) filers: $60,029 and $225,115.
 */
const EXEMPTION_2024: Record<FilingStatus, { amount: number; phaseOutStart: number }> = {
  single: { amount: 90_048, phaseOutStart: 337_678 },
  head_of_household: { amount: 90_048, phaseOutStart: 337_678 },
  married_filing_jointly: { amount: 120_065, phaseOutStart: 450_238 },
  qualifying_surviving_spouse: { amount: 120_065, phaseOutStart: 450_238 },
  married_filing_separately: { amount: 60_029, phaseOutStart: 225_115 },
};

/* Line 4, married/RDP filing separately for 2024 (ca-3510-inst-2025::sec::specific-line-instructions::b02). */
const SEPARATE_RETURN_THRESHOLD = 465_231;
const SEPARATE_RETURN_RATE = 0.25;
const SEPARATE_RETURN_CAP = 60_029;
/* Line 8: "Multiply line 7 by 25%" (the form). */
const PHASE_OUT_RATE = 0.25;
/* Line 9: the child's 2024 earned income plus $9,450 (ca-3510-inst-2025::sec::specific-line-instructions::b03). */
const CHILD_MINIMUM_EXEMPTION = 9_450;
/* Line 11: "Multiply line 10 by 7.00%" (the form). */
const TENTATIVE_MINIMUM_TAX_RATE = 0.07;
/* Lines 21 and 24: four places, "Do not enter more than 1.0000" (the form). */
const RATIO_PLACES = 4;
const RATIO_CAP = 1;

/* Line 1: 2024 Schedule P Part I lines 15 to 18; lines 17 and 18 are printed in parentheses. */
export function line1(answers: CaPriorYearAmtExclusionsFactValue): number {
  const added = sum(answers.taxableIncome, answers.nolDeductions);
  return roundDollars(added - sum(answers.amtiExclusion, answers.itemizedDeductionsLimitation));
}

/*
 * Line 2: 2024 Schedule P Part I lines 1 to 7, 13b and 13i, line 6 (in
 * parentheses) taken away, plus the K-1 (541) and other exclusions
 * (ca-3510-inst-2025::sec::specific-line-instructions::b01, ::b02).
 */
export function line2(answers: CaPriorYearAmtExclusionsFactValue): number {
  const items = answers.exclusionItems;
  const added = sum(
    items.standardDeduction,
    items.medicalAndDental,
    items.propertyTaxes,
    items.homeMortgageInterest,
    items.miscellaneousDeductions,
    items.investmentInterest,
    items.depletion,
    items.pollutionControl,
    answers.otherExclusions,
  );
  return roundDollars(added - sum(items.propertyTaxRefund));
}

/*
 * Line 4: lines 1 and 2 less line 3, at least 0. Married/RDP filing separately
 * for 2024 above $465,231: add 25% of the excess, at most $60,029.
 */
export function line4(
  line1Amount: number,
  line2Amount: number,
  line3Amount: number,
  filingStatus: FilingStatus,
): number {
  const combined = atLeast(0, line1Amount + line2Amount - line3Amount);
  const separate = filingStatus === "married_filing_separately";
  if (!separate || combined <= SEPARATE_RETURN_THRESHOLD) return combined;
  const addition = roundDollars((combined - SEPARATE_RETURN_THRESHOLD) * SEPARATE_RETURN_RATE);
  return combined + Math.min(addition, SEPARATE_RETURN_CAP);
}

export interface SectionALines {
  line1: number;
  line2: number;
  /* Blank when none. */
  line3?: number;
  line4: number;
  /* Lines 5 to 12 are blank when line 4 is 0, and lines 11 and 12 when line 10 is 0 (the form: go to line 13). */
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  /* 2024 Form 540 only; a 2024 Form 540NR goes to Section B after line 11. */
  line12?: number;
  line13?: number;
}

/* Lines 5 to 10: the 2024 exemption, phased out by 25% of line 4 above the worksheet's line 3. */
function exemptionLines(answers: CaPriorYearAmtExclusionsFactValue, amount: number) {
  const { amount: line5, phaseOutStart: line6 } = EXEMPTION_2024[answers.filingStatus];
  const line7 = atLeast(0, amount - line6);
  const line8 = line7 === 0 ? 0 : roundDollars(line7 * PHASE_OUT_RATE);
  const exemption = atLeast(0, line5 - line8);
  const child = answers.childEarnedIncome;
  const line9 =
    child === undefined ? exemption : Math.min(exemption, child + CHILD_MINIMUM_EXEMPTION);
  return { line5, line6, line7, line8, line9, line10: atLeast(0, amount - line9) };
}

/* Section A, lines 1 to 13. */
export function figureSectionA(answers: CaPriorYearAmtExclusionsFactValue): SectionALines {
  const amounts = { line1: line1(answers), line2: line2(answers) };
  const line3 = answers.amtCreditNolDeduction;
  const line4Amount = line4(amounts.line1, amounts.line2, line3 ?? 0, answers.filingStatus);
  const resident = answers.returnForm === "540";
  const base = { ...amounts, line3: line3 || undefined, line4: line4Amount };
  if (line4Amount === 0) return { ...base, line13: resident ? 0 : undefined };
  const exemption = exemptionLines(answers, line4Amount);
  if (exemption.line10 === 0) {
    return { ...base, ...exemption, line13: resident ? 0 : undefined };
  }
  const line11 = roundDollars(exemption.line10 * TENTATIVE_MINIMUM_TAX_RATE);
  if (!resident) return { ...base, ...exemption, line11 };
  const line12 = roundDollars(answers.regularTax ?? 0);
  return { ...base, ...exemption, line11, line12, line13: atLeast(0, line11 - line12) };
}

/* A ratio to four places, at most 1.0000 and at least 0. */
export function ratio(part: number, whole: number): number {
  return Math.min(RATIO_CAP, atLeast(0, roundToPlaces(part / whole, RATIO_PLACES)));
}

export interface SectionBLines {
  line14: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
  line20: number;
  /* Blank when the 2024 return did not itemize (line 20: skip line 21 and line 22). */
  line21?: number;
  line22?: number;
  line23: number;
  line24: number;
  line25: number;
  line26: number;
  line27: number;
}

/*
 * Section B, lines 14 to 27, for a 2024 Form 540NR. Undefined when line 21
 * cannot be figured: line 16 is zero or less, and the form does not say what
 * to divide by (QUESTIONS.md). Line 24 is 0 when line 11 is blank (line 4 or
 * line 10 is 0): no tentative minimum tax on exclusions.
 */
export function figureSectionB(
  sectionA: SectionALines,
  lines: CaPriorYearAmtNonresidentLines,
): SectionBLines | undefined {
  const line14 = sectionA.line4;
  const line15 = roundDollars(lines.totalAmtItemizedDeductions);
  const line16 = line14 + line15;
  const line17 = roundDollars(lines.line28);
  // ca-3510-inst-2025::sec::specific-line-instructions::b04: lines 29a and 29h, and the K-1 (541) line 12e column (e) items.
  const line18 = roundDollars(
    sum(lines.investmentInterest, lines.depletion, lines.otherExclusions),
  );
  const line20 = line17 + line18;
  let prorated: { line21?: number; line22?: number } = {};
  if (lines.itemized) {
    if (line16 <= 0) return undefined;
    const line21 = ratio(line20, line16);
    prorated = { line21, line22: roundDollars(line15 * line21) };
  }
  const line23 = line20 - (prorated.line22 ?? 0);
  const line11 = sectionA.line11 ?? 0;
  const line24 = line11 === 0 ? 0 : ratio(line11, sectionA.line4);
  const line25 = roundDollars(line23 * line24);
  const line26 = roundDollars(lines.regularTax);
  const line27 = atLeast(0, line25 - line26);
  return {
    ...{ line14, line15, line16, line17, line18, line20, ...prorated },
    ...{ line23, line24, line25, line26, line27 },
  };
}

/*
 * Line 29: line 13, or Section B line 27 for a 2024 Form 540NR. With no 2024
 * AMT there is no AMT on exclusions: 0. Undefined while the Part I figures
 * wait, or when Section B has no rule (line 16 at 0 or less).
 */
export function line29(
  amt: number,
  answers: CaPriorYearAmtExclusionsFactValue | undefined,
): number | undefined {
  if (amt <= 0) return 0;
  if (answers === undefined) return undefined;
  const sectionA = figureSectionA(answers);
  if (answers.returnForm !== "540nr") return sectionA.line13;
  const nonresident = answers.nonresident;
  return nonresident === undefined ? undefined : figureSectionB(sectionA, nonresident)?.line27;
}

/*
 * Line 32 from the stated answers alone (Part I and lines 28 to 31 read no
 * 2025 form); undefined while an answer waits.
 */
export function line32FromAnswers(
  amt: number | undefined,
  carryover: number | undefined,
  answers: CaPriorYearAmtExclusionsFactValue | undefined,
): number | undefined {
  if (amt === undefined || carryover === undefined) return undefined;
  const exclusions = line29(atLeast(0, amt), answers);
  if (exclusions === undefined) return undefined;
  return figureCreditAvailable(atLeast(0, amt), exclusions, atLeast(0, carryover)).line32;
}

/* Part II lines 28 to 32: the AMT on deferral items, plus the carryover. */
export interface CreditAvailableLines {
  line28: number;
  line29: number;
  line30: number;
  line31: number;
  line32: number;
}

/* Line 30 may be negative ("enter as a negative amount"); line 32 combines it with line 31. */
export function figureCreditAvailable(
  line28: number,
  line29: number,
  line31: number,
): CreditAvailableLines {
  const line30 = line28 - line29;
  return { line28, line29, line30, line31, line32: line30 + line31 };
}

/* Part II lines 33 to 39, figured only when line 32 is above 0 (ca-3510-inst-2025::sec::specific-line-instructions::b04). */
export interface CreditAllowedLines {
  line33: number;
  line34: number;
  line35: number;
  line36: number;
  line37: number;
  line38: number;
  line39: number;
}

export function figureCreditAllowed(
  line32: number,
  line33: number,
  line34: number,
  line36: number,
): CreditAllowedLines {
  const line35 = line33 - line34;
  const line37 = atLeast(0, line35 - line36);
  const line38 = Math.min(line32, line37);
  return { line33, line34, line35, line36, line37, line38, line39: line32 - line38 };
}

/* Lines 21 and 24 print one digit, the point and four places ("0.4321"). */
export function ratioText(value: number): string {
  const tenThousandths = roundDollars(value * 10 ** RATIO_PLACES);
  const places = tenThousandths % 10 ** RATIO_PLACES;
  const whole = (tenThousandths - places) / 10 ** RATIO_PLACES;
  return `${whole}.${String(places).padStart(RATIO_PLACES, "0")}`;
}
