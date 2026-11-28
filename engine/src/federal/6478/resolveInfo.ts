import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import type { Form6478FilingInfo, PassThroughBiofuelCredits } from "./filingInfo.js";
import { PART_III_LINE, STATED_OWN_GAP } from "./form3800.js";
import { line3Of, ownProductionCanQualify, TAX_YEAR } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_6478";

/* The K-1 detail of 1065 box 15 code I, 1120-S box 13 code I and 1041 box 13 code H (federal/passThrough). */
export const BIOFUEL_DETAIL = "biofuel_producer";

/* The Form 3800 source form of a stated line 4c credit (3800/rows.ts). */
const SOURCE_FORM = "6478";

const NO_AMOUNT_GAP =
  "A K-1 reports the biofuel producer credit with no amount; the entity's statement gives it, and the K-1 fact does not hold it.";
const TRUST_GAP =
  "A Schedule K-1 (Form 1041) reports a biofuel producer credit (box 13 code H). The engine does not send a trust's box 13 credits to Form 3800 yet, so line 3 cannot include it.";
const OTHER_FORM_GAP =
  "A credit is stated on Form 3800 Part III line 4c with a source form other than Form 6478, and Form 3800 does not place it.";

/* Every K-1 item of the return with the biofuel producer credit, with the K-1 form it came from. */
function k1BiofuelItems(inputs: ResolverInputs) {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint).entities.flatMap((entity) =>
    entity.items
      .filter((item) => item.detail === BIOFUEL_DETAIL)
      .map((item) => ({ form: entity.form, amount: item.amount })),
  );
}

/*
 * Line 3: "Enter the total biofuel producer credits from: Schedule K-1 (Form
 * 1065) ... box 15 ...; Schedule K-1 (Form 1120-S) ... box 13 ...; Schedule
 * K-1 (Form 1041) ... box 13 (code H); and Form 1099-PATR ... box 12, or other
 * notice of credit allocation" (irs-6478-inst-2025::sec::line-3::b01). The K-1
 * items, and each stated Form 3800 line 4c credit that names its entity (a
 * cooperative's notice; the engine reads no Form 1099-PATR). Undefined with
 * none; the gap of the first credit the engine cannot place.
 */
export function passThroughBiofuelCreditsOf(
  inputs: ResolverInputs,
): PassThroughBiofuelCredits | undefined {
  const k1 = k1BiofuelItems(inputs);
  const stated = getGeneralBusinessCreditFacts(inputs.facts)
    .map((fact) => fact.value)
    .filter((value) => value.line === PART_III_LINE);
  if (k1.length === 0 && stated.length === 0) return undefined;
  if (k1.some((item) => item.form === "1041")) return { gap: TRUST_GAP };
  if (k1.some((item) => item.amount === undefined)) return { gap: NO_AMOUNT_GAP };
  if (stated.some((value) => value.passThroughEin === undefined)) return { gap: STATED_OWN_GAP };
  if (stated.some((value) => value.sourceForm !== SOURCE_FORM)) return { gap: OTHER_FORM_GAP };
  const amounts = [...k1.map((item) => item.amount ?? 0), ...stated.map((value) => value.amount)];
  return { amount: line3Of(amounts) };
}

/*
 * Who files. Lines 1 and 2 hold the credit of the taxpayer's own production,
 * and a tax year that begins in 2025 has none (lines.ts). What a 2025 return
 * can still claim is the credit a pass-through entity allocates from a tax
 * year that began in 2024: "line 3 can still be used by taxpayers receiving
 * allocations of the credit in 2025 from fiscal-year pass-through entities"
 * (irs.gov, "Completing Form 6478 for tax years beginning after 2024").
 *
 * DECISION (2026-11-27, by the author): an individual whose only source is a
 * pass-through entity does not file Form 6478 unless the explicit decision
 * says so; with it, line 3 holds the credits. Text A: "All other taxpayers
 * aren't required to complete or file this form if their only source for this
 * credit is a partnership, S corporation, cooperative, estate, or trust.
 * Instead, they can report this credit directly on the appropriate line of
 * Form 3800" (irs-6478-inst-2025::sec::general-instructions::b01), and the K-1
 * code I: "Report this amount on Form 6478, Biofuel Producer Credit, line 3; or
 * Form 3800, Part III, line 4c" (irs-1065k1-inst-2025::sec::box-15-credits::b05).
 * Text B: "All other taxpayers: Report the above credits directly on the
 * appropriate line of Form 3800; and Don't file Form 6478"
 * (irs-6478-inst-2025::sec::line-3::b01). The engine follows text A, which
 * allows both, because Form 3800 line 4c takes the same credit either way and
 * no dollar amount changes.
 */
export function resolve6478Info(inputs: ResolverInputs): Form6478FilingInfo {
  const ownProduction = ownProductionCanQualify(TAX_YEAR);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: "fallback: a 2025 return has no credit of the taxpayer's own production (lines 1 and 2), and a pass-through credit goes straight to Form 3800 Part III line 4c",
        value: ownProduction,
      },
    ],
  });
  const filed = { mustFile: { "form-6478": mustFile }, missingInputs: { "form-6478": [] } };
  if (mustFile.value !== true) return filed;
  return { ...filed, form6478: { line3: passThroughBiofuelCreditsOf(inputs) } };
}
