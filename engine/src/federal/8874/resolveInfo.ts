import { getNewMarketsInvestmentFacts, type NewMarketsInvestmentFact } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { Cell } from "../3800/cells.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import type { Form8874FilingInfo } from "./filingInfo.js";
import { form8874LinesOf, rowOf, type NewMarketsInvestment } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8874";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code AD (passThrough box tables). */
export const K1_NEW_MARKETS_DETAIL = "new_markets";

const K1_AMOUNT_GAP =
  "A K-1 reports the new markets credit (code AD) with no amount; the entity's statement gives it.";

/* The investment facts on this return: the spouse's only on a joint return. */
export function newMarketsFactsOf(inputs: ResolverInputs): NewMarketsInvestmentFact[] {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return getNewMarketsInvestmentFacts(inputs.facts).filter(
    ({ value }) => joint || value.owner !== "spouse",
  );
}

const investmentOf = ({ key, value }: NewMarketsInvestmentFact): NewMarketsInvestment => ({
  key,
  cdeName: value.notice.box1CdeName,
  cdeAddress: value.cdeAddress,
  cdeEin: value.notice.box2CdeEin,
  investmentDate: value.notice.box7InvestmentDate,
  amount: value.notice.box8Amount,
  disposedOn: value.disposedOn,
  recaptureEventOn: value.recaptureEventOn,
  passive: value.passive,
});

/* The investments with a row on line 1: a credit allowance date in 2025 while held and qualified. */
export const investmentsWithRow = (inputs: ResolverInputs): NewMarketsInvestmentFact[] =>
  newMarketsFactsOf(inputs).filter((fact) => rowOf(investmentOf(fact)) !== undefined);

/*
 * Line 2: "New markets credit from partnerships and S corporations"
 * (irs-8874-form-2025::sec::face-page-1::b01): each K-1's code AD (partnership
 * box 15, S corporation box 13; irs-1065k1-inst-2025::sec::box-15-credits::b09)
 * in whole dollars, as Form 3800 takes it (3800/k1Credits.ts). Blank with none.
 * A Form 3800 line 1i credit stated by hand is not added: Form 3800 makes it a
 * gap, because the engine figures line 1i from this form (3800/rows.ts,
 * ENGINE_FORM_LINES).
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before the add, the
 * rule of Form 8846 line 5 and Form 8820 line 3 (docs/rule-decisions.md A96, A121).
 * Text A, the Form 1040 instructions: "include cents when adding the amounts
 * and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 3: "All others, report this amount on Form 3800, Part III, line
 * 1i" (irs-8874-form-2025::sec::face-page-1::b01), where an aggregate "from
 * more than one pass-through entity" is broken down "by the EIN of the
 * pass-through entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01),
 * one whole-dollar amount for each K-1. The engine follows text B, so line 3
 * equals Form 3800 line 1i.
 */
export function k1NewMarketsCreditOf(inputs: ResolverInputs): Cell {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_NEW_MARKETS_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  return sum(...items.map(({ item }) => roundDollars(item.amount)));
}

/* An investment with a row whose answers are missing: the address of column (a), or passive. */
const waitsOnAnswer = ({ value }: NewMarketsInvestmentFact) =>
  typeof value.passive !== "boolean" || !value.cdeAddress;

/*
 * Who files: "Use Form 8874 to claim the new markets credit for qualified
 * equity investments made in qualified community development entities (CDEs)"
 * (irs-8874-form-2025::sec::purpose-of-form::b01), so an investment held
 * directly with a credit allowance date in 2025 files it. "Taxpayers that are
 * not partnerships or S corporations, and whose only source of this credit is
 * from those pass-through entities, are not required to complete or file this
 * form. Instead, they can report this credit directly on Form 3800, Part III,
 * line 1i" (same block): a K-1 alone does not file it. The explicit decision
 * still wins; with it true, line 2 holds the K-1 credits.
 */
export function resolve8874Info(inputs: ResolverInputs): Form8874FilingInfo {
  const withRow = investmentsWithRow(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${withRow.length} qualified equity investment(s) held directly with a 2025 credit allowance date`,
        value: withRow.length > 0,
        triggeredByFactKeys: withRow.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8874": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8874": [] } };
  const investments = newMarketsFactsOf(inputs).map(investmentOf);
  return {
    ...filed,
    missingInputs: { "form-8874": withRow.filter(waitsOnAnswer).map((fact) => fact.key) },
    newMarketsCredit: form8874LinesOf(investments, k1NewMarketsCreditOf(inputs)),
  };
}
