/*
 * The foreign tax credit on Schedule 3 line 1: Form 1116 line 35, or the
 * election's amount with no Form 1116. The credit forms that subtract Schedule 3
 * line 1 (Forms 8880, 8863, 8936, 8396, 6251) call foreignTaxCreditGap to tell
 * a gap from "no credit", since a gap reads as blank through the accessor.
 */

import { unsupported } from "../../types.js";
import { form1116Set, isGap, type Value } from "./copies.js";
import type { Form1116FilingInfo } from "./filingInfo.js";
import { electionCredit } from "./lines.js";
import { regularTaxForCredit, type Accessor } from "./returnAmounts.js";

/*
 * Schedule 3 line 1. The election enters "the smaller of (a) your total foreign
 * tax, or (b) your regular tax" (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b03).
 * Form 1116: line 35 ("Enter here and on Schedule 3 (Form 1040), line 1").
 * Blank with no foreign tax, or when the decision files no Form 1116 and the
 * election does not apply. A K-1's foreign taxes the engine cannot read make
 * it a gap; a K-1 that waits makes it wait.
 */
export function foreignTaxCredit(form: Accessor, info: Form1116FilingInfo): Value {
  const foreignTax = info.foreignTax;
  if (foreignTax === undefined) return undefined;
  if (foreignTax.k1Gap !== undefined) return unsupported(foreignTax.k1Gap);
  if (foreignTax.k1Waiting === true) return undefined;
  if (foreignTax.election) {
    const regularTax = regularTaxForCredit(form, info);
    if (typeof regularTax !== "number") return regularTax;
    return electionCredit(
      foreignTax.sources.map((source) => source.foreignTaxPaid),
      regularTax,
    );
  }
  if (info.mustFile?.["form-1116"]?.value !== true) return undefined;
  const set = form1116Set(form, info);
  if (set === undefined || isGap(set)) return set;
  const { partIV } = set;
  return partIV === undefined || isGap(partIV) ? partIV : partIV.line35;
}

/* Why Schedule 3 line 1 is a gap, or undefined when it is a number or blank. */
export function foreignTaxCreditGap(form: Accessor, info: Form1116FilingInfo): string | undefined {
  const credit = foreignTaxCredit(form, info);
  return isGap(credit) ? `Schedule 3 line 1 (the foreign tax credit): ${credit.reason}` : undefined;
}

/* The election applies: the AMT foreign tax credit is the same amount (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b02). */
export const claimsByElection = (info: Form1116FilingInfo) => info.foreignTax?.election === true;
