/*
 * FTB 3801 Side 1 (Parts I to III), from Parts IV and V and federal modified AGI.
 * Sources: Pub. 925 examples (irs-pub-925-2025::sec::rental-activities::b08–b11,
 * ::a-b-c-total::b01), worked through the form's lines by hand; the limits are
 * the form's text and ca-3801-inst-2025::sec::part-ii::b01 (line 5 for MFS).
 */

import { describe, expect, it } from "vitest";
import type { ActivityPart, PassiveActivity } from "../../../../../src/federal/8582/activities.js";
import {
  form3801Lines,
  MAX_ALLOWANCE,
  MAX_ALLOWANCE_MFS_APART,
  partTotals,
  type FilerStatus,
} from "../../../../../src/state/ca/3801/lines.js";

type Amounts = Partial<Pick<PassiveActivity, "netIncome" | "netLoss" | "priorUnallowedLoss">>;

const row = (factKey: string, part: ActivityPart, amounts: Amounts): PassiveActivity => ({
  factKey,
  part,
  name: factKey,
  netIncome: amounts.netIncome ?? 0,
  netLoss: amounts.netLoss ?? 0,
  priorUnallowedLoss: amounts.priorUnallowedLoss ?? 0,
});

const parts = (...rows: PassiveActivity[]) => ({
  part4: rows.filter((entry) => entry.part === "part4"),
  part5: rows.filter((entry) => entry.part === "part5"),
});

const JOINT: FilerStatus = { marriedFilingSeparately: false };

describe("FTB 3801 Side 1: published examples", () => {
  it("Pub. 925, Stacey: a $4,000 rental loss with modified AGI of $44,000 is allowed in full", () => {
    const lines = form3801Lines(parts(row("house", "part4", { netLoss: 4000 })), JOINT, 44000);
    expect(lines).toMatchObject({
      line1b: 4000,
      line1d: -4000,
      line3: -4000,
      line4: 4000,
      line5: 150000,
      line6: 44000,
      line7: 106000,
      line8: 25000,
      line9: 4000,
      line11: 4000,
    });
  });

  it("Pub. 925, phaseout: modified AGI $120,000 allows $15,000 of a $31,000 rental loss", () => {
    const lines = form3801Lines(parts(row("rental", "part4", { netLoss: 31000 })), JOINT, 120000);
    expect(lines).toMatchObject({ line4: 31000, line6: 120000, line7: 30000, line8: 15000 });
    expect(lines.line9).toBe(15000);
    expect(lines.line11).toBe(15000);
    // The carryforward: line 3 as a positive amount less line 11.
    expect(-(lines.line3 ?? 0) - (lines.line11 ?? 0)).toBe(16000);
  });

  it("Pub. 925, Terry: Part V losses of $25,000 against $4,000 of income; Part II does not apply", () => {
    const lines = form3801Lines(
      parts(
        row("A", "part5", { netLoss: 9000 }),
        row("B", "part5", { netLoss: 16000 }),
        row("C", "part5", { netIncome: 4000 }),
      ),
      JOINT,
      undefined,
    );
    expect(lines).toMatchObject({ line2a: 4000, line2b: 25000, line2d: -21000, line3: -21000 });
    expect(lines.line1d).toBeUndefined();
    expect(lines.line4).toBeUndefined();
    expect(lines.line9).toBe(0);
    expect(lines.line10).toBe(4000);
    expect(lines.line11).toBe(4000);
  });
});

describe("FTB 3801 Side 1: limits and edges", () => {
  const rentalLoss = (loss: number) => parts(row("rental", "part4", { netLoss: loss }));

  it("line 8 is never more than $25,000", () => {
    const lines = form3801Lines(rentalLoss(60000), JOINT, 0);
    expect(lines.line7).toBe(150000);
    expect(lines.line8).toBe(MAX_ALLOWANCE);
    expect(lines.line9).toBe(25000);
  });

  it("line 6 equal to line 5 skips lines 7 and 8 and enters 0 on line 9", () => {
    const lines = form3801Lines(rentalLoss(10000), JOINT, 150000);
    expect(lines.line6).toBe(150000);
    expect(lines.line7).toBeUndefined();
    expect(lines.line8).toBeUndefined();
    expect(lines.line9).toBe(0);
    expect(lines.line11).toBe(0);
  });

  it("$1 under line 5 leaves line 8 at 50 cents, rounded to $1", () => {
    const lines = form3801Lines(rentalLoss(10000), JOINT, 149999);
    expect(lines.line7).toBe(1);
    expect(lines.line8).toBe(1);
    expect(lines.line9).toBe(1);
  });

  it("line 6 is not less than zero", () => {
    expect(form3801Lines(rentalLoss(1000), JOINT, -5000).line6).toBe(0);
  });

  it("married filing separately, lived apart: $75,000 on line 5 and at most $12,500 on line 8", () => {
    const filer: FilerStatus = { marriedFilingSeparately: true, livedApartAllYear: true };
    const lines = form3801Lines(rentalLoss(40000), filer, 10000);
    expect(lines.line5).toBe(75000);
    expect(lines.line7).toBe(65000);
    expect(lines.line8).toBe(MAX_ALLOWANCE_MFS_APART);
    expect(lines.line9).toBe(12500);
  });

  it("married filing separately, lived together at any time: line 9 is 0 and lines 4 to 8 are blank", () => {
    const filer: FilerStatus = { marriedFilingSeparately: true, livedApartAllYear: false };
    const lines = form3801Lines(rentalLoss(8000), filer, 10000);
    expect(lines.line4).toBeUndefined();
    expect(lines.line5).toBeUndefined();
    expect(lines.line9).toBe(0);
  });

  it("line 3 income or zero: Parts II and III stay blank", () => {
    const zero = form3801Lines(
      parts(row("A", "part4", { netLoss: 3000 }), row("B", "part5", { netIncome: 3000 })),
      JOINT,
      50000,
    );
    expect(zero.line3).toBe(0);
    expect(zero.line4).toBeUndefined();
    expect(zero.line9).toBeUndefined();
    expect(zero.line11).toBeUndefined();
  });

  it("line 3 a loss with line 1d income: 0 on line 9, then lines 10 and 11", () => {
    const lines = form3801Lines(
      parts(row("A", "part4", { netIncome: 2000 }), row("B", "part5", { netLoss: 7000 })),
      JOINT,
      50000,
    );
    expect(lines.line1d).toBe(2000);
    expect(lines.line3).toBe(-5000);
    expect(lines.line9).toBe(0);
    expect(lines.line10).toBe(2000);
    expect(lines.line11).toBe(2000);
  });

  it("line 9 is the smaller of lines 4 and 8; line 11 is lines 9 and 10", () => {
    const lines = form3801Lines(
      parts(
        row("A", "part4", { netLoss: 9000, priorUnallowedLoss: 1000 }),
        row("B", "part4", { netIncome: 4000 }),
        row("C", "part5", { netIncome: 1500, priorUnallowedLoss: 2500 }),
      ),
      JOINT,
      140000,
    );
    expect(lines.line1d).toBe(-6000);
    expect(lines.line3).toBe(-7000);
    expect(lines.line4).toBe(6000);
    expect(lines.line8).toBe(5000);
    expect(lines.line9).toBe(5000);
    expect(lines.line10).toBe(5500);
    expect(lines.line11).toBe(10500);
  });

  it("lines 1a to 1c are the Part IV totals; lines 2a to 2c the Part V totals", () => {
    const rows = parts(
      row("A", "part4", { netIncome: 100, netLoss: 0, priorUnallowedLoss: 30 }),
      row("B", "part4", { netLoss: 200 }),
      row("C", "part5", { netLoss: 50 }),
    );
    const lines = form3801Lines(rows, JOINT, 0);
    expect(partTotals(rows.part4)).toEqual({
      netIncome: 100,
      netLoss: 200,
      priorUnallowedLoss: 30,
    });
    expect([lines.line1a, lines.line1b, lines.line1c]).toEqual([100, 200, 30]);
    expect(lines.line1d).toBe(100 - 200 - 30);
    expect([lines.line2a, lines.line2b, lines.line2c]).toEqual([undefined, 50, undefined]);
    expect(lines.line3).toBe((lines.line1d ?? 0) + (lines.line2d ?? 0));
  });

  it("line 6 that waits leaves lines 6 to 9 and line 11 blank", () => {
    const lines = form3801Lines(rentalLoss(5000), JOINT, undefined);
    expect(lines.line4).toBe(5000);
    expect(lines.line5).toBe(150000);
    expect(lines.line6).toBeUndefined();
    expect(lines.line9).toBeUndefined();
    expect(lines.line11).toBeUndefined();
  });
});
