import {
  CA_LUMP_SUM_OWN_KEY,
  getCaLumpSumDistributionFacts,
  isCompleteCaLumpSumDistribution,
  isCorrectiveDistribution,
  isDisabilityPension,
  isEmployerPlanDistribution,
  makeRetirementDistributionFactKey,
  qualifiesForScheduleG1,
  type CaLumpSumDistributionFact,
  type CaLumpSumDistributionFactValue,
  type RetirementDistributionFactValue,
} from "../../../facts/index.js";
import { sum } from "../../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { ScheduleG1Figures, ScheduleG1FilingInfo } from "./filingInfo.js";
import {
  DEATH_BENEFIT_EXCLUSION_LIMIT,
  amountTaxedOnScheduleG1,
  type ScheduleG1Inputs,
} from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_g_1";
const FILES_540_KEY = "decisions.scope.must_file_ca_540";
const WHOLE = 100;

const ONE_SCHEDULE = unsupported(
  "Each plan participant files a separate Schedule G-1 (ca-540-sched-g1-inst-2025::sec::d-how-often-you-can-choose::b01), and spouses who each received one file one each (::specific-line-instructions::b01); the engine fills one schedule.",
);
const NOT_QUALIFIED_PLAN = unsupported(
  "A named Form 1099-R is from an IRA or is a corrective distribution, which is not a qualified lump-sum distribution (irs-4972-form-2025::sec::distributions-that-don-t-qualify-for::b01, b02).",
);
const NO_TAXABLE_AMOUNT = unsupported(
  "Form 1099-R box 2a is blank: the taxable amount must be figured first by Pub. 575 (irs-4972-form-2025::sec::line-8::b01), which the engine does not model.",
);
const PERCENTS_DIFFER = unsupported(
  "The named Forms 1099-R show different percentages in box 8 or box 9a, or a percentage of 0; the multiple-recipient computation (ca-540-sched-g1-inst-2025::sec::multiple-recipients-of-a-lump-sum-distribution::b01) needs one percentage above 0.",
);
const BASIS_WITH_WORKSHEETS = unsupported(
  "A California taxable amount (FTB Pub. 1005, Worksheet I) together with the NUA election or a death benefit exclusion: neither the schedule's instructions nor Pub. 1005 say how the worksheets use it.",
);
const CA_BASIS_ADJUSTMENT = unsupported(
  "A California taxable amount that differs from box 2a (FTB Pub. 1005): the Schedule CA adjustment for the basis difference is not modeled.",
);
const NOT_ON_LINE_5B = unsupported(
  "A named Form 1099-R is a disability pension (code 3), which Form 1040 may report on line 1h instead of line 5b; the Schedule CA adjustment is not figured.",
);

/* The one percentage the 1099-Rs share; 100 when none prints it. Undefined when they differ or show 0. */
function sharedPercent(values: Array<number | undefined>): number | undefined {
  const percents = [...new Set(values.map((value) => value ?? WHOLE))];
  return percents.length === 1 && percents[0] > 0 ? percents[0] : undefined;
}

function inputsOf(
  answers: CaLumpSumDistributionFactValue,
  rows: RetirementDistributionFactValue[],
): ScheduleG1Inputs | Unsupported {
  if (!rows.every(isEmployerPlanDistribution) || rows.some(isCorrectiveDistribution)) {
    return NOT_QUALIFIED_PLAN;
  }
  if (rows.some((row) => row.box2a === undefined)) return NO_TAXABLE_AMOUNT;
  const annuityPercent = sharedPercent(rows.map((row) => row.box8Percent));
  const distributionPercent = sharedPercent(rows.map((row) => row.box9a));
  if (annuityPercent === undefined || distributionPercent === undefined) return PERCENTS_DIFFER;
  const exclusion = answers.deathBenefitExclusion;
  const worksheets = answers.includeNua === true || exclusion !== undefined;
  if (answers.californiaTaxableAmount !== undefined && worksheets) return BASIS_WITH_WORKSHEETS;
  const annuities = rows.filter((row) => row.box8 !== undefined);
  return {
    capitalGainElection: answers.capitalGainElection,
    tenYearAveraging: answers.tenYearAveraging,
    includeNua: answers.includeNua === true,
    taxableAmount: sum(...rows.map((row) => row.box2a)),
    capitalGain: sum(...rows.map((row) => row.box3)),
    nua: sum(...rows.map((row) => row.box6)),
    annuityValue: annuities.length === 0 ? undefined : sum(...annuities.map((row) => row.box8)),
    annuityPercent,
    distributionPercent,
    deathBenefitExclusion:
      exclusion === undefined ? undefined : Math.min(exclusion, DEATH_BENEFIT_EXCLUSION_LIMIT),
    californiaTaxableAmount: answers.californiaTaxableAmount,
  };
}

interface Resolved {
  figures?: ScheduleG1Figures | Unsupported;
  missing: string[];
  rows: RetirementDistributionFactValue[];
}

/* The one schedule's figures, or the answers it waits for. */
function resolveOne(inputs: ResolverInputs, fact: CaLumpSumDistributionFact): Resolved {
  if (!isCompleteCaLumpSumDistribution(fact.value)) return { missing: [fact.key], rows: [] };
  const keys = fact.value.distributions.map((ref) =>
    makeRetirementDistributionFactKey(ref.payerSlug, ref.distributionId),
  );
  const missing = keys.filter((key) => inputs.factByKey.get(key) === undefined);
  if (missing.length > 0) return { missing, rows: [] };
  const rows = keys.map((key) => inputs.factByKey.get(key) as RetirementDistributionFactValue);
  const figured = inputsOf(fact.value, rows);
  const figures = "unsupported" in figured ? figured : { answers: fact.value, inputs: figured };
  return { figures, missing: [], rows };
}

function resolveFacts(inputs: ResolverInputs, facts: CaLumpSumDistributionFact[]): Resolved {
  if (facts.length === 0) return { missing: [CA_LUMP_SUM_OWN_KEY], rows: [] };
  if (facts.length > 1) return { figures: ONE_SCHEDULE, missing: [], rows: [] };
  return resolveOne(inputs, facts[0]);
}

/* A stated choice of Schedule G-1: complete, qualified by Part I and with an election; or not complete yet. */
function choosesScheduleG1(fact: CaLumpSumDistributionFact): boolean {
  const { value } = fact;
  if (!isCompleteCaLumpSumDistribution(value)) return true;
  return qualifiesForScheduleG1(value) && (value.capitalGainElection || value.tenYearAveraging);
}

/* Schedule CA line 5b, column B, when Form 4972 does not file (schedule-ca/lumpSum.ts checks that). */
function caSubtraction(resolved: Resolved): ScheduleG1FilingInfo["scheduleG1CaSubtraction"] {
  const figures = resolved.figures;
  if (figures === undefined || "unsupported" in figures) return figures;
  if (figures.inputs.californiaTaxableAmount !== undefined) return CA_BASIS_ADJUSTMENT;
  if (resolved.rows.some(isDisabilityPension)) return NOT_ON_LINE_5B;
  return amountTaxedOnScheduleG1(figures.inputs);
}

/*
 * Who files: a qualified lump-sum distribution of a participant born before
 * January 2, 1936, that the taxpayer chooses to tax on the schedule
 * (ca-540-sched-g1-inst-2025::sec::b-who-can-use-the-form::b01, ::c-how-to-use-the-form::b01),
 * with Form 540. The explicit decision still wins.
 */
export function resolveScheduleG1Info(inputs: ResolverInputs): ScheduleG1FilingInfo {
  const facts = getCaLumpSumDistributionFacts(inputs.facts);
  const chosen = facts.filter(choosesScheduleG1);
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and ${chosen.length} lump-sum distribution(s) chosen for Schedule G-1`,
        value: files540 && chosen.length > 0,
        triggeredByFactKeys: chosen.map((fact) => fact.key),
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
  const info: ScheduleG1FilingInfo = { mustFile: { "schedule-g-1": mustFile } };
  if (mustFile.value !== true) return { ...info, missingInputs: { "schedule-g-1": [] } };
  const resolved = resolveFacts(inputs, facts);
  return {
    ...info,
    missingInputs: { "schedule-g-1": resolved.missing },
    scheduleG1: resolved.figures,
    scheduleG1CaSubtraction: caSubtraction(resolved),
  };
}
