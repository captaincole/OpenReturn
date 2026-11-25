/*
 * The line functions of FTB 3840: each reads the printed exchange and returns
 * its gap when it has one. A line that needs a fact the exchange lacks waits:
 * resolveInfo.ts lists that fact in missingInputs.
 */

import type {
  CaLikeKindExchangeFactValue,
  LikeKindExchangeFactValue,
} from "../../../facts/index.js";
import type { RealizedLines, RecognizedLines } from "../../../federal/8824/lines.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { line8Of, scheduleAOf, side1Of, type CaExchange, type Side1 } from "./exchange.js";
import type { Form3840FilingInfo } from "./filingInfo.js";
import type { ScheduleALines } from "./lines.js";

type Result<T> = T | Unsupported | undefined;
export type LineFn<T> = (form: unknown, info: Form3840FilingInfo) => Result<T>;

/* A line of the printed exchange: blank when the form does not file, the gap when every exchange line is one. */
export function exchangeLine<T>(
  pick: (exchange: CaExchange, info: Form3840FilingInfo) => Result<T>,
): LineFn<T> {
  return (_, info) => {
    const state = info.form3840;
    if (state === undefined) return undefined;
    if (state.gap) return unsupported(state.gap);
    return state.exchange === undefined ? undefined : pick(state.exchange, info);
  };
}

/* A line from the Form 8824 fact (Side 1 Part I, Question C). */
export const federalLine = <T>(
  pick: (federal: LikeKindExchangeFactValue, exchange: CaExchange) => Result<T>,
): LineFn<T> =>
  exchangeLine((exchange) =>
    exchange.federal === undefined ? undefined : pick(exchange.federal, exchange),
  );

/* A line from the California fact (Schedule A lines 1, 2, 9 and 11). */
export const californiaLine = <T>(
  pick: (california: CaLikeKindExchangeFactValue) => Result<T>,
): LineFn<T> =>
  exchangeLine((exchange) =>
    exchange.california === undefined ? undefined : pick(exchange.california),
  );

/* Side 1 lines 7–15: Form 8824 lines 12–20. */
export const realizedLine = (pick: (lines: RealizedLines) => number | undefined): LineFn<number> =>
  federalLine((federal) => {
    const side1 = side1Of(federal);
    if (side1.gap) return unsupported(side1.gap);
    return side1.realized === undefined ? undefined : pick(side1.realized);
  });

/* Side 1 lines 16–20: Form 8824 lines 21–25, or the line 21 gap. */
export const recognizedLine = (
  pick: (lines: RecognizedLines) => number | undefined,
): LineFn<number> =>
  federalLine((federal) => {
    const side1: Side1 = side1Of(federal);
    const gap = side1.gap ?? side1.line21Gap;
    if (gap) return unsupported(gap);
    return side1.recognized === undefined ? undefined : pick(side1.recognized);
  });

/* Schedule A lines 3–7, column A: both facts; the gap of an exchange that does not qualify. */
export const scheduleALine = (pick: (lines: ScheduleALines) => number): LineFn<number> =>
  exchangeLine(({ federal, california }) => {
    if (federal === undefined || california === undefined) return undefined;
    const gap = side1Of(federal).gap;
    return gap ? unsupported(gap) : pick(scheduleAOf(federal, california));
  });

/* Schedule A line 8, and line 10 column D for the one property received. */
export const line8 = exchangeLine((exchange) => {
  if (exchange.federal === undefined) return undefined;
  const result = line8Of(exchange, side1Of(exchange.federal));
  if (result === undefined) return undefined;
  return "gap" in result ? unsupported(result.gap) : result.value;
});

/* A Yes/No radio of Schedule A. */
export const yesNo = (answer: boolean): "yes" | "no" => (answer ? "yes" : "no");
