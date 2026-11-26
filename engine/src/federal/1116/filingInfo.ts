import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form461FilingInfo } from "../461/filingInfo.js";
import type { Form8978FilingInfo } from "../8978/filingInfo.js";
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
  /* Why a K-1's foreign taxes cannot be read (sources.ts k1ForeignTax): Schedule 3 line 1 and Form 1116 are gaps. */
  k1Gap?: string;
  /* Why a foreign-currency 1099-INT or 1099-DIV fact cannot be converted (incomeInDollars.ts): the same lines are gaps. */
  currencyGap?: string;
  /*
   * A K-1 with foreign taxes waits on an answer, or a foreign-currency 1099-INT
   * or 1099-DIV fact waits for its exchange rate: Schedule 3 line 1 and Form 1116 wait too.
   */
  taxesWaiting?: boolean;
  /* Why line 12 cannot be figured (excluded foreign income, Form 2555 or 4563). */
  line12Gap?: string;
  /* Why line 16 cannot be figured (a loss account from an earlier year); Form 461 is read in copies.ts. */
  line16Gap?: string;
  /* Why line 22 cannot be figured (Form 5471: an excess limitation account). */
  line22Gap?: string;
  /* Line h: the country of residence; undefined with no home address. */
  residentOf?: string;
}

/*
 * Form 461's slots: line 16 reads its line 16 (copies.ts). Form 8978's: line
 * 20 is lower by a negative line 14, and so is Form 6251 line 10, which reads
 * these slots too.
 */
export interface Form1116FilingInfo
  extends BaseFilingInfo, Pick<Form461FilingInfo, "form461">, Pick<Form8978FilingInfo, "form8978"> {
  foreignTax?: ForeignTaxInfo;
  /* The copy being rendered; 0 (the summary copy) when absent. */
  form1116CopyIndex?: number;
  /* Read from Form 1040's and Schedule C's resolvers (same slots, declared here to keep imports one-way). */
  useItemizedDeductions?: boolean;
  form4972Tax?: number;
  businesses?: ReadonlyArray<unknown>;
}
