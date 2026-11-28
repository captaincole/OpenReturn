import { RAILROAD_TRACK_MAINTENANCE_KEY } from "../../facts/kinds/railroadTrackMaintenance.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { trackMaintenanceFigures, type TrackMaintenanceFigures } from "./figures.js";
import type { Form8900FilingInfo, K1TrackCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8900";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code AJ (federal/passThrough). */
export const K1_TRACK_DETAIL = "railroad_track_maintenance";

const K1_AMOUNT_GAP =
  "A K-1 reports the railroad track maintenance credit (code AJ) with no amount; the entity's statement gives it.";

/* A spouse's business is on the return unless the spouses file separately. */
const isJointForBusinesses = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures; every resolver that reads them calls this one function. */
export const trackFiguresOf = (inputs: ResolverInputs): TrackMaintenanceFigures =>
  trackMaintenanceFigures(inputs.facts, isJointForBusinesses(inputs));

/*
 * Line 6: "Enter total qualified railroad track maintenance credits from:
 * Schedule K-1 (Form 1065) ... box 15 (code AJ); and Schedule K-1 (Form
 * 1120-S) ... box 13 (code AJ)" (irs-8900-inst-2025::sec::line-6::b01), each
 * K-1 in whole dollars, as Form 3800 takes it (3800/k1Credits.ts). Undefined
 * with none.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before the add, the
 * rule of Form 8846 line 5 and Form 8820 line 3 (docs/rule-decisions.md A96, A134).
 * Text A, the Form 1040 instructions: "include cents when adding the amounts
 * and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 7: "All others, report this amount on Form 3800, Part III, line
 * 4g" (irs-8900-face-2025::sec::face-page-1::b02), where an aggregate "from
 * more than one pass-through entity" is broken down "by the EIN of the
 * pass-through entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01),
 * one whole-dollar amount for each K-1. The engine follows text B, so line 7
 * equals Form 3800 line 4g.
 */
export function k1TrackCreditsOf(inputs: ResolverInputs): K1TrackCredits | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_TRACK_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return { amount: sum(...items.map(({ item }) => roundDollars(item.amount))) };
}

/*
 * Who files: "Eligible taxpayers use Form 8900 to claim the railroad track
 * maintenance credit ... If you are an assignor of miles of eligible railroad
 * track, you must file Form 8900 even if you do not claim any RTMC"
 * (irs-8900-inst-2025::sec::general-instructions::b01): the fact of the
 * taxpayer's own business files it, with or without a credit. Taxpayers other
 * than partnerships and S corporations "are not required to complete or file
 * this form if their only source for this credit is a partnership or S
 * corporation" (same block): a K-1 alone does not file it. The explicit
 * decision still wins; with it true, line 6 holds the K-1 credits.
 */
export function resolve8900Info(inputs: ResolverInputs): Form8900FilingInfo {
  const figures = trackFiguresOf(inputs);
  const own = figures.fact !== undefined || figures.malformed;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: "fallback: a railroad track maintenance fact of the taxpayer's own business",
        value: own,
        triggeredByFactKeys: own ? [RAILROAD_TRACK_MAINTENANCE_KEY] : [],
      },
    ],
  });
  const filed = { mustFile: { "form-8900": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8900": [] } };
  const missing = figures.malformed ? [RAILROAD_TRACK_MAINTENANCE_KEY] : figures.missing;
  return {
    ...filed,
    missingInputs: { "form-8900": missing },
    form8900: {
      ownCredit: own,
      lines: figures.lines,
      gap: figures.gap,
      k1Credits: k1TrackCreditsOf(inputs),
    },
  };
}
