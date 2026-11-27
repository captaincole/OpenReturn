/*
 * Schedule D (540NR): Schedule D (540)'s lines on the same sales, as if the
 * taxpayer were a full-year resident (lines.ts). Every field is on page 0.
 */

import { defineForm, type FormAccessor, type FormSpec } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { federalCapitalGain, line1Cells } from "../schedule-d-ca/bindings.js";
import { adjustment } from "../schedule-d-ca/lines.js";
import type { ScheduleD540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleD540NRFigures } from "./lines.js";
import type { ScheduleD540NR } from "./types.js";

type Info = ScheduleD540NRFilingInfo;
type Form = FormAccessor<ScheduleD540NR>;
type Bindings = FormSpec<ScheduleD540NR, Info>["bindings"];

/* Line 1 has rows a through v, all on the one page. */
const ROW_PAGES: Array<[letters: string, page: number]> = [["abcdefghijklmnopqrstuv", 0]];

/* A total line: blank while the form does not file, unsupported with a gap. */
const total =
  (read: (figures: ScheduleD540NRFigures) => number | undefined) => (_: Form, info: Info) => {
    const figures = info.scheduleD540NRFigures;
    if (figures === undefined) return undefined;
    return figures.gap === undefined ? read(figures) : unsupported(figures.gap);
  };

/* A line that copies one input (lines 3 and 6), blank while the form does not file. */
const copy =
  (read: (figures: ScheduleD540NRFigures) => number | undefined) => (_: Form, info: Info) =>
    info.scheduleD540NRFigures === undefined ? undefined : read(info.scheduleD540NRFigures);

/*
 * Line 2 (ca-540nr-sched-d-inst-2025::sec::line-2-…::b01): the net of the
 * California Schedules K-1. Blank with no K-1 capital item on the return; a gap
 * with one, since the engine has no California K-1 amount (sources.ts).
 */
const line2 = (_: Form, info: Info) => {
  const gap = info.scheduleD540NRFigures?.line2Gap;
  return gap === undefined ? undefined : unsupported(gap);
};

/* Line 10: federal Form 1040 line 7a (0 with no capital gain or loss on it). */
const line10 = (form: Form, info: Info) =>
  info.scheduleD540NRFigures === undefined ? undefined : federalCapitalGain(form, info);

/* Lines 12a and 12b (::line-12a::b01, ::line-12b::b01): line 10 against line 11. */
const line12 = (pick: "line12a" | "line12b") => (form: Form, info: Info) => {
  const figures = info.scheduleD540NRFigures;
  if (figures === undefined) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  const federal = numberOrBlank(form["0.line.10"]);
  if (federal === undefined || figures.line11 === undefined) return undefined;
  return adjustment(federal, figures.line11)[pick];
};

const BINDINGS: Bindings = {
  // "Name(s) as shown on return": both spouses on a joint return.
  "0.header.name": (_, info) => (info.scheduleD540NRFigures ? namesOnReturn(info) : undefined),
  "0.header.ssn": (_, info) => (info.scheduleD540NRFigures ? info.taxpayerSSN : undefined),
  ...(line1Cells<Info>(ROW_PAGES, (info) => info.scheduleD540NRFigures?.line1) as Bindings),
  "0.line.2.loss": line2,
  "0.line.2.gain": line2,
  // Line 3 (::line-3-capital-gain-distributions::b01): 1099-DIV box 2a; no Form 2439 amount.
  "0.line.3": copy((figures) => figures.line3),
  "0.line.4": total((figures) => figures.line4),
  "0.line.5": total((figures) => figures.line5),
  // Line 6 (::line-6-california-capital-loss-carryover-from-2024::b01): as if a resident in all prior years.
  "0.line.6": copy((figures) => figures.line6),
  "0.line.7": total((figures) => figures.line7),
  // Line 8 (::line-8-net-gain-or-loss::b01): a loss is a negative number.
  "0.line.8": total((figures) => figures.line8),
  // Line 9 (::line-9::b01): $3,000, or $1,500 married/RDP filing separately.
  "0.line.9": total((figures) => figures.line9),
  "0.line.10": line10,
  "0.line.11": total((figures) => figures.line11),
  "0.line.12a": line12("line12a"),
  "0.line.12b": line12("line12b"),
};

export function register(): void {
  defineForm<ScheduleD540NR, Info>("schedule-d-540nr", { bindings: BINDINGS });
}
