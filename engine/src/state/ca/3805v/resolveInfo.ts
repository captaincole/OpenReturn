import {
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  CA_NOL_KEYS,
  getCaNolCarryoverRows,
} from "../../../facts/index.js";
import { businessLossesWithoutIncome } from "../../../federal/461/resolveInfo.js";
import { totalBusinessLosses } from "../../../federal/passThrough/excessBusinessLoss.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import {
  californiaCapitalFigures,
  federalCapitalLossCarryover,
} from "../schedule-d-ca/resolveInfo.js";
import type { Form3805VFilingInfo } from "./filingInfo.js";

const FILES_540_KEY = "decisions.scope.must_file_ca_540";
const FILES_540NR_KEY = "decisions.scope.must_file_540nr";

export const FORM_540NR_GAP =
  "Form 540NR files: FTB 3805V then takes Part I Section B, whose columns split each business and nonbusiness amount by California source and by the part of the year as a resident (ca-3805v-inst-2025::sec::section-b-nonresidents-and-part-year-residents::b01, ::b02), and Part II reads Schedule CA (540NR) Part IV; the engine figures neither.";

/*
 * Who files (ca-3805v-inst-2025::sec::a-purpose::b01): the form figures "the
 * current year NOL and ... limit[s] the NOL carryover and disaster loss
 * deductions". A carryover from 2024 files it. A current year NOL needs a
 * business loss (deductions more than income); the resolver cannot see the
 * lines, so a business loss on a Form 540 return files the form, and it comes
 * off the return when it shows no NOL, carryover or deduction
 * (filesOnlyWithAmountOn in bindings.ts). The explicit decision wins.
 */
function mustFileOf(inputs: ResolverInputs, hasCarryover: boolean) {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const files540NR = inputs.decisionByKey.get(FILES_540NR_KEY) === true;
  const { k1Losses, other, line8Loss, entityKeys } = businessLossesWithoutIncome(inputs);
  const losses = other === undefined ? 0 : totalBusinessLosses(k1Losses, other) + line8Loss;
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3805v",
    fallbacks: [
      {
        rule: "fallback: Form 540 or 540NR files with a California NOL or disaster loss carryover from 2024",
        value: (files540 || files540NR) && hasCarryover,
        triggeredByFactKeys: [CA_NOL_KEYS.priorYearCarryovers],
        triggeredByDecisionKeys: [files540 ? FILES_540_KEY : FILES_540NR_KEY],
      },
      {
        rule: "fallback: Form 540 files and the return has a business loss, which can make a current year NOL",
        value: files540 && losses > 0,
        triggeredByFactKeys: entityKeys,
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
}

/*
 * The carryover rows are optional by design: a taxpayer with no carryover says
 * nothing, and the form files with them. Schedule D (540)'s line 6 is the
 * California carryover, or the federal one when no California amount differs.
 */
export function resolve3805VInfo(inputs: ResolverInputs): Form3805VFilingInfo {
  const priorRows = (getCaNolCarryoverRows(inputs.facts) ?? []).filter(
    (row) => row.carryoverFrom2024 > 0,
  );
  const mustFile = mustFileOf(inputs, priorRows.length > 0);
  if (mustFile.value !== true) return { mustFile: { "form-3805v": mustFile } };
  const carryover =
    num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY) ?? federalCapitalLossCarryover(inputs);
  const { k1Losses } = businessLossesWithoutIncome(inputs);
  return {
    mustFile: { "form-3805v": mustFile },
    missingInputs: { "form-3805v": [] },
    form3805v: {
      priorRows,
      capital: californiaCapitalFigures(inputs, carryover, false),
      lossFromPassThrough: k1Losses > 0,
      gap: inputs.decisionByKey.get(FILES_540NR_KEY) === true ? FORM_540NR_GAP : undefined,
    },
  };
}
