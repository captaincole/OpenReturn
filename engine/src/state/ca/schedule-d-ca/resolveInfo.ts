import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  isDividendFactKey,
} from "../../../facts/index.js";
import { form6252TotalsOf } from "../../../federal/6252/resolveInfo.js";
import { sum } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { form3805ETotalsOf } from "../3805e/resolveInfo.js";
import type { CaliforniaSection1231Gain } from "../schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "../schedule-d-1/resolveInfo.js";
import type { ScheduleDCaFilingInfo } from "./filingInfo.js";
import { scheduleDCaFigures, type InstallmentRow, type ScheduleDCaFigures } from "./lines.js";
import { salesWithBases, scheduleDCaMustFile } from "./mustFile.js";

const INSTALLMENT_SALE_GAP =
  "Federal Schedule D holds a Form 6252 capital asset gain, which line 10 includes. California's gain goes on line 1 from FTB 3805E line 26 or 37 (ca-3805e-inst-2025::sec::line-26-and-line-37::b01), and FTB 3805E does not file (its decision says no).";

/*
 * A Form 6252 capital asset sale sends its gain to federal Schedule D line 4 or
 * 11, so line 10 holds it. Its California amount is an FTB 3805E row on line 1
 * (3805e/totals.ts). FTB 3805E files whenever this schedule does and such a
 * sale exists; when its decision says no, the row is missing, and lines 4 to
 * 12b are a gap rather than subtract the whole gain on Schedule CA.
 */
function installmentRows(inputs: ResolverInputs): {
  rows: InstallmentRow[];
  gap: string | undefined;
} {
  const totals = form3805ETotalsOf(inputs);
  if (totals !== undefined) {
    const gap = totals.gap;
    return { rows: totals.scheduleDRows, gap };
  }
  const federal = form6252TotalsOf(inputs);
  const sendsGain = federal?.scheduleDLine4 !== undefined || federal?.scheduleDLine11 !== undefined;
  return { rows: [], gap: sendsGain ? INSTALLMENT_SALE_GAP : undefined };
}

/* The federal capital loss carryover from 2024, short and long term added. */
export function federalCapitalLossCarryover(inputs: ResolverInputs): number {
  return sum(...Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).map((key) => num(inputs, key)));
}

/*
 * Lines 1 to 9 and 11 from the return's sales, FTB 3805E rows, capital gain
 * distributions, Schedule D-1 gain and the line 6 carryover given. FTB 3805V
 * reads them too, also when this schedule does not file.
 */
export function californiaCapitalFigures(
  inputs: ResolverInputs,
  carryover: number | undefined,
  carryoverMissing: boolean,
): ScheduleDCaFigures {
  // California's section 1231 gain (Schedule D-1), figured when Form 4797 files on a Form 540 return.
  const section1231 = resolveScheduleD1Info(inputs).californiaSection1231Gain;
  return capitalFiguresWith(inputs, carryover, carryoverMissing, section1231);
}

/*
 * The same lines with the Schedule D-1 gain given. Schedule D (540NR) gives
 * the gain a full-year resident would have (schedule-d-540nr/resolveInfo.ts).
 */
export function capitalFiguresWith(
  inputs: ResolverInputs,
  carryover: number | undefined,
  carryoverMissing: boolean,
  section1231: CaliforniaSection1231Gain | undefined,
): ScheduleDCaFigures {
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  const installments = installmentRows(inputs);
  const figures = scheduleDCaFigures({
    sales: salesWithBases(inputs).map((sale) => sale.sale),
    installmentRows: installments.rows,
    capitalGainDistributions: distributions > 0 ? distributions : undefined,
    californiaCarryover: carryover !== undefined && carryover > 0 ? carryover : undefined,
    californiaCarryoverMissing: carryoverMissing,
    filingStatus: filingStatusOf(inputs),
    section1231Gain: section1231?.gap === undefined ? section1231?.gain : undefined,
    section1231Waits: section1231?.waits,
    section1231Gap: section1231?.gap && `Schedule D-1: ${section1231.gap}`,
  });
  return { ...figures, gap: figures.gap ?? installments.gap };
}

/* Schedule D (540): who files (mustFile.ts), line 6's question, and lines 1 to 11. */
export function resolveScheduleDCaInfo(inputs: ResolverInputs): ScheduleDCaFilingInfo {
  const resolution = scheduleDCaMustFile(inputs);
  const files = resolution.value === true;
  const federalCarryover = federalCapitalLossCarryover(inputs);
  const californiaCarryover = num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY);
  /* Line 6 (::line-6-…::b01): asked when the federal return carries a loss over and no California amount is stated. */
  const asked =
    files && federalCarryover > 0
      ? missingInputs({ [CA_CAPITAL_LOSS_CARRYOVER_KEY]: californiaCarryover })
      : [];
  if (!files) {
    return {
      mustFile: { "schedule-d-ca": resolution },
      missingInputs: { "schedule-d-ca": asked },
    };
  }
  return {
    mustFile: { "schedule-d-ca": resolution },
    missingInputs: { "schedule-d-ca": asked },
    scheduleDCaFigures: californiaCapitalFigures(inputs, californiaCarryover, asked.length > 0),
  };
}
