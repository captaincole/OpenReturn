import { getNoncashGiftFacts } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8283FilingInfo } from "./filingInfo.js";
import { form8283Plan, missingColumns, MUST_FILE_OVER } from "./lines.js";

/*
 * When the form files. SOURCE CONFLICT on the $500 test:
 * - The 2025 form's header (Rev. December 2025): "Attach one or more Forms
 *   8283 to your tax return if you claimed a total deduction of over $500 for
 *   all contributed property." Pub. 526 says the same
 *   (irs-pub-526-2025::sec::how-to-report::b02: "If your total deduction for
 *   all noncash contributions for the year is over $500").
 * - The instructions test each gift: "if the amount of your deduction for each
 *   noncash contribution is more than $500", or a group of similar items over
 *   $500 (irs-8283-inst-2025::sec::who-must-file::b01), and list in Section A
 *   only items "more than $500 but not more than $5,000"
 *   (::which-sections-to-complete::b04).
 * The engine follows the form's words: the total of every noncash gift's
 * deduction, before the income limits, over $500. The form then lists every
 * gift, as its Section A note on gifts of $500 or less implies.
 *
 * Only the gift facts count: a single total (`charitable.noncash`) over $500
 * with no gift facts lists nothing, so it does not file the form.
 * decisions.scope.must_file_8283 overrides.
 */
export function resolve8283Info(inputs: ResolverInputs): Form8283FilingInfo {
  const gifts = getNoncashGiftFacts(inputs.facts);
  const plan = form8283Plan(gifts);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8283",
    fallbacks: [
      {
        rule: `fallback: the noncash gifts' total deduction ($${plan.mustFileTotal}) is over $${MUST_FILE_OVER}`,
        value: plan.mustFileTotal > MUST_FILE_OVER,
        triggeredByFactKeys: gifts.map((gift) => gift.factKey),
      },
    ],
  });
  /* A gift whose row lacks a column the form requires: Cade records the gift again with it. */
  const incomplete = plan.rows.filter((row) => missingColumns(row).length > 0);
  return {
    mustFile: { "form-8283": resolution },
    missingInputs: { "form-8283": incomplete.map((row) => row.factKey) },
    form8283Copies: plan.copies,
  };
}
