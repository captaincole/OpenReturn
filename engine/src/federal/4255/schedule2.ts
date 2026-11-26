/*
 * Where Form 4255 goes on a Form 1040 return: Schedule 2 lines 1d, 1e, 1f, 1y,
 * 17a, 17z and 19. Block ids are in irs-1040-inst-2025::sec unless named.
 * Column (q) (reduced by nonrefundable credits) lands in Schedule 2 Part I,
 * column (r) in Part II (irs-4255-inst-2025::sec::lines-1-and-2::b02).
 */

import type { Form4255Line } from "../../facts/index.js";
import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4255FilingInfo, Form4255Result } from "./filingInfo.js";
import { ELECTIVE_PAYMENT_LINES, type PartOneRow } from "./partOne.js";

export type Schedule2Entry = [type: string, amount: number];

export interface Schedule2Amounts {
  line1d?: number;
  line1e?: number;
  /* The lines whose column (n)(1) holds an amount: the line 1e boxes. */
  line1eBoxes: Form4255Line[];
  line1f?: number;
  line1fBoxes: Form4255Line[];
  line1y: Schedule2Entry[];
  line17a: Schedule2Entry[];
  line17z: Schedule2Entry[];
  line19?: number;
}

type Cells = Partial<Record<Form4255Line, PartOneRow>>;

const cell = (rows: Cells, line: Form4255Line, column: keyof PartOneRow): number => {
  const value = rows[line]?.[column];
  return typeof value === "number" ? value : 0;
};
const across = (rows: Cells, lines: readonly Form4255Line[], ...columns: Array<keyof PartOneRow>) =>
  sum(...lines.flatMap((line) => columns.map((column) => cell(rows, line, column))));
const everyLine = (rows: Cells): Form4255Line[] => Object.keys(rows) as Form4255Line[];
const amountOrBlank = (value: number): number | undefined => (value > 0 ? value : undefined);

/* Entries above 0, the same type added together, in first-listed order. */
function entries(list: ReadonlyArray<Schedule2Entry>): Schedule2Entry[] {
  const totals = new Map<string, number>();
  for (const [type, amount] of list) totals.set(type, (totals.get(type) ?? 0) + amount);
  return [...totals].filter(([, amount]) => amount > 0);
}

/*
 * DECISION (2026-11-25, by the author): a Form 4255 amount that the Schedule 2
 * instructions do not name goes on the Schedule 2 line of its column's kind:
 * a column (r) recapture on line 17a, named by its form ("3468" for lines 1g
 * and 1d column (k), "8936" for line 1h, the stated form for line 1z); a
 * column (q) amount of line 2z on line 1y, named by its form; and the
 * penalties of columns (o)(3) and (p)(3) on line 17z, with the other penalties.
 * Text A, Form 4255: "Enter the amount from Part I, line 3, column (r) ... on
 * the appropriate line of your tax return", and column (q) "on the appropriate
 * line" (irs-4255-inst-2025::sec::lines-1-and-2::b02).
 * Text B, the Schedule 2 lists: line 17a takes "Form 4255, column (j), lines
 * 1b, 1j, 1l, and 1m" and line 1d column (j) (::line-17a::b01); line 17z takes
 * "columns (o)(1), (o)(2), (p)(1), and/or (p)(2)" (::line-17z::b01); line 1y
 * names lines 2a and 2b only (::line-1y::b01, ::identify-as-epe8933::b01).
 * The engine follows Text A: every amount in columns (q) and (r) reaches the
 * return, on the line that already takes the same kind of amount.
 */
function partTwoEntries(rows: Cells, otherForm1z: string | undefined) {
  const line17a = entries([
    ["3468", across(rows, ["1b", "1g", "1j", "1l", "1m"], "j") + cell(rows, "1d", "k")],
    ["NEPE3468", cell(rows, "1d", "j")],
    ["8936", cell(rows, "1h", "j")],
    [otherForm1z ?? "Other", across(rows, ["1z"], "j", "k", "l")],
    ["6418(g)(3)", across(rows, ["1b", "1g", "1j", "1z"], "m3")],
  ]);
  const penalties = ["o1", "o2", "o3", "p1", "p2", "p3"] as const;
  const others = everyLine(rows).filter((line) => line !== "1c" && line !== "2a");
  const line17z = entries([
    ["PWA7210", across(rows, ["1c"], ...penalties)],
    ["PWA8933", across(rows, ["2a"], ...penalties)],
    ["NPWA", across(rows, others, ...penalties)],
  ]);
  return { line17a, line17z };
}

/* Line 1y (::line-1y::b01, ::identify-as-epe8933::b01, ::identify-as-nepe8933::b01). */
function line1yEntries(rows: Cells, otherForm2z: string | undefined): Schedule2Entry[] {
  const lines = everyLine(rows);
  return entries([
    ["ARPCR", across(rows, ["2b"], "j", "k", "l")],
    ["EPE8933", cell(rows, "2a", "k")],
    ["NEPE8933", cell(rows, "2a", "j")],
    ["EPGEPE", across(rows, lines, "n2")],
    ["6418(g)(2)", across(rows, lines, "m1", "m2")],
    [otherForm2z ?? "Other", across(rows, ["2z"], "j", "k", "l", "m3")],
  ]);
}

/* Every Schedule 2 amount of one figured Form 4255. */
export function schedule2Amounts(result: Form4255Result): Schedule2Amounts {
  const rows = result.rows;
  const boxes = (column: keyof PartOneRow) =>
    ELECTIVE_PAYMENT_LINES.filter((line) => cell(rows, line, column) > 0);
  return {
    line1d: amountOrBlank(cell(rows, "2a", "l")),
    line1e: amountOrBlank(across(rows, ELECTIVE_PAYMENT_LINES, "n1")),
    line1eBoxes: boxes("n1"),
    line1f: amountOrBlank(across(rows, ELECTIVE_PAYMENT_LINES, "n3")),
    line1fBoxes: boxes("n3"),
    line1y: line1yEntries(rows, result.otherForms["2z"]),
    ...partTwoEntries(rows, result.otherForms["1z"]),
    line19: amountOrBlank(cell(rows, "1d", "l")),
  };
}

/*
 * What Schedule 2 takes from Form 4255: "none" when the form does not file,
 * a gap, undefined while it waits for a fact, or the amounts.
 */
export function form4255ForSchedule2(
  info: Form4255FilingInfo,
): Schedule2Amounts | Unsupported | undefined | "none" {
  if (info.mustFile?.["form-4255"]?.value !== true) return "none";
  if (info.form4255Gap !== undefined) return unsupported(info.form4255Gap);
  return info.form4255 === undefined ? undefined : schedule2Amounts(info.form4255);
}

/* One amount line or box of Schedule 2: blank when the form does not file. */
export function schedule2Line<T extends number | boolean>(
  info: Form4255FilingInfo,
  pick: (amounts: Schedule2Amounts) => T | undefined,
): T | Unsupported | undefined {
  const amounts = form4255ForSchedule2(info);
  if (amounts === "none" || amounts === undefined) return undefined;
  return "unsupported" in amounts ? amounts : pick(amounts);
}

/* The line 1e or 1f box of one line: checked when its column holds an amount. */
export const boxOf =
  (boxes: "line1eBoxes" | "line1fBoxes", line: Form4255Line) =>
  (amounts: Schedule2Amounts): boolean | undefined =>
    amounts[boxes].includes(line) ? true : undefined;

type Without = () => Unsupported | undefined;

/* A list line's entries, or what it shows without them (`without`) or with a gap. */
function listOf(
  info: Form4255FilingInfo,
  pick: (amounts: Schedule2Amounts) => Schedule2Entry[],
): Schedule2Entry[] | Unsupported | undefined {
  const amounts = form4255ForSchedule2(info);
  if (amounts === undefined) return undefined;
  if (amounts === "none") return [];
  return "unsupported" in amounts ? amounts : pick(amounts);
}

/* A list line's amount (1y, 17a): the entries' total. */
export function entryAmount(
  info: Form4255FilingInfo,
  pick: (amounts: Schedule2Amounts) => Schedule2Entry[],
  without: Without,
): number | Unsupported | undefined {
  const list = listOf(info, pick);
  if (!Array.isArray(list)) return list;
  return list.length === 0 ? without() : sum(...list.map(([, amount]) => amount));
}

/* A list line's description: the types, joined as line 17z joins them. */
export function entryTypes(
  info: Form4255FilingInfo,
  pick: (amounts: Schedule2Amounts) => Schedule2Entry[],
  without: Without,
): string | Unsupported | undefined {
  const list = listOf(info, pick);
  if (!Array.isArray(list)) return list;
  return list.length === 0 ? without() : list.map(([type]) => type).join("; ");
}
