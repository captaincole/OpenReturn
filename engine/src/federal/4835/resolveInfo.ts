import { getFarmRentalFacts, RENTAL_KEYS, type FarmRentalFact } from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { resolve8582Info } from "../8582/resolveInfo.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { booleanFact, spousePropertiesOnReturn } from "../rentals/passive.js";
import { resolveScheduleFInfo } from "../schedule-f/resolveInfo.js";
import { farmTotals, type FarmOutcome } from "./farmTotals.js";
import type { Form4835FilingInfo } from "./filingInfo.js";
import { grossIncomeFromFarming, isGap, partI, partII, type Gap } from "./lines.js";
import { printedForm } from "./printed.js";
import {
  farmRentalResult,
  isNonpassive,
  type Form4835Result,
  type Form8582State,
  type ResultAnswer,
  type ResultContext,
} from "./result.js";

const MUST_FILE_KEY = "decisions.scope.must_file_4835";
const MUST_FILE_8582_KEY = "decisions.scope.must_file_8582";

const JOINT_ON_SEPARATE_RETURN =
  "A jointly owned farm rental on a separate return needs the taxpayer's share, which the fact does not hold.";
const NO_FARM_RENTAL = "Form 4835 files by decision, but no farm rental fact gives its amounts.";
const SHARED_CONSERVATION_LIMIT =
  "Line 10: the 25% limit is on all gross income from farming, and Schedule F or a Schedule K-1 also has farming on this return; the instructions do not say how the limit is split (irs-pub-225-2025::sec::assessment-for-depreciable::b07).";

/* The farm rentals on this return: a spouse's farm is on it only when filing jointly. */
function farmsOnReturn(inputs: ResolverInputs) {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const all = getFarmRentalFacts(inputs.facts);
  const owner = (farm: FarmRentalFact) => farm.value.owner ?? "taxpayer";
  return {
    farms: all.filter((farm) => joint || owner(farm) !== "spouse"),
    jointOnSeparate: !joint && all.some((farm) => owner(farm) === "joint"),
  };
}

/* Schedule F or a K-1's gross farming income shares line 10's limit (assessment-for-depreciable::b07). */
function otherFarmingOnReturn(inputs: ResolverInputs): boolean {
  if (resolveScheduleFInfo(inputs).mustFile?.["schedule-f"]?.value === true) return true;
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return passThroughEntitiesOnReturn(inputs.facts, joint).entities.some((entity) =>
    entity.items.some((item) => item.type === "gross_farming_fishing_income"),
  );
}

/* The decision wins; else Form 8582 files for another activity; else it is open. */
function form8582State(inputs: ResolverInputs): Form8582State {
  if (inputs.decisionByKey.get(MUST_FILE_8582_KEY) === false) return "exception";
  return resolve8582Info(inputs).mustFile?.["form-8582"]?.value === true ? "files" : "open";
}

function resultContext(inputs: ResolverInputs, farm: FarmRentalFact): ResultContext {
  return {
    priorYearUnallowedLoss: farm.value.priorYearUnallowedLoss ?? 0,
    activelyParticipated: farm.value.activelyParticipated,
    allInvestmentAtRisk: farm.value.allInvestmentAtRisk,
    realEstateProfessional: booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional)),
    materiallyParticipated: farm.value.materiallyParticipated,
    form8582: form8582State(inputs),
  };
}

/* The keys a waiting line asks for: the farm's own answers are on its fact. */
function answerKeys(farm: FarmRentalFact, answers: ResultAnswer[]): string[] {
  return answers.map((answer) => {
    if (answer === "real_estate_professional") return RENTAL_KEYS.realEstateProfessional;
    if (answer === "form_8582") return MUST_FILE_8582_KEY;
    return farm.key;
  });
}

/* Every line of the one form, and Schedule E lines 40, 42 and 43, carry one gap. */
function formGap(reason: string): Form4835FilingInfo {
  const gap: Gap = { gap: reason };
  return {
    form4835Gap: reason,
    farmRentalInUse: true,
    farmRentalNet: gap,
    farmRentalGross: gap,
    farmRentalLine43: "waits",
  };
}

/* One farm rental whose Part I is a gap: its copy, line 40 part and line 7 carry it. */
function farmGap(farm: FarmRentalFact, reason: string): FarmOutcome {
  const gap: Gap = { gap: reason };
  return {
    copy: { form4835: undefined, form4835Gap: reason },
    summary: { factKey: farm.key, net: gap },
    gross: gap,
    waitingKeys: [],
  };
}

/* One farm rental's Form 4835 and the amounts Schedule E reads. */
function farmOutcome(
  inputs: ResolverInputs,
  farm: FarmRentalFact,
  otherFarming: () => boolean,
): FarmOutcome {
  const lines = partI(farm.value);
  if (isGap(lines)) return farmGap(farm, lines.gap);
  const claimsConservation =
    (farm.value.expenses?.conservation ?? 0) + (farm.value.conservationCarryover ?? 0) > 0;
  const conservationGap =
    claimsConservation && otherFarming() ? SHARED_CONSERVATION_LIMIT : undefined;
  const grossIncome = lines.waitsOnElection
    ? undefined
    : grossIncomeFromFarming(lines.line7 ?? 0, farm.value.breedingLivestockGains);
  const expenses = partII(farm.value, grossIncome, conservationGap);
  const context = resultContext(inputs, farm);
  const result: Form4835Result | undefined = lines.waitsOnElection
    ? undefined
    : farmRentalResult(lines.line7, isGap(expenses) ? expenses : expenses.line31, context);
  const nonpassive = isNonpassive(context);
  // Line 43 asks a real estate professional about material participation even with income.
  const asksParticipation = context.realEstateProfessional === true && nonpassive === undefined;
  const waitingKeys = [
    ...(farm.value.activelyParticipated === undefined || lines.waitsOnElection ? [farm.key] : []),
    ...(asksParticipation ? [farm.key] : []),
    ...answerKeys(farm, result?.waitsOn ?? []),
  ];
  return {
    copy: { form4835: printedForm(farm.value, lines, expenses, result), form4835Gap: undefined },
    summary: { factKey: farm.key, net: result?.scheduleELine40, nonpassive },
    gross: lines.line7,
    waitingKeys,
  };
}

/*
 * Who files (irs-4835-inst-2025::sec::purpose-of-form::b01): a landowner (or
 * sub-lessor) with farm rental income based on crops or livestock produced by
 * the tenant, who did not materially participate for self-employment tax
 * purposes. A farm rental fact is that answer (facts/kinds/farmRental.ts); the
 * explicit decision still wins.
 */
export function resolve4835Info(inputs: ResolverInputs): Form4835FilingInfo {
  const { farms, jointOnSeparate } = farmsOnReturn(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${farms.length} farm rental(s) for crop or livestock shares`,
        value: farms.length > 0 || jointOnSeparate,
        triggeredByFactKeys: farms.map((farm) => farm.key),
      },
    ],
  });
  const filed = { mustFile: { "form-4835": mustFile } };
  if (mustFile.value !== true) return filed;
  if (jointOnSeparate) return { ...filed, ...formGap(JOINT_ON_SEPARATE_RETURN) };
  // The decision alone: the amounts are not known, so every line and Schedule E line 40 show it.
  if (farms.length === 0) return { ...filed, ...formGap(NO_FARM_RENTAL) };
  // Another farm rental's line 7 is gross income from farming too, so it shares line 10's limit.
  const otherFarming = () => farms.length > 1 || otherFarmingOnReturn(inputs);
  const outcomes = farms.map((farm) => farmOutcome(inputs, farm, otherFarming));
  const waitingKeys = [...new Set(outcomes.flatMap((outcome) => outcome.waitingKeys))];
  return {
    ...filed,
    ...farmTotals(outcomes),
    missingInputs: {
      "form-4835": missingInputs(Object.fromEntries(waitingKeys.map((key) => [key, undefined]))),
    },
  };
}
