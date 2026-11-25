import { CA_HEALTH_COVERAGE_KEYS } from "../../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3853FilingInfo } from "./filingInfo.js";
import { hasAffordabilityTest, memberMissingKeys, resolveHousehold } from "./household.js";

const FULL_YEAR_COVERAGE_KEY = "health_coverage.full_year_mec";

/*
 * Who files (ca-3853-inst-2025::sec::who-must-file::b01–b02): a Form 540
 * filer who cannot check the full-year health care coverage box (Form 540
 * line 92) and cannot be claimed as a dependent. The explicit decision still
 * wins. While Step 1 question 1 waits, the form files and asks it.
 */
export function resolve3853Info(inputs: ResolverInputs): Form3853FilingInfo {
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const noFullYearCoverage = inputs.factByKey.get(FULL_YEAR_COVERAGE_KEY) === false;
  const household = resolveHousehold(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3853",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}), the full-year coverage box is not checked (${noFullYearCoverage}) and no one can claim the taxpayer as a dependent (${household.claimableAsDependent !== true})`,
        value: files540 && noFullYearCoverage && household.claimableAsDependent !== true,
        triggeredByFactKeys: [FULL_YEAR_COVERAGE_KEY],
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  const asked = (key: string, value: unknown, when: boolean) => (when ? { [key]: value } : {});
  return {
    mustFile: { "form-3853": resolution },
    missingInputs: {
      "form-3853":
        resolution.value === true
          ? [
              ...missingInputs({
                [CA_HEALTH_COVERAGE_KEYS.claimableAsDependent]: household.claimableAsDependent,
                ...asked(
                  CA_HEALTH_COVERAGE_KEYS.grossIncome,
                  household.grossIncome,
                  household.grossIncomeAsked,
                ),
                ...asked(
                  CA_HEALTH_COVERAGE_KEYS.salaryReductionPremiums,
                  household.salaryReductionPremiums,
                  hasAffordabilityTest(household.members),
                ),
              }),
              ...memberMissingKeys(inputs, household.members),
            ]
          : [],
    },
    ca3853: household,
  };
}
