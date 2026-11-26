import type { CaliforniaTrustDistribution } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { PartIIIColumn, PartISectionA, PartITotals, YearColumn } from "./lines.js";

/*
 * One year's column. lines is undefined for a blank column (a "No" year). gap
 * names why the figured lines (the tax and below) are unsupported.
 */
export interface Column {
  year: number;
  lines?: YearColumn;
  gap?: string;
}

export interface PartILines {
  sectionA: PartISectionA;
  /* Line 11, columns 2024 to 2020. */
  line11: number[];
  /* Lines 12 to 21, the three kept years in line 11's order. */
  columns: Column[];
  totals?: PartITotals;
}

/* Part II line 3 (Section A) or line 5 (Section B): the year and its "Yes" or "No". */
export interface ResidentYear {
  year: number;
  resident: boolean;
}

export interface PartIILines {
  section: "A" | "B";
  line1: number;
  /* Section A line 2; Section B line 4: the amount on Schedule CA line 8z column C. */
  share: number;
  /* Section B line 2a and line 3. */
  years?: number;
  averagingFactor?: number;
  residentYears: ResidentYear[];
  /* Lines 4 to 13 (Section B: 6 to 15), one per resident year, in column order. */
  columns: Column[];
  /* Section A line 14, Section B line 16. */
  total?: number;
}

export interface PartIIILines {
  columns: PartIIIColumn[];
  line6: number;
}

export interface Form5870ALines {
  partI?: PartILines;
  partII?: PartIILines;
  /* Part III, only when a recomputed income is over $1,000,000. */
  partIII?: PartIIILines;
}

/*
 * One trust's FTB 5870A:
 * - figured: the lines are known; taxGap names why the tax (Form 540 line 34)
 *   is not, bhstGap why Part III is not;
 * - waits: an answer is missing (missingInputs lists it);
 * - gap: the engine cannot figure the form (the reason).
 */
export type Form5870AResult =
  | { kind: "figured"; lines: Form5870ALines; taxGap?: string; bhstGap?: string }
  | { kind: "waits"; missing: string[] }
  | { kind: "gap"; reason: string };

export interface Form5870ACopy {
  /* The trust fact (trust_accumulation_distribution.<slug>). */
  factKey: string;
  trustName: string;
  trustEin: string;
  beneficiary: "taxpayer" | "spouse";
  california?: CaliforniaTrustDistribution;
  result: Form5870AResult;
}

/* A figured amount for another form, why it is unsupported, "waits" while an answer is missing, or undefined when nothing applies. */
export type Carried = { amount: number } | { gap: string } | "waits" | undefined;

export interface Form5870AFilingInfo extends BaseFilingInfo {
  /* The one FTB 5870A the engine prints; undefined when none files. */
  form5870A?: Form5870ACopy;
  /* Why the printed form's lines are unsupported (more than one trust, a decision with no fact). */
  form5870AGap?: string;
  /* The header's count of trusts. */
  form5870ATrustCount?: number;
  /* Form 540 line 34: Part I line 26, Part II Section A line 14 or Section B line 16. */
  form5870ATax?: Carried;
  /* Form 540 line 62: Part III Section A or Section B line 6. */
  form5870ABehavioralHealthTax?: Carried;
  /* Schedule CA (540) line 8z column C: Part II line 2 or 4, or an untaxed distribution in full. */
  form5870AScheduleCaAddition?: Carried;
}
