/*
 * Schedule D-1 for the whole return. Parts I to IV are federal Form 4797 with
 * California amounts (ca-540-sched-d1-inst-2025::sec::a-purpose::b01: "For common
 * examples of items to report on this schedule, see the instructions for federal
 * Form 4797"), so the arithmetic is the federal form's (federal/4797/lines.ts).
 * The line numbers move: D-1 lines 23–32b are 4797 lines 20–29b, lines 33–35 are
 * 30–32, and lines 36–38 are 33–35. Part II Section B (lines 19–21) is
 * California's own: the ordinary gain or loss against federal Schedule 1 line 4.
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): line 30b, the
 * section 1252 percentage of farmland held 10 years or longer. Text A: "Line 30b
 * – Enter 100% of line 30a on line 30b if your property was held for 10 years or
 * longer. If your property was held for less than 10 years, use the same
 * percentage required by federal law" (ca-540-sched-d1-inst-2025::sec::irc-section-1252-property::b01).
 * Text B, the same block: "You may have ordinary income on the disposition of
 * certain farm land held more than one year but less than 10 years", and the
 * federal rule, "Skip line 27 if you dispose of such farmland during the 10th or
 * later year" (irs-4797-inst-2025::sec::line-27::b01). The engine follows Text B
 * (the federal percentage, and no line 30 from the 10th year): 100% for 10 years
 * or more would make old farmland's gain ordinary, which the sentence before it
 * and section 1252 rule out.
 */

import {
  section179RecaptureAmount,
  type Section179RecaptureFactValue,
} from "../../../facts/index.js";
import {
  form4797Lines,
  type Form4797Inputs,
  type Form4797Lines,
  type PartIVColumn,
} from "../../../federal/4797/lines.js";
import { sum } from "../../../money.js";

export interface ScheduleD1Lines extends Form4797Lines {
  /* Line 19: federal Schedule 1 line 4 (Form 4797 line 18b); undefined while blank or waiting. */
  line19?: number;
  /* Line 20: line 18b. */
  line20?: number;
  line21a?: number;
  line21b?: number;
  /* Lines 19–21 wait for a line 8 answer on either return. */
  waitsForLine19Or20: boolean;
}

export interface ScheduleD1Inputs extends Form4797Inputs {
  /* Federal Form 4797 line 18b, which Schedule 1 line 4 copies. */
  federalLine18b?: number;
  /* Federal Form 4797 waits for its line 8 answer. */
  federalWaits: boolean;
}

/*
 * Line 21 (ca-540-sched-d1-inst-2025::sec::part-ii::b03): line 19 more than line
 * 20 is 21a (Schedule CA line 4 column B); line 20 more than line 19 is 21b
 * (column C). A blank line counts as 0; equal lines fill neither.
 */
export function ordinaryAdjustment(
  line19: number | undefined,
  line20: number | undefined,
): { line21a?: number; line21b?: number } {
  const federal = line19 ?? 0;
  const california = line20 ?? 0;
  if (federal > california) return { line21a: federal - california };
  if (california > federal) return { line21b: california - federal };
  return {};
}

/* Parts I to IV with California amounts, then lines 19–21. */
export function scheduleD1Lines(inputs: ScheduleD1Inputs): ScheduleD1Lines {
  const lines = form4797Lines(inputs);
  const waits = inputs.federalWaits || lines.waitsForLine8;
  const line19 = waits ? undefined : inputs.federalLine18b;
  const line20 = waits ? undefined : lines.line18b;
  return {
    ...lines,
    line19,
    line20,
    ...(waits ? {} : ordinaryAdjustment(line19, line20)),
    waitsForLine19Or20: waits,
  };
}

const recaptureTotal = (column: PartIVColumn | undefined): number => column?.line35 ?? 0;

/*
 * The figures that differ from federal Form 4797: line 18b (ordinary), the
 * section 1231 gain that goes to Schedule D, and each Part IV recapture. The
 * schedule files "only if your California gains or losses ... are different
 * from your federal gains or losses" (a-purpose::b01).
 */
export function differsFromFederal(california: Form4797Lines, federal: Form4797Lines): boolean {
  return (
    (california.line18b ?? 0) !== (federal.line18b ?? 0) ||
    (california.scheduleDGain ?? 0) !== (federal.scheduleDGain ?? 0) ||
    recaptureTotal(california.partIV.section179) !== recaptureTotal(federal.partIV.section179) ||
    recaptureTotal(california.partIV.section280f) !== recaptureTotal(federal.partIV.section280f)
  );
}

/* One side of a Schedule CA column pair: what California subtracts or adds. */
export interface CaliforniaDifference {
  subtraction: number;
  addition: number;
  gap?: string;
}

/*
 * Part IV line 38 against federal line 35 for one business's recaptures
 * (part-iv::b03): "If the federal amount is more than the California amount,
 * enter the difference on Schedule CA, column B", else column C. Each property's
 * recapture is figured on its own, at least 0 (the federal partIVColumn).
 */
export function recaptureDifference(
  federal: ReadonlyArray<Section179RecaptureFactValue>,
  california: ReadonlyArray<Section179RecaptureFactValue>,
): CaliforniaDifference {
  const total = (each: ReadonlyArray<Section179RecaptureFactValue>) =>
    sum(...each.map(section179RecaptureAmount));
  const difference = total(federal) - total(california);
  return {
    subtraction: difference > 0 ? difference : 0,
    addition: difference < 0 ? -difference : 0,
  };
}
