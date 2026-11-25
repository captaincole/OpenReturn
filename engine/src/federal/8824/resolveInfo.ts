import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8824FilingInfo } from "./filingInfo.js";
import { NO_FACT_TOTALS, form8824Totals } from "./totals.js";

/*
 * Who files (irs-8824-inst-2025::sec::when-to-file::b01): "If during the current
 * tax year you transferred property to another party in a like-kind exchange,
 * you must file Form 8824 ... Also file Form 8824 for the 2 years following the
 * year of a related party exchange." Part IV files for a 2025 conflict-of-interest
 * sale whose deferral the taxpayer elects (purpose-of-form::b01). A malformed
 * fact files the form too, so its lines show the gap. The explicit decision wins.
 * The form asks again for a related party exchange whose lines 9 and 10 are not
 * answered.
 */
export function resolve8824Info(inputs: ResolverInputs): Form8824FilingInfo {
  const totals = form8824Totals(inputs);
  const keys = totals === undefined ? [] : [...totals.fileKeys, ...totals.malformedKeys];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8824",
    fallbacks: [
      {
        rule: `fallback: ${keys.length} like-kind exchange or conflict-of-interest sale fact(s) for 2025`,
        value: keys.length > 0,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-8824": resolution },
    missingInputs: { "form-8824": files ? (totals?.unansweredKeys ?? []) : [] },
    form8824Totals: files ? (keys.length > 0 ? totals : NO_FACT_TOTALS) : undefined,
  };
}
