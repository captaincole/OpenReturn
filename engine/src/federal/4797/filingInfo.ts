import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Section1250Property } from "../../worksheets/unrecapturedSection1250.js";
import type { Form4797Activities } from "./activities.js";
import type { Form4797Lines } from "./lines.js";

export interface Form4797FilingInfo extends BaseFilingInfo {
  /* The figured form; undefined with no sale or recapture fact, or with a gap. */
  form4797?: Form4797Lines;
  /* Why no line of the form can be figured (a malformed fact, a sale with no price). */
  form4797Gap?: string;
  /*
   * Why lines 7–12, 17 and 18b and what they send on (Schedule D line 11,
   * Schedule 1 line 4) are a gap: a K-1 section 1231 item, or Form 4684, 6252
   * or 8824 filing.
   */
  form4797SummaryGap?: string;
  /* Why a Form 6252 amount for line 4, 10 or 15 is not known (a sale's gap); the summary is a gap too. */
  form4797InstallmentGaps?: { line4?: string; line10?: string; line15?: string };
  /* Which copy this render prints (renderCopies sets it; copies.ts); absent means the first. */
  form4797CopyIndex?: number;
  /* Why a Part IV column's line 35 cannot reach its schedule. */
  form4797PartIVGap?: { section179?: string; section280f?: string };
  /* The section 1250 properties of Part III, for the Unrecaptured Section 1250 Gain Worksheet lines 1–3. */
  form4797Section1250?: Section1250Property[];
  /* The amounts of each activity that sold property, for QBI and Form 8960 line 5b; undefined when the form does not file. */
  form4797Activities?: Form4797Activities;
}
