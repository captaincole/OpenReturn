import {
  getArmedForcesMoveFacts,
  getCaWorkMoveFacts,
  type ArmedForcesMoveFact,
  type CaWorkMoveFact,
  type CaWorkMoveFactValue,
} from "../../../facts/index.js";
import { namesBothVehicleMethods } from "../../../federal/3903/lines.js";
import { codePTotal } from "../../../federal/3903/resolveInfo.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3913FilingInfo } from "./filingInfo.js";
import {
  caTravelExpenses,
  form3913Lines,
  meetsDistanceTest,
  scheduleCaLine14Addition,
  scheduleCaLine1hAddition,
  type Form3913Lines,
  type MoveForm,
} from "./lines.js";

const ONE_COPY =
  "Each move files its own FTB 3913 (ca-3913-inst-2025::sec::a-purpose::b01); the engine prints one copy, so a return with more than one move needs a preparer for the forms.";
const BOTH_METHODS =
  "The move states both vehicle methods (miles and gas and oil); line 2 takes one (ca-3913-inst-2025::sec::line-2::b01), and the engine does not choose.";
const SPLIT_CODE_P =
  "More than one military move, and a move does not state its government reimbursements: the W-2 box 12 code P total cannot be split among the forms FTB 3913.";

const CALIFORNIA_RETURN_KEYS = [
  "decisions.scope.must_file_ca_540",
  "decisions.scope.must_file_540nr",
] as const;

/* One move's FTB 3913: its lines, the reason it cannot be figured, or undefined while an answer waits. */
interface FiguredMove {
  factKey: string;
  military: boolean;
  result: Form3913Lines | string | undefined;
}

/*
 * A military move. Line 4 is the stated amount; else the W-2 box 12 code P
 * total, which belongs to the move only when it is the return's one military
 * move ("This excluded amount should be identified on federal Form W-2, box 12,
 * with code P", ca-3913-inst-2025::sec::line-4::b01).
 */
function militaryMove(move: ArmedForcesMoveFact, codeP: number | undefined): FiguredMove {
  const { value } = move;
  const figure = () => {
    if (namesBothVehicleMethods(value.travel)) return BOTH_METHODS;
    const line4 = value.governmentReimbursements ?? codeP;
    if (line4 === undefined) return SPLIT_CODE_P;
    return form3913Lines({
      householdGoods: value.householdGoods,
      travel: caTravelExpenses(value.travel),
      governmentReimbursements: line4,
      excludedAllowances: value.excludedAllowances,
    });
  };
  return { factKey: move.key, military: true, result: figure() };
}

/*
 * A work move files when it meets the distance test and the time test is not
 * failed: "you must meet both the distance and time tests ... prior to
 * completing line 1 through line 5" (ca-3913-inst-2025::sec::non-military-members::b01);
 * the worksheet's No: "Do not complete form FTB 3913" (distance-test-worksheet::b01).
 * Miles not stated yet: the form files and waits.
 */
function qualifies(move: CaWorkMoveFact): boolean {
  const {
    milesOldHomeToNewWorkplace: miles,
    milesOldHomeToOldWorkplace,
    meetsTimeTest,
  } = move.value;
  if (meetsTimeTest === false) return false;
  return typeof miles !== "number" || meetsDistanceTest(miles, milesOldHomeToOldWorkplace);
}

/* Lines 1 to 5 wait for the distance, the time test and line 4. */
function waitsForAnswer(value: CaWorkMoveFactValue): boolean {
  return (
    typeof value.milesOldHomeToNewWorkplace !== "number" ||
    value.meetsTimeTest === undefined ||
    value.employerPaidNotInWages === undefined
  );
}

function workMove(move: CaWorkMoveFact): FiguredMove {
  const { value } = move;
  const figure = () => {
    if (namesBothVehicleMethods(value.travel)) return BOTH_METHODS;
    if (waitsForAnswer(value)) return undefined;
    return form3913Lines({
      householdGoods: value.householdGoods,
      travel: caTravelExpenses(value.travel),
      governmentReimbursements: value.employerPaidNotInWages ?? 0,
    });
  };
  return { factKey: move.key, military: false, result: figure() };
}

/* The one copy the engine prints. */
function printedCopy(moves: FiguredMove[]): Partial<Form3913FilingInfo> {
  if (moves.length !== 1) return { form3913Gap: ONE_COPY };
  const { military, result } = moves[0];
  if (typeof result === "string") return { form3913Military: military, form3913Gap: result };
  return { form3913Military: military, form3913: result };
}

/* The Schedule CA (540) amounts: every non-military form, figured. */
function scheduleCaAmounts(moves: FiguredMove[]): Partial<Form3913FilingInfo> {
  const work = moves.filter((move) => !move.military);
  const gap = work.map((move) => move.result).find((result) => typeof result === "string");
  if (gap !== undefined) return { caMovingTotalsGap: gap };
  if (work.some((move) => move.result === undefined)) return { caMovingWaits: true };
  const forms: MoveForm[] = work.map((move) => ({
    military: false,
    lines: move.result as Form3913Lines,
  }));
  return {
    caMovingExpenseDeduction: scheduleCaLine14Addition(forms),
    caMovingReimbursementExcess: scheduleCaLine1hAddition(forms),
  };
}

/*
 * Who files (ca-3913-inst-2025::sec::a-purpose::b01; important-information::b01):
 * a California return (Form 540 or 540NR) with a move for a new workplace that
 * meets the tests, or a military move by a permanent change of station that the
 * member certifies (Schedule CA (540) instructions: "Non-military and military
 * taxpayers, prepare form FTB 3913", line-11-through-line-25::b01). The explicit
 * decision still wins.
 */
export function resolve3913Info(inputs: ResolverInputs): Form3913FilingInfo {
  const military = getArmedForcesMoveFacts(inputs.facts).filter(
    (move) => move.value.certifiesRequirements === true,
  );
  const work = getCaWorkMoveFacts(inputs.facts).filter(qualifies);
  const californiaReturn = CALIFORNIA_RETURN_KEYS.some(
    (key) => inputs.decisionByKey.get(key) === true,
  );
  const moveKeys = [...military, ...work].map((move) => move.key);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3913",
    fallbacks: [
      {
        rule: `fallback: a California return files (${californiaReturn}) with ${moveKeys.length} qualifying move(s): a certified Armed Forces move, or a work move that meets the distance and time tests`,
        value: californiaReturn && moveKeys.length > 0,
        triggeredByFactKeys: moveKeys,
        triggeredByDecisionKeys: [...CALIFORNIA_RETURN_KEYS],
      },
    ],
  });
  const filed = { mustFile: { "form-3913": mustFile } };
  if (mustFile.value !== true || moveKeys.length === 0) {
    return { ...filed, missingInputs: { "form-3913": [] } };
  }
  const codeP = military.length === 1 ? codePTotal(inputs) : undefined;
  const moves = [...military.map((move) => militaryMove(move, codeP)), ...work.map(workMove)];
  return {
    ...filed,
    missingInputs: {
      "form-3913": moves.filter((move) => move.result === undefined).map((move) => move.factKey),
    },
    ...printedCopy(moves),
    ...scheduleCaAmounts(moves),
  };
}
