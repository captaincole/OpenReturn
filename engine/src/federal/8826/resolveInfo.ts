import { roundDollars, sum } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { isJointForBusinesses } from "../8846/resolveInfo.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { disabledAccessFigures, type DisabledAccessFigures } from "./figures.js";
import type { Form8826FilingInfo, K1DisabledAccessCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8826";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code K (federal/passThrough). */
export const K1_DISABLED_ACCESS_DETAIL = "disabled_access";

const K1_AMOUNT_GAP =
  "A K-1 reports the disabled access credit (code K) with no amount; the entity's statement gives it.";

/* The return's own figures; every resolver that reads them calls this one function. */
export const disabledAccessFiguresOf = (inputs: ResolverInputs): DisabledAccessFigures =>
  disabledAccessFigures(inputs.facts, isJointForBusinesses(inputs));

/*
 * Line 7: "Disabled access credit from partnerships and S corporations"
 * (irs-8826-form-2025::sec::face-page-1::b01): each K-1's code K in whole
 * dollars, as Form 3800 takes it (3800/k1Credits.ts). Undefined with none.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before the add, as row
 * A96 decides for Form 8846 line 5. Text A, the Form 1040 instructions: "If you
 * have to add two or more amounts to figure the amount to enter on a line,
 * include cents when adding the amounts and round off only the total"
 * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). Text B, line 8: "All
 * others, report this amount on Form 3800, Part III, line 1e"
 * (irs-8826-form-2025::sec::face-page-1::b01), where an aggregate "from more
 * than one pass-through entity" is broken down "by the EIN of the pass-through
 * entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01), one
 * whole-dollar amount for each K-1. The engine follows text B, so line 8
 * equals Form 3800 line 1e, the sum of its Part V amounts (docs/rule-decisions.md).
 */
export function k1DisabledAccessCreditsOf(
  inputs: ResolverInputs,
): K1DisabledAccessCredits | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_DISABLED_ACCESS_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return { amount: sum(...items.map(({ item }) => roundDollars(item.amount))) };
}

/*
 * Who files: an eligible small business that claims the credit for its
 * eligible access expenditures; it "Elects (by filing Form 8826) to claim the
 * disabled access credit" (irs-8826-form-2025::sec::purpose-of-form::b01). A
 * disabled access fact of the taxpayer's own business files it, unless the
 * prior-year answers show the business is not eligible. A taxpayer whose only
 * source is a partnership or S corporation is "not required to complete or
 * file this form" and reports the credit "directly on Form 3800": a K-1 alone
 * does not file it. The explicit decision still wins; with it true, line 7
 * holds the K-1 credits.
 */
export function resolve8826Info(inputs: ResolverInputs): Form8826FilingInfo {
  const figures = disabledAccessFiguresOf(inputs);
  const keys = [...figures.factKeys, ...figures.malformedKeys];
  const own = figures.factKeys.length > 0 || figures.malformedKeys.length > 0;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} disabled access fact(s) of the taxpayer's own business, from an eligible small business (or the test waits on an answer)`,
        value: own && figures.eligible !== false,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const filed = { mustFile: { "form-8826": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8826": [] } };
  return {
    ...filed,
    missingInputs: { "form-8826": [...figures.missing, ...figures.malformedKeys] },
    form8826: {
      lines: figures.lines,
      ownCredit: figures.factKeys.length > 0,
      gap: figures.gap,
      k1Credits: k1DisabledAccessCreditsOf(inputs),
    },
  };
}
