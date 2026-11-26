import { getTrustAccumulationDistributionFacts } from "../../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form5870AFilingInfo } from "./filingInfo.js";

const FILES_540_KEY = "decisions.scope.must_file_ca_540";

/*
 * Who files: "If you received accumulation distributions from foreign trusts or
 * from certain domestic trusts, get form FTB 5870A ... to figure the additional
 * tax" (ca-540-inst-2025::sec::line-34-tax-from-schedule-g-1-and-form-ftb-5870a::b01;
 * ca-5870a-inst-2025::sec::purpose::b01: "an accumulation distribution made by a
 * foreign trust and certain domestic trusts"). A trust fact with a throwback year
 * on a Form 540 return files it, foreign or domestic: California's R&TC 17745
 * reaches trusts that the federal Form 4970 does not, so the fact is enough. The
 * form has no rules yet, so Form 540 line 34 shows the gap instead of a blank.
 * The explicit decision still wins.
 */
export function resolve5870AInfo(inputs: ResolverInputs): Form5870AFilingInfo {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const trustKeys = getTrustAccumulationDistributionFacts(inputs.facts)
    .filter((fact) => fact.value.throwbackYears.length > 0)
    .map((fact) => fact.key);
  return {
    mustFile: {
      "form-5870a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_5870a",
        fallbacks: [
          {
            rule: `fallback: Form 540 files (${files540}) with ${trustKeys.length} trust accumulation distribution(s)`,
            value: files540 && trustKeys.length > 0,
            triggeredByFactKeys: trustKeys,
            triggeredByDecisionKeys: [FILES_540_KEY],
          },
        ],
      }),
    },
  };
}
