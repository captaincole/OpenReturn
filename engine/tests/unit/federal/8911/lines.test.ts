/*
 * Form 8911 and Schedule A (Form 8911) lines from the published examples (IRS
 * Publications 6027 and 6029) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  BUSINESS_LIMIT_PER_ITEM,
  PERSONAL_LIMIT_PER_ITEM,
  businessUsePercentage,
  constructionBeforePwaRules,
  netRegularTax,
  partITotals,
  personalCreditLines,
  scheduleALines,
  scheduleATotal,
  type ScheduleAInputs,
} from "../../../../src/federal/8911/lines.js";

const personal = (cost: number): ScheduleAInputs => ({
  cost,
  businessUsePercent: 0,
  line13: false,
  line17: true,
});

const business = (cost: number, line13: boolean): ScheduleAInputs => ({
  cost,
  businessUsePercent: 100,
  line13,
  line17: false,
});

describe("Form 8911, published examples", () => {
  /*
   * Publication 6027 (10-2024): a home charger $1,500 with labor, a $500 wall
   * mount and $1,000 of panel and wiring for the charger only. "30% of the sum
   * ... is $900, and since it's less than the $1,000 credit limit per single
   * item ... the allowable credit amount is $900."
   */
  it("Publication 6027, the home charger: $3,000 → $900", () => {
    const lines = scheduleALines(personal(1500 + 500 + 1000));
    expect(lines.line8).toBe(3000);
    expect(lines.line10).toBe(0);
    expect(lines.line16).toBeUndefined();
    expect(lines.line18).toBe(3000);
    expect(lines.line19).toBe(900);
    expect(lines.line21).toBe(900);
    expect(scheduleATotal([lines.line21])).toBe(900);
  });

  /*
   * Publication 6029: 60 charging ports, each a single item of $25,000, a
   * $1,000 pedestal share, $833.33 of panel and wiring and $666.67 of the
   * charge management system. With PWA: "30% of the sum of these items is a
   * credit value of $8,250 ... a total credit of $495,000".
   */
  it("Publication 6029, the school buses: $27,500 per port with PWA → $8,250; 60 ports → $495,000", () => {
    const lines = scheduleALines(business(25000 + 1000 + 833.33 + 666.67, true));
    expect(lines.line8).toBe(27500);
    expect(lines.line10).toBe(27500);
    expect(lines.line12).toBe(27500);
    expect(lines.line14).toBe(8250);
    expect(lines.line16).toBe(8250);
    expect(lines.line18).toBeUndefined();
    const line1 = scheduleATotal(Array.from({ length: 60 }, () => lines.line16));
    expect(line1).toBe(495000);
    expect(partITotals(line1, undefined).line3).toBe(495000);
  });
});

describe("Schedule A (Form 8911), limits", () => {
  it("the personal part never passes $1,000 per item", () => {
    expect(scheduleALines(personal(10000)).line21).toBe(PERSONAL_LIMIT_PER_ITEM);
    // 30% of $3,333 is $999.90, $1,000 rounded; $3,334 is just over.
    expect(scheduleALines(personal(3333)).line19).toBe(1000);
    expect(scheduleALines(personal(3334)).line21).toBe(1000);
    expect(scheduleALines(personal(3300)).line21).toBe(990);
  });

  it("the business part is 6% without PWA, 30% with, and never passes $100,000 per item", () => {
    expect(scheduleALines(business(50000, false)).line16).toBe(3000);
    expect(scheduleALines(business(50000, true)).line16).toBe(15000);
    const big = scheduleALines(business(400000, true));
    expect(big.line14).toBe(120000);
    expect(big.line16).toBe(BUSINESS_LIMIT_PER_ITEM);
    // 6% reaches the limit only above $1,666,667.
    expect(scheduleALines(business(2000000, false)).line16).toBe(BUSINESS_LIMIT_PER_ITEM);
  });

  it("a mixed-use item splits the cost: line 10 business, line 18 the rest", () => {
    const lines = scheduleALines({
      cost: 5000,
      businessUsePercent: 40,
      line13: false,
      line17: true,
    });
    expect(lines.line10).toBe(2000);
    expect(lines.line14).toBe(120);
    expect(lines.line18).toBe(3000);
    expect(lines.line21).toBe(900);
    expect((lines.line10 ?? 0) + (lines.line18 ?? 0)).toBe(lines.line8);
  });

  it("section 179 reduces the business part only (line 12), never below 0", () => {
    const lines = scheduleALines({
      cost: 5000,
      businessUsePercent: 40,
      section179Deduction: 500,
      line13: true,
      line17: true,
    });
    expect(lines.line11).toBe(500);
    expect(lines.line12).toBe(1500);
    expect(lines.line14).toBe(450);
    expect(lines.line18).toBe(3000);
    const over = scheduleALines({ ...business(1000, true), section179Deduction: 1500 });
    expect(over.line12).toBe(0);
    expect(over.line16).toBe(0);
  });

  it("line 9 for a change of use: the percentage times the months, divided by 12", () => {
    expect(businessUsePercentage(60, 6)).toBe(30);
    expect(businessUsePercentage(60)).toBe(60);
    const lines = scheduleALines({
      cost: 4000,
      businessUsePercent: 100,
      businessUseMonths: 3,
      line13: false,
      line17: true,
    });
    expect(lines.line9).toBe(25);
    expect(lines.line10).toBe(1000);
    expect(lines.line18).toBe(3000);
  });

  it("100% business use stops at line 16; a home that is not the main home stops at line 17", () => {
    expect(scheduleALines({ ...business(4000, false), line17: true }).line21).toBeUndefined();
    expect(scheduleALines({ ...personal(4000), line17: false }).line21).toBeUndefined();
  });

  it("line 13 is Yes with no test only when construction began before January 29, 2023", () => {
    expect(constructionBeforePwaRules("2023-01-28")).toBe(true);
    expect(constructionBeforePwaRules("2023-01-29")).toBe(false);
    expect(constructionBeforePwaRules(undefined)).toBe(false);
  });
});

describe("Form 8911, Parts I and II", () => {
  it("line 3 is line 1 plus line 2; a K-1 credit alone fills lines 2 and 3", () => {
    expect(partITotals(3000, 1200.4)).toEqual({ line1: 3000, line2: 1200, line3: 4200 });
    expect(partITotals(undefined, 800)).toEqual({ line1: undefined, line2: 800, line3: 800 });
    expect(partITotals(undefined, undefined).line3).toBeUndefined();
  });

  it("line 7 is line 5 less line 6c, never below 0", () => {
    expect(netRegularTax(10000, 95, 2200)).toMatchObject({ line6c: 2295, line7: 7705 });
    expect(netRegularTax(1000, undefined, 2200).line7).toBe(0);
    expect(netRegularTax(1000, undefined, undefined).line6c).toBe(0);
  });

  it("line 10 is the smaller of line 4 and line 9, blank when line 9 is 0", () => {
    expect(personalCreditLines(1624, 30312, 23002)).toEqual({ line9: 7310, line10: 1624 });
    expect(personalCreditLines(1624, 23712, 23002)).toEqual({ line9: 710, line10: 710 });
    expect(personalCreditLines(1624, 23002, 23002)).toEqual({ line9: 0, line10: undefined });
    expect(personalCreditLines(1624, 20000, 23002)).toEqual({ line9: 0, line10: undefined });
  });
});
