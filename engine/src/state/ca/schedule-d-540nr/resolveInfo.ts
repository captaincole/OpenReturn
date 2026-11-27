import { CA_CAPITAL_LOSS_CARRYOVER_KEY } from "../../../facts/index.js";
import { resolve4797Info } from "../../../federal/4797/resolveInfo.js";
import { missingInputs, num, type ResolverInputs } from "../../../resolverInputs.js";
import { asFullYearResident, formOnly540Gap } from "../540nr/californiaForms.js";
import type { CaliforniaSection1231Gain } from "../schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "../schedule-d-1/resolveInfo.js";
import { capitalFiguresWith, federalCapitalLossCarryover } from "../schedule-d-ca/resolveInfo.js";
import type { ScheduleD540NRFilingInfo } from "./filingInfo.js";
import { withSourceGaps, type ScheduleD540NRFigures } from "./lines.js";
import { scheduleD540NRMustFile } from "./mustFile.js";
import { federalSourcesNotCarried } from "./sources.js";

/*
 * Line 1's section 1231 row: "Forms 540 and 540NR filers, enter the gain on
 * Schedule D (540 or 540NR), line 1" (Schedule D-1, under lines 7 and 9). The
 * schedule reports gains "as if they were full-year residents" (::purpose::b01),
 * so the gain is Schedule D-1's for the same facts on a resident's return. When
 * that return would file Schedule D-1 (its gain is not the federal one), this
 * return needs it, and the engine figures it for Form 540 only: a gap. Else
 * Schedule D-1 does not file and its gain is the federal Form 4797 gain.
 */
function section1231AsResident(inputs: ResolverInputs): {
  gain: CaliforniaSection1231Gain | undefined;
  gap: string | undefined;
} {
  if (resolve4797Info(inputs).mustFile?.["form-4797"]?.value !== true) {
    return { gain: undefined, gap: undefined };
  }
  const resident = resolveScheduleD1Info(asFullYearResident(inputs));
  if (resident.mustFile?.["schedule-d-1"]?.value === true) {
    return {
      gain: undefined,
      gap: `${formOnly540Gap("schedule-d-1")} Line 1 takes its section 1231 gain.`,
    };
  }
  return { gain: resident.californiaSection1231Gain, gap: undefined };
}

/* Lines 1 to 9 and 11, with the gap of an amount the lines cannot carry. */
function figuresOf(
  inputs: ResolverInputs,
  carryover: number | undefined,
  carryoverMissing: boolean,
): ScheduleD540NRFigures {
  const sources = federalSourcesNotCarried(inputs);
  const section1231 = section1231AsResident(inputs);
  const figures = capitalFiguresWith(inputs, carryover, carryoverMissing, section1231.gain);
  return withSourceGaps(figures, sources.gap ?? section1231.gap, sources.line2Gap);
}

/*
 * Schedule D (540NR): who files (mustFile.ts), line 6's question, and lines 1
 * to 11. Line 6 is asked as on Schedule D (540): when the federal return
 * carries a loss over and no California amount is stated
 * (ca-540nr-sched-d-inst-2025::sec::line-6-california-capital-loss-carryover-from-2024::b01).
 */
export function resolveScheduleD540NRInfo(inputs: ResolverInputs): ScheduleD540NRFilingInfo {
  const resolution = scheduleD540NRMustFile(inputs);
  const files = resolution.value === true;
  const californiaCarryover = num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY);
  const asked =
    files && federalCapitalLossCarryover(inputs) > 0
      ? missingInputs({ [CA_CAPITAL_LOSS_CARRYOVER_KEY]: californiaCarryover })
      : [];
  const base = {
    mustFile: { "schedule-d-540nr": resolution },
    missingInputs: { "schedule-d-540nr": asked },
  };
  if (!files) return base;
  return {
    ...base,
    scheduleD540NRFigures: figuresOf(inputs, californiaCarryover, asked.length > 0),
  };
}
