import { describe, expect, it } from "vitest";
import { uniqueTradeId } from "../../../../src/mastra/tools/ingestTrades.js";

describe("uniqueTradeId", () => {
  it("keeps an id no earlier lot used", () => {
    expect(uniqueTradeId("acme-2025-03-04-q10", new Set())).toBe("acme-2025-03-04-q10");
  });

  it("numbers a second and third lot sold the same day in the same quantity", () => {
    const base = "acme-2025-03-04-q10";
    const used = new Set([base]);
    expect(uniqueTradeId(base, used)).toBe(`${base}-2`);
    used.add(`${base}-2`);
    expect(uniqueTradeId(base, used)).toBe(`${base}-3`);
  });
});
