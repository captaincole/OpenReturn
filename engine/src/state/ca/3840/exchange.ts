/*
 * One exchange on FTB 3840: its Form 8824 fact and its California fact, joined
 * by slug. Side 1 copies Form 8824 Parts I and III in any year: the year of the
 * exchange, and each later year until the California deferred gain is
 * recognized ("Enter the same information as reported on the initial",
 * ca-3840-inst-2025::sec::general-question-a-through-question-c::b02).
 */

import type {
  CaLikeKindExchangeFactValue,
  LikeKindExchangeFactValue,
} from "../../../facts/index.js";
import {
  exchangeGap,
  partIII,
  realizedOf,
  relatedPartyState,
} from "../../../federal/8824/exchange.js";
import {
  recognizedLines,
  yearOf,
  type RealizedLines,
  type RecognizedLines,
} from "../../../federal/8824/lines.js";
import { roundDollars } from "../../../money.js";
import { TAX_YEAR, californiaDeferredGain, scheduleALines, type ScheduleALines } from "./lines.js";

export interface CaExchange {
  federalKey: string;
  californiaKey: string;
  /* Undefined while the fact is missing: the form asks for it. */
  federal?: LikeKindExchangeFactValue;
  california?: CaLikeKindExchangeFactValue;
}

/* Side 1 Part II: Form 8824 lines 12–25, or why they cannot be figured. */
export interface Side1 {
  realized?: RealizedLines;
  recognized?: RecognizedLines;
  /* No line 7–20 can be figured. */
  gap?: string;
  /* Lines 16–20 cannot be figured (Form 8824 line 21). */
  line21Gap?: string;
}

export function side1Of(federal: LikeKindExchangeFactValue): Side1 {
  const gap = exchangeGap(federal);
  if (gap) return { gap };
  const part = partIII(federal);
  return "line21Gap" in part
    ? { realized: part.realized, line21Gap: part.line21Gap }
    : { realized: part.realized, recognized: part.recognized };
}

export type FilingType = "initial" | "annual" | "final";

/*
 * Question B (general-question-a-through-question-c::b01–b03): Initial in the
 * year of the exchange, Annual in a later year, Final when the California
 * deferred gain is recognized this year. A related party disposition with no
 * exception makes Form 8824 report the deferred gain this year
 * (irs-8824-inst-2025::sec::line-7::b02), which recognizes it. A same-year
 * exchange and recognition checks Final (QUESTIONS.md). Undefined while the
 * California fact is missing.
 */
export function filingTypeOf(exchange: CaExchange): FilingType | undefined {
  const { federal, california } = exchange;
  if (federal === undefined) return undefined;
  if (relatedPartyState(federal).triggered) return "final";
  if (california === undefined) return undefined;
  if (california.recognizedIn2025) return "final";
  return yearOf(federal.givenUp.dateTransferred) === TAX_YEAR ? "initial" : "annual";
}

/* The California adjusted basis: stated, else the federal one. */
export const californiaBasisOf = (
  federal: LikeKindExchangeFactValue,
  california: CaLikeKindExchangeFactValue,
): number => california.givenUp.californiaAdjustedBasis ?? federal.givenUp.adjustedBasis;

/* Schedule A lines 3–7, column A. */
export function scheduleAOf(
  federal: LikeKindExchangeFactValue,
  california: CaLikeKindExchangeFactValue,
): ScheduleALines {
  return scheduleALines({
    receivedValue: federal.received.fairMarketValue,
    cashReceived: federal.cashReceived ?? 0,
    otherReceivedValue: federal.otherPropertyReceived?.fairMarketValue ?? 0,
    liabilitiesRelieved: federal.givenUp.liabilitiesAssumedByOtherParty ?? 0,
    liabilitiesAssumed: federal.received.liabilitiesAssumed ?? 0,
    cashPaid: federal.cashPaid ?? 0,
    otherGivenUpValue: federal.otherPropertyGivenUp?.fairMarketValue ?? 0,
    exchangeExpenses: federal.exchangeExpenses ?? 0,
    californiaBasis: californiaBasisOf(federal, california),
  });
}

const RECAPTURE_GAP =
  "The California basis is not the federal basis and the property given up has depreciation recapture: the California recapture (Form 8824 line 21 with California amounts) is not stated, so the deferred gain cannot be adjusted (ca-3840-inst-2025::sec::part-i-properties-given-up::b02).";
const RECOGNIZED_GAP =
  "With the California basis the recognized gain is not the federal one: California's own Form 8824 amounts reach Schedule D (540) or Schedule D-1, which do not take them, so the adjusted deferred gain is not printed (ca-3840-inst-2025::sec::part-i-properties-given-up::b02).";

export type Line8 = { value: number } | { gap: string } | undefined;

/*
 * Schedule A line 8, the California sourced deferred gain: Side 1 line 19 for a
 * property given up in California, adjusted for a California basis that differs
 * (lines.ts californiaDeferredGain); 0 for one outside California
 * (part-i-properties-given-up::b03). Undefined while Side 1 line 19 waits.
 */
export function line8Of(exchange: CaExchange, side1: Side1): Line8 {
  const { federal, california } = exchange;
  if (federal === undefined || california === undefined) return undefined;
  const gap = side1.gap ?? side1.line21Gap;
  if (gap) return { gap };
  const recognized = side1.recognized;
  if (recognized === undefined) return undefined;
  if (!california.givenUp.inCalifornia) return { value: 0 };
  const federalBasis = federal.givenUp.adjustedBasis;
  const californiaBasis = californiaBasisOf(federal, california);
  if (roundDollars(federalBasis) === roundDollars(californiaBasis)) {
    return { value: recognized.line24 };
  }
  if (recognized.line21 !== undefined) return { gap: RECAPTURE_GAP };
  const withCaliforniaBasis = realizedOf({
    ...federal,
    givenUp: { ...federal.givenUp, adjustedBasis: californiaBasis },
  });
  const californiaRecognized = recognizedLines(
    withCaliforniaBasis,
    undefined,
    federal.section121Exclusion ?? 0,
  );
  if (californiaRecognized.line23 !== recognized.line23) return { gap: RECOGNIZED_GAP };
  return { value: californiaDeferredGain(recognized.line24, federalBasis, californiaBasis) };
}
