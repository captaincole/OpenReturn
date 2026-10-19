import { describe, expect, it } from "vitest";
import type { Form8949Box } from "../../../../../src/engine/facts/index.js";
import {
  planForm8949Copies,
  totalsByBox,
  type BoxedTrade,
} from "../../../../../src/engine/federal/8949/copyPlan.js";

function trades(box: Form8949Box, count: number, proceeds = 100, basis = 60): BoxedTrade[] {
  return Array.from({ length: count }, (_, i) => ({
    box,
    basis,
    trade: {
      tradeId: `${box}-${i}`,
      description: "X",
      quantity: 1,
      dateSold: "01/02/25",
      proceeds,
    },
  }));
}

describe("planForm8949Copies", () => {
  it("returns no copies without sales", () => {
    expect(planForm8949Copies([])).toEqual([]);
  });

  it("pairs Part I page n with Part II page n (one box per page)", () => {
    // Two parts per copy: B + D on copy 1, H + E on copy 2.
    const plan = planForm8949Copies([
      ...trades("partII.boxE", 2),
      ...trades("partI.boxH", 3),
      ...trades("partI.boxB", 7),
      ...trades("partII.boxD", 9),
    ]);
    expect(plan.map((c) => [c.partI?.box, c.partII?.box])).toEqual([
      ["partI.boxB", "partII.boxD"],
      ["partI.boxH", "partII.boxE"],
    ]);
  });

  it("splits a box over 11 rows into more pages", () => {
    const plan = planForm8949Copies([...trades("partI.boxB", 7), ...trades("partII.boxD", 19)]);
    expect(plan.map((c) => [c.partI?.rows.length, c.partII?.rows.length])).toEqual([
      [7, 11],
      [undefined, 8],
    ]);
  });

  it("keeps the fact order within a box", () => {
    const plan = planForm8949Copies(trades("partI.boxA", 3));
    expect(plan[0].partI?.rows.map((r) => r.trade.tradeId)).toEqual([
      "partI.boxA-0",
      "partI.boxA-1",
      "partI.boxA-2",
    ]);
  });
});

describe("totalsByBox", () => {
  it("adds proceeds and basis per box with cents, across pages", () => {
    const totals = totalsByBox([
      ...trades("partII.boxD", 12, 10.25, 4.1),
      ...trades("partII.boxE", 1, 5),
    ]);
    expect(totals["partII.boxD"]?.proceeds).toBeCloseTo(123);
    expect(totals["partII.boxD"]?.cost).toBeCloseTo(49.2);
    expect(totals["partII.boxE"]).toEqual({ proceeds: 5, cost: 60 });
  });

  it("counts a missing basis as 0", () => {
    const [sale] = trades("partII.boxE", 1, 306);
    expect(totalsByBox([{ ...sale, basis: undefined }])["partII.boxE"]).toEqual({
      proceeds: 306,
      cost: 0,
    });
  });
});
