import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { childcareCreditFigures, type ChildcareCreditFigures } from "./figures.js";
import type { Form8882FilingInfo, PassThroughChildcareCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8882";

/* Form 3800 Part III line 1k takes Form 8882 (3800/rows.ts). */
export const FORM_3800_LINE = "1k";
const SOURCE_FORM = "8882";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code AH (federal/passThrough). */
export const K1_CHILDCARE_DETAIL = "childcare";

const K1_AMOUNT_GAP =
  "A K-1 reports the credit for employer-provided childcare facilities and services (code AH) with no amount; the entity's statement gives it.";

/* A joint return holds both spouses' businesses; an unknown status is taken as joint, as for the businesses. */
const isJoint = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures; every resolver that reads them calls this one function. */
export const childcareFiguresOf = (inputs: ResolverInputs): ChildcareCreditFigures =>
  childcareCreditFigures(inputs.facts, isJoint(inputs));

/*
 * Line 5: "Credit for employer-provided childcare facilities and services from
 * partnerships, S corporations, estates, and trusts"
 * (irs-8882-form-2025::sec::face-page-1::b01): each K-1's code AH, and each
 * stated Form 3800 line 1k credit that names its pass-through entity (an
 * estate's or trust's notice), in whole dollars. Undefined with none.
 *
 * DECISION (2026-11-27, by the author): each pass-through credit rounds before
 * the add, as Form 8846 line 5 (docs/rule-decisions.md A96).
 * Text A, the Form 1040 instructions: "include cents when adding the amounts
 * and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 7: "report this amount on Form 3800, Part III, line 1k"
 * (irs-8882-form-2025::sec::face-page-1::b01), which Part V breaks down "by
 * the EIN of the pass-through entity" (irs-3800-inst-2025::sec::part-v-3::b01),
 * one whole-dollar amount for each. The engine follows text B, so line 7 equals
 * Form 3800 line 1k.
 */
export function passThroughCreditsOf(
  inputs: ResolverInputs,
): PassThroughChildcareCredits | undefined {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_CHILDCARE_DETAIL,
  );
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      value.line === FORM_3800_LINE &&
      value.sourceForm === SOURCE_FORM &&
      value.passThroughEin !== undefined,
  );
  if (k1.length === 0 && stated.length === 0) return undefined;
  if (k1.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return {
    amount: sum(
      ...k1.map(({ item }) => roundDollars(item.amount)),
      ...stated.map(({ value }) => roundDollars(value.amount)),
    ),
  };
}

/*
 * Who files: "Employers use Form 8882 to claim the credit for qualified
 * childcare facility and resource and referral expenditures"
 * (irs-8882-form-2025::sec::purpose-of-form::b01): an expenditure fact of the
 * taxpayer's own business files it. "Taxpayers, other than partnerships, S
 * corporations, estates, or trusts, whose only source of this credit is from
 * those pass-through entities, are not required to complete or file this
 * form. Instead, they can report this credit directly on Form 3800" (same
 * block): a K-1 alone does not file it. The explicit decision still wins;
 * with it true, line 5 holds the pass-through credits.
 */
export function resolve8882Info(inputs: ResolverInputs): Form8882FilingInfo {
  const figures = childcareFiguresOf(inputs);
  const keys = [...figures.factKeys, ...figures.malformedKeys];
  const own = keys.length > 0;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} childcare expenditure fact(s) of the taxpayer's own business`,
        value: own,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const filed = { mustFile: { "form-8882": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8882": [] } };
  return {
    ...filed,
    missingInputs: { "form-8882": figures.malformedKeys },
    form8882: {
      lines: figures.lines,
      ownCredit: own,
      gap: figures.gap,
      passThrough: passThroughCreditsOf(inputs),
    },
  };
}
