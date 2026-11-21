import {
  getArmedForcesMoveFacts,
  isW2FactKey,
  type ArmedForcesMoveFact,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form3903FilingInfo } from "./filingInfo.js";
import {
  excessReimbursements,
  form3903Lines,
  movingExpenseDeduction,
  namesBothVehicleMethods,
  travelExpenses,
  type Form3903Lines,
} from "./lines.js";

/* W-2 box 12 code P: excludable moving expense reimbursements (irs-w2w3-inst-2025::sec::specific-instructions-for-form-w-2::b31). */
const MOVING_REIMBURSEMENT_CODE = "P";

const ONE_COPY =
  "Each move files its own Form 3903 (irs-3903-inst-2025::sec::purpose-of-form::b01); the engine prints one copy, so a return with more than one move needs a preparer for the forms.";
const BOTH_METHODS =
  "The move states both vehicle methods (miles and gas and oil); line 2 takes one (irs-3903-inst-2025::sec::line-2::b01), and the engine does not choose.";
const SPLIT_CODE_P =
  "More than one move, and a move does not state its government reimbursements: the W-2 box 12 code P total cannot be split among the Forms 3903.";

/* The code P amounts on every W-2 of the return, cents kept; 0 with none. */
function codePTotal(inputs: ResolverInputs): number {
  const entries = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .flatMap((row) => (row.value as W2FactValue).box12 ?? [])
    .filter((entry) => entry.code.toUpperCase() === MOVING_REIMBURSEMENT_CODE);
  return sum(...entries.map((entry) => entry.amount));
}

/*
 * One move's Form 3903, or why it cannot be figured. Line 4 is the stated
 * amount; else the code P total, which belongs to the move only when it is the
 * return's one move (irs-3903-inst-2025::sec::line-4::b01: "This excluded amount
 * should be identified on Form W-2, box 12, with code P").
 */
function moveForm(move: ArmedForcesMoveFact, codeP: number | undefined): Form3903Lines | string {
  const { value } = move;
  if (namesBothVehicleMethods(value.travel)) return BOTH_METHODS;
  const governmentReimbursements = value.governmentReimbursements ?? codeP;
  if (governmentReimbursements === undefined) return SPLIT_CODE_P;
  return form3903Lines({
    householdGoods: value.householdGoods,
    travel: travelExpenses(value.travel),
    governmentReimbursements,
    excludedAllowances: value.excludedAllowances,
  });
}

/*
 * Who files: a member of the Armed Forces on active duty who moves by a military
 * order because of a permanent change of station
 * (irs-3903-inst-2025::sec::purpose-of-form::b01). A move fact the member
 * certifies files the form; the explicit decision still wins.
 */
export function resolve3903Info(inputs: ResolverInputs): Form3903FilingInfo {
  const moves = getArmedForcesMoveFacts(inputs.facts).filter(
    (move) => move.value.certifiesRequirements === true,
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3903",
    fallbacks: [
      {
        rule: `fallback: ${moves.length} certified Armed Forces move(s)`,
        value: moves.length > 0,
        triggeredByFactKeys: moves.map((move) => move.key),
      },
    ],
  });
  const filed = { mustFile: { "form-3903": mustFile } };
  if (mustFile.value !== true || moves.length === 0) return filed;
  const codeP = moves.length === 1 ? codePTotal(inputs) : undefined;
  const forms = moves.map((move) => moveForm(move, codeP));
  const gap = forms.find((form): form is string => typeof form === "string");
  const figured = forms.filter((form): form is Form3903Lines => typeof form !== "string");
  const printed = moves.length === 1 ? figured[0] : undefined;
  return {
    ...filed,
    form3903: printed,
    form3903Gap: moves.length > 1 ? ONE_COPY : gap,
    movingTotalsGap: gap,
    movingExpenseDeduction: gap ? undefined : movingExpenseDeduction(figured),
    movingReimbursementExcess: gap ? undefined : excessReimbursements(figured),
  };
}
