import { describe, expect, it } from "vitest";
import type { K1Box, K1FactValue, K1HoldingFactValue } from "../../../../src/facts/index.js";
import {
  figureBasis,
  needsForm7203,
  type BasisFigures,
} from "../../../../src/federal/passThrough/basis.js";
import {
  itemsOf,
  priorYearItemsOf,
  type PassThroughEntity,
} from "../../../../src/federal/passThrough/items.js";
import { prorateDollars } from "../../../../src/money.js";

function sCorp(boxes: K1Box[], holding: K1HoldingFactValue): PassThroughEntity {
  const k1 = {
    form: "1120-S",
    entityName: "Harbor Tile, Inc.",
    entityEin: "00-0000001",
    boxes,
  } as K1FactValue;
  return {
    key: "k1.s_corporation.harbor",
    holdingKey: "k1.holding.harbor",
    form: "1120-S",
    name: k1.entityName,
    ein: k1.entityEin,
    k1,
    holding,
    items: itemsOf("k1.s_corporation.harbor", k1),
    priorYearItems: priorYearItemsOf("k1.s_corporation.harbor", holding),
  };
}

function figured(entity: PassThroughEntity): BasisFigures {
  const outcome = figureBasis(entity);
  if (outcome.kind !== "figured") throw new Error(`not figured: ${JSON.stringify(outcome)}`);
  return outcome.figures;
}

const columns = (figures: BasisFigures) =>
  figures.rows.map((row) => [
    row.line,
    row.current + row.carriedIn,
    row.fromStock,
    row.fromDebt,
    row.carriedOut,
  ]);

describe("prorateDollars", () => {
  it("splits a total in proportion, the parts adding up to it after rounding", () => {
    // 30,500 over 60,000, 1,500 and 1,100: 29,233.23, 730.83 and 535.94.
    expect(prorateDollars(30500, [60000, 1500, 1100])).toEqual([29233, 731, 536]);
    // Three equal shares of 100: 33.33 each; the running totals round to 33, 67, 100.
    const thirds = prorateDollars(100, [1, 1, 1]);
    expect(thirds).toEqual([33, 34, 33]);
    expect(thirds.reduce((total, part) => total + part, 0)).toBe(100);
  });
});

describe("Form 7203 stock basis (Part I)", () => {
  it("adds income and contributions, then takes off distributions and nondeductible expenses", () => {
    const figures = figured(
      sCorp(
        [
          { box: "1", amount: 8000 },
          { box: "4", amount: 200 },
          { box: "16", code: "A", amount: 50 },
          { box: "16", code: "C", amount: 300 },
          { box: "16", code: "D", amount: 6000 },
        ],
        { stockBasisAtStart: 1000, capitalContributions: 500 },
      ),
    );
    expect(figures.stock).toMatchObject({
      line1: 1000,
      line2: 500,
      increases: { "3a": 8000, "3d": 200, "3k": 50 },
      line4: 8250,
      line5: 9750,
      line6: 6000,
      line7: 3750,
      line8a: 300,
      line10: 3450,
      line11: 0,
      line15: 3450,
    });
    expect(figures.distributionOverBasis).toBe(0);
  });

  it("finds a distribution above stock basis, which is a capital gain the K-1 cannot report", () => {
    const outcome = figureBasis(
      sCorp([{ box: "16", code: "D", amount: 7000 }], { stockBasisAtStart: 5000 }),
    );
    expect(outcome.kind).toBe("figured");
    if (outcome.kind === "figured") {
      expect(outcome.figures.stock).toMatchObject({ line5: 5000, line7: 0, line10: 0 });
      expect(outcome.figures.distributionOverBasis).toBe(2000);
      expect(outcome.gaps.join(" ")).toContain("Form 8949");
    }
  });

  it("waits for the stock basis at the start of the year", () => {
    expect(figureBasis(sCorp([{ box: "1", amount: -10 }], {}))).toEqual({
      kind: "waiting",
      factKeys: ["k1.holding.harbor"],
    });
  });
});

describe("Form 7203 Part III: losses and deductions limited to basis", () => {
  it("allows every item in full when the basis covers them", () => {
    const figures = figured(
      sCorp(
        [
          { box: "1", amount: -4000 },
          { box: "12", code: "A", amount: 500 },
        ],
        { stockBasisAtStart: 10000 },
      ),
    );
    expect(columns(figures)).toEqual([
      ["35", 4000, 4000, 0, 0],
      ["42", 500, 500, 0, 0],
    ]);
    expect(figures.stock.line15).toBe(5500);
  });

  it("allows each item in proportion when the basis is smaller, the parts adding up to the basis", () => {
    const figures = figured(
      sCorp(
        [
          { box: "1", amount: -60000 },
          { box: "8a", amount: -1500 },
          { box: "12", code: "A", amount: 1100 },
          { box: "16", code: "C", amount: 500 },
          { box: "16", code: "D", amount: 4000 },
        ],
        { stockBasisAtStart: 20000, capitalContributions: 15000 },
      ),
    );
    expect(figures.stock.line10).toBe(30500);
    expect(columns(figures)).toEqual([
      ["35", 60000, 29233, 0, 30767],
      ["38", 1500, 731, 0, 769],
      ["42", 1100, 536, 0, 564],
    ]);
    expect(figures.stock.line11).toBe(30500);
    expect(figures.stock.line15).toBe(0);
  });

  it("uses stock basis first, then debt basis, each in proportion", () => {
    const figures = figured(
      sCorp(
        [
          { box: "1", amount: -9000 },
          { box: "12", code: "A", amount: 1000 },
        ],
        { stockBasisAtStart: 4000, loanBalanceAtStart: 3000, debtBasisAtStart: 3000 },
      ),
    );
    /*
     * Stock 4,000 over 9,000 and 1,000: 3,600 and 400. Debt 3,000 over the rest
     * (5,400 and 600): 2,700 and 300. Carried: 2,700 and 300.
     */
    expect(columns(figures)).toEqual([
      ["35", 9000, 3600, 2700, 2700],
      ["42", 1000, 400, 300, 300],
    ]);
    expect(figures.debt).toMatchObject({
      line16: 3000,
      line21: 3000,
      line29: 3000,
      line30: 3000,
      line31: 0,
    });
  });

  it("takes nondeductible expenses above stock basis off debt basis (line 28)", () => {
    const figures = figured(
      sCorp([{ box: "16", code: "C", amount: 1500 }], {
        stockBasisAtStart: 1000,
        loanBalanceAtStart: 2000,
        debtBasisAtStart: 2000,
      }),
    );
    expect(figures.stock.line10).toBe(0);
    expect(figures.debt).toMatchObject({ line28: 500, line29: 1500, line31: 1500 });
  });

  it("restores a reduced debt basis with the net increase before stock basis (line 23)", () => {
    const figures = figured(
      sCorp([{ box: "1", amount: 3000 }], {
        stockBasisAtStart: 0,
        loanBalanceAtStart: 5000,
        debtBasisAtStart: 4000,
      }),
    );
    expect(figures.debt).toMatchObject({ line23: 1000, line24: 5000, line31: 5000 });
    expect(figures.stock).toMatchObject({ line12: 1000, line15: 2000 });
  });

  it("waits for the debt basis of a loan", () => {
    expect(
      figureBasis(
        sCorp([{ box: "1", amount: -10 }], { stockBasisAtStart: 0, loanBalanceAtStart: 500 }),
      ),
    ).toEqual({ kind: "waiting", factKeys: ["k1.holding.harbor"] });
  });

  it("puts a loss carried from an earlier year in column (b), and allows it with this year's", () => {
    const figures = figured(
      sCorp([{ box: "1", amount: 5000 }], {
        stockBasisAtStart: 0,
        carriedLosses: { basis: { ordinaryBusinessLoss: 2000, cashCharitableContributions: 300 } },
      }),
    );
    expect(
      figures.rows.map((row) => [row.line, row.current, row.carriedIn, row.fromStock]),
    ).toEqual([
      ["35", 0, 2000, 2000],
      ["42", 0, 300, 300],
    ]);
    expect(figures.stock.line15).toBe(2700);
  });
});

describe("who files Form 7203", () => {
  it("files for a loss, a deduction, a distribution or a carried loss; not for income only", () => {
    expect(needsForm7203(sCorp([{ box: "1", amount: 100 }], {}))).toBe(false);
    expect(needsForm7203(sCorp([{ box: "1", amount: -100 }], {}))).toBe(true);
    expect(needsForm7203(sCorp([{ box: "16", code: "D", amount: 100 }], {}))).toBe(true);
    const carried = { carriedLosses: { basis: { ordinaryBusinessLoss: 10 } } };
    expect(needsForm7203(sCorp([{ box: "1", amount: 100 }], carried))).toBe(true);
  });
});
