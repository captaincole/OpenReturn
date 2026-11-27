import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { facilityFactsOnForm8835, form8835Copies, type Form8835Copy } from "./copies.js";
import type { Form8835FilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8835";

/*
 * Who files: "Taxpayers ... must file a separate form for each qualified
 * facility that is used in your trade or business to claim the credit. All
 * others are generally not required to complete or file this form if their
 * only source for this credit is from a partnership, S corporation, estate,
 * trust, or cooperative. Instead, they can report their share of the credit
 * directly on Form 3800" (irs-8835-inst-2025::sec::general-instructions::b01).
 * So a facility fact files it; a facility with a section 1603 grant earns no
 * credit and files none (copies.ts).
 *
 * DECISION (2026-11-27, by the author): a K-1 credit alone does not file Form
 * 8835. The partnership K-1 instructions offer both: "Report this amount on
 * Form 8835; or Form 3800, Part III, line 1f" (irs-1065k1-inst-2025::sec::box-15-credits::b08).
 * Form 8835's own instructions say such a taxpayer is "not required to
 * complete or file this form" (general-instructions::b01) and "If the only
 * credit allocated to you is the renewable electricity production credit,
 * don't report the credit on Form 8835. Instead, report the credit directly on
 * Form 3800" (line-14::b01). The engine follows Form 8835's instructions, as
 * Form 8586 does (row A109); the K-1 credit reaches Form 3800 line 1f either
 * way. When the form files for a facility, the K-1 credits print on the
 * separate copy's line 14. The explicit decision still wins.
 */
export function form8835MustFile(inputs: ResolverInputs) {
  const facilities = facilityFactsOnForm8835(inputs);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${facilities.length} renewable electricity facilit(ies) the taxpayer owns or operates`,
        value: facilities.length > 0,
        triggeredByFactKeys: facilities.map((fact) => fact.key),
      },
    ],
  });
}

/* The copies of a return that files the form; none when it does not. */
export function filedForm8835Copies(inputs: ResolverInputs): Form8835Copy[] {
  return form8835MustFile(inputs).value === true ? form8835Copies(inputs) : [];
}

/*
 * A facility waits while an answer its lines read is missing (Part I lines 6,
 * 8 to 10, or the 4-year split): the facility fact is listed again, as a Form
 * 3468 property is.
 */
export function resolve8835Info(inputs: ResolverInputs): Form8835FilingInfo {
  const mustFile = form8835MustFile(inputs);
  const filed = { mustFile: { "form-8835": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8835": [] } };
  const copies = form8835Copies(inputs);
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { ...filed, missingInputs: { "form-8835": missing }, form8835Copies: copies };
}
