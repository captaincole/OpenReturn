import { statedFarmsOnReturn } from "../../facts/kinds/farm.js";
import { SMALL_EMPLOYER_HEALTH_CREDIT_KEY } from "../../facts/kinds/smallEmployerHealthCredit.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { healthCreditFigures, type HealthCreditFigures } from "./figures.js";
import type { Form8941FilingInfo, K1HealthCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8941";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code BA (federal/passThrough). */
export const K1_HEALTH_CREDIT_DETAIL = "small_employer_health";

const K1_AMOUNT_GAP =
  "A K-1 reports the credit for small employer health insurance premiums (code BA) with no amount; the entity's statement gives it.";

/* A spouse's business is on the return unless the spouses file separately. */
const isJointForBusinesses = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures; every resolver that reads them calls this one function. */
export function healthCreditFiguresOf(inputs: ResolverInputs): HealthCreditFigures {
  const joint = isJointForBusinesses(inputs);
  return healthCreditFigures(inputs.facts, joint, statedFarmsOnReturn(inputs.facts, joint).farms);
}

/*
 * Line 15: the credit "from: Schedule K-1 (Form 1065) ... box 15 (code BA);
 * Schedule K-1 (Form 1120-S) ... box 13 (code BA)"
 * (irs-8941-inst-2025::sec::line-15::b01): each K-1's code BA in whole dollars,
 * as Form 3800 takes it (3800/k1Credits.ts). Undefined with none.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before the add, the
 * rule of Form 8846 line 5 and Form 8820 line 3 (docs/rule-decisions.md A123, as A96 and A121).
 * Text A, the Form 1040 instructions: "include cents when adding the amounts
 * and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 16: "All others, stop here and report this amount on Form 3800,
 * Part III, line 4h" (irs-8941-face-2025::sec::face-page-1::b04), where an
 * aggregate "from more than one pass-through entity" is broken down "by the
 * EIN of the pass-through entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01),
 * one whole-dollar amount for each K-1. The engine follows text B, so line 16
 * equals Form 3800 line 4h.
 */
export function k1HealthCreditsOf(inputs: ResolverInputs): K1HealthCredits | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_HEALTH_CREDIT_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return { amount: sum(...items.map(({ item }) => roundDollars(item.amount))) };
}

/* Why the fact files no form: the rule of the must-file fallback. */
function fallbackRule(figures: HealthCreditFigures): string {
  if (figures.malformed) return "fallback: a small employer health credit fact to record again";
  if (figures.fact === undefined) return "fallback: no small employer health credit fact";
  if (!figures.fact.value.shopCoverage)
    return "fallback: line A is No (Stop. Do not file Form 8941)";
  if (figures.fact.value.creditClaimedBefore2024)
    return "fallback: line C is Yes, the 2-year credit period is over (Stop. Do not file Form 8941)";
  return "fallback: a small employer health credit fact of the taxpayer's own employees";
}

/*
 * Who files: an eligible small employer that paid premiums for coverage
 * through a SHOP Marketplace (line A "Yes") and whose 2-year credit period has
 * not ended (line C "No"); "No. Stop. Do not file Form 8941" and "Yes. Stop. Do
 * not file Form 8941" (irs-8941-face-2025::sec::face-page-1::b01, ::b02;
 * irs-8941-inst-2025::sec::credit-period::b01). A taxpayer whose only source is
 * a partnership or S corporation "must not complete or file this form" and
 * reports the credit "directly on line 4h in Part III of Form 3800"
 * (general-instructions::b02): a K-1 alone does not file it. The explicit
 * decision still wins; with it true, line 15 holds the K-1 credits.
 */
export function resolve8941Info(inputs: ResolverInputs): Form8941FilingInfo {
  const figures = healthCreditFiguresOf(inputs);
  const files = figures.malformed || figures.claimsCredit;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: fallbackRule(figures),
        value: files,
        triggeredByFactKeys:
          figures.fact || figures.malformed ? [SMALL_EMPLOYER_HEALTH_CREDIT_KEY] : [],
      },
    ],
  });
  const filed = { mustFile: { "form-8941": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8941": [] } };
  const value = figures.fact?.value;
  return {
    ...filed,
    missingInputs: { "form-8941": figures.malformed ? [SMALL_EMPLOYER_HEALTH_CREDIT_KEY] : [] },
    form8941: {
      answers: value && {
        shopCoverage: value.shopCoverage,
        marketplaceIdentifier: value.marketplaceIdentifier,
        employmentTaxEin: value.employmentTaxEin,
        creditClaimedBefore2024: value.creditClaimedBefore2024,
      },
      claimsCredit: figures.claimsCredit,
      lines: figures.lines,
      gap: figures.gap,
      k1Credits: k1HealthCreditsOf(inputs),
    },
  };
}
