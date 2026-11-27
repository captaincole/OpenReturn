/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { form4797Files, scheduleDGainFromForm4797 } from "../../../federal/4797/receivers.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { ScheduleDCaFilingInfo } from "./filingInfo.js";
import {
  adjustment,
  LINE_1_ROWS,
  MORE_ROWS_GAP,
  type Line1Row,
  type ScheduleDCaFigures,
} from "./lines.js";
import type { ScheduleDCa } from "./types.js";

type Bindings = Partial<{
  [K in keyof ScheduleDCa]: BindingFn<ScheduleDCa, ScheduleDCaFilingInfo, K>;
}>;
type Cell = (row: Line1Row) => string | number | Unsupported | undefined;

/* MANUAL EDIT: the rows of line 1 by page: a–f on side 1, g–m, n–t, then u–v on side 4. */
const ROW_PAGES: Array<[letters: string, page: number]> = [
  ["abcdef", 0],
  ["ghijklm", 1],
  ["nopqrst", 2],
  ["uv", 3],
];

/* Columns (c) to (e) of a sale with a federal adjustment the engine does not carry. */
const unlessGap =
  (read: (row: Line1Row) => number | undefined): Cell =>
  (row) =>
    row.gap === undefined ? read(row) : unsupported(row.gap);

const CELLS: Record<string, Cell> = {
  description: (row) => row.description,
  sales_price: (row) => row.salesPrice,
  cost_basis: unlessGap((row) => row.basis),
  loss: unlessGap((row) => row.loss),
  gain: unlessGap((row) => row.gain),
};

/* One line 1 cell: the row's value, blank past the last row. */
type Line1Cell<Info> = (form: unknown, info: Info) => string | number | Unsupported | undefined;

/*
 * MANUAL EDIT: line 1 (ca-540-sched-d-inst-2025::sec::line-1::b01), one row per
 * sale in the order of the federal return. More than 22 sales: every row is
 * unsupported (MORE_ROWS_GAP); the totals still add every sale. Schedule D
 * (540NR) has the same rows on one page (ca-540nr-sched-d-inst-2025::sec::line-1::b01).
 */
export function line1Cells<Info>(
  pages: ReadonlyArray<[letters: string, page: number]>,
  rowsOf: (info: Info) => Line1Row[] | undefined,
): Record<string, Line1Cell<Info>> {
  const out: Record<string, Line1Cell<Info>> = {};
  const letters = pages.flatMap(([group, page]) => [...group].map((letter) => ({ letter, page })));
  letters.forEach(({ letter, page }, index) => {
    for (const [column, read] of Object.entries(CELLS)) {
      out[`${page}.line.1${letter}.${column}`] = (_, info) => {
        const rows = rowsOf(info);
        if (rows === undefined) return undefined;
        if (rows.length > LINE_1_ROWS) return unsupported(MORE_ROWS_GAP);
        const row = rows[index];
        return row === undefined ? undefined : read(row);
      };
    }
  });
  return out;
}

const line1Bindings = (): Bindings =>
  line1Cells<ScheduleDCaFilingInfo>(
    ROW_PAGES,
    (info) => info.scheduleDCaFigures?.line1,
  ) as Bindings;

/* A total line: blank while the form does not file, unsupported with a sale's gap. */
const total =
  (read: (figures: ScheduleDCaFigures) => number | undefined) =>
  (_: unknown, info: ScheduleDCaFilingInfo) => {
    const figures = info.scheduleDCaFigures;
    if (figures === undefined) return undefined;
    return figures.gap === undefined ? read(figures) : unsupported(figures.gap);
  };

/* A line that copies one input, blank while the form does not file. */
const copy =
  (read: (figures: ScheduleDCaFigures) => number | undefined) =>
  (_: unknown, info: ScheduleDCaFilingInfo) =>
    info.scheduleDCaFigures === undefined ? undefined : read(info.scheduleDCaFigures);

/*
 * Line 10: federal Form 1040 line 7a. With no federal Schedule D and no capital
 * gain distributions on line 7a, the federal amount is 0.
 */
function federalLine7a(
  form: FormAccessor<ScheduleDCa>,
  info: ScheduleDCaFilingInfo,
): number | undefined {
  if (info.scheduleDCaFigures === undefined) return undefined;
  return federalCapitalGain(form, info);
}

/* Federal Form 1040 line 7a, 0 with no federal Schedule D and no capital gain distributions. Schedule D (540NR) line 10 too. */
export function federalCapitalGain(
  form: Readonly<Record<string, unknown>>,
  info: Pick<ScheduleDCaFilingInfo, "mustFile" | "capitalGainDistributionsNoScheduleD">,
): number | undefined {
  const federalHasCapitalGains =
    info.mustFile?.["schedule-d"]?.value === true ||
    info.capitalGainDistributionsNoScheduleD !== undefined;
  return federalHasCapitalGains ? numberOrBlank(form["form-1040.line.7a"]) : 0;
}

/*
 * MANUAL EDIT: line 10 (federal 1040 line 7a) holds Form 4797's section 1231 gain
 * through federal Schedule D line 11. Line 1 holds California's: Schedule D-1
 * line 7 or 9, "enter the gain on Schedule D (540 or 540NR), line 1" (the text
 * under Schedule D-1 lines 7 and 9). With no California difference, Schedule D-1
 * does not file and its figures equal the federal ones, so line 1 carries the
 * same gain. Lines 12a and 12b are a gap only while California's gain is not
 * figured (a Schedule D-1 gap) and Form 4797 sends an amount, or a gap, to
 * federal Schedule D line 11.
 */
export function form4797Gap(info: ScheduleDCaFilingInfo): Unsupported | undefined {
  if (!form4797Files(info)) return undefined;
  const sent = scheduleDGainFromForm4797(info);
  if (sent === undefined) return undefined;
  const california = info.californiaSection1231Gain;
  if (california === undefined) {
    return unsupported(
      "Federal Schedule D line 11 holds a Form 4797 section 1231 amount, and California's section 1231 gain (Schedule D-1) is figured only on a Form 540 return.",
    );
  }
  return california.gap === undefined ? undefined : unsupported(`Schedule D-1: ${california.gap}`);
}

/* Lines 12a and 12b: line 10 against line 11. */
const line12 =
  (pick: "line12a" | "line12b") =>
  (form: FormAccessor<ScheduleDCa>, info: ScheduleDCaFilingInfo) => {
    const figures = info.scheduleDCaFigures;
    if (figures === undefined) return undefined;
    if (figures.gap !== undefined) return unsupported(figures.gap);
    const fromForm4797 = form4797Gap(info);
    if (fromForm4797) return fromForm4797;
    const line10 = numberOrBlank(form["3.line.10"]);
    if (line10 === undefined || figures.line11 === undefined) return undefined;
    return adjustment(line10, figures.line11)[pick];
  };

export function register(): void {
  defineForm<ScheduleDCa, ScheduleDCaFilingInfo>("schedule-d-ca", {
    bindings: {
      "0.header.name": (_, info) =>
        info.scheduleDCaFigures && info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => (info.scheduleDCaFigures ? info.taxpayerSSN : undefined),
      ...line1Bindings(),
      /*
       * MANUAL EDIT: line 2 (::line-2-…::b01) takes California Schedule K-1 gains and
       * losses. The engine has no K-1 fact (the federal Schedule D lines 5 and 12
       * are unsupported too), so no return it computes has one: the line is blank.
       */
      "3.line.2.loss": () => undefined,
      "3.line.2.gain": () => undefined,
      // Line 3 (::line-3-capital-gain-distributions::b01): 1099-DIV box 2a; no Form 2439 amount.
      "3.line.3": copy((figures) => figures.line3),
      "3.line.4": total((figures) => figures.line4),
      "3.line.5": total((figures) => figures.line5),
      // Line 6 (::line-6-california-capital-loss-carryover-from-2024::b01).
      "3.line.6": copy((figures) => figures.line6),
      "3.line.7": total((figures) => figures.line7),
      // Line 8 (::line-8-net-gain-or-loss::b01): a loss is a negative number.
      "3.line.8": total((figures) => figures.line8),
      // Line 9 (::line-9::b01): $3,000, or $1,500 married/RDP filing separately.
      "3.line.9": total((figures) => figures.line9),
      "3.line.10": federalLine7a,
      "3.line.11": total((figures) => figures.line11),
      // Lines 12a and 12b (::line-12a::b01, ::line-12b::b01).
      "3.line.12a": line12("line12a"),
      "3.line.12b": line12("line12b"),
    },
  });
}
