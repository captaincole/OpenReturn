import type { IraOwner } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EarlyDistributionRow } from "./lines.js";

/* One person's early distributions: Form 5329 Part I, one form per person. */
export interface EarlyDistributionPerson {
  owner: IraOwner;
  /* The person's 1099-Rs that put an amount above 0 on line 1. */
  rows: EarlyDistributionRow[];
  /* Why the engine cannot figure line 1 for this person (lines 1–4 are unsupported). */
  gap?: string;
  /* An answer line 1 needs is not in yet (Form 8606 asks for it): lines 1–4 wait. */
  pending: boolean;
  /* Form 5329 must file for this person: an exception or a code S row (not the Schedule 2 path). */
  needsForm: boolean;
  /* The 1099-R facts behind the rows. */
  factKeys: string[];
}

export interface Form5329FilingInfo extends BaseFilingInfo {
  /* Each person with an early distribution in income, or one the engine cannot figure. */
  earlyDistributionPeople?: EarlyDistributionPerson[];
  /* One Form 5329 per person (irs-5329-inst-2025::sec::specific-instructions::b01). */
  form5329Filers?: EarlyDistributionPerson[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form5329CopyIndex?: number;
  /*
   * No Form 5329 files, and Schedule 2 line 8 takes the 10% directly with its
   * box checked (irs-1040-inst-2025::sec::line-8::b01–b02).
   */
  earlyDistributionTaxWithoutForm?: boolean;
}
