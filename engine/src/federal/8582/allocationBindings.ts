/*
 * MANUAL EDIT: Parts VI–IX. Parts VI–VIII print allocation.ts's rows; a part
 * that is not needed stays blank. Part IX is unsupported.
 */

import type { FormAccessor } from "../../defineForm.js";
import { sumOrBlank } from "../../money.js";
import type { PropertyColumn } from "../schedule-e/filingInfo.js";
import { ROWS_PER_PART } from "./activities.js";
import {
  lossAllocation,
  type LossAllocation,
  type Part6Row,
  type Part7Row,
  type Part8Row,
} from "./allocation.js";
import type { Form8582FilingInfo } from "./filingInfo.js";
import type { Form8582 } from "./types.js";

type Fn = (f: FormAccessor<Form8582>, info: Form8582FilingInfo) => unknown;
type Cell<R> = readonly [suffix: string, value: (row: R) => number | string | undefined];

interface PartSpec<R> {
  prefix: string;
  rows: (allocation: LossAllocation) => R[] | undefined;
  columns: ReadonlyArray<Cell<R>>;
  totals: ReadonlyArray<Cell<R>>;
}

/*
 * The second column: a rental's allowed loss is on Schedule E line 22
 * (irs-8582-inst-2025::sec::how-to-report-allowed-losses::b03), written as in the
 * example for Part VI (irs-8582-inst-2025::sec::part-vi::b01). A royalty has no
 * line 22 (irs-1040se-inst-2025::sec::line-22::b01): its loss is on line 21, and
 * line 25 counts only the part Form 8582 allows.
 */
function reportedOn(info: Form8582FilingInfo, column: PropertyColumn): string | undefined {
  const property = info.rentalProperties?.find((entry) => entry.column === column);
  if (!property) return undefined;
  return property.value.propertyType === "royalties" ? "Sch E, line 21" : "Sch E, line 22";
}

function partBindings<R extends { name: string; column: PropertyColumn }>(
  spec: PartSpec<R>,
): Record<string, Fn> {
  const rowsOf = (form: FormAccessor<Form8582>, info: Form8582FilingInfo) => {
    const allocation = lossAllocation((fieldId) => form[fieldId], info);
    return allocation ? spec.rows(allocation) : undefined;
  };
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= ROWS_PER_PART; rowNumber++) {
    const row = (form: FormAccessor<Form8582>, info: Form8582FilingInfo) =>
      rowsOf(form, info)?.[rowNumber - 1];
    const key = `${spec.prefix}.row_${rowNumber}`;
    out[`${key}_name`] = (form, info) => row(form, info)?.name;
    out[`${key}_form_or_schedule`] = (form, info) => {
      const activity = row(form, info);
      return activity ? reportedOn(info, activity.column) : undefined;
    };
    for (const [suffix, value] of spec.columns) {
      out[`${key}_${suffix}`] = (form, info) => {
        const activity = row(form, info);
        return activity ? value(activity) : undefined;
      };
    }
  }
  for (const [suffix, value] of spec.totals) {
    out[`${spec.prefix}.total_${suffix}`] = (form, info) => {
      const rows = rowsOf(form, info);
      return rows ? sumOrBlank(...rows.map(value)) : undefined;
    };
  }
  return out;
}

/* irs-8582-inst-2025::sec::part-vi::b02–b04. */
const PART_6: PartSpec<Part6Row> = {
  prefix: "1.part6",
  rows: (allocation) => allocation.part6,
  columns: [
    ["col_a_loss", (row) => row.loss],
    ["col_b_ratio", (row) => row.ratio],
    ["col_c_special_allowance", (row) => row.allowance],
    ["col_d_subtract", (row) => row.remaining],
  ],
  totals: [
    ["col_a_loss", (row) => row.loss],
    ["col_c_special_allowance", (row) => row.allowance],
    ["col_d_subtract", (row) => row.remaining],
  ],
};

/* irs-8582-inst-2025::sec::part-vii-allocation-of-unallowed-losses::b01–b02. */
const PART_7: PartSpec<Part7Row> = {
  prefix: "1.part7",
  rows: (allocation) => allocation.part7,
  columns: [
    ["col_a_loss", (row) => row.loss],
    ["col_b_ratio", (row) => row.ratio],
    ["col_c_unallowed_loss", (row) => row.unallowed],
  ],
  totals: [
    ["col_a_loss", (row) => row.loss],
    ["col_c_unallowed_loss", (row) => row.unallowed],
  ],
};

/* irs-8582-inst-2025::sec::part-viii-allowed-losses::b01–b02; column (c) prints 0 when none is allowed. */
const PART_8: PartSpec<Part8Row> = {
  prefix: "1.part8",
  rows: (allocation) => allocation.part8,
  columns: [
    ["col_a_loss", (row) => row.loss],
    ["col_b_unallowed_loss", (row) => row.unallowed],
    ["col_c_allowed_loss", (row) => row.allowed],
  ],
  totals: [
    ["col_a_loss", (row) => row.loss],
    ["col_b_unallowed_loss", (row) => row.unallowed],
    ["col_c_allowed_loss", (row) => row.allowed],
  ],
};

export function allocationBindings(): Record<string, Fn> {
  return { ...partBindings(PART_6), ...partBindings(PART_7), ...partBindings(PART_8) };
}

const PART_9 =
  "Each activity is one Schedule E Part I property reported on one schedule, so Part VIII holds it; Part IX is for losses on two or more forms or separately identified transactions (irs-8582-inst-2025::sec::parts-viii-and-ix::b01).";

const PART_9_BLOCK_FIELDS = [
  "form_or_schedule",
  "line_1a_col_a",
  "line_1b_col_a",
  "line_1c_col_b",
  "col_c",
  "col_d",
  "col_e",
];

/* Part IX: every field. */
export function part9Unsupported(): Record<string, string> {
  const fields = [
    "activity_name",
    ...[1, 2, 3].flatMap((block) => PART_9_BLOCK_FIELDS.map((field) => `block_${block}_${field}`)),
    "total_col_b",
    "total_col_d",
    "total_col_e",
  ];
  return Object.fromEntries(fields.map((field) => [`2.part9.${field}`, PART_9]));
}
