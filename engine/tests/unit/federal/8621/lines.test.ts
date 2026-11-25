/*
 * Form 8621 Parts I, III, IV and VI: limit tests that need no source. The
 * instructions publish no example with numbers (.scratch/evidence.md).
 */

import { describe, expect, it } from "vitest";
import {
  markToMarketOrdinary,
  partIIILines,
  partIVDisposition,
  partIVYearEnd,
  valueBox,
} from "../../../../src/federal/8621/lines.js";
import { deferredTaxDue, partVIColumn } from "../../../../src/federal/8621/partVI.js";

describe("Part I line 4: the value box", () => {
  it("each range's top edge stays in its box; one dollar more moves up", () => {
    expect([valueBox(0), valueBox(50000), valueBox(50001)]).toEqual(["a", "a", "b"]);
    expect([valueBox(100000), valueBox(100001), valueBox(150000)]).toEqual(["b", "c", "c"]);
    expect([valueBox(150001), valueBox(200000), valueBox(200001)]).toEqual(["d", "d", "e"]);
  });

  it("rounds to whole dollars first: $50,000.49 is box (a), $50,000.50 is box (b)", () => {
    expect([valueBox(50000.49), valueBox(50000.5)]).toEqual(["a", "b"]);
  });
});

describe("Part III: income from a QEF", () => {
  it("line 6c = 6a − 6b and line 7c = 7a − 7b, each line in whole dollars", () => {
    const lines = partIIILines(
      {
        ordinaryEarnings: 5000.49,
        ordinaryEarningsExcluded: 400,
        netCapitalGain: 1200.5,
        netCapitalGainExcluded: 200,
      },
      false,
    );
    expect(lines).toEqual({
      line6a: 5000,
      line6b: 400,
      line6c: 4600,
      line7a: 1201,
      line7b: 200,
      line7c: 1001,
    });
  });

  it("lines 8a–8e only with Election B; 8a = 6c + 7c, 8d = 8b + 8c, 8e = 8a − 8d", () => {
    const lines = partIIILines(
      {
        ordinaryEarnings: 3000,
        netCapitalGain: 1000,
        distributions: 1500,
        disposedSharesIncome: 300,
      },
      true,
    );
    expect(lines.electionB).toEqual({
      line8a: 4000,
      line8b: 1500,
      line8c: 300,
      line8d: 1800,
      line8e: 2200,
    });
  });

  it("line 8e is negative when the distributions are more than the income", () => {
    const lines = partIIILines(
      { ordinaryEarnings: 100, netCapitalGain: 0, distributions: 500 },
      true,
    );
    expect(lines.electionB?.line8e).toBe(-400);
  });
});

describe("Part IV: stock held at the end of the year", () => {
  it("a gain on line 10c leaves lines 11 and 12 blank", () => {
    expect(partIVYearEnd(268450, { adjustedBasis: 241300 })).toEqual({
      line10a: 268450,
      line10b: 241300,
      line10c: 27150,
    });
  });

  it("a loss is allowed only up to the unreversed inclusions", () => {
    expect(partIVYearEnd(61000, { adjustedBasis: 70000, unreversedInclusions: 5500 })).toEqual({
      line10a: 61000,
      line10b: 70000,
      line10c: -9000,
      line11: 5500,
      line12: -5500,
    });
  });

  it("a loss smaller than the unreversed inclusions is allowed in full", () => {
    expect(partIVYearEnd(9000, { adjustedBasis: 10000, unreversedInclusions: 5000 }).line12).toBe(
      -1000,
    );
  });

  it("with no unreversed inclusions no loss is allowed (line 12 is 0)", () => {
    const lines = partIVYearEnd(9000, { adjustedBasis: 10000 });
    expect([lines.line11, lines.line12]).toEqual([0, 0]);
  });
});

describe("Part IV: stock sold during the year", () => {
  it("a gain on line 13c leaves line 14 blank", () => {
    expect(
      partIVDisposition({ date: "2025-05-01", amountRealized: 12000, adjustedBasis: 10000 }),
    ).toEqual({
      line13a: 12000,
      line13b: 10000,
      line13c: 2000,
    });
  });

  it("a loss within the inclusions: line 14b is the whole loss, 14c blank", () => {
    const sale = {
      date: "2025-08-14",
      amountRealized: 30000,
      adjustedBasis: 34500,
      unreversedInclusions: 6200,
    };
    expect(partIVDisposition(sale)).toEqual({
      line13a: 30000,
      line13b: 34500,
      line13c: -4500,
      line14a: 6200,
      line14b: -4500,
      line14c: undefined,
    });
  });

  it("a loss over the inclusions: 14b is the inclusions, 14c the rest, and 14b + 14c = 13c", () => {
    const sale = {
      date: "2025-08-14",
      amountRealized: 20000,
      adjustedBasis: 30000,
      unreversedInclusions: 4000,
    };
    const lines = partIVDisposition(sale);
    expect([lines.line14b, lines.line14c]).toEqual([-4000, -6000]);
    expect((lines.line14b ?? 0) + (lines.line14c ?? 0)).toBe(lines.line13c);
  });

  it("the section 1296 amount nets lines 10c or 12 with 13c or 14b, never 14c", () => {
    const held = partIVYearEnd(268450, { adjustedBasis: 241300 });
    const sold = partIVDisposition({
      date: "2025-08-14",
      amountRealized: 20000,
      adjustedBasis: 30000,
      unreversedInclusions: 4000,
    });
    expect(markToMarketOrdinary(held, sold)).toBe(27150 - 4000);
  });
});

describe("Part VI: section 1294 elections", () => {
  it("a full termination makes all of line 19 due", () => {
    expect(deferredTaxDue(5000, 1850, 5000)).toBe(1850);
    expect(deferredTaxDue(5000, 1850, 6000)).toBe(1850);
  });

  it("a partial termination makes line 19 × line 22 / line 18 due", () => {
    expect(deferredTaxDue(5000, 1850, 2000)).toBe(740);
  });

  it("an outstanding election with no event fills lines 17–19 only", () => {
    expect(partVIColumn({ taxYear: 2023, undistributedEarnings: 3200, deferredTax: 1184 })).toEqual(
      {
        line17: "12/31/2023",
        line18: 3200,
        line19: 1184,
      },
    );
  });

  it("a partial termination: line 25 = 19 − 23, and line 24 is interest from the election year's due date", () => {
    const column = partVIColumn({
      taxYear: 2022,
      undistributedEarnings: 5000,
      deferredTax: 1850,
      terminatingEvent: "Distribution",
      earningsDistributed: 2000,
    });
    expect(column).toMatchObject({ line22: 2000, line23: 740, line25: 1110 });
    // 740 compounded daily from 2023-04-15 to 2026-04-15 (checked by an independent script, evidence.md).
    expect(typeof column === "string" ? undefined : column.line24).toBe(184);
  });

  it("a full termination leaves line 25 blank", () => {
    const column = partVIColumn({
      taxYear: 2022,
      undistributedEarnings: 5000,
      deferredTax: 1850,
      terminatingEvent: "Disposition of all shares",
      earningsDistributed: 5000,
    });
    expect(typeof column === "string" ? undefined : column.line25).toBeUndefined();
  });

  it("an event with no earnings distributed is a gap", () => {
    const column = partVIColumn({
      taxYear: 2022,
      undistributedEarnings: 5000,
      deferredTax: 1850,
      terminatingEvent: "Distribution",
    });
    expect(typeof column).toBe("string");
  });
});
