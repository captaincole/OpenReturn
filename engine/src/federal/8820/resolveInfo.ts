import { orphanDrugCreditFigures } from "../../facts/kinds/activitiesOnReturn.js";
import { ORPHAN_DRUG_CREDIT_KEY } from "../../facts/kinds/orphanDrugCredit.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import type { OrphanDrugFigures } from "./figures.js";
import type { Form8820FilingInfo, K1OrphanDrugCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8820";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code Z (federal/passThrough). */
export const K1_ORPHAN_DRUG_DETAIL = "orphan_drug";

const K1_AMOUNT_GAP =
  "A K-1 reports the orphan drug credit (code Z) with no amount; the entity's statement gives it.";

/* A spouse's business is on the return unless the spouses file separately. */
const isJointForBusinesses = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures, placed after the credits before Form 8820; every resolver that reads them calls this one function. */
export const orphanDrugFiguresOf = (inputs: ResolverInputs): OrphanDrugFigures =>
  orphanDrugCreditFigures(inputs.facts, isJointForBusinesses(inputs));

/*
 * Line 3: "Orphan drug credit from partnerships, S corporations, estates, or
 * trusts" (irs-8820-form-2025::sec::face-part-i::b01): each K-1's code Z in
 * whole dollars, as Form 3800 takes it (3800/k1Credits.ts). Undefined with none.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before the add, the
 * rule of Form 8846 line 5 (docs/rule-decisions.md A96).
 * Text A, the Form 1040 instructions: "include cents when adding the amounts
 * and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 4: "All others, report this amount on Form 3800, Part III, line
 * 1h" (irs-8820-form-2025::sec::face-part-i::b01), where an aggregate "from
 * more than one pass-through entity" is broken down "by the EIN of the
 * pass-through entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01),
 * one whole-dollar amount for each K-1. The engine follows text B, so line 4
 * equals Form 3800 line 1h.
 */
export function k1OrphanDrugCreditsOf(inputs: ResolverInputs): K1OrphanDrugCredits | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_ORPHAN_DRUG_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return { amount: sum(...items.map(({ item }) => roundDollars(item.amount))) };
}

/*
 * Who files: a taxpayer who claims the orphan drug credit from its own clinical
 * testing, or elects the reduced credit: "If you are electing the reduced
 * orphan drug credit, you must complete Form 8820 (even if no orphan drug
 * credits are claimed on the original return)" (irs-8820-form-2025::sec::line-2a::b01).
 * A taxpayer "whose only source of this credit is from those pass-through
 * entities" is "not required to complete or file this form" and reports it on
 * Form 3800 (purpose-of-form::b01): a K-1 alone does not file it. The explicit
 * decision still wins; with it true, line 3 holds the K-1 credits.
 */
export function resolve8820Info(inputs: ResolverInputs): Form8820FilingInfo {
  const figures = orphanDrugFiguresOf(inputs);
  const own = figures.fact !== undefined || figures.malformed;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: "fallback: an orphan drug credit fact of the taxpayer's own business",
        value: own,
        triggeredByFactKeys: own ? [ORPHAN_DRUG_CREDIT_KEY] : [],
      },
    ],
  });
  const filed = { mustFile: { "form-8820": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8820": [] } };
  const missing = figures.malformed ? [ORPHAN_DRUG_CREDIT_KEY] : figures.missing;
  return {
    ...filed,
    missingInputs: { "form-8820": missing },
    form8820: {
      ownCredit: own,
      reducedCreditElection: figures.fact?.value.reducedCreditElection,
      lines: figures.lines,
      gap: figures.gap,
      drugs: figures.fact?.value.drugs ?? [],
      k1Credits: k1OrphanDrugCreditsOf(inputs),
    },
  };
}
