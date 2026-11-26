/*
 * Form 461's reads of other forms: Part I copies Schedule 1 and Form 1040
 * lines; Part II adds what is not from a trade or business. Each function is
 * undefined while a line it reads still waits, so no total commits early.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import type { NonbusinessColumn } from "./classify.js";
import type { Form461Figures, Form461FilingInfo } from "./filingInfo.js";
import { capitalAdjustment, type PartIAmounts } from "./lines.js";

/* Form 461's slots, and Schedule 1's answers that a business or a farm is on the return (line 3 or 6 then waits). */
export type Info = Form461FilingInfo & { hasBusiness?: boolean; hasFarm?: boolean };
export type Read = Record<string, unknown>;

const files = (info: Info, formId: string) => info.mustFile?.[formId]?.value === true;

/* Line 2: Schedule 1 line 3; it waits while a Schedule C business's line 31 does. */
export function line2Source(form: Read, info: Info): number | null | undefined {
  const value = numberOrBlank(form["schedule-1.0.line.3"]);
  if (value !== undefined) return value;
  return info.hasBusiness === true ? undefined : null;
}

/* Line 3: Form 1040 line 7a; it waits while Schedule D files and line 7a is blank. */
export function line3Source(form: Read, info: Info): number | null | undefined {
  const value = numberOrBlank(form["form-1040.line.7a"]);
  if (value !== undefined) return value;
  return files(info, "schedule-d") ? undefined : null;
}

/* Line 5: Schedule 1 line 5; it waits while Schedule E files and line 41 is blank. */
export function line5Source(form: Read, info: Info): number | null | undefined {
  const value = numberOrBlank(form["schedule-1.0.line.5"]);
  if (value !== undefined) return value;
  return info.mustFile?.["schedule-e"]?.value === false ? null : undefined;
}

/* Line 6: Schedule 1 line 6; it waits while a farm's line 34 does. */
export function line6Source(form: Read, info: Info): number | null | undefined {
  const value = numberOrBlank(form["schedule-1.0.line.6"]);
  if (value !== undefined) return value;
  return info.hasFarm === true ? undefined : null;
}

/* Lines 2, 3, 5, 6 and 8 (line 4 is blank or a gap); undefined while one waits. */
export function partIAmounts(form: Read, info: Info): PartIAmounts | undefined {
  const sources = [
    line2Source(form, info),
    line3Source(form, info),
    line5Source(form, info),
    line6Source(form, info),
  ];
  if (sources.includes(undefined)) return undefined;
  const [line2, line3, line5, line6] = sources.map((value) => value ?? undefined);
  return { line2, line3, line5, line6, line8: info.form461?.otherBusinessIncome };
}

/*
 * A Part I column not from a trade or business, as it reaches Schedule 1
 * line 5: its line 21 income (line 10), and its deductible loss (line 11):
 * line 22 for a rental, the line 21 loss for a portfolio royalty, which is
 * not a passive activity (the Schedule E line 25 rule, schedule-e/totals.ts).
 */
function columnAmounts(form: Read, entry: NonbusinessColumn) {
  const net = numberOrBlank(form[`schedule-e.0.line.21_income_or_loss_${entry.column}`]) ?? 0;
  const line22 = numberOrBlank(form[`schedule-e.0.line.22_deductible_loss_${entry.column}`]);
  const loss = entry.royalty ? atLeast(0, 0 - net) : (line22 ?? 0);
  return { income: atLeast(0, net), loss };
}

/*
 * Schedule E Part I columns not from a trade or business, added up. It waits
 * for line 26, which settles every column's line 21 and line 22 (a blank
 * line 22 then means no loss is allowed).
 */
export function nonbusinessColumns(form: Read, figures: Form461Figures) {
  const columns = figures.nonbusinessColumns;
  if (columns === undefined) return undefined;
  if (columns.length === 0) return { income: 0, losses: 0 };
  if (numberOrBlank(form["schedule-e.0.line.26_total_income_or_loss"]) === undefined) {
    return undefined;
  }
  const amounts = columns.map((entry) => columnAmounts(form, entry));
  return {
    income: sum(...amounts.map((amount) => amount.income)),
    losses: sum(...amounts.map((amount) => amount.loss)),
  };
}

/* Lines 10 and 11 as positive amounts; undefined while an answer or a line waits. */
export function partIIAmounts(
  form: Read,
  info: Info,
  partI: PartIAmounts,
): { line10: number; line11: number } | undefined {
  const figures = info.form461;
  if (figures === undefined || figures.k1Nonbusiness === undefined) return undefined;
  const columns = nonbusinessColumns(form, figures);
  if (columns === undefined) return undefined;
  const capital = capitalAdjustment(partI.line3, figures.businessCapitalGain);
  return {
    line10: sum(capital.nonbusinessGain, columns.income, figures.k1Nonbusiness.income),
    line11: sum(capital.capitalLoss, columns.losses, figures.k1Nonbusiness.losses),
  };
}

/* Every Part I gap, joined: lines 9 to 16 cannot be figured while one stands. */
export function formGap(info: Info): string | undefined {
  const gaps = info.form461?.gaps;
  const reasons = [gaps?.line4, gaps?.line5, gaps?.line6].filter((gap) => gap !== undefined);
  return reasons.length > 0 ? reasons.join(" ") : undefined;
}
