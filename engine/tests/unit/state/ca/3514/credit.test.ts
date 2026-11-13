/* Source: ca-3514-inst-2025: the 2025 EITC Table (booklet pages 22–30), the worksheet, and lines 25–28 and 36–39. */

import { describe, expect, it } from "vitest";
import { worksheetCredit } from "../../../../../src/state/ca/3514/credit.js";
import { caEitcTableCredit } from "../../../../../src/state/ca/3514/eitcTable.js";
import {
  phasedOutCredit,
  reductionCents,
} from "../../../../../src/state/ca/3514/youngChildAndFosterYouth.js";

/*
 * Rows read off the printed pages: at least, but not over, then the credit
 * for 0, 1, 2 and 3 qualifying children. They include each column's peak
 * (where the worksheet's Part II amounts sit) and the last row.
 */
const PRINTED_ROWS = [
  [1, 50, 2, 7, 9, 10],
  [4651, 4700, 302, 1351, 1590, 1788],
  [6951, 7000, 239, 2016, 2372, 2668],
  [8001, 8050, 229, 1725, 2729, 3070],
  [9801, 9850, 212, 1205, 3339, 3756],
  [12951, 13000, 183, 599, 2268, 2551],
  [13551, 13600, 178, 581, 2064, 2322],
  [23801, 23850, 84, 273, 381, 386],
  [32851, 32900, 1, 1, 1, 1],
];

describe("caEitcTableCredit", () => {
  it.each(PRINTED_ROWS)(
    "matches the printed row %d–%d in every column",
    (atLeast, notOver, ...credits) => {
      for (const [children, credit] of credits.entries()) {
        expect(caEitcTableCredit(atLeast!, children)).toBe(credit);
        expect(caEitcTableCredit(notOver!, children)).toBe(credit);
      }
    },
  );

  it("has no credit at $0 or at $32,901 and over, and uses the 3-child column for more", () => {
    expect(caEitcTableCredit(0, 0)).toBe(0);
    expect(caEitcTableCredit(32_901, 3)).toBe(0);
    expect(caEitcTableCredit(13_000, 5)).toBe(2551);
  });
});

describe("worksheetCredit", () => {
  it("takes line 2 when federal AGI equals earned income", () => {
    expect(worksheetCredit(13_000, 13_000, 0)).toBe(183);
  });
  it("takes line 2 when AGI is under the Part II amount ($4,661 with no child)", () => {
    expect(worksheetCredit(4_000, 4_600, 0)).toBe(caEitcTableCredit(4_000, 0));
  });
  it("takes the smaller of lines 2 and 5 at or over it", () => {
    expect(worksheetCredit(13_000, 13_600, 0)).toBe(178);
    expect(worksheetCredit(8_000, 9_850, 2)).toBe(caEitcTableCredit(8_000, 2));
  });
  it("takes line 5 when it is smaller, with a child: $7,000 earned (2,016), AGI $13,000 (599)", () => {
    expect(worksheetCredit(7_000, 13_000, 1)).toBe(599);
    expect(worksheetCredit(9_850, 13_000, 3)).toBe(2551);
  });
});

describe("YCTC and FYTC phase-out", () => {
  it("is $1,189 a claimant at or under $27,425", () => {
    expect(phasedOutCredit(27_425, 1)).toBe(1189);
    expect(phasedOutCredit(10_000, 2)).toBe(2378);
  });
  it("cuts 25.75 × $21.71 to 559.03, then rounds $629.97 to $630", () => {
    expect(reductionCents(2_575, 1)).toBe(55_903);
    expect(phasedOutCredit(30_000, 1)).toBe(630);
  });
  it("uses $43.42 for two claimants", () => {
    expect(reductionCents(2_575, 2)).toBe(111_806);
    expect(phasedOutCredit(30_000, 2)).toBe(1260);
  });
  it("enters $1 for a credit between $0 and $1: $32,900 earned leaves $0.38", () => {
    expect(phasedOutCredit(32_900, 1)).toBe(1);
  });
});
