import {
  CA_RESIDENCY_FACT_KEYS,
  caCaliforniaAmountKey,
  isDividendFactKey,
  isEmployerPlanDistribution,
  isInterestFactKey,
  isRetirementDistributionFactKey,
  readCaCaliforniaAmounts,
  readCaResidencyFact,
  type CaStatedAmountLine,
  type RetirementDistributionFactValue,
} from "../../../facts/index.js";
import { resolve4797Info } from "../../../federal/4797/resolveInfo.js";
import { resolveScheduleCInfo } from "../../../federal/schedule-c/resolveInfo.js";
import { resolveScheduleEInfo } from "../../../federal/schedule-e/resolveInfo.js";
import { resolveScheduleFInfo } from "../../../federal/schedule-f/resolveInfo.js";
import { resolveScheduleSEInfo } from "../../../federal/schedule-se/resolveInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { resolveScheduleCaInfo, resolveScheduleDInfo } from "../../../filingInfoResolvers.js";
import {
  factsInCategory,
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  sumInvestmentBox,
  sumW2Box,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { asFullYearResident } from "../540nr/californiaForms.js";
import { files540NR } from "../540nr/mustFile.js";
import { resolveScheduleD540NRInfo } from "../schedule-d-540nr/resolveInfo.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

function retirementTaxable(inputs: ResolverInputs, employerPlan: boolean): boolean {
  return factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .some(
      (form) => isEmployerPlanDistribution(form) === employerPlan && (form.box2a ?? form.box1) > 0,
    );
}

/*
 * The lines whose column E the form asks for: a document or a schedule on the
 * return puts an amount on the line's column A. A line with a column D amount
 * that no entry here names is a gap (columnE.ts), never a silent 0.
 */
function linesAsked(inputs: ResolverInputs): CaStatedAmountLine[] {
  const asked: Array<[CaStatedAmountLine, boolean]> = [
    ["1a", sumW2Box(inputs, "box1") !== 0],
    [
      "2b",
      sumInvestmentBox(inputs, "box1", isInterestFactKey) +
        sumInvestmentBox(inputs, "box3", isInterestFactKey) >
        0,
    ],
    ["3b", sumInvestmentBox(inputs, "box1a", isDividendFactKey) > 0],
    ["4b", retirementTaxable(inputs, false)],
    ["5b", retirementTaxable(inputs, true)],
    [
      "7a",
      files(resolveScheduleDInfo(inputs), "schedule-d") ||
        sumInvestmentBox(inputs, "box2a", isDividendFactKey) > 0 ||
        files(resolveScheduleD540NRInfo(inputs), "schedule-d-540nr"),
    ],
    ["b3", files(resolveScheduleCInfo(inputs), "schedule-c")],
    ["b4", files(resolve4797Info(inputs), "form-4797")],
    ["b5", files(resolveScheduleEInfo(inputs), "schedule-e")],
    ["b6", files(resolveScheduleFInfo(inputs), "schedule-f")],
    ["c15", files(resolveScheduleSEInfo(inputs), "schedule-se")],
  ];
  return asked.filter(([, isAsked]) => isAsked).map(([line]) => line);
}

/* The answers the schedule reads: each person's Part I answers, the column E amounts asked, and Schedule CA (540)'s. */
function requiredAnswers(
  inputs: ResolverInputs,
  asked: CaStatedAmountLine[],
  amounts: Partial<Record<CaStatedAmountLine, number>>,
) {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const residency = {
    [CA_RESIDENCY_FACT_KEYS.taxpayer]: readCaResidencyFact(inputs.facts, "taxpayer"),
    ...(joint
      ? { [CA_RESIDENCY_FACT_KEYS.spouse]: readCaResidencyFact(inputs.facts, "spouse") }
      : {}),
  };
  const columnE = Object.fromEntries(
    asked.map((line) => [caCaliforniaAmountKey(line), amounts[line]]),
  );
  const asResident = resolveScheduleCaInfo(asFullYearResident(inputs)).missingInputs?.[
    "schedule-ca"
  ];
  return [...missingInputs({ ...residency, ...columnE }), ...(asResident ?? [])];
}

/*
 * ca-540nr-sched-ca-inst-2025::sec::purpose::b01: the schedule gives the
 * California taxable income of Form 540NR (lines 14, 16, 18, 32 and 35 take it),
 * so it files with Form 540NR.
 */
export function resolveScheduleCa540NRInfo(inputs: ResolverInputs): ScheduleCa540NRFilingInfo {
  const with540NR = files540NR(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_ca_540nr",
    fallbacks: [
      {
        rule: `fallback: files with Form 540NR (${with540NR})`,
        value: with540NR,
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_540nr",
          "decisions.scope.ca_residency",
        ],
      },
    ],
  });
  const filed = resolution.value === true;
  const amounts = readCaCaliforniaAmounts(inputs.facts);
  const asked = filed ? linesAsked(inputs) : [];
  return {
    mustFile: { "schedule-ca-540nr": resolution },
    missingInputs: { "schedule-ca-540nr": filed ? requiredAnswers(inputs, asked, amounts) : [] },
    caResidencyTaxpayer: readCaResidencyFact(inputs.facts, "taxpayer"),
    caResidencySpouse: readCaResidencyFact(inputs.facts, "spouse"),
    californiaAmounts: amounts,
    californiaAmountLinesAsked: asked,
  };
}
