/*
 * Form 8824 arithmetic: Part III (lines 12–25c) and Part IV (lines 30–38).
 * Pure functions on amounts; the facts are read in exchange.ts. Each printed
 * amount is whole dollars: an input line keeps its cents and rounds once, and
 * a line the form defines from other lines uses their rounded values.
 */

import { atLeast, roundDollars } from "../../money.js";

/* The tax year this form is for. */
export const TAX_YEAR = 2025;

/*
 * Deferred exchanges: the replacement property "must be identified within 45
 * days after the property being given up is transferred" and "received within
 * 180 days" (irs-8824-inst-2025::sec::deferred-exchanges::b01, line-5::b01, line-6::b01).
 */
export const IDENTIFICATION_DAYS = 45;
export const RECEIPT_DAYS = 180;

/* "Also file Form 8824 for the 2 years following the year of a related party exchange" (when-to-file::b01). */
export const RELATED_PARTY_FOLLOWING_YEARS = 2;

export interface PartIIIInputs {
  /* Lines 12 and 13: the other (not like-kind) property given up. */
  otherGivenUp?: { fairMarketValue: number; adjustedBasis: number };
  cashReceived: number;
  cashPaid: number;
  /* The fair market value of other (not like-kind) property received. */
  otherReceivedValue: number;
  /* Liabilities the other party assumed, and liabilities the taxpayer assumed. */
  liabilitiesRelieved: number;
  liabilitiesAssumed: number;
  exchangeExpenses: number;
  /* Line 16. */
  receivedValue: number;
  givenUpBasis: number;
  section121Exclusion: number;
}

export interface Consideration {
  line15: number;
  line18: number;
}

/*
 * Lines 15 and 18 (irs-8824-inst-2025::sec::lines-15-and-15a::b01, line-18::b01).
 * Net liabilities assumed by the other party: the liabilities it assumed over
 * the liabilities the taxpayer assumed, the cash the taxpayer paid and the FMV
 * of other property given up. The net amount paid is the reverse excess. Line 15
 * is cash received, other property received and the net liabilities, less the
 * exchange expenses but not below zero; the expenses not used there go on line
 * 18 with the adjusted basis and the net amount paid.
 */
export function consideration(inputs: PartIIIInputs): Consideration {
  const given =
    inputs.liabilitiesAssumed + inputs.cashPaid + (inputs.otherGivenUp?.fairMarketValue ?? 0);
  const netRelieved = atLeast(0, inputs.liabilitiesRelieved - given);
  const netPaid = atLeast(0, given - inputs.liabilitiesRelieved);
  const beforeExpenses = inputs.cashReceived + inputs.otherReceivedValue + netRelieved;
  const expensesOnLine15 = Math.min(inputs.exchangeExpenses, beforeExpenses);
  return {
    line15: roundDollars(beforeExpenses - expensesOnLine15),
    line18: roundDollars(
      inputs.givenUpBasis + netPaid + inputs.exchangeExpenses - expensesOnLine15,
    ),
  };
}

export interface RealizedLines {
  line12?: number;
  line13?: number;
  line14?: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
  line19: number;
  line20: number;
}

/*
 * DECISION (2026-11-24, by the author, not reviewed by a person): "If you
 * transferred and received (a) more than one group of like-kind properties, or
 * (b) cash or other (non-like-kind) property, don't complete lines 12 through 18
 * of Form 8824. Instead, attach your own statement"
 * (irs-8824-inst-2025::sec::multi-asset-exchanges::b01). The line 20 example
 * completes lines 15 to 18 for an exchange with $40,000 of cash: "Taylor enters on
 * line 15 of the Form 8824 only the $40,000 cash received"
 * (irs-8824-inst-2025::sec::summary-of-facts::b01). The engine follows the
 * example and the line instructions for one property given up and one received:
 * the (b) clause sits under the heading for multi-asset exchanges, which the
 * fact cannot describe. No dollar amount changes: lines 19 to 25 are the same.
 *
 * Lines 12–20. Lines 12–14 only with other property given up (the form's note
 * above line 12). Line 19 is not reduced by a section 121 exclusion; line 20 is
 * the smaller of line 15 (less the exclusion) or line 19, not below zero
 * (irs-8824-inst-2025::sec::line-19::b02, line-20::b01, property-used-as-home::b01).
 */
export function realizedLines(inputs: PartIIIInputs): RealizedLines {
  const { line15, line18 } = consideration(inputs);
  const line16 = roundDollars(inputs.receivedValue);
  const line17 = line15 + line16;
  const line19 = line17 - line18;
  const exclusion = roundDollars(inputs.section121Exclusion);
  const other = inputs.otherGivenUp;
  const line12 = other === undefined ? undefined : roundDollars(other.fairMarketValue);
  const line13 = other === undefined ? undefined : roundDollars(other.adjustedBasis);
  return {
    line12,
    line13,
    line14: line12 === undefined || line13 === undefined ? undefined : line12 - line13,
    line15,
    line16,
    line17,
    line18,
    line19,
    line20: atLeast(0, Math.min(line15 - exclusion, line19)),
  };
}

/* Line 21 inputs: the recapture of the property given up and the parts of the property received. */
export interface RecaptureInputs {
  section1245Depreciation: number;
  section1250OrdinaryIfSold: number;
  /* The fair market value of the property received (line 16, with cents) and of its section 1245 and 1250 parts. */
  receivedValue: number;
  receivedSection1245Value: number;
  receivedSection1250Value: number;
}

/*
 * Line 21 for section 1245 real property: the smaller of the depreciation (up
 * to the line 19 gain) or the line 20 gain plus the FMV of non-section 1245
 * like-kind property received (irs-8824-inst-2025::sec::line-21::b01). The
 * example: $35,000 depreciation, line 20 $40,000 plus $250,000 → $35,000
 * (line-24::b02).
 */
export function section1245Recapture(lines: RealizedLines, inputs: RecaptureInputs): number {
  const depreciation = Math.min(
    roundDollars(inputs.section1245Depreciation),
    atLeast(0, lines.line19),
  );
  const nonSection1245 = roundDollars(inputs.receivedValue - inputs.receivedSection1245Value);
  return Math.min(depreciation, lines.line20 + nonSection1245);
}

/*
 * Line 21 for section 1250 property: the smaller of the ordinary income if sold,
 * or the larger of the line 20 gain or that income over the FMV of the section
 * 1250 property received (irs-8824-inst-2025::sec::line-21::b01). The example:
 * $35,000, larger of $30,000 or $0 → $30,000 (line-24::b04, b05).
 */
export function section1250Recapture(lines: RealizedLines, inputs: RecaptureInputs): number {
  const ordinary = roundDollars(inputs.section1250OrdinaryIfSold);
  const overReceived = atLeast(0, ordinary - roundDollars(inputs.receivedSection1250Value));
  return Math.min(ordinary, Math.max(lines.line20, overReceived));
}

export interface RecognizedLines {
  line21?: number;
  line22: number;
  line23: number;
  line24: number;
  line25: number;
}

/*
 * Lines 22–25: line 22 is line 20 less line 21, -0- when zero or less; line 23
 * adds lines 21 and 22; line 24 is line 19 less line 23 (a loss on line 19 goes
 * to line 24, as line 23 is then 0); line 25 is lines 18 and 23 less line 15,
 * plus a section 121 exclusion (irs-8824-inst-2025::sec::line-24::b01,
 * property-used-as-home::b01 step 3).
 */
export function recognizedLines(
  lines: RealizedLines,
  line21: number | undefined,
  section121Exclusion: number,
): RecognizedLines {
  const line22 = atLeast(0, lines.line20 - (line21 ?? 0));
  const line23 = (line21 ?? 0) + line22;
  return {
    line21,
    line22,
    line23,
    line24: lines.line19 - line23,
    line25: lines.line18 + line23 - lines.line15 + roundDollars(section121Exclusion),
  };
}

/*
 * Lines 25a–25c: line 25 split in proportion to the FMVs of the parts received
 * (irs-8824-inst-2025::sec::lines-25a-25b-and-25c::b01). The example: $165,000 /
 * $220,000 × $175,000 = $131,250 (::b03). Blank for a part not received.
 */
export function basisPart(
  line25: number,
  partValue: number,
  receivedValue: number,
): number | undefined {
  if (partValue <= 0 || receivedValue <= 0) return undefined;
  return roundDollars((line25 * partValue) / receivedValue);
}

export interface PartIVInputs {
  amountReceived: number;
  sellingExpenses: number;
  basis: number;
  replacementCost: number;
  /* Line 35: the Form 4797 Part III recapture; 0 for a capital asset. */
  recapture: number;
}

export interface PartIVLines {
  line30: number;
  line31: number;
  line32: number;
  line33: number;
  line34: number;
  line35: number;
  line36: number;
  line37: number;
  line38: number;
}

/*
 * Part IV (the form's lines; irs-8824-inst-2025::sec::line-30::b01,
 * section-1043-conflict-of-interest::b01): gain is recognized only to the extent
 * the amount realized is more than the cost of the replacement property.
 */
export function partIVLines(inputs: PartIVInputs): PartIVLines {
  const line30 = roundDollars(inputs.amountReceived - inputs.sellingExpenses);
  const line31 = roundDollars(inputs.basis);
  const line32 = line30 - line31;
  const line33 = roundDollars(inputs.replacementCost);
  const line34 = atLeast(0, line30 - line33);
  const line35 = roundDollars(inputs.recapture);
  const line36 = atLeast(0, line34 - line35);
  const line37 = line32 - (line35 + line36);
  return {
    line30,
    line31,
    line32,
    line33,
    line34,
    line35,
    line36,
    line37,
    line38: line33 - line37,
  };
}

const MS_PER_DAY = 86_400_000;

/* Whole days from one YYYY-MM-DD date to a later one. */
export function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY;
}

/* The year of a YYYY-MM-DD date. */
export const yearOf = (date: string): number => Number(date.slice(0, 4));
