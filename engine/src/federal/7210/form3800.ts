/*
 * Form 7210's credit as a Form 3800 source: "All others, stop here and report
 * this amount on Form 3800, Part III, line 1g" (irs-7210-face-2025::sec::face-part-iv::b01).
 * Form 3800 takes line 10 here, one source for each facility, with its
 * transfer or elective payment election ("report the entire amount ... on Form
 * 3800, Part III, line 1g", irs-7210-inst-2025::sec::line-12::b02), and the
 * K-1 credits of line 11 as its own K-1 sources (3800/sources.ts, with each
 * entity's EIN and passive answer), so its line 1g adds to Form 7210 line 12.
 */

import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { Form7210Copy } from "./filingInfo.js";
import { resolve7210Info } from "./resolveInfo.js";

/* Part III line 1g, Form 7210 (3800/rows.ts). */
export const FORM_3800_LINE = "1g";

function sourceOf(copy: Form7210Copy): CreditSource[] {
  const facility = copy.facility;
  if (facility === undefined || copy.line10 === undefined) return [];
  const { passive, passiveActivity, transfer, electivePayment } = facility;
  const credit = {
    line: FORM_3800_LINE,
    key: copy.key,
    amount: copy.line10,
    passive,
    activity: passive ? passiveActivity : undefined,
    transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
    electivePayment: electivePayment && {
      ...electivePayment,
      amount: roundDollars(electivePayment.amount),
    },
  };
  return [{ credit }];
}

/* The line 1g sources of the taxpayer's own facilities while Form 7210 files, and the facilities that wait. */
export function cleanHydrogenSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const copies = resolve7210Info(inputs).form7210Copies ?? [];
  return {
    sources: copies.flatMap(sourceOf),
    missing: copies.filter((copy) => copy.waiting).map((copy) => copy.key),
  };
}
