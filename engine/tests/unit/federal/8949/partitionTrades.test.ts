import { describe, expect, it } from "vitest";
import {
  makeStatedQuantityFactKey,
  makeTradeFactKey,
  type TradeFactValue,
} from "../../../../src/facts/index.js";
import { partitionTrades } from "../../../../src/federal/8949/partitionTrades.js";

type Fact = { key: string; category: string; value: unknown };

const sale = (value: Partial<TradeFactValue> = {}): Fact => ({
  key: makeTradeFactKey("etrade", "etr-d-01"),
  category: "investment_income",
  value: {
    tradeId: "etr-d-01",
    description: "intuit stock",
    dateAcquired: "12/01/2021",
    dateSold: "11/27/2025",
    proceeds: 76100,
    costBasis: 38991,
    ...value,
  },
});

const stated: Fact = {
  key: makeStatedQuantityFactKey("etrade", "etr-d-01"),
  category: "capital_gains",
  value: 100,
};

describe("partitionTrades: the number of shares (Form 8949 column (a))", () => {
  it("keeps the count the broker printed", () => {
    const { boxed, missingQuantityKeys } = partitionTrades([sale({ quantity: 40 })], new Map());
    expect(boxed[0]?.trade.quantity).toBe(40);
    expect(missingQuantityKeys).toEqual([]);
  });

  it("takes the count the taxpayer stated when box 1a printed none", () => {
    const { boxed, missingQuantityKeys } = partitionTrades([sale(), stated], new Map());
    expect(boxed[0]?.trade.quantity).toBe(100);
    expect(missingQuantityKeys).toEqual([]);
  });

  it("does not ask when box 1a printed the count", () => {
    const { missingQuantityKeys } = partitionTrades(
      [sale({ description: "91.207 sh SAMPLE INC" })],
      new Map(),
    );
    expect(missingQuantityKeys).toEqual([]);
  });

  it("asks for a name that starts with a digit but prints no count", () => {
    const { missingQuantityKeys } = partitionTrades([sale({ description: "3M CO" })], new Map());
    expect(missingQuantityKeys).toEqual([makeStatedQuantityFactKey("etrade", "etr-d-01")]);
  });

  it("names the stated-quantity key while the count is unknown", () => {
    const { boxed, missingQuantityKeys } = partitionTrades([sale()], new Map());
    expect(boxed[0]?.trade.quantity).toBeUndefined();
    expect(missingQuantityKeys).toEqual([makeStatedQuantityFactKey("etrade", "etr-d-01")]);
  });
});
