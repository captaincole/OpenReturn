/*
 * Schedule CA (540NR) Part II columns D and E.
 *
 * Column D: "Subtract the amounts in column B from the amounts in column A.
 * Add the amounts in column C to the result"; lines 9b1 to 9b3 take column B
 * "as a negative number"
 * (ca-540nr-sched-ca-inst-2025::sec::column-d-total-amounts-using-california-law::b01,
 * ::line-9b1-through-line-9b3::b01).
 *
 * Column E: the California amount of each line, as the taxpayer states it
 * (facts/kinds/caCaliforniaAmounts.ts; ::column-e-california-amounts::b01).
 * The totals add the lines: line 10 (::line-10-total-3::b01), line 26
 * (::line-26-2::b01) and line 27, "Subtract line 26 from Section B, line 10
 * in column E" (::line-27-total-2::b01).
 */

import type { FormAccessor } from "../../../defineForm.js";
import { caCaliforniaAmountKey, type CaStatedAmountLine } from "../../../facts/index.js";
import { numberOrBlank, roundDollars, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { columnD } from "../540nr/lines.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleCa540NR } from "./types.js";

type Form = FormAccessor<ScheduleCa540NR>;
type Info = ScheduleCa540NRFilingInfo;

/* The lines that hold a total in every column, and the lines each adds (column E). */
const TOTALS = {
  "1z": ["1a", "1b", "1c", "1d", "1e", "1f", "1g", "1h", "1i"],
  b9a: [
    "b8b",
    "b8c",
    "b8e",
    "b8g",
    "b8h",
    "b8i",
    "b8j",
    "b8k",
    "b8l",
    "b8m",
    "b8p",
    "b8q",
    "b8r",
    "b8s",
    "b8t",
    "b8u",
    "b8v",
    "b8z",
  ],
  b10: [
    "1z",
    "2b",
    "3b",
    "4b",
    "5b",
    "7a",
    "b2a",
    "b3",
    "b4",
    "b5",
    "b6",
    "b9a",
    "b9b1",
    "b9b2",
    "b9b3",
  ],
  c25: ["c24a", "c24b", "c24d", "c24e", "c24f", "c24g", "c24h", "c24k", "c24z"],
  c26: ["c12", "c14", "c15", "c16", "c17", "c18", "c19a", "c20", "c21", "c23", "c25"],
} as const;

export type TotalLine = keyof typeof TOTALS | "c27";
export type PartIILine = CaStatedAmountLine | TotalLine;

const NEGATIVE_LINES: readonly string[] = ["b9b1", "b9b2", "b9b3"];

/* The page of each line: the catalog puts all five columns of a line on one page. */
const PAGE_ONE: readonly string[] = [
  "b3",
  "b4",
  "b5",
  "b6",
  "b8b",
  "b8c",
  "b8e",
  "b8g",
  "b8h",
  "b8i",
  "b8j",
  "b8k",
  "b8l",
  "b8m",
  "b8p",
  "b8q",
  "b8r",
  "b8s",
  "b8t",
  "b8u",
  "b8v",
  "b8z",
  "b9a",
];
const PAGE_THREE: readonly string[] = ["c24k", "c24z", "c25", "c26", "c27"];

export function pageOf(line: PartIILine): string {
  if (PAGE_ONE.includes(line)) return "1";
  if (PAGE_THREE.includes(line)) return "3";
  return line.startsWith("b9b") || line === "b10" || line.startsWith("c") ? "2" : "0";
}

export const fieldOf = (line: PartIILine, column: string) =>
  `${pageOf(line)}.line.${line}_${column}`;

/*
 * Column D of a line: blank when columns A, B and C hold no amount ("If you do
 * not have an entry for a line, leave it blank", ca-540nr-booklet-2025::sec::before-you-begin::b02).
 */
export function columnDOf(form: Form, line: PartIILine): number | undefined {
  const read = (column: string) => numberOrBlank(form[fieldOf(line, column)]);
  const [federal, subtractions, additions] = ["federal", "subtractions", "additions"].map(read);
  if (!federal && !subtractions && !additions) return undefined;
  if (NEGATIVE_LINES.includes(line)) return -sum(subtractions);
  return columnD(sum(federal), sum(subtractions), sum(additions));
}

/* A column E amount: a number, blank, waiting for its answer, or a gap. */
type ColumnE =
  | { kind: "amount"; value: number }
  | { kind: "blank" }
  | { kind: "waits" }
  | { kind: "gap"; gap: Unsupported };

const isTotal = (line: PartIILine): line is TotalLine => line in TOTALS || line === "c27";

/*
 * A stated line: the taxpayer's amount. With none, a line with no column D
 * amount is blank; a line the form asks for waits for its answer; any other
 * line is a gap, because a blank would read as no California income.
 */
function statedLine(form: Form, info: Info, line: CaStatedAmountLine): ColumnE {
  const stated = info.californiaAmounts?.[line];
  if (stated !== undefined) return { kind: "amount", value: roundDollars(stated) };
  const total = columnDOf(form, line);
  if (total === undefined || total === 0) return { kind: "blank" };
  if (info.californiaAmountLinesAsked?.includes(line)) return { kind: "waits" };
  return {
    kind: "gap",
    gap: unsupported(
      `Column E of line ${line} is the taxpayer's California amount (fact ${caCaliforniaAmountKey(line)}); the engine does not ask for it on this line yet.`,
    ),
  };
}

/* A total: the first gap of its lines, else blank while one waits, else their sum. */
function totalLine(form: Form, info: Info, line: TotalLine): ColumnE {
  if (line === "c27") {
    const income = columnEOf(form, info, "b10");
    const adjustments = columnEOf(form, info, "c26");
    const parts = [income, adjustments];
    const gap = parts.find((part) => part.kind === "gap");
    if (gap) return gap;
    if (parts.some((part) => part.kind === "waits")) return { kind: "waits" };
    if (parts.every((part) => part.kind === "blank")) return { kind: "blank" };
    return { kind: "amount", value: amountOf(income) - amountOf(adjustments) };
  }
  const parts = TOTALS[line].map((part: PartIILine) => columnEOf(form, info, part));
  const gap = parts.find((part) => part.kind === "gap");
  if (gap) return gap;
  if (parts.some((part) => part.kind === "waits")) return { kind: "waits" };
  if (parts.every((part) => part.kind === "blank")) return { kind: "blank" };
  return { kind: "amount", value: sum(...parts.map(amountOf)) };
}

const amountOf = (part: ColumnE) => (part.kind === "amount" ? part.value : 0);

export function columnEOf(form: Form, info: Info, line: PartIILine): ColumnE {
  return isTotal(line) ? totalLine(form, info, line) : statedLine(form, info, line);
}

/* The field value of a column E result. */
export function columnEValue(part: ColumnE): number | Unsupported | undefined {
  if (part.kind === "amount") return part.value;
  return part.kind === "gap" ? part.gap : undefined;
}
