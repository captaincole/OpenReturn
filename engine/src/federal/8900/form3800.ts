/*
 * Form 8900's credit as a Form 3800 source: "All others, report this amount on
 * Form 3800, Part III, line 4g" (irs-8900-face-2025::sec::face-page-1::b02).
 * Form 3800 takes line 5 here, one source for the business, and the K-1
 * credits of line 6 as its own K-1 sources (3800/sources.ts, with each
 * entity's EIN and passive answer), so its line 4g adds to Form 8900 line 7.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { resolve8900Info, trackFiguresOf } from "./resolveInfo.js";

/* Part III line 4g, Form 8900 (3800/rows.ts): a specified credit. */
export const FORM_3800_LINE = "4g";

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (column (d)), which Form 8582-CR limits by the tax
 * on net passive income. The engine does not figure a passive Schedule C
 * business (its line 31 stays blank, schedule-c/lines.ts), so that limit is a gap.
 */
const PASSIVE_BUSINESS_GAP =
  "The railroad track maintenance credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

/*
 * The decision decisions.scope.must_file_8900 = false takes Form 8900 off the
 * return, but the track asset's cost is reduced from the fact alone
 * (facts/kinds/activitiesOnReturn.ts reads no decision). The basis goes down
 * by "the amount of RTMC" (irs-8900-inst-2025::sec::adjustments-to-basis::b01):
 * with no form, nothing is claimed and nothing lowers the basis. Until the two
 * agree, line 4g is a gap, so the return never loses the basis and the credit
 * together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8900 is false, but the railroad track maintenance fact ${key} claims the credit, and the track asset's basis is reduced by it (irs-8900-inst-2025::sec::adjustments-to-basis::b01). To not claim the credit, remove the fact; to claim it, remove the decision.`;

/* One source that carries the gap, so line 4g and every total that adds it stay unsupported. */
function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

/*
 * The line 4g source of the taxpayer's own business while Form 8900 files, and
 * the answers it waits on: lines 1 to 5 themselves, or the business's line G
 * (materially participated), which decides column (d) or (e).
 */
export function trackMaintenanceSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const figures = trackFiguresOf(inputs);
  const fact = figures.fact;
  if (fact === undefined) return { sources: [], missing: [] };
  if (resolve8900Info(inputs).mustFile?.["form-8900"]?.value !== true) {
    const conflict = figures.reduction !== undefined;
    return {
      sources: conflict ? [gapSource(fact.key, DECISION_CONFLICT_GAP(fact.key))] : [],
      missing: [],
    };
  }
  if (figures.gap !== undefined)
    return { sources: [gapSource(fact.key, figures.gap)], missing: [] };
  if (figures.lines === undefined) return { sources: [], missing: figures.missing };
  const participated = figures.business?.materiallyParticipated;
  if (participated === undefined) return { sources: [], missing: [fact.value.businessKey] };
  if (figures.lines.line5 <= 0) return { sources: [], missing: [] };
  if (participated === false)
    return { sources: [gapSource(fact.key, PASSIVE_BUSINESS_GAP)], missing: [] };
  const amount = figures.lines.line5;
  return {
    sources: [{ credit: { line: FORM_3800_LINE, key: fact.key, amount, passive: false } }],
    missing: [],
  };
}
