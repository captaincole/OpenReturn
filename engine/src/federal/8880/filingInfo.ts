import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import type { Form8978FilingInfo } from "../8978/filingInfo.js";
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

/*
 * Form 1116's slots: the worksheet asks foreignTaxCreditGap whether Schedule 3
 * line 1 is a gap, and Form 8978's whether line 6l is.
 */
export interface Form8880FilingInfo
  extends BaseFilingInfo, Form1116FilingInfo, Pick<Form8978FilingInfo, "form8978"> {
  form8880Columns?: { you: Form8880Column; spouse: Form8880Column };
}
