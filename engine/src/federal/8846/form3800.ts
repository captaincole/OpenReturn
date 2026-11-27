/*
 * Form 8846's credit as a Form 3800 source: "All others, report this amount on
 * Form 3800, Part III, line 4f" (irs-8846-form-2025::sec::face-page-1::b01).
 * Form 3800 takes line 4 here, one source for each business, and the K-1
 * credits of line 5 as its own K-1 sources (3800/sources.ts, with each
 * entity's EIN and passive answer), so its line 4f adds to Form 8846 line 6.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { TipCreditOfBusiness } from "./figures.js";
import { resolve8846Info, tipCreditFiguresOf } from "./resolveInfo.js";

/* Part III line 4f, Form 8846 (3800/rows.ts). */
export const FORM_3800_LINE = "4f";

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (Schedule C line G; column (d),
 * irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b05),
 * which Form 8582-CR limits by the tax on net passive income. The engine does
 * not figure a passive Schedule C business (its line 31 stays blank,
 * schedule-c/lines.ts), so that limit is a gap.
 */
const PASSIVE_BUSINESS_GAP =
  "The tip credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

function sourceOf(credit: TipCreditOfBusiness): CreditSource {
  if (credit.business.materiallyParticipated === false) {
    return gapSource(credit.key, PASSIVE_BUSINESS_GAP);
  }
  return {
    credit: { line: FORM_3800_LINE, key: credit.key, amount: credit.share, passive: false },
  };
}

/* One source that carries the gap, so line 4f and every total that adds it stay unsupported. */
function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

/*
 * The decision decisions.scope.must_file_8846 = false takes Form 8846 off the
 * return, but Schedule C line 23 is reduced from the tip credit fact alone
 * (facts/kinds/activitiesOnReturn.ts reads no decision). "Reduce the income
 * tax deduction ... by the amount on line 4" (irs-8846-form-2025::sec::line-4::b01):
 * with no form, nothing is claimed and nothing reduces the deduction. Until
 * the two agree, line 4f is a gap, so the return never loses the deduction
 * and the credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8846 is false, but the tip credit fact ${key} claims the credit, and Schedule C line 23 is reduced by it (irs-8846-form-2025::sec::line-4::b01). To elect not to claim the credit, record electNotToClaim on the fact (irs-8846-form-2025::sec::purpose-of-form::b01); to claim it, remove the decision.`;

function conflictSources(inputs: ResolverInputs): CreditSource[] {
  const figures = tipCreditFiguresOf(inputs);
  if (figures.lines === undefined) return [];
  const reduced = figures.credits.filter((credit) => (credit.share ?? 0) > 0);
  return reduced.map((credit) => gapSource(credit.key, DECISION_CONFLICT_GAP(credit.key)));
}

/*
 * The line 4f sources of the taxpayer's own businesses while Form 8846 files,
 * and the answers they wait on: line 4 itself, or a business's line G
 * (materially participated), which decides column (d) or (e).
 */
export function tipCreditSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  if (resolve8846Info(inputs).mustFile?.["form-8846"]?.value !== true) {
    return { sources: conflictSources(inputs), missing: [] };
  }
  const figures = tipCreditFiguresOf(inputs);
  const first = figures.factKeys[0];
  if (figures.gap !== undefined && first !== undefined) {
    return { sources: [gapSource(first, figures.gap)], missing: [] };
  }
  const unknown = figures.credits.filter(
    (credit) => credit.business.materiallyParticipated === undefined,
  );
  const missing = [
    ...figures.missing,
    ...figures.malformedKeys,
    ...unknown.map((credit) => credit.businessKey),
  ];
  if (missing.length > 0 || figures.lines === undefined) return { sources: [], missing };
  // A business whose tips are all used to meet the rate has no credit and no row.
  const withCredit = figures.credits.filter((credit) => (credit.share ?? 0) > 0);
  return { sources: withCredit.map(sourceOf), missing: [] };
}
