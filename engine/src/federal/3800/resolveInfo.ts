import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { refuelingBusinessCredit } from "../8911/resolveInfo.js";
import { cleanVehicleBusinessCredit } from "../8936/resolveInfo.js";
import type { Form3800FilingInfo } from "./filingInfo.js";
import { form3800SourcesOf } from "./sources.js";

/*
 * Who files: "You must file Form 3800 and the credit source form(s) to claim
 * any of the general business credits" (irs-3800-inst-2025::sec::who-must-file::b01),
 * and a taxpayer whose only source is a partnership or S corporation reports
 * the credit "directly on Form 3800" (general-instructions::b01). So the form
 * files with a stated current-year credit, a carryover from last year's
 * return, a K-1 general business credit, or a business credit Form 8911 or
 * Form 8936 figures. The explicit decision still wins.
 */
export function resolve3800Info(inputs: ResolverInputs): Form3800FilingInfo {
  const { sources, missing } = form3800SourcesOf(inputs);
  const factKeys = [
    ...sources.current.map((source) => source.credit.key),
    ...sources.carryovers.map((carryover) => carryover.key),
  ];
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3800",
    fallbacks: [
      {
        rule: "fallback: Form 8936 has a clean vehicle business credit (Part III line 1y or 1aa)",
        value: cleanVehicleBusinessCredit(inputs),
      },
      {
        rule: "fallback: Form 8911 line 3 or a K-1 code AO has a refueling property business credit (Part III line 1s)",
        value: refuelingBusinessCredit(inputs),
      },
      {
        rule: `fallback: ${factKeys.length} general business credit(s) or carryover(s) stated or on a K-1, or a K-1 credit waiting on an answer`,
        value: factKeys.length > 0 || missing.length > 0,
        triggeredByFactKeys: [...new Set(factKeys)],
      },
    ],
  });
  const filed = { mustFile: { "form-3800": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-3800": [] } };
  return { ...filed, missingInputs: { "form-3800": missing }, form3800Sources: sources };
}

/*
 * Form 6251 files for Form 3800: "you claim any general business credit, and
 * either line 6 (in Part I) of Form 3800 or line 25 of Form 3800 is more than
 * zero" (irs-6251-inst-2025::sec::who-must-file::b01). The resolver sees the
 * sources, not the lines: a source outside the specified credits (lines 4a–4z)
 * files it, or a Form 8911 or 8936 business credit.
 */
export function generalBusinessCreditNeedsTmt(inputs: ResolverInputs): boolean {
  const info = resolve3800Info(inputs);
  if (info.mustFile?.["form-3800"]?.value !== true) return false;
  if (cleanVehicleBusinessCredit(inputs) || refuelingBusinessCredit(inputs)) return true;
  const sources = info.form3800Sources;
  const lines = [
    ...(sources?.current ?? []).map((source) => source.credit.line),
    ...(sources?.carryovers ?? []).map((carryover) => carryover.line),
  ];
  return lines.some((line) => !line.startsWith("4"));
}
