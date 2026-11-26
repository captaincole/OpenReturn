import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Line18Row, PassThroughCreb } from "./lines.js";

/* One row of Part III line 13: one Form 1097-BTC. The amount keeps its cents. */
export interface PartIIIRow {
  filerName: string;
  filerTin?: string;
  uniqueIdentifier?: string;
  amount: number;
}

/*
 * One row of Part IV line 18. A held bond fills every column; a credit from a
 * pass-through entity fills only column (f) ("enter the amount of the credit
 * in column (f)", irs-8912-inst-2025::sec::line-18-column-a::b04).
 */
export interface PartIVRow {
  identifier?: string;
  columns?: Line18Row;
  f: number;
}

/* Lines 18 to 20 of one Part IV, once every input is there. */
export interface PartIVLines {
  rows: PartIVRow[];
  line19: number;
  line20: number;
}

/* One Part IV: a bond, or a credit an entity passed through with no Form 1097-BTC. */
export interface PartIVForm {
  factKey: string;
  issuer: string;
  issuerEin: string;
  issueDate?: string;
  maturityDate?: string;
  disposedDate?: string;
  /* Undefined while a row's credit rate is missing (the form's missingInputs lists the fact). */
  lines?: PartIVLines;
}

/* The deemed interest of a held bond no Form 1099-INT reports: a Schedule B line 1 row. */
export interface BondCreditInterest {
  payerName: string;
  /* Undefined while the bond does not say whether a Form 1099-INT reports it, or with a gap. */
  amount: number | undefined;
  /* Why the engine cannot figure the interest: the Schedule B row and its total are unsupported. */
  gap?: string;
}

export interface Form8912Inputs {
  partIII: PartIIIRow[];
  partIV: PartIVForm[];
  /* Line 3, whole dollars; undefined with no carryforward fact. */
  carryforward?: number;
  /*
   * The interests in a pass-through entity that passed a CREB credit on, for
   * the line 12 formula; undefined while one lacks its taxable income or the
   * answer whether its Form 1097-BTC came from a pass-through entity.
   */
  passThroughCrebs?: PassThroughCreb[];
}

export interface Form8912FilingInfo extends BaseFilingInfo {
  form8912?: Form8912Inputs;
  /* Which copy is printing: copy n prints the nth Part IV and the nth 20 rows of Part III. */
  form8912CopyIndex?: number;
}
