import type { Form4255Line } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { PartThreeLines, PropertyLines } from "./lines.js";
import type { PartOneRow } from "./partOne.js";

/* The whole Form 4255, figured from its facts (resolveInfo.ts). */
export interface Form4255Result {
  /* Part I, one entry per line that has a fact. */
  rows: Partial<Record<Form4255Line, PartOneRow>>;
  /* Part I line 3. */
  total: PartOneRow;
  /* Lines 1z and 2z: the form the credit came from. */
  otherForms: Partial<Record<"1z" | "2z", string>>;
  /* Part II, properties A to D in the order recorded. */
  properties: PropertyLines[];
  /* Part II lines 18–20; undefined with no property. */
  partTwoTotals?: { line18: number; line19?: number; line20: number };
  partThree?: PartThreeLines;
}

export interface Form4255FilingInfo extends BaseFilingInfo {
  /* Undefined when the form does not file, has a gap, or waits for a line's fact. */
  form4255?: Form4255Result;
  /* Why every line of the form is unsupported. */
  form4255Gap?: string;
}
