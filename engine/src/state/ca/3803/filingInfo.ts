import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { SSN } from "../../../values.js";
import type { Form3803Lines } from "./lines.js";

/* One child's FTB 3803: the lines, or why they are not figured. */
export interface Form3803Child {
  /* The child's investment income fact. */
  factKey: string;
  /* The header's child name and SSN, from the dependent fact. */
  name?: string;
  ssn?: SSN;
  /* The lines; undefined while an answer is missing or when the child fails a condition. */
  lines?: Form3803Lines;
  /* Why the election or the engine cannot figure this child's form (one sentence). */
  gap?: string;
  /* The answers this child's form waits for (fact keys). */
  missing: string[];
}

/* Undefined when no FTB 3803 files; "waits" while an answer is missing; a gap's reason otherwise. */
export type Form3803Totals =
  | {
      kind: "figured";
      /* Line 6, added across the forms: Schedule CA (540) line 8z. */
      line6: number;
      /* Line 9, added across the forms: Form 540 line 31. */
      line9: number;
    }
  | { kind: "waits" }
  | { kind: "unsupported"; reason: string };

/*
 * Schedule CA (540) line 8z, columns B and C: the difference between the
 * children's income on the California return and on the federal return.
 * Undefined when neither return reports a child's income.
 */
export type ChildIncomeLine8z =
  | {
      kind: "figured";
      subtraction?: number;
      addition?: number;
      /* A child's capital gain distributions reach line 6 on either return. */
      childCapitalGainDistributions: boolean;
    }
  | { kind: "waits" }
  | { kind: "unsupported"; reason: string };

export interface Form3803FilingInfo extends BaseFilingInfo {
  /* One FTB 3803 per child with an investment income fact (ca-3803-inst-2025::sec::c-how-to-make-the-election::b01). */
  form3803Children?: Form3803Child[];
  /* Which child this copy is for (renderCopies sets it); absent means the first. */
  form3803CopyIndex?: number;
  form3803Totals?: Form3803Totals;
  childIncomeLine8z?: ChildIncomeLine8z;
}
