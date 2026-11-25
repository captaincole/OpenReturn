/*
 * FTB 3801 Side 2: the California Passive Activity Worksheet (Step 1) and the
 * California Adjustment Worksheets (Step 4).
 */

import type { FieldReader } from "../../../federal/8582/allocation.js";
import type { MagiFields } from "../../../federal/8582/magi.js";
import { sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { californiaAfterLimits, federalAfterLimits } from "./afterLimits.js";
import type { CaScheduleEActivity } from "./californiaRentals.js";
import { contextOf, fromContext, isUnsupportedResult } from "./context.js";
import type { Form3801FilingInfo } from "./filingInfo.js";
import type { Fn } from "./partBindings.js";

/* Rows printed on Side 2 for each worksheet. */
const WORKSHEET_ROWS = 7;

/* Column (b) of the Passive Activity Worksheet: every activity here is on federal Schedule E. */
const FEDERAL_SCHEDULE = "Sch E";
/* Column (c): the California form used for the adjustment (ca-3801-inst-2025::sec::step-1::b01). */
const CALIFORNIA_SCHEDULE = "FTB 3885A";

const nonZeroOrBlank = (value: number) => (value === 0 ? undefined : value);

/*
 * California Passive Activity Worksheet
 * (ca-3801-inst-2025::sec::step-1-figuring-your-california-passive-activity-income-loss::b01):
 * one row per passive activity, before the PAL rules. Column (d) is Schedule E
 * line 21, column (e) the FTB 3885A difference, column (f) their sum.
 */
function passiveWorksheetBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= WORKSHEET_ROWS; rowNumber++) {
    const cell = (value: (activity: CaScheduleEActivity) => number | string | undefined) =>
      fromContext((context) => {
        const activity = context.activities.filter((entry) => entry.passive)[rowNumber - 1];
        return activity ? value(activity) : undefined;
      });
    const key = `1.passive_worksheet.row${rowNumber}`;
    out[`${key}_activity_description_col_a`] = cell((activity) => activity.worksheetName);
    out[`${key}_federal_schedule_col_b`] = cell(() => FEDERAL_SCHEDULE);
    out[`${key}_california_schedule_col_c`] = cell((activity) =>
      activity.californiaAdjustment === 0 ? undefined : CALIFORNIA_SCHEDULE,
    );
    out[`${key}_federal_amount_col_d`] = cell((activity) => activity.federalNet);
    out[`${key}_california_adjustment_col_e`] = cell((activity) =>
      nonZeroOrBlank(activity.californiaAdjustment),
    );
    out[`${key}_california_amount_col_f`] = cell((activity) => activity.californiaNet);
  }
  return out;
}

/* One Schedule E row of the adjustment worksheet: columns (c) and (d), or why they are blank. */
interface AdjustmentRow {
  activity: CaScheduleEActivity;
  california?: number;
  federal?: number;
}

type RowsResult = AdjustmentRow[] | Unsupported | undefined;

/*
 * The Schedule E worksheet's rows: every Schedule E activity, passive or not
 * (ca-3801-inst-2025::sec::step-4-figuring-the-california-adjustment::b02).
 * Column (c) reads Part VIII, so it shows line 6's gap.
 */
function scheduleERows(form: MagiFields, info: Form3801FilingInfo): RowsResult {
  const gap = info.form3801Figures?.scheduleEWorksheetGap;
  const context = contextOf(form, info);
  if (context === undefined || isUnsupportedResult(context)) return context;
  if (gap) return unsupported(gap);
  if (context.magiGap) return unsupported(context.magiGap);
  const read: FieldReader = (fieldId) => form[fieldId];
  return context.activities.map((activity) => ({
    activity,
    california: context.allocation
      ? californiaAfterLimits(activity, context.allocation)
      : undefined,
    federal: federalAfterLimits(read, info, activity),
  }));
}

/* A column total; undefined while a row's amount waits. */
function columnTotal(rows: AdjustmentRow[], side: "california" | "federal") {
  const amounts = rows.map((row) => row[side]);
  return amounts.some((amount) => amount === undefined) ? undefined : sum(...amounts);
}

/*
 * Total line 2(e): the total of column (c) less the total of column (d)
 * (ca-3801-inst-2025::sec::individuals::b01, steps 1 to 3). Positive goes to
 * Schedule CA (540) line 5 column C, negative to column B as a positive amount.
 */
export function scheduleEAdjustment(
  form: MagiFields,
  info: Form3801FilingInfo,
): number | Unsupported | undefined {
  const rows = scheduleERows(form, info);
  if (rows === undefined || isUnsupportedResult(rows)) return rows;
  const california = columnTotal(rows, "california");
  const federal = columnTotal(rows, "federal");
  return california === undefined || federal === undefined ? undefined : california - federal;
}

function rowsBinding(read: (rows: AdjustmentRow[]) => unknown): Fn {
  return (form, info) => {
    const rows = scheduleERows(form, info);
    if (rows === undefined || isUnsupportedResult(rows)) return rows;
    return read(rows);
  };
}

function scheduleEWorksheetBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= WORKSHEET_ROWS; rowNumber++) {
    const cell = (value: (row: AdjustmentRow) => number | string | undefined) =>
      rowsBinding((rows) => {
        const row = rows[rowNumber - 1];
        return row ? value(row) : undefined;
      });
    const key = `1.adjustment_worksheet.schedule_e_row${rowNumber}`;
    out[`${key}_activity_description_col_a`] = cell((row) => row.activity.worksheetName);
    // Column (b): "the character of the activity for California purposes".
    out[`${key}_passive_or_nonpassive_col_b`] = cell((row) =>
      row.activity.passive ? "Passive" : "Nonpassive",
    );
    out[`${key}_california_amount_col_c`] = cell((row) => row.california);
    out[`${key}_federal_amount_col_d`] = cell((row) => row.federal);
  }
  const prefix = "1.adjustment_worksheet";
  out[`${prefix}.2c_schedule_e_total_california_amount`] = rowsBinding((rows) =>
    columnTotal(rows, "california"),
  );
  out[`${prefix}.2d_schedule_e_total_federal_amount`] = rowsBinding((rows) =>
    columnTotal(rows, "federal"),
  );
  out[`${prefix}.2e_schedule_e_california_adjustment`] = scheduleEAdjustment;
  return out;
}

/*
 * The Schedule C and Schedule F worksheets list a schedule's activities only
 * when one of them is passive (ca-3801-inst-2025::sec::step-4::b01). A passive
 * Schedule C business, a farm or a farm rental is a gap for the whole form
 * (formScope.ts), so on a form the engine fills both stay blank.
 */
function blankWorksheetBindings(schedule: "c" | "f", line: 1 | 3): Record<string, Fn> {
  const blank = fromContext(() => undefined);
  const columns = [
    "activity_description_col_a",
    "passive_or_nonpassive_col_b",
    "california_amount_col_c",
    "federal_amount_col_d",
  ];
  const prefix = "1.adjustment_worksheet";
  const rows = Array.from({ length: WORKSHEET_ROWS }, (_, index) =>
    columns.map((column) => `${prefix}.schedule_${schedule}_row${index + 1}_${column}`),
  ).flat();
  const totals = [
    `${prefix}.${line}c_schedule_${schedule}_total_california_amount`,
    `${prefix}.${line}d_schedule_${schedule}_total_federal_amount`,
    `${prefix}.${line}e_schedule_${schedule}_california_adjustment`,
  ];
  return Object.fromEntries([...rows, ...totals].map((fieldId) => [fieldId, blank]));
}

export function worksheetBindings(): Record<string, Fn> {
  return {
    ...passiveWorksheetBindings(),
    ...scheduleEWorksheetBindings(),
    ...blankWorksheetBindings("c", 1),
    ...blankWorksheetBindings("f", 3),
  };
}
