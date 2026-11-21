import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ColumnInputs } from "./lines.js";

/*
 * One column of lines 1 through 6:
 * - counts: the person can take the credit and made a contribution;
 * - waits: an answer is missing (the form's missingInputs lists it);
 * - blank: the column is not completed (not a joint return, the person cannot
 *   take the credit, or made no contribution).
 */
export type Form8880Column =
  { kind: "counts"; inputs: ColumnInputs } | { kind: "waits" } | { kind: "blank" };

export interface Form8880FilingInfo extends BaseFilingInfo {
  form8880Columns?: { you: Form8880Column; spouse: Form8880Column };
  /* A 1099-INT or 1099-DIV shows foreign tax paid: Schedule 3 line 1 may hold a credit. */
  form8880ForeignTaxPaid?: boolean;
}
