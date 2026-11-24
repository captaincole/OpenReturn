import type { ExceptedFormsFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import type { CategoryItems } from "./partIII.js";
import type { PartIILines, PartILines, PartVIRow, PartVRow } from "./rows.js";

/* The figured Form 8938: page 1 once, and one page 2 for each copy. */
export interface Form8938Figured {
  partV: PartVRow[];
  partVI: PartVIRow[];
  partI?: PartILines;
  partII?: PartIILines;
  /* Line 13: the Part V accounts' tax items. */
  accounts: CategoryItems;
  /* Line 14: the Part VI assets' tax items. */
  otherAssets: CategoryItems;
  /* Part IV, or undefined: no asset is reported on another form, or the counts wait. */
  exceptedForms?: ExceptedFormsFactValue;
  /* The number of page 2s: one, or one for each account, asset or issuer page. */
  copies: number;
}

/*
 * Schedule B Part III from the foreign asset facts: each Part V account on this
 * return, and each Part VI asset answered as a financial account.
 */
export interface ForeignAccountOnReturn {
  country: string | undefined;
  maximumDollars: number;
}

/* Form 1116's slots: Part III credits print only when Schedule 3 line 1 claims the credit. */
export interface Form8938FilingInfo extends BaseFilingInfo, Form1116FilingInfo {
  form8938?: Form8938Figured;
  form8938CopyIndex?: number;
  /* The foreign financial accounts on this return (foreignAccountsOnReturn), whether or not Form 8938 files. */
  foreignAccounts?: ForeignAccountOnReturn[];
}
