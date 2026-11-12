/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { needsScheduleA, partIBusinesses } from "../8995-a/lines.js";
import type { QbiBusiness } from "../qbi/filingInfo.js";
import { businessQbi, rentalQbi } from "../qbi/lines.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8995AScheduleCFilingInfo } from "./filingInfo.js";
import type { Form8995AScheduleC } from "./types.js";

type Read = Record<string, unknown>;

const num = (value: unknown) => (typeof value === "number" ? value : undefined);

type Info = Form8995AScheduleCFilingInfo;

const ROWS = ["a", "b", "c"] as const;
type Row = (typeof ROWS)[number];

// Column (a), the QBI before netting: a Schedule C business's is line 31 less the deductible SE tax.
function qbiBeforeNetting(form: Read, info: Info, business: QbiBusiness): number | undefined {
  if (needsScheduleA(form, info, business)) return undefined;
  if (business.kind === "business") return roundDollars(businessQbi(form, info, business));
  return business.scheduleEColumn && rentalQbi(form, info, business.scheduleEColumn);
}

// Column (a) for every Part I business, undefined while any is blank.
function columnA(form: Read, info: Info): number[] | undefined {
  const amounts = partIBusinesses(form, info)?.map((business) =>
    qbiBeforeNetting(form, info, business),
  );
  if (!amounts || amounts.includes(undefined)) return undefined;
  return amounts.filter((amount) => amount !== undefined);
}

const rowAt = (form: Read, row: Row) => num(form[`0.line.1_col_a_qbi_${row}`]);

/*
 * Column (b): line 5 apportioned among the trades with QBI, in proportion to it.
 * Each share is the rounded running total less the one before it, so the shares
 * add up to line 5 exactly.
 */
function lossNetting(form: Read, info: Info, row: Row): number | undefined {
  const amounts = columnA(form, info);
  const line4 = num(form["0.line.4_total_income"]);
  const line5 = num(form["0.line.5_losses_netted"]);
  const index = ROWS.indexOf(row);
  if (!amounts || line4 === undefined || line5 === undefined) return undefined;
  if (!(amounts[index] > 0)) return undefined;
  const runningShare = (count: number) => {
    const income = sum(...amounts.slice(0, count).map((amount) => atLeast(0, amount)));
    return roundDollars((line5 * income) / line4);
  };
  return runningShare(index + 1) - runningShare(index);
}

// Column (c): (a) less the reduction in (b); zero or less enters -0-.
function adjustedQbi(form: Read, row: Row): number | undefined {
  const qbi = rowAt(form, row);
  if (qbi === undefined) return undefined;
  if (qbi <= 0) return 0;
  const reduction = num(form[`0.line.1_col_b_loss_netting_${row}`]);
  return reduction === undefined ? undefined : atLeast(0, qbi - reduction);
}

function rowName(form: Read, info: Info, row: Row): string | undefined {
  return partIBusinesses(form, info)?.[ROWS.indexOf(row)]?.name;
}

// Each row's column (a) stands alone; lines 3 and 4 wait for every row.
function qbiIn(form: Read, info: Info, row: Row): number | undefined {
  const business = partIBusinesses(form, info)?.[ROWS.indexOf(row)];
  return business && qbiBeforeNetting(form, info, business);
}

export function register(): void {
  defineForm<Form8995AScheduleC, Form8995AScheduleCFilingInfo>("form-8995-a-schedule-c", {
    bindings: {
      "0.header.name": (_, info) => namesOnReturn(info),
      "0.header.taxpayer_id": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: one row per Form 8995-A Part I business, in its column order.
      "0.line.1_name_a": (form, info) => rowName(form, info, "a"),
      "0.line.1_col_a_qbi_a": (form, info) => qbiIn(form, info, "a"),
      "0.line.1_col_b_loss_netting_a": (form, info) => lossNetting(form, info, "a"),
      "0.line.1_col_c_adjusted_qbi_a": (form) => adjustedQbi(form, "a"),
      "0.line.1_name_b": (form, info) => rowName(form, info, "b"),
      "0.line.1_col_a_qbi_b": (form, info) => qbiIn(form, info, "b"),
      "0.line.1_col_b_loss_netting_b": (form, info) => lossNetting(form, info, "b"),
      "0.line.1_col_c_adjusted_qbi_b": (form) => adjustedQbi(form, "b"),
      "0.line.1_name_c": (form, info) => rowName(form, info, "c"),
      "0.line.1_col_a_qbi_c": (form, info) => qbiIn(form, info, "c"),
      "0.line.1_col_b_loss_netting_c": (form, info) => lossNetting(form, info, "c"),
      "0.line.1_col_c_adjusted_qbi_c": (form) => adjustedQbi(form, "c"),
      // Line 2 is unsupported (no carryforward fact), so it adds nothing to line 3.
      "0.line.3_total_losses": (form, info) => {
        const amounts = columnA(form, info);
        return amounts && 0 - sum(0, ...amounts.filter((amount) => amount < 0));
      },
      "0.line.4_total_income": (form, info) => {
        const amounts = columnA(form, info);
        return amounts && sum(0, ...amounts.filter((amount) => amount > 0));
      },
      // Lines 3, 5 and 6 print in parentheses: positive amounts here.
      "0.line.5_losses_netted": (form) => {
        const line3 = num(form["0.line.3_total_losses"]);
        const line4 = num(form["0.line.4_total_income"]);
        return line3 === undefined || line4 === undefined ? undefined : Math.min(line3, line4);
      },
      "0.line.6_net_loss_carryforward": (form) => {
        const line3 = num(form["0.line.3_total_losses"]);
        const line5 = num(form["0.line.5_losses_netted"]);
        return line3 === undefined || line5 === undefined ? undefined : atLeast(0, line3 - line5);
      },
    },

    unsupported: {
      "0.line.2_prior_year_carryforward":
        "No fact gives a qualified business net loss carryforward from prior years (last year's Schedule C (Form 8995-A) line 6 or Form 8995 line 16).",
    },
  });
}
