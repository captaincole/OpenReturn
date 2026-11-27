/*
 * Form 8844's side of Form 3800 Part III line 3. "All others, stop here and
 * report this amount on Form 3800, Part III, line 3" (irs-8844-face-2025::sec::face-page-1::b01,
 * line 4). Line 4 is line 2 (the credit of the taxpayer's own employees) plus
 * line 3 (the pass-through credits). Form 3800 already holds each pass-through
 * credit as its own source, with its entity for Part V; this adds line 2 as
 * one source for each business or farm that paid the wages, passive when the
 * owner did not materially participate. So Part III line 3 adds to line 4.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { gap } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { resolve8844Info } from "./resolveInfo.js";

const LINE = "3";

const STATED_OWN_GAP =
  "Form 8844 figures the credit of the taxpayer's own employees from the empowerment zone employee facts (line 2), and this stated line 3 credit names no pass-through entity: state the employees instead.";

/* A pass-through credit: a K-1 item, or a stated credit that names its entity (Form 8844 line 3). */
export const isPassThroughZoneCredit = (source: CreditSource) =>
  source.credit.line === LINE && (source.fromK1 !== undefined || source.credit.ein !== undefined);

/* The Form 3800 sources with Form 8844 line 2 added, when Form 8844 files. */
export function withForm8844(inputs: ResolverInputs, current: CreditSource[]): CreditSource[] {
  const figures = resolve8844Info(inputs).form8844;
  if (figures === undefined) return current;
  const kept = current.map((source) =>
    source.credit.line === LINE && !isPassThroughZoneCredit(source)
      ? { ...source, credit: { ...source.credit, amount: gap(STATED_OWN_GAP) } }
      : source,
  );
  if (typeof figures.line2 !== "number") {
    const credit = { line: LINE, key: "form-8844", amount: figures.line2, passive: false };
    return [...kept, { credit }];
  }
  const own: CreditSource[] = figures.employers
    .filter((employer) => employer.credit > 0)
    .map((employer) => ({
      credit: {
        line: LINE,
        key: employer.key,
        amount: employer.credit,
        passive: employer.passive,
        activity: employer.passive ? { name: employer.name, rentalRealEstate: false } : undefined,
      },
    }));
  return [...kept, ...own];
}
