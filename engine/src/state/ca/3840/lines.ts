/*
 * FTB 3840 arithmetic: Schedule A lines 3–8 for one property given up, and the
 * printed percentages. Pure functions on amounts; the facts are read in
 * exchange.ts. Side 1 lines 7–20 are Form 8824's lines 12–25, which
 * federal/8824/lines.ts figures. Each printed amount is whole dollars: an input
 * amount keeps its cents and rounds once, and a line the form defines from other
 * lines uses their rounded values.
 */

import { roundDollars } from "../../../money.js";

/* The tax year this form is for. */
export const TAX_YEAR = 2025;

/*
 * "Enter the federal amounts from federal Form 8824, Part III, line 12 through
 * line 25, on form FTB 3840, Part II, line 7 through line 20, respectively"
 * (ca-3840-inst-2025::sec::part-ii-realized-gain-or-loss-recognized-gain-and-basis-of-like-kind-property-received::b01).
 */
export const FORM_8824_LINE_OFFSET = 5;

/* Schedule A lines 1 and 9 print two decimals; line 11 prints four ("___.__" and "___.____"). */
export const OWNERSHIP_DECIMALS = 2;
export const APPORTIONMENT_DECIMALS = 4;
/* The places before the point in both boxes. */
const PERCENT_WHOLE_PLACES = 3;

export interface ScheduleAInputs {
  /* What the taxpayer received: the like-kind property's FMV, cash, other property's FMV, and the liabilities the other party assumed. */
  receivedValue: number;
  cashReceived: number;
  otherReceivedValue: number;
  liabilitiesRelieved: number;
  /* What the taxpayer gave besides the property: liabilities assumed, cash paid, other property's FMV. */
  liabilitiesAssumed: number;
  cashPaid: number;
  otherGivenUpValue: number;
  /* The exchange expenses the taxpayer paid. */
  exchangeExpenses: number;
  /* The California adjusted basis of the property given up. */
  californiaBasis: number;
}

export interface ScheduleALines {
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
}

/*
 * DECISION (2026-11-24, by the author, not reviewed by a person): Schedule A
 * line 3 is the consideration for the property given up, net of what the
 * taxpayer gave with it. Text A, the line 3 instruction
 * (ca-3840-inst-2025::sec::part-i-properties-given-up::b01): "enter the
 * consideration or total sales price the taxpayer received for the property.
 * This includes all money and notes received, plus any mortgages or other debts
 * assumed by the buyer ... plus the fair market value of any other property",
 * which counts only what was received. Text B, Form 8824's lines 15 and 18
 * (irs-8824-inst-2025::sec::lines-15-and-15a::b01, line-18::b01), which the
 * FTB 3840 instructions name for this exchange: the liabilities the taxpayer
 * assumed, the cash paid and the other property given up offset the liabilities
 * relieved, and the rest is an amount paid. The engine follows Text B: line 7
 * ("Realized gain or (loss)") then equals Side 1 line 14 when the bases agree,
 * and line 8 is figured from line 7's gain for each property
 * (part-i-properties-given-up::b03), so the form's arithmetic holds. Dollars
 * differ on lines 3, 5 and 7 only (information lines) when the taxpayer paid
 * cash, assumed a liability or gave other property: $150,000 of liabilities
 * assumed makes line 3 $150,000 lower than Text A. Line 8 does not change.
 *
 * Lines 3–7 (part-i-properties-given-up::b01, b02): line 4 is the exchange
 * expenses; line 5 = line 3 − line 4; line 6 is the California adjusted basis;
 * line 7 = line 5 − line 6.
 */
export function scheduleALines(inputs: ScheduleAInputs): ScheduleALines {
  const line3 = roundDollars(
    inputs.receivedValue +
      inputs.cashReceived +
      inputs.otherReceivedValue +
      inputs.liabilitiesRelieved -
      inputs.liabilitiesAssumed -
      inputs.cashPaid -
      inputs.otherGivenUpValue,
  );
  const line4 = roundDollars(inputs.exchangeExpenses);
  const line5 = line3 - line4;
  const line6 = roundDollars(inputs.californiaBasis);
  return { line3, line4, line5, line6, line7: line5 - line6 };
}

/*
 * Line 8 for a property given up in California: "the amount from Side 1, line
 * 19, Deferred gain, adjusted for differences between federal and California
 * law" (part-i-properties-given-up::b02). The difference this fact carries is
 * the basis: a lower California basis raises the realized gain, and so the
 * deferred gain, by the difference. Valid while the California recognized gain
 * is the federal one (exchange.ts checks it). A property outside California
 * adds nothing (::b03).
 */
export function californiaDeferredGain(
  side1Line19: number,
  federalBasis: number,
  californiaBasis: number,
): number {
  return side1Line19 + roundDollars(federalBasis) - roundDollars(californiaBasis);
}

/*
 * A percentage as the boxes print it: three places before the point, with
 * leading zeros, and a fixed count after it ("100.00", "050.00", "012.5000").
 */
export function percentBoxes(percent: number, decimals: number): string {
  const scale = 10 ** decimals;
  const scaled = roundDollars(percent * scale);
  const fraction = scaled % scale;
  const whole = (scaled - fraction) / scale;
  return `${String(whole).padStart(PERCENT_WHOLE_PLACES, "0")}.${String(fraction).padStart(decimals, "0")}`;
}
