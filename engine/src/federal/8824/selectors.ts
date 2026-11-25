/*
 * The line functions of Form 8824: each reads the printed exchange or the
 * printed Part IV sale, and returns a gap when that is one.
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { DivestitureForm } from "./divestiture.js";
import type { ExchangeForm } from "./exchange.js";
import type { Form8824FilingInfo } from "./filingInfo.js";
import type { RealizedLines, RecognizedLines } from "./lines.js";
import { printedDivestiture, printedExchange, type PrintedExchange } from "./printed.js";

export type LineFn<T> = (form: unknown, info: Form8824FilingInfo) => T | Unsupported | undefined;

type Summary = Extract<PrintedExchange, { kind: "summary" }>;

/*
 * A line of Parts I–III. `pick` reads one exchange; `fromSummary` reads the
 * summary form, which leaves every other line blank (purpose-of-form::b02).
 */
export function exchangeLine<T>(
  pick: (form: ExchangeForm) => T | Unsupported | undefined,
  fromSummary?: (summary: Summary) => T | Unsupported | undefined,
): LineFn<T> {
  return (_, info) => {
    const totals = info.form8824Totals;
    if (totals === undefined) return undefined;
    const printed = printedExchange(totals);
    if (printed.kind === "gap") return unsupported(printed.reason);
    if (printed.kind === "summary") return fromSummary?.(printed);
    return printed.kind === "one" ? pick(printed.form) : undefined;
  };
}

/* Lines 12–20: blank when Part III is not completed this year. */
export const realizedLine = <T>(
  pick: (lines: RealizedLines, form: ExchangeForm) => T | undefined,
) => exchangeLine((form) => (form.realized === undefined ? undefined : pick(form.realized, form)));

/* Lines 21–25c: the line 21 gap when the instructions do not settle it. */
export const recognizedLine = <T>(
  pick: (lines: RecognizedLines, form: ExchangeForm) => T | undefined,
  fromSummary?: (summary: Summary) => T | Unsupported | undefined,
) =>
  exchangeLine((form) => {
    if (form.realized === undefined) return undefined;
    if (form.line21Gap) return unsupported(form.line21Gap);
    return form.recognized === undefined ? undefined : pick(form.recognized, form);
  }, fromSummary);

/* A total of the summary form, or the gap of an exchange in it. */
export const summaryTotal =
  (pick: (summary: Summary) => number | undefined) =>
  (summary: Summary): number | Unsupported | undefined =>
    summary.gap ? unsupported(summary.gap) : pick(summary);

/* A line of Part IV; `figured` lines (35–38) also take the gap of a business property. */
export function divestitureLine<T>(
  pick: (form: DivestitureForm) => T | undefined,
  figured = false,
): LineFn<T> {
  return (_, info) => {
    const totals = info.form8824Totals;
    if (totals === undefined) return undefined;
    const printed = printedDivestiture(totals);
    if (printed.kind === "gap") return unsupported(printed.reason);
    if (printed.kind === "blank") return undefined;
    if (figured && printed.form.linesGap) return unsupported(printed.form.linesGap);
    return pick(printed.form);
  };
}

/* A Yes/No pair of checkboxes: each box is checked (true) or blank. */
export const yesBox = (answer: boolean | undefined): boolean | undefined =>
  answer === true ? true : undefined;
export const noBox = (answer: boolean | undefined): boolean | undefined =>
  answer === false ? true : undefined;
