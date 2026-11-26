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

const ONE_COPY =
  "Each farm rental files its own Form 4835; the engine prints one copy, so a return with more than one needs a preparer for the forms and for Schedule E line 40.";
const JOINT_ON_SEPARATE_RETURN =
  "A jointly owned farm rental on a separate return needs the taxpayer's share, which the fact does not hold.";
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

/* Every line of the form, and Schedule E lines 40 and 42, carry one gap. */
function formGap(reason: string): Form4835FilingInfo {
  const gap: Gap = { gap: reason };
  return { form4835Gap: reason, farmRentalInUse: true, farmRentalNet: gap, farmRentalGross: gap };
}

interface FarmOutcome {
  info: Form4835FilingInfo;
  waitingKeys: string[];
}

/* One farm rental's Form 4835 and the amounts Schedule E reads. */
function farmOutcome(inputs: ResolverInputs, farm: FarmRentalFact): FarmOutcome {
  const lines = partI(farm.value);
  if (isGap(lines)) return { info: formGap(lines.gap), waitingKeys: [] };
  const claimsConservation =
    (farm.value.expenses?.conservation ?? 0) + (farm.value.conservationCarryover ?? 0) > 0;
  const conservationGap =
    claimsConservation && otherFarmingOnReturn(inputs) ? SHARED_CONSERVATION_LIMIT : undefined;
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
    info: {
      form4835: printedForm(farm.value, lines, expenses, result),
      farmRentalInUse: true,
      farmRentalNet: result?.scheduleELine40,
      farmRentalGross: lines.line7,
      farmRentalNonpassive: nonpassive,
    },
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
  if (mustFile.value !== true || (farms.length === 0 && !jointOnSeparate)) return filed;
  if (jointOnSeparate) return { ...filed, ...formGap(JOINT_ON_SEPARATE_RETURN) };
  if (farms.length > 1) return { ...filed, ...formGap(ONE_COPY) };
  const { info, waitingKeys } = farmOutcome(inputs, farms[0]);
  return {
    ...filed,
    ...info,
    missingInputs: {
      "form-4835": missingInputs(Object.fromEntries(waitingKeys.map((key) => [key, undefined]))),
    },
  };
}
