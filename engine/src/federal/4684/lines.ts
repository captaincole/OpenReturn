/*
 * Form 4684 Section A: lines 2–12 for one casualty or theft event, and the
 * totals on lines 13–17 over every event. Pure functions of the event facts,
 * so Schedule A can read the net qualified disaster loss without the form.
 */

import type { CasualtyEventFactValue, CasualtyPropertyValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

/* Columns A through D; more items go on additional sheets (Section A instructions). */
export const COLUMNS = 4;

/* Line 11 (irs-4684-inst-2025::sec::line-11::b01). */
export const CASUALTY_FLOOR = 100;
export const QUALIFIED_DISASTER_FLOOR = 500;

/* Line 17: 10% of Form 1040 line 11b. */
export const AGI_FLOOR_RATE = 0.1;

export interface PropertyLines {
  line2: number;
  /* Blank when no reimbursement. */
  line3: number | undefined;
  /* Only when line 3 is more than line 2; waits for the amount received in 2025. */
  line4: number | undefined;
  /* Lines 5 through 9 are skipped when line 4 has a gain. */
  line5: number | undefined;
  line6: number | undefined;
  line7: number | undefined;
  line8: number | undefined;
  line9: number | undefined;
}

/*
 * Line 3 is more than line 2: a gain. Not modeled: the main-home exclusion that
 * reduces line 3 (irs-4684-inst-2025::sec::line-3::b03) and the election to
 * postpone the gain with replacement property (line-3::b04, Gain on Reimbursement).
 */
export function hasGain(property: CasualtyPropertyValue): boolean {
  return roundDollars(property.reimbursement) > roundDollars(property.costBasis);
}

/*
 * Line 4 is the 2025 receipts less line 2, not less than zero: coverage not
 * claimed, or received in a later year, is no gain now (line-4::b01).
 */
function line4Gain(property: CasualtyPropertyValue, line2: number): number | undefined {
  if (property.reimbursementReceived === undefined) return undefined;
  return atLeast(0, roundDollars(property.reimbursementReceived) - line2);
}

export function propertyLines(property: CasualtyPropertyValue): PropertyLines {
  const line2 = roundDollars(property.costBasis);
  const reimbursement = roundDollars(property.reimbursement);
  const line3 = reimbursement > 0 ? reimbursement : undefined;
  if (hasGain(property)) {
    return {
      line2,
      line3,
      line4: line4Gain(property, line2),
      line5: undefined,
      line6: undefined,
      line7: undefined,
      line8: undefined,
      line9: undefined,
    };
  }
  const line5 = roundDollars(property.fairMarketValueBefore);
  const line6 = roundDollars(property.fairMarketValueAfter);
  const line7 = line5 - line6;
  const line8 = Math.min(line2, line7);
  const line9 = Math.max(0, line8 - reimbursement);
  return { line2, line3, line4: undefined, line5, line6, line7, line8, line9 };
}

/* The line 4 gains of every property in the event, additional sheets included; waits on any line 4. */
export function line4Total(event: CasualtyEventFactValue): number | undefined {
  const gains = event.properties.filter(hasGain).map((property) => propertyLines(property).line4);
  return gains.includes(undefined) ? undefined : sum(...gains);
}

/* The line 4 gains known so far; a waiting line 4 counts as zero. */
function knownLine4Total(event: CasualtyEventFactValue): number {
  return sum(...event.properties.map((property) => propertyLines(property).line4));
}

/* Blocked with more than four properties: the additional sheets are not printed. */
export function line10(event: CasualtyEventFactValue): number | undefined {
  if (event.properties.length > COLUMNS) return undefined;
  return sumOrBlank(...event.properties.map((property) => propertyLines(property).line9));
}

/* $500 when a qualified disaster loss on line 10 is larger than the line 4 gains of all Forms 4684. */
export function line11(
  events: readonly CasualtyEventFactValue[],
  index: number,
): number | undefined {
  const event = events[index];
  const loss = event && line10(event);
  if (loss === undefined) return undefined;
  if (!event.qualifiedDisasterLoss) return CASUALTY_FLOOR;
  const known = sum(...events.map(knownLine4Total));
  if (loss <= known) return CASUALTY_FLOOR;
  // A waiting line 4 can only raise the gains, so line 11 waits only when it can still flip.
  const waiting = events.some((other) => line4Total(other) === undefined);
  return waiting ? undefined : QUALIFIED_DISASTER_FLOOR;
}

export function line12(
  events: readonly CasualtyEventFactValue[],
  index: number,
): number | undefined {
  const event = events[index];
  const loss = event && line10(event);
  const floor = line11(events, index);
  if (loss === undefined || floor === undefined) return undefined;
  return Math.max(0, loss - floor);
}

/* Line 1, Property A's ZIP: the property most affected, read as the largest decrease in FMV (line 7). */
export function mostAffectedZip(event: CasualtyEventFactValue): string | undefined {
  let best: { zip: string | undefined; decrease: number } | undefined;
  for (const property of event.properties) {
    const decrease = propertyLines(property).line7 ?? 0;
    if (!best || decrease > best.decrease) best = { zip: property.zip, decrease };
  }
  return best?.zip;
}

/* Line 12 of one Form 4684 with a loss column, as lines 14 and 15 read it. */
interface EventLoss {
  line10: number;
  line12: number;
  /* Federal casualty, disaster and qualified disaster losses all "refer to federally declared disasters" (general-instructions::b01). */
  declared: boolean;
  /* Line 11 is $500 (line-15::b02). */
  subjectToQualifiedFloor: boolean;
}

/* Forms with only gain columns have no line 12; a blocked line 12 makes the totals wait. */
function eventLosses(events: readonly CasualtyEventFactValue[]): EventLoss[] | undefined {
  const losses: EventLoss[] = [];
  for (const [index, event] of events.entries()) {
    if (event.properties.every(hasGain)) continue;
    const ten = line10(event);
    const floor = line11(events, index);
    const twelve = line12(events, index);
    if (ten === undefined || floor === undefined || twelve === undefined) return undefined;
    losses.push({
      line10: ten,
      line12: twelve,
      declared: event.federallyDeclaredDisaster || event.qualifiedDisasterLoss,
      subjectToQualifiedFloor: floor === QUALIFIED_DISASTER_FLOOR,
    });
  }
  return losses;
}

export interface SectionATotals {
  /* Blank when no Form 4684 reports a gain. */
  line13: number | undefined;
  /* Blank when no Form 4684 reports a loss. */
  line14: number | undefined;
  /* A net gain (for Schedule D), 0, or the net qualified disaster loss. */
  line15: number;
  /* The part of line 15 that is a net qualified disaster loss (Schedule A line 16); 0 otherwise. */
  netQualifiedDisasterLoss: number;
  /* Blank when line 15 stops the section. */
  line16: number | undefined;
}

/* Worksheet 1-1: losses not attributable to a federally declared disaster count only up to line 13. */
function line14Total(losses: readonly EventLoss[], gains: number): number {
  const notDeclared = sum(...losses.filter((loss) => !loss.declared).map((loss) => loss.line12));
  const declared = sum(...losses.filter((loss) => loss.declared).map((loss) => loss.line12));
  return declared + Math.min(notDeclared, gains);
}

/* Lines 13–16 over every Form 4684, in the order recorded; waits on any line 4 or line 12. */
export function sectionATotals(
  events: readonly CasualtyEventFactValue[],
): SectionATotals | undefined {
  if (events.length === 0) return undefined;
  const gainsByEvent = events.map(line4Total);
  const losses = eventLosses(events);
  if (gainsByEvent.includes(undefined) || losses === undefined) return undefined;
  const reportsGain = events.some((event) => event.properties.some(hasGain));
  const line13 = reportsGain ? sum(...gainsByEvent) : undefined;
  const gains = line13 ?? 0;
  const total = line14Total(losses, gains);
  const line14 = losses.length > 0 ? total : undefined;
  const lines = { line13, line14 };
  // More or equal: the difference (a gain, or 0), and the section stops.
  if (gains >= total) {
    return { ...lines, line15: gains - total, netQualifiedDisasterLoss: 0, line16: undefined };
  }
  const qualified = losses.filter((loss) => loss.subjectToQualifiedFloor);
  if (qualified.length === 0) {
    return { ...lines, line15: 0, netQualifiedDisasterLoss: 0, line16: total - gains };
  }
  const line15 = Math.min(total - gains, sum(...qualified.map((loss) => loss.line12)));
  const allQualified = losses
    .filter((loss) => loss.line10 > 0)
    .every((loss) => loss.subjectToQualifiedFloor);
  return {
    ...lines,
    line15,
    netQualifiedDisasterLoss: line15,
    line16: allQualified ? undefined : total - (gains + line15),
  };
}

/* Form 4684 line 15 as Schedule A line 16 reads it: 0 with no casualty events; waits like the totals. */
export function netQualifiedDisasterLoss(
  events: readonly CasualtyEventFactValue[],
): number | undefined {
  if (events.length === 0) return 0;
  return sectionATotals(events)?.netQualifiedDisasterLoss;
}

export function line17(agi: number | undefined): number | undefined {
  return agi === undefined ? undefined : roundDollars(agi * AGI_FLOOR_RATE);
}
