import { FARM_INCOME_AVERAGING_KEY, type FarmIncomeAveragingFactValue } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { baseYears } from "./baseYears.js";
import type { ScheduleJFilingInfo } from "./filingInfo.js";

/*
 * Who files: "Use Schedule J (Form 1040) to elect to figure your 2025 income
 * tax by averaging, over the previous 3 years (base years), all or part of
 * your 2025 taxable income from your trade or business of farming or fishing"
 * (irs-1040sj-inst-2025::sec::what-s-new::b01, under General Instructions);
 * "Attach Schedule J only if you are using it to figure your tax" (the face).
 * The election fact files it; the explicit decision still wins.
 *
 * The form then asks for the election when the decision files it with no
 * fact, and for each base-year fact that is missing or lacks an answer a line
 * needs (baseYears.ts).
 */
export function resolveScheduleJInfo(inputs: ResolverInputs): ScheduleJFilingInfo {
  const election = inputs.factByKey.get(FARM_INCOME_AVERAGING_KEY) as
    FarmIncomeAveragingFactValue | undefined;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_j",
    fallbacks: [
      {
        rule: "fallback: the taxpayer elects to average farming or fishing income",
        value: election !== undefined,
        triggeredByFactKeys: election === undefined ? [] : [FARM_INCOME_AVERAGING_KEY],
      },
    ],
  });
  const filed = { mustFile: { "schedule-j": mustFile } };
  if (mustFile.value !== true) return filed;
  const years = baseYears(inputs);
  const missing = [
    ...(election === undefined ? [FARM_INCOME_AVERAGING_KEY] : []),
    ...(years.kind === "waits" ? years.missing : []),
  ];
  const known = election !== undefined && years.kind === "known";
  return {
    ...filed,
    missingInputs: { "schedule-j": missing },
    scheduleJ: known ? { election, baseYears: years.years } : undefined,
  };
}
