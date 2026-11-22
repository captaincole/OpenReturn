import {
  CLEAN_VEHICLE_KEYS,
  PRIOR_YEAR_KEYS,
  getCleanVehicleFacts,
  type CleanVehicleFact,
  type CleanVehicleK1Credits,
  type CleanVehiclePriorYearAdditions,
} from "../../facts/index.js";
import { missingInputs, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { FilingStatus } from "../../values.js";
import type { CleanVehicleAnswers, Form8936FilingInfo } from "./filingInfo.js";
import { FILING_STATUS_CODES } from "./lines.js";
import { TAX_YEAR_PREFIX, passesLines5To7 } from "./scheduleA.js";

const isFilingStatus = (value: unknown): value is FilingStatus =>
  typeof value === "string" && value in FILING_STATUS_CODES;

function answersOf(inputs: ResolverInputs): CleanVehicleAnswers {
  const status = inputs.factByKey.get(CLEAN_VEHICLE_KEYS.priorYearFilingStatus);
  const dependent = inputs.factByKey.get(CLEAN_VEHICLE_KEYS.claimableAsDependent);
  return {
    agi2024: num(inputs, PRIOR_YEAR_KEYS.federalAgi),
    status2024: isFilingStatus(status) ? status : undefined,
    additions2024: inputs.factByKey.get(CLEAN_VEHICLE_KEYS.priorYearMagiAdditions) as
      CleanVehiclePriorYearAdditions | undefined,
    puertoRicoExcluded2025: num(inputs, CLEAN_VEHICLE_KEYS.puertoRicoExcludedIncome),
    claimableAsDependent: typeof dependent === "boolean" ? dependent : undefined,
    k1Credits: inputs.factByKey.get(CLEAN_VEHICLE_KEYS.k1Credits) as
      CleanVehicleK1Credits | undefined,
  };
}

const transfers = (vehicle: CleanVehicleFact) => (vehicle.value.creditTransferredToDealer ?? 0) > 0;

/* A new or previously owned vehicle that is not resold reaches Part I (Schedule A lines 8c, 13b). */
const reachesMagiTest = (vehicle: CleanVehicleFact) =>
  vehicle.value.kind !== "commercial" &&
  passesLines5To7(vehicle.value) &&
  vehicle.value.resoldWithin30Days === false;

/* A previously owned vehicle with no credit transferred can reach line 13g. */
const mayReachLine13g = (vehicle: CleanVehicleFact) =>
  reachesMagiTest(vehicle) && vehicle.value.kind === "previously_owned" && !transfers(vehicle);

/*
 * The answers the vehicles may need. The 2024 AGI and filing status count only
 * when the 2025 modified AGI is over the limit (lines 8d, 13c), which the
 * resolver cannot see before Form 1040 line 11a; they are asked whenever a
 * vehicle reaches the test, so the test never waits with nothing to ask.
 */
function requiredAnswers(vehicles: CleanVehicleFact[], answers: CleanVehicleAnswers) {
  const required: Record<string, unknown> = {};
  if (vehicles.some(reachesMagiTest)) {
    required[PRIOR_YEAR_KEYS.federalAgi] = answers.agi2024;
    required[CLEAN_VEHICLE_KEYS.priorYearFilingStatus] = answers.status2024;
  }
  if (vehicles.some(mayReachLine13g)) {
    required[CLEAN_VEHICLE_KEYS.claimableAsDependent] = answers.claimableAsDependent;
  }
  return required;
}

/*
 * Schedule 3 files for lines 6f and 6m when a new or previously owned vehicle
 * kept its credit for the return; Schedule 2 files for lines 1b and 1c when a
 * credit went to the dealer and may have to be repaid. The resolver cannot see
 * modified AGI, so a schedule may file with those lines blank (KNOWN GAP, as
 * Schedule 2 has for Form 6251).
 */
export function cleanVehicleSchedules(inputs: ResolverInputs): {
  personalCredit: boolean;
  repayment: boolean;
} {
  const info = resolve8936Info(inputs);
  const vehicles = (info.cleanVehicles ?? []).filter((vehicle) => passesLines5To7(vehicle.value));
  return {
    personalCredit: vehicles.some(
      (vehicle) => vehicle.value.kind !== "commercial" && !transfers(vehicle),
    ),
    repayment: vehicles.some(
      (vehicle) => vehicle.value.kind !== "commercial" && transfers(vehicle),
    ),
  };
}

/*
 * A general business credit for Form 3800: a new vehicle with business use
 * (line 8, "report this amount on Form 3800, Part III, line 1y"), a commercial
 * vehicle (line 21, "... line 1aa"), or a K-1 clean vehicle credit
 * (irs-8936-inst-2025::sec::use-parts-i-ii-and-iii-of-schedule-a-form-8936-to::b01).
 * The resolver cannot see modified AGI, so Form 3800 may file for a credit
 * that line 8 leaves at 0 (KNOWN GAP, as Schedule 3 has for lines 6f and 6m).
 */
export function cleanVehicleBusinessCredit(inputs: ResolverInputs): boolean {
  const k1 = inputs.factByKey.get(CLEAN_VEHICLE_KEYS.k1Credits) as
    CleanVehicleK1Credits | undefined;
  if ((k1?.newVehicleCodeAY ?? 0) > 0 || (k1?.commercialCodeAZ ?? 0) > 0) return true;
  const businessUse = (vehicle: CleanVehicleFact) =>
    vehicle.value.kind === "new" &&
    !transfers(vehicle) &&
    (vehicle.value.businessUsePercent ?? 0) > 0;
  return (resolve8936Info(inputs).cleanVehicles ?? []).some(
    (vehicle) =>
      passesLines5To7(vehicle.value) &&
      (vehicle.value.kind === "commercial" || businessUse(vehicle)),
  );
}

/*
 * Who files: a taxpayer with a clean vehicle placed in service in 2025, and
 * always one who transferred the credit to the dealer
 * (irs-8936-inst-2025::sec::general-instructions::b01; what-s-new::b02). A
 * credit only from a partnership or S corporation needs no Form 8936
 * (use-parts-i-ii-and-iii-of-schedule-a-form-8936-to::b01). The explicit decision still wins.
 */
export function resolve8936Info(inputs: ResolverInputs): Form8936FilingInfo {
  const vehicles = getCleanVehicleFacts(inputs.facts).filter((vehicle) =>
    vehicle.value.placedInServiceDate.startsWith(TAX_YEAR_PREFIX),
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8936",
    fallbacks: [
      {
        rule: `fallback: ${vehicles.length} clean vehicle(s) placed in service in 2025`,
        value: vehicles.length > 0,
        triggeredByFactKeys: vehicles.map((vehicle) => vehicle.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8936": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8936": [] } };
  const answers = answersOf(inputs);
  return {
    ...filed,
    missingInputs: { "form-8936": missingInputs(requiredAnswers(vehicles, answers)) },
    cleanVehicles: vehicles,
    cleanVehicleAnswers: answers,
  };
}
