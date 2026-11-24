/*
 * FTB 3801 Side 3 and Side 4, Parts IV to IX. "Refer to the instructions for
 * federal Form 8582 for specific instructions on how to complete Part IV
 * through Part IX" (the form's Side 3 note; ca-3801-inst-2025::sec::step-3::b01,
 * ::how-to-report-allowed-losses::b01). The rows are federal/8582's, in
 * California amounts: Parts IV and V from californiaRentals.ts, Parts VI to
 * VIII from allocateLosses (irs-8582-inst-2025::sec::part-vi::b02–b04,
 * ::part-vii-allocation-of-unallowed-losses::b01–b02, ::part-viii-allowed-losses::b01–b02).
 */

import {
  overallOf,
  type ActivityPart,
  type PassiveActivity,
} from "../../../federal/8582/activities.js";
import type {
  LossAllocation,
  Part6Row,
  Part7Row,
  Part8Row,
} from "../../../federal/8582/allocation.js";
import type { MagiFields } from "../../../federal/8582/magi.js";
import { sumOrBlank } from "../../../money.js";
import { fromContext, type Form3801Context } from "./context.js";
import type { Form3801FilingInfo } from "./filingInfo.js";

export type Fn = (form: MagiFields, info: Form3801FilingInfo) => unknown;

/* Rows printed on the form for each part (Side 3). */
const PART_ROWS = { part4: 5, part5: 5, part6: 5, part7: 6, part8: 5 } as const;

/*
 * "Form or schedule to be reported on", with its line number
 * (irs-8582-inst-2025::sec::part-vi::b01): every activity on this form is a
 * federal Schedule E property, written as federal Form 8582 writes it. A
 * rental's loss is on Schedule E line 22; a royalty has no line 22, so its
 * loss is on line 21 (irs-1040se-inst-2025::sec::line-22::b01). The California
 * amount then goes to the Schedule E adjustment worksheet on Side 2
 * (ca-3801-inst-2025::sec::step-4-figuring-the-california-adjustment::b01).
 * QUESTIONS.md item 4.
 */
export function reportedOn(context: Form3801Context, factKey: string): string | undefined {
  const activity = context.activities.find((entry) => entry.factKey === factKey);
  if (!activity) return undefined;
  return activity.royalty ? "Sch E, line 21" : "Sch E, line 22";
}

const positiveOrBlank = (value: number) => (value > 0 ? value : undefined);

type Cell<R> = readonly [suffix: string, value: (row: R) => number | string | undefined];

const AMOUNT_COLUMNS: ReadonlyArray<Cell<PassiveActivity>> = [
  ["col_a_net_income", (row) => positiveOrBlank(row.netIncome)],
  ["col_b_net_loss", (row) => positiveOrBlank(row.netLoss)],
  ["col_c_prior_unallowed_loss", (row) => positiveOrBlank(row.priorUnallowedLoss)],
];

/* Parts IV and V: name, columns (a) to (c), then the overall gain (d) or loss (e); and the totals. */
function activityPartBindings(part: ActivityPart): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  const prefix = `2.${part}`;
  for (let rowNumber = 1; rowNumber <= PART_ROWS[part]; rowNumber++) {
    const cell = (value: (row: PassiveActivity) => number | string | undefined) =>
      fromContext((context) => {
        const row = context.parts[part][rowNumber - 1];
        return row ? value(row) : undefined;
      });
    const key = `${prefix}.row${rowNumber}`;
    out[`${key}_activity_name`] = cell((row) => row.name);
    for (const [suffix, value] of AMOUNT_COLUMNS) out[`${key}_${suffix}`] = cell(value);
    out[`${key}_col_d_overall_gain`] = cell((row) => positiveOrBlank(overallOf(row)));
    out[`${key}_col_e_overall_loss`] = cell((row) => positiveOrBlank(-overallOf(row)));
  }
  for (const [suffix, value] of AMOUNT_COLUMNS) {
    out[`${prefix}.total_${suffix}`] = fromContext((context) =>
      sumOrBlank(...context.parts[part].map(value)),
    );
  }
  return out;
}

interface AllocationSpec<R> {
  prefix: string;
  rows: number;
  of: (allocation: LossAllocation) => R[] | undefined;
  columns: ReadonlyArray<Cell<R>>;
  totals: ReadonlyArray<Cell<R>>;
}

/* The rows of Part VI, VII or VIII; undefined while the allocation waits. */
function allocated<R>(context: Form3801Context, spec: AllocationSpec<R>) {
  return context.allocation ? spec.of(context.allocation) : undefined;
}

/* Parts VI to VIII read line 9 or line 11, so they show line 6's gap. */
function allocationPartBindings<R extends { name: string; factKey: string }>(
  spec: AllocationSpec<R>,
): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= spec.rows; rowNumber++) {
    const cell = (value: (row: R, context: Form3801Context) => number | string | undefined) =>
      fromContext((context) => {
        const row = allocated(context, spec)?.[rowNumber - 1];
        return row ? value(row, context) : undefined;
      }, true);
    const key = `${spec.prefix}.row${rowNumber}`;
    out[`${key}_activity_name`] = cell((row) => row.name);
    out[`${key}_form_or_schedule`] = cell((row, context) => reportedOn(context, row.factKey));
    for (const [suffix, value] of spec.columns) out[`${key}_${suffix}`] = cell(value);
  }
  for (const [suffix, value] of spec.totals) {
    out[`${spec.prefix}.total_${suffix}`] = fromContext((context) => {
      const rows = allocated(context, spec);
      return rows ? sumOrBlank(...rows.map(value)) : undefined;
    }, true);
  }
  return out;
}

/* Part VI: "Use this part if an amount is shown on Part II, line 9." */
const PART_6: AllocationSpec<Part6Row> = {
  prefix: "2.part6",
  rows: PART_ROWS.part6,
  of: (allocation) => allocation.part6,
  columns: [
    ["col_a_loss", (row) => row.loss],
    ["col_b_ratio", (row) => row.ratio],
    ["col_c_special_allowance", (row) => row.allowance],
    ["col_d_loss_less_allowance", (row) => row.remaining],
  ],
  totals: [
    ["col_a_loss", (row) => row.loss],
    ["col_c_special_allowance", (row) => row.allowance],
    ["col_d_loss_less_allowance", (row) => row.remaining],
  ],
};

/* Part VII: Allocation of Unallowed Losses. */
const PART_7: AllocationSpec<Part7Row> = {
  prefix: "2.part7",
  rows: PART_ROWS.part7,
  of: (allocation) => allocation.part7,
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

/* Part VIII: Allowed Losses; column (c) prints 0 when none is allowed. */
const PART_8: AllocationSpec<Part8Row> = {
  prefix: "2.part8",
  rows: PART_ROWS.part8,
  of: (allocation) => allocation.part8,
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

const PART_9_BLOCK_FIELDS = [
  "form_or_schedule",
  "1a_net_loss_plus_prior_unallowed_col_a",
  "1b_net_income_col_a",
  "1c_loss_less_income_col_b",
  "1c_ratio_col_c",
  "1c_unallowed_loss_col_d",
  "1c_allowed_loss_col_e",
];

/*
 * Part IX is for an activity with losses on two or more forms or schedules
 * (irs-8582-inst-2025::sec::parts-viii-and-ix::b01). Every activity on this
 * form is one Schedule E property reported on Schedule E only (an entire
 * disposition, which adds Form 4797 or 8949, is a gap in californiaRentals.ts),
 * so Part VIII holds each one and Part IX stays blank.
 */
function part9Bindings(): Record<string, Fn> {
  const blank = fromContext(() => undefined);
  const fields = [
    ...[1, 2, 3].flatMap((block) => PART_9_BLOCK_FIELDS.map((field) => `row${block}_${field}`)),
    "total_col_b",
    "total_unallowed_loss_col_d",
    "total_allowed_loss_col_e",
  ];
  return Object.fromEntries(fields.map((field) => [`3.part9.${field}`, blank]));
}

export function partBindings(): Record<string, Fn> {
  return {
    ...activityPartBindings("part4"),
    ...activityPartBindings("part5"),
    ...allocationPartBindings(PART_6),
    ...allocationPartBindings(PART_7),
    ...allocationPartBindings(PART_8),
    ...part9Bindings(),
  };
}
