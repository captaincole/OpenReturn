/*
 * The line functions of Form 8824: each reads the exchange or the Part IV sale
 * of the copy being printed (printed.ts), and returns a gap when that is one.
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { DivestitureForm } from "./divestiture.js";
import type { ExchangeForm } from "./exchange.js";
import type { Form8824FilingInfo } from "./filingInfo.js";
import type { RealizedLines, RecognizedLines } from "./lines.js";
import { printedDivestiture, printedExchange } from "./printed.js";

export type LineFn<T> = (form: unknown, info: Form8824FilingInfo) => T | Unsupported | undefined;

const copyIndexOf = (info: Form8824FilingInfo): number => info.form8824CopyIndex ?? 0;

/* A line of Parts I–III: `pick` reads this copy's exchange; blank on a copy with none. */
export function exchangeLine<T>(
  pick: (form: ExchangeForm) => T | Unsupported | undefined,
): LineFn<T> {
  return (_, info) => {
    const totals = info.form8824Totals;
    if (totals === undefined) return undefined;
    const printed = printedExchange(totals, copyIndexOf(info));
    if (printed.kind === "gap") return unsupported(printed.reason);
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
) =>
  exchangeLine((form) => {
    if (form.realized === undefined) return undefined;
    if (form.line21Gap) return unsupported(form.line21Gap);
    return form.recognized === undefined ? undefined : pick(form.recognized, form);
  });

/* A line of Part IV; `figured` lines (35–38) also take the gap of a business property. */
export function divestitureLine<T>(
  pick: (form: DivestitureForm) => T | undefined,
  figured = false,
): LineFn<T> {
  return (_, info) => {
    const totals = info.form8824Totals;
    if (totals === undefined) return undefined;
    const printed = printedDivestiture(totals, copyIndexOf(info));
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
