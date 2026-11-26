import {
  getForm8986Facts,
  getPartnerAdjustmentYearFacts,
  type PartnerAdjustmentYearFactValue,
} from "../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8978FilingInfo } from "./filingInfo.js";
import { REPORTING_YEAR } from "./lines.js";
import { placeStatement, planForms, reportingYearOf, type PlacedStatement } from "./plan.js";

/*
 * Who files: "Every partner (except pass-through partners) that receives a
 * Form 8986 from a pass-through entity must file Form 8978"
 * (irs-8978-inst-2025::sec::purpose-of-this-form::b08), with the return for
 * the reporting year (::where-and-when-to-file::b01). An individual is never
 * a pass-through partner. A Form 8986 furnished in another year belongs to
 * that year's return. A statement whose Part II item G date does not read
 * stays on this return, so its gap shows. The explicit decision still wins.
 */
export function resolve8978Info(inputs: ResolverInputs): Form8978FilingInfo {
  const statements = getForm8986Facts(inputs.facts).filter((fact) => {
    const year = reportingYearOf(fact);
    return year === undefined || year === REPORTING_YEAR;
  });
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8978",
    fallbacks: [
      {
        rule: `fallback: ${statements.length} Form(s) 8986 furnished in ${REPORTING_YEAR}`,
        value: statements.length > 0,
        triggeredByFactKeys: statements.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8978": mustFile } };
  if (mustFile.value !== true || statements.length === 0) return filed;
  const placed = statements.map(placeStatement);
  const gap = placed.find((each): each is string => typeof each === "string");
  if (gap !== undefined) return { ...filed, form8978: { copies: [], gap, waitingKeys: [] } };
  const years = new Map<number, PartnerAdjustmentYearFactValue>(
    getPartnerAdjustmentYearFacts(inputs.facts).map((fact) => [fact.value.taxYear, fact.value]),
  );
  const plan = planForms(placed as PlacedStatement[], years);
  return {
    ...filed,
    form8978: plan,
    missingInputs: {
      "form-8978": missingInputs(
        Object.fromEntries(plan.waitingKeys.map((key) => [key, undefined])),
      ),
    },
  };
}
