import { getElectricVehiclePassiveCreditFacts } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Carryover } from "../3800/credits.js";
import { worksheetOf } from "../8582-cr/worksheets.js";
import type { Form8834FilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8834";

/*
 * The row's name on Form 8582-CR. It is not a Form 3800 line: the qualified
 * electric vehicle credit is not a general business credit, and Form 3800
 * never sees the row. Worksheets 1 to 4 read the line only to find a
 * low-income housing or rehabilitation credit, which this is not.
 */
export const ELECTRIC_VEHICLE_ROW = "8834";
/* "available for certain vehicles placed in service before 2007" (face-page-1::b01): no printed line reads the year. */
const LAST_YEAR_OF_CREDIT = 2006;

/* The prior year unallowed credits with an amount, as Form 8582-CR rows (column (b)). */
export function electricVehicleCarryoversOf(inputs: ResolverInputs): Carryover[] {
  return getElectricVehiclePassiveCreditFacts(inputs.facts)
    .filter((fact) => roundDollars(fact.value.amount) > 0)
    .map(({ key, value }) => ({
      line: ELECTRIC_VEHICLE_ROW,
      key,
      originYear: LAST_YEAR_OF_CREDIT,
      amount: roundDollars(value.amount),
      passive: true,
      activity: value.activity,
      changed: false,
    }));
}

/*
 * A carryover whose activity does not choose its worksheet yet (rental real
 * estate with the active participation answer missing): the fact is asked
 * again, as Form 8582-CR asks it.
 */
const activityMissing = (carryover: Carryover) =>
  carryover.activity === undefined ||
  (carryover.activity.publiclyTradedPartnership !== true &&
    worksheetOf(carryover.line, carryover.activity, false) === undefined);

/*
 * Who files: "Use Form 8834 to claim any qualified electric vehicle passive
 * activity credit allowed for the current tax year"
 * (irs-8834-form-2025::sec::purpose-of-form::b01). A prior year unallowed
 * credit stated as a fact files it; the form leaves the return when Form
 * 8582-CR allows none (filesOnlyWithAmountOn, bindings.ts). The explicit
 * decision still wins.
 */
export function resolve8834Info(inputs: ResolverInputs): Form8834FilingInfo {
  const carryovers = electricVehicleCarryoversOf(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${carryovers.length} prior year unallowed qualified electric vehicle passive credit(s)`,
        value: carryovers.length > 0,
        triggeredByFactKeys: carryovers.map((carryover) => carryover.key),
      },
    ],
  });
  const missing =
    mustFile.value === true
      ? carryovers.filter(activityMissing).map((carryover) => carryover.key)
      : [];
  return {
    mustFile: { "form-8834": mustFile },
    missingInputs: { "form-8834": missing },
    electricVehiclePassiveCarryovers: carryovers,
  };
}
