import type { BaseFilingInfo } from "../../filingInfo.js";
import type { SSN } from "../../values.js";
import type { Form8814Lines } from "./lines.js";

/* One child's Form 8814: the lines, or why they are not figured. */
export interface Form8814Child {
  /* The child's investment income fact. */
  factKey: string;
  /* Header A and B, from the dependent fact. */
  name?: string;
  ssn?: SSN;
  /* The lines; undefined while an answer is missing or when the child fails a condition. */
  lines?: Form8814Lines;
  /* Why the election or the engine cannot figure this child's form (one sentence). */
  gap?: string;
  /* The answers this child's form waits for (fact keys). */
  missing: string[];
  /* The fact's Alaska Permanent Fund dividends and private activity bond interest (Form 4952, 6251, 8960). */
  alaskaPermanentFundDividends?: number;
  privateActivityBondInterest?: number;
}

/* The amounts every Form 8814 sends to other forms, added across the copies. */
export interface Form8814Figured {
  kind: "figured";
  /* Line 9: 1040 lines 3a and 3b (Schedule B line 5 when it files), one entry per child. */
  line9ByChild: number[];
  line9: number;
  /* Line 10: Schedule D line 13, or 1040 line 7a without Schedule D. */
  line10: number;
  /* Line 12: Schedule 1 line 8z. */
  line12: number;
  /* Line 15: 1040 line 16. */
  line15: number;
  /* Line 1b: Pub. 596 Worksheet 1 line 2. */
  line1b: number;
  /* The private activity bond part of line 1b, cents kept: Form 6251 line 2g. */
  privateActivityBondInterest: number;
  /* Line 12 less the Alaska Permanent Fund dividend part: Form 4952 line 4a, Form 8960 line 7. */
  line12LessAlaskaDividends: number;
  /* Pub. 596 Worksheet 1 line 4. */
  eicWorksheet1Line4: number;
}

/* Undefined when no Form 8814 files; "waits" while a child's answer is missing; a gap's reason otherwise. */
export type Form8814Totals =
  Form8814Figured | { kind: "waits" } | { kind: "unsupported"; reason: string };

export interface Form8814FilingInfo extends BaseFilingInfo {
  /* One Form 8814 per child with an investment income fact (irs-8814-inst-2025::sec::general-instructions::b02). */
  form8814Children?: Form8814Child[];
  /* Which child this copy is for (renderCopies sets it); absent means the first. */
  form8814CopyIndex?: number;
  form8814Totals?: Form8814Totals;
}
