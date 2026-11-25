/*
 * One like-kind exchange fact → its Form 8824 (Parts I–III) and the amounts it
 * sends to Schedule D and Form 4797. Who files and which parts are completed
 * follow the form's text under lines 7 and 10 and irs-8824-inst-2025::sec::line-7::b02.
 */

import type {
  ExchangePropertyUse,
  LikeKindExchangeFact,
  LikeKindExchangeFactValue,
  RelatedPartyException,
} from "../../facts/index.js";
import { heldMoreThanOneYear } from "../4797/dates.js";
import {
  IDENTIFICATION_DAYS,
  RECEIPT_DAYS,
  RELATED_PARTY_FOLLOWING_YEARS,
  TAX_YEAR,
  basisPart,
  daysBetween,
  realizedLines,
  recognizedLines,
  section1245Recapture,
  section1250Recapture,
  yearOf,
  type RealizedLines,
  type RecognizedLines,
} from "./lines.js";
import { addAmount, emptyAmounts, type Destination, type RoutedAmounts } from "./routedAmounts.js";

export interface ExchangeRoute {
  amounts: RoutedAmounts;
  /* Why some amounts cannot be carried, and the forms that leaves open. */
  gap?: { reason: string; destinations: Destination[] };
  /* Lines 9 or 10 are not answered, or line 21 lacks the section 1250 value received: the form asks for the exchange again. */
  waits: boolean;
  /* A section 1231 gain from section 1250 property that was depreciated (Schedule D line 19). */
  unrecapturedGap?: string;
}

export interface ExchangeForm {
  key: string;
  value: LikeKindExchangeFactValue;
  /* Part III is completed this year: the year of the exchange, or a later year of a disposition. */
  realized?: RealizedLines;
  recognized?: RecognizedLines;
  /* Why lines 21–25c cannot be figured. */
  line21Gap?: string;
  basisParts?: { section1250?: number; section1245?: number; intangible?: number };
  /* The line 11 box to check. */
  line11?: RelatedPartyException;
  route: ExchangeRoute;
}

export type ExchangeOutcome =
  | { kind: "not_this_year" }
  | { kind: "gap"; key: string; reason: string; destinations: Destination[] }
  | { kind: "filed"; form: ExchangeForm };

export const destinationOf = (use: ExchangePropertyUse): Destination =>
  use === "investment" ? "schedule_d" : "form_4797";

/* The forms an exchange's gain reaches: the property given up's, and the other property's. */
function destinationsOf(value: LikeKindExchangeFactValue): Destination[] {
  const all = [destinationOf(value.givenUp.use)];
  if (value.otherPropertyGivenUp) all.push(destinationOf(value.otherPropertyGivenUp.use));
  return [...new Set(all)];
}

/*
 * A deferred exchange: "The replacement property for the exchange must be
 * identified within 45 days after the property being given up is transferred.
 * The replacement property must be received within 180 days"
 * (irs-8824-inst-2025::sec::deferred-exchanges::b01). A property received
 * before the transfer (a QEAA) has no deadline to test here.
 */
function deadlineGap(value: LikeKindExchangeFactValue): string | undefined {
  const transferred = value.givenUp.dateTransferred;
  const { dateIdentified, dateReceived } = value.received;
  const receivedDays = daysBetween(transferred, dateReceived);
  // "If you received the replacement property before the end of the 45-day period, you are automatically treated as having met" it (line-5::b03).
  if (receivedDays <= IDENTIFICATION_DAYS) return undefined;
  if (dateIdentified === undefined) return NO_IDENTIFICATION_GAP;
  const late =
    receivedDays > RECEIPT_DAYS || daysBetween(transferred, dateIdentified) > IDENTIFICATION_DAYS;
  return late ? LATE_GAP : undefined;
}

const LATE_GAP =
  "The replacement property was identified after 45 days or received after 180 days (irs-8824-inst-2025::sec::deferred-exchanges::b01): the exchange does not qualify, the gain is reported as a sale, and the engine does not carry a sale from an exchange fact.";
const NO_IDENTIFICATION_GAP =
  "A deferred exchange received more than 45 days after the transfer states no written identification date (line 5; irs-8824-inst-2025::sec::line-5::b01).";

/* The reasons no line of an exchange can be figured. FTB 3840 reads it too. */
export function exchangeGap(value: LikeKindExchangeFactValue): string | undefined {
  if (value.usedPartlyAsHome === true) {
    return "The property given up was used partly as a main home: two worksheet Forms 8824 split every amount between the home and the business part (irs-8824-inst-2025::sec::property-used-as-home::b02), and the facts do not split them.";
  }
  const related = value.relatedParty;
  if (related?.soldIntoExchange === true && related.exception === undefined) {
    return "A related party sold the replacement property into the exchange and no line 11 exception applies: do not file Form 8824, report the disposition as if the exchange had been a sale (the note under line 7; irs-8824-inst-2025::sec::line-7::b03).";
  }
  const { section1250Value = 0, section1245Value = 0, intangibleValue = 0 } = value.received;
  if (section1250Value + section1245Value + intangibleValue > value.received.fairMarketValue) {
    return "The parts of the property received are worth more than the property (lines 16 and 25a–25c).";
  }
  return deadlineGap(value);
}

/* Line 21, or why the instructions do not settle it. */
function line21Of(
  value: LikeKindExchangeFactValue,
  realized: RealizedLines,
): number | string | undefined {
  const recapture = value.givenUp.recapture ?? {};
  if (recapture.section1252To1255 === true) {
    return 'Section 1252, 1254 and 1255 property: the rules are only "similar to those for section 1245 property" and point to the regulations (irs-8824-inst-2025::sec::line-21::b02).';
  }
  const inputs = {
    section1245Depreciation: recapture.section1245Depreciation ?? 0,
    section1250OrdinaryIfSold: recapture.section1250OrdinaryIfSold ?? 0,
    receivedValue: value.received.fairMarketValue,
    receivedSection1245Value: value.received.section1245Value ?? 0,
    receivedSection1250Value: value.received.section1250Value ?? 0,
  };
  const has1245 = inputs.section1245Depreciation > 0;
  const has1250 = inputs.section1250OrdinaryIfSold > 0;
  if (has1245 && has1250) {
    return "Both section 1245 and section 1250 recapture: line 21 gives each rule its own limit from line 20 (irs-8824-inst-2025::sec::line-21::b01) and does not say how they combine.";
  }
  if (has1245) return section1245Recapture(realized, inputs);
  if (has1250) return section1250Recapture(realized, inputs);
  return undefined;
}

/* Part II: lines 9 and 10 answered, a disposition, the line 11 box, and whether line 24 is reported. */
export function relatedPartyState(value: LikeKindExchangeFactValue) {
  const related = value.relatedParty;
  if (related === undefined) return { waits: false, triggered: false, line11: undefined };
  const waits =
    related.relatedPartyDisposed === undefined || related.taxpayerDisposed === undefined;
  const disposed = related.relatedPartyDisposed === true || related.taxpayerDisposed === true;
  const boxed = disposed || related.soldIntoExchange === true;
  return {
    waits,
    triggered: disposed && related.exception === undefined,
    line11: boxed ? related.exception : undefined,
  };
}

/*
 * The section 1250 rule of line 21 reads "the FMV of the section 1250 property
 * received" (irs-8824-inst-2025::sec::line-21::b01), and the taxpayer decides
 * that split (lines-25a-25b-and-25c::b02). With section 1250 recapture on the
 * property given up and no section 1250 value stated, the exchange waits for
 * it (QUESTIONS.md, question 15); a stated 0 (land received) answers it.
 */
const waitsForSection1250Value = (value: LikeKindExchangeFactValue): boolean =>
  (value.givenUp.recapture?.section1250OrdinaryIfSold ?? 0) > 0 &&
  value.received.section1250Value === undefined;

/* Lines 12–20 of one exchange, from its fact. */
export function realizedOf(value: LikeKindExchangeFactValue): RealizedLines {
  const other = value.otherPropertyGivenUp;
  return realizedLines({
    otherGivenUp: other && {
      fairMarketValue: other.fairMarketValue,
      adjustedBasis: other.adjustedBasis,
    },
    cashReceived: value.cashReceived ?? 0,
    cashPaid: value.cashPaid ?? 0,
    otherReceivedValue: value.otherPropertyReceived?.fairMarketValue ?? 0,
    liabilitiesRelieved: value.givenUp.liabilitiesAssumedByOtherParty ?? 0,
    liabilitiesAssumed: value.received.liabilitiesAssumed ?? 0,
    exchangeExpenses: value.exchangeExpenses ?? 0,
    receivedValue: value.received.fairMarketValue,
    givenUpBasis: value.givenUp.adjustedBasis,
    section121Exclusion: value.section121Exclusion ?? 0,
  });
}

/* Part III of one exchange: lines 12–25c, or the gap of lines 21–25c. FTB 3840 copies it in any year. */
export function partIII(value: LikeKindExchangeFactValue) {
  const exclusion = value.section121Exclusion ?? 0;
  const realized = realizedOf(value);
  const line21 = line21Of(value, realized);
  if (typeof line21 === "string") return { realized, line21Gap: line21 };
  const recognized = recognizedLines(realized, line21, exclusion);
  const received = value.received;
  const part = (amount: number | undefined) =>
    basisPart(recognized.line25, amount ?? 0, received.fairMarketValue);
  return {
    realized,
    recognized,
    basisParts: {
      section1250: part(received.section1250Value),
      section1245: part(received.section1245Value),
      intangible: part(received.intangibleValue),
    },
  };
}

/* The Schedule D or Form 4797 line a gain of a property goes on (irs-8824-inst-2025::sec::line-22::b01). */
function placeGain(
  amounts: RoutedAmounts,
  use: ExchangePropertyUse,
  longTerm: boolean,
  amount: number,
): RoutedAmounts {
  if (use === "investment")
    return addAmount(amounts, longTerm ? "longTermCapital" : "shortTermCapital", amount);
  // Property used in a business and held more than 1 year is section 1231 property (irs-4797-inst-2025::sec::part-i::b01).
  return addAmount(amounts, longTerm ? "section1231" : "ordinary", amount);
}

const INSTALLMENT_GAP =
  "The installment method applies: the gain goes on Form 6252 (irs-8824-inst-2025::sec::line-22::b01, line-21::b02), which has no rules.";
const OTHER_BUSINESS_GAP =
  'Line 14: other property given up that was used in a business is reported "as if the exchange had been a sale" (irs-8824-inst-2025::sec::line-14::b01), on Form 4797 with its own recapture, and the engine does not carry that sale from an exchange fact.';
const RELATED_LOSS_GAP =
  'A loss with a related party: Form 8824 reports it "as if the exchange had been a sale" (irs-8824-inst-2025::sec::line-7::b02, line-14::b01), and a loss from a sale between related parties is not deductible (irs-1040sd-inst-2025::sec::certain-nondeductible-losses::b01).';
const TRIGGERED_RECAPTURE_GAP =
  'A related party disposition makes the line 24 deferred gain reportable "as if the exchange had been a sale" (irs-8824-inst-2025::sec::line-7::b02); the instructions do not say how the recapture of a sale applies to it.';
const UNRECAPTURED_GAP =
  "A Form 8824 section 1231 gain on Form 4797 line 5 from section 1250 property that was depreciated: the Unrecaptured Section 1250 Gain Worksheet takes only Part III properties of Form 4797 (line 1) and sales with no Part I entry (line 12) (irs-1040sd-inst-2025::sec::unrecaptured-section-1250-gain-worksheet-line-19::b01, b03).";

interface RouteInputs {
  value: LikeKindExchangeFactValue;
  realized?: RealizedLines;
  recognized?: RecognizedLines;
  exchangeYear: boolean;
  triggered: boolean;
  line21Gap?: string;
}

/* The gaps of a route, first found first. */
function routeGap(inputs: RouteInputs): ExchangeRoute["gap"] {
  const { value, realized, recognized, exchangeYear, triggered } = inputs;
  const own = destinationOf(value.givenUp.use);
  if (recognized === undefined) {
    return { reason: inputs.line21Gap ?? "", destinations: [own, "form_4797"] };
  }
  if (value.installmentMethod === true)
    return { reason: INSTALLMENT_GAP, destinations: [own, "form_4797" as const] };
  const other = value.otherPropertyGivenUp;
  if (exchangeYear && other !== undefined) {
    if (other.use === "business_or_rental")
      return { reason: OTHER_BUSINESS_GAP, destinations: ["form_4797" as const] };
    if (value.relatedParty && (realized?.line14 ?? 0) < 0)
      return { reason: RELATED_LOSS_GAP, destinations: ["schedule_d" as const] };
  }
  if (!triggered) return undefined;
  if (recognized.line24 < 0) return { reason: RELATED_LOSS_GAP, destinations: [own] };
  const recapture = value.givenUp.recapture ?? {};
  if (
    (recapture.section1245Depreciation ?? 0) > 0 ||
    (recapture.section1250OrdinaryIfSold ?? 0) > 0
  ) {
    return { reason: TRIGGERED_RECAPTURE_GAP, destinations: [own, "form_4797" as const] };
  }
  return undefined;
}

/*
 * The amounts an exchange sends this year. The year of the exchange: line 21 to
 * Form 4797 line 16, line 22 to Schedule D or Form 4797 by the property's use
 * and holding period ("use the date of the exchange", line-22::b01), and line 14
 * as a sale of the other property. A related party disposition with no exception
 * also reports line 24 (line-7::b02); in a later year only line 24.
 */
function amountsOf({
  value,
  realized,
  recognized,
  exchangeYear,
  triggered,
}: RouteInputs): RoutedAmounts {
  let amounts = emptyAmounts();
  if (recognized === undefined || realized === undefined) return amounts;
  const { givenUp } = value;
  const longTerm = heldMoreThanOneYear(givenUp.dateAcquired, givenUp.dateTransferred);
  if (exchangeYear) {
    amounts = addAmount(amounts, "ordinary", recognized.line21 ?? 0);
    amounts = placeGain(amounts, givenUp.use, longTerm, recognized.line22);
    const other = value.otherPropertyGivenUp;
    if (other !== undefined && realized.line14 !== undefined) {
      const otherLong = heldMoreThanOneYear(other.dateAcquired, givenUp.dateTransferred);
      amounts = placeGain(amounts, other.use, otherLong, realized.line14);
    }
  }
  return triggered ? placeGain(amounts, givenUp.use, longTerm, recognized.line24) : amounts;
}

function routeOf(inputs: RouteInputs, waits: boolean): ExchangeRoute {
  const amounts = amountsOf(inputs);
  const depreciated = (inputs.value.givenUp.recapture?.section1250Depreciation ?? 0) > 0;
  return {
    amounts,
    gap: routeGap(inputs),
    waits,
    unrecapturedGap: depreciated && amounts.section1231 > 0 ? UNRECAPTURED_GAP : undefined,
  };
}

/*
 * Who files for one exchange (irs-8824-inst-2025::sec::when-to-file::b01): the
 * year the property was transferred, and the 2 years after a related party
 * exchange. In a later year Part III is completed only for a disposition with no
 * exception (the form's text under line 10; line-7::b02).
 */
export function evaluateExchange({ key, value }: LikeKindExchangeFact): ExchangeOutcome {
  const year = yearOf(value.givenUp.dateTransferred);
  const exchangeYear = year === TAX_YEAR;
  const following =
    value.relatedParty !== undefined &&
    year < TAX_YEAR &&
    year >= TAX_YEAR - RELATED_PARTY_FOLLOWING_YEARS;
  if (!exchangeYear && !following) return { kind: "not_this_year" };
  const reason = exchangeGap(value);
  if (reason) return { kind: "gap", key, reason, destinations: destinationsOf(value) };
  const related = relatedPartyState(value);
  const completes = exchangeYear || related.triggered;
  const part = completes ? partIII(value) : undefined;
  const inputs: RouteInputs = {
    value,
    realized: part?.realized,
    recognized: part?.recognized,
    exchangeYear,
    triggered: related.triggered,
    line21Gap: part?.line21Gap,
  };
  const waits = related.waits || (completes && waitsForSection1250Value(value));
  const route = completes
    ? routeOf(inputs, waits)
    : { amounts: emptyAmounts(), waits: related.waits };
  return {
    kind: "filed",
    form: { key, value, ...part, line11: related.line11, route },
  };
}
