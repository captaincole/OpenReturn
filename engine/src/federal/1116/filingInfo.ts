import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ForeignTaxSource } from "./sources.js";

/* The categories the engine figures a Form 1116 for. */
export type Form1116Category = "passive" | "general";

export interface Form1116CategoryInfo {
  category: Form1116Category;
  sources: ForeignTaxSource[];
  /* Line 10: the stated carryover; undefined while the answer is missing. */
  carryover: number | undefined;
}

export interface ForeignTaxInfo {
  sources: ForeignTaxSource[];
  /* The election applies: Schedule 3 line 1 is the credit with no Form 1116. */
  election: boolean;
  /* One Form 1116 for each category, passive first; empty when the form does not file. */
  categories: Form1116CategoryInfo[];
  /* Part II box (k) instead of (j). */
  claimAccrued: boolean;
  /* Why the engine cannot figure any Form 1116 (a category it does not do, no source). */
  formGap?: string;
  /* Why line 12 cannot be figured (excluded foreign income, Form 2555 or 4563). */
  line12Gap?: string;
  /* Why line 16 cannot be figured (a loss account from an earlier year, Form 461). */
  line16Gap?: string;
  /* Why line 22 cannot be figured (Form 5471: an excess limitation account). */
  line22Gap?: string;
  /* Line h: the country of residence; undefined with no home address. */
  residentOf?: string;
}

export interface Form1116FilingInfo extends BaseFilingInfo {
  foreignTax?: ForeignTaxInfo;
  /* The copy being rendered; 0 (the summary copy) when absent. */
  form1116CopyIndex?: number;
  /* Read from Form 1040's and Schedule C's resolvers (same slots, declared here to keep imports one-way). */
  useItemizedDeductions?: boolean;
  form4972Tax?: number;
  businesses?: ReadonlyArray<unknown>;
}
