/*
 * Form 4137 arithmetic (lines.ts): the published example with numbers (Pub. 531),
 * then limit tests that need no source: each threshold edge, the line 10
 * comparison, rounding and totals.
 */

import { describe, expect, it } from "vitest";
import type { W2FactValue } from "../../../../src/facts/index.js";
import {
  allocatedTipsRow,
  form4137Lines,
  line10Of,
  SOCIAL_SECURITY_WAGE_BASE,
  tipIncomeNotOnLine1a,
  tipsSubjectToMedicare,
  type TipRow,
} from "../../../../src/federal/4137/lines.js";

const row = (received: number, reported: number, extra: Partial<TipRow> = {}): TipRow => ({
  employerName: "Employer",
  employerEin: "00-0000000",
  received,
  reported,
  ...extra,
});

describe("Pub. 531 (2025), Blue Ocean Restaurant (irs-pub-531-2025::sec::reporting-tips-on-your::b03, b04)", () => {
  // June tips $18 (under $20, not required to report); the rest, $7,000, reported.
  const rows = [row(7018, 7000, { under20: 18 })];

  it("adds the $18 to Form 1040 line 1c ($17,000 + $18 = $17,018 of wages)", () => {
    expect(tipIncomeNotOnLine1a(rows)).toBe(18);
  });

  it("owes no social security or Medicare tax: line 6 is 0, so no Form 4137 is required", () => {
    expect(tipsSubjectToMedicare(rows)).toBe(0);
    const lines = form4137Lines(rows, 10000);
    expect([lines.line4, lines.line5, lines.line6, lines.line12, lines.line13]).toEqual([
      18, 18, 0, 0, 0,
    ]);
  });
});

describe("lines 2 through 6", () => {
  it("line 2 adds column (c), line 3 column (d), line 4 is the difference", () => {
    const lines = form4137Lines([row(5000, 3000), row(2500, 2000)], 0);
    expect([lines.line2, lines.line3, lines.line4]).toEqual([7500, 5000, 2500]);
  });

  // irs-1040-inst-2025::sec::rounding-off-to-whole::b01: keep cents while adding, round the total.
  it("lines 2 and 3 keep the rows' cents and round only the total", () => {
    const lines = form4137Lines([row(100.4, 0), row(100.4, 0)], 0);
    expect(lines.line2).toBe(201);
    const halves = form4137Lines([row(100.5, 0), row(100.5, 0)], 0);
    expect([halves.line2, halves.line4]).toEqual([201, 201]);
    expect(tipIncomeNotOnLine1a([row(100.5, 0), row(100.5, 0)])).toBe(201);
    const reported = form4137Lines([row(300, 100.4), row(300, 100.4)], 0);
    expect([reported.line3, reported.line4]).toEqual([201, 399]);
  });

  it("line 5 is blank with no tips under $20; line 6 equals line 4", () => {
    const lines = form4137Lines([row(900, 400)], 0);
    expect([lines.line5, lines.line6]).toEqual([undefined, 500]);
  });

  it("line 5 adds every employer's months under $20 (the $20 rule is per employer)", () => {
    const lines = form4137Lines(
      [row(500, 400, { under20: 19 }), row(300, 250, { under20: 15 })],
      0,
    );
    expect([lines.line4, lines.line5, lines.line6]).toEqual([150, 34, 116]);
  });

  it("a record that reports more than it received leaves line 4 at 0, not negative", () => {
    expect(form4137Lines([row(100, 300)], 0).line4).toBe(0);
  });
});

describe("lines 7 through 13", () => {
  it("line 7 is the 2025 wage base, $176,100", () => {
    expect(form4137Lines([row(1000, 0)], 0).line7).toBe(176100);
  });

  it("line 8 at the wage base leaves line 9, 10 and 11 at 0; Medicare still owed", () => {
    const lines = form4137Lines([row(4000, 0)], SOCIAL_SECURITY_WAGE_BASE);
    expect([lines.line9, lines.line10, lines.line11, lines.line12, lines.line13]).toEqual([
      0, 0, 0, 58, 58,
    ]);
  });

  it("line 8 above the wage base: line 9 is -0-", () => {
    expect(form4137Lines([row(4000, 0)], 200000).line9).toBe(0);
  });

  it("line 8 one dollar under the base: line 10 is $1", () => {
    const lines = form4137Lines([row(4000, 0)], SOCIAL_SECURITY_WAGE_BASE - 1);
    expect([lines.line9, lines.line10]).toEqual([1, 1]);
  });

  it("line 10 is the smaller of line 6 or line 9", () => {
    expect(form4137Lines([row(5000, 0)], 174100).line10).toBe(2000);
    expect(form4137Lines([row(5000, 0)], 100000).line10).toBe(5000);
  });

  it("line 8 rounds the W-2 boxes 3 and 7 total once", () => {
    expect(form4137Lines([row(100, 0)], 66799.5).line8).toBe(66800);
  });

  it("lines 11 and 12 round to the nearest dollar; line 13 adds them", () => {
    const lines = form4137Lines([row(4858, 0)], 0);
    expect([lines.line11, lines.line12, lines.line13]).toEqual([301, 70, 371]);
  });

  it("half a dollar rounds up: $1,000 × 1.45% = $14.50 → $15", () => {
    expect(form4137Lines([row(1000, 0)], 0).line12).toBe(15);
  });

  it("line 13 never exceeds 7.65% of line 6 (6.2% + 1.45%), within rounding", () => {
    for (const tips of [1, 99, 1234, 98765]) {
      const lines = form4137Lines([row(tips, 0)], 0);
      expect(lines.line13!).toBeLessThanOrEqual(tips * 0.0765 + 1);
    }
  });

  it("while line 8 waits, lines 8 through 11 and 13 wait; line 12 does not", () => {
    const lines = form4137Lines([row(1000, 0)], undefined);
    expect([lines.line8, lines.line9, lines.line10, lines.line11, lines.line13]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(lines.line12).toBe(15);
  });
});

describe("line 10, government-employee tips (irs-4137-form-2025::sec::line-10::b01)", () => {
  it("leaves the 1.45% tips out of the comparison only; line 6 keeps them", () => {
    const rows = [row(4000, 0, { medicareOnly: 1500 })];
    const lines = form4137Lines(rows, 0);
    expect([lines.line6, lines.line10, lines.line12]).toEqual([4000, 2500, 58]);
  });

  it("is 0 when every tip owed only Medicare tax", () => {
    expect(line10Of(4000, 176100, [row(4000, 0, { medicareOnly: 4000 })])).toBe(0);
  });

  it("is still capped by line 9", () => {
    expect(line10Of(4000, 1000, [row(4000, 0, { medicareOnly: 1500 })])).toBe(1000);
  });
});

describe("allocated tips (irs-4137-form-2025::sec::line-1::b02)", () => {
  const w2 = (box7: number | undefined, box8: number): W2FactValue => ({
    employerName: "Casino",
    employerEin: "00-0000001",
    box1: 0,
    box2: 0,
    box7,
    box8,
  });

  it("column (c) is box 7 plus box 8, column (d) is box 7", () => {
    const allocated = allocatedTipsRow(w2(3050, 1320));
    expect([allocated.received, allocated.reported]).toEqual([4370, 3050]);
    expect(form4137Lines([allocated], 0).line4).toBe(1320);
  });

  it("with no box 7, column (d) is 0 and line 4 is box 8", () => {
    const allocated = allocatedTipsRow(w2(undefined, 800));
    expect(form4137Lines([allocated], 0).line4).toBe(800);
  });
});

describe("Form 1040 line 1c", () => {
  it("is blank with no tips", () => {
    expect(tipIncomeNotOnLine1a([])).toBeUndefined();
  });

  it("adds noncash tips to line 4; they are not on Form 4137", () => {
    const rows = [row(1489.75, 1150, { under20: 52, noncash: 240 })];
    expect(form4137Lines(rows, 0).line4).toBe(340);
    expect(tipIncomeNotOnLine1a(rows)).toBe(580);
  });
});
