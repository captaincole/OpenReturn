/*
 * Who files Schedule D (540NR). Its own instructions: "all gains and losses
 * must be reported. Full-year nonresidents or part-year residents complete
 * Schedule D (540NR) ... in order to complete column E on Schedule CA (540NR)"
 * (ca-540nr-sched-d-inst-2025::sec::purpose::b01). So, unlike Schedule D (540)
 * ("only if there is a difference"), it files with Form 540NR whenever the
 * return has a capital gain or loss: federal Schedule D files, a Form 1099-DIV
 * box 2a amount goes straight to Form 1040 line 7a, or a California capital
 * loss carryover from 2024 is stated (line 6). QUESTIONS.md, question 1.
 * The explicit decision still wins.
 */

import { CA_CAPITAL_LOSS_CARRYOVER_KEY, isDividendFactKey } from "../../../facts/index.js";
import type { MustFileResolution } from "../../../filingInfo.js";
import { resolveScheduleDInfo } from "../../../filingInfoResolvers.js";
import {
  num,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { files540NR } from "../540nr/mustFile.js";

export const MUST_FILE_KEY = "decisions.scope.must_file_schedule_d_540nr";
const FORM_540NR_KEYS = ["decisions.scope.must_file_540nr", "decisions.scope.ca_residency"];

export function scheduleD540NRMustFile(inputs: ResolverInputs): MustFileResolution {
  const with540NR = files540NR(inputs);
  const scheduleD = resolveScheduleDInfo(inputs).mustFile?.["schedule-d"]?.value === true;
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey) > 0;
  const carryover = (num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY) ?? 0) > 0;
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540NR files (${with540NR}) and the federal return has a capital gain or loss (Schedule D files: ${scheduleD}; capital gain distributions: ${distributions})`,
        value: with540NR && (scheduleD || distributions),
        triggeredByDecisionKeys: FORM_540NR_KEYS,
      },
      {
        rule: `fallback: Form 540NR files (${with540NR}) and a California capital loss carryover from 2024 is stated (${carryover})`,
        value: with540NR && carryover,
        triggeredByFactKeys: [CA_CAPITAL_LOSS_CARRYOVER_KEY],
        triggeredByDecisionKeys: FORM_540NR_KEYS,
      },
    ],
  });
}
