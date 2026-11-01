import { describe, expect, it } from "vitest";
import { mergeByRank } from "../../../../src/mastra/workflows/ask/mergeHits";

const hits = (...ids: string[]) => ids.map((blockId) => ({ blockId }));
const ids = (list: { blockId: string }[]) => list.map((hit) => hit.blockId);

describe("mergeByRank", () => {
  it("takes each query's top hits in turn, whatever the score scale", () => {
    const longQuery = hits("a1", "a2", "a3", "a4");
    const shortQuery = hits("b1", "b2");
    expect(ids(mergeByRank([longQuery, shortQuery], 4))).toEqual(["a1", "b1", "a2", "b2"]);
  });

  it("keeps a block that two queries found at its first place", () => {
    expect(ids(mergeByRank([hits("x", "a2"), hits("b1", "x", "b3")], 10))).toEqual([
      "x",
      "b1",
      "a2",
      "b3",
    ]);
  });

  it("stops at the cap and handles empty lists", () => {
    expect(ids(mergeByRank([hits("a1", "a2"), [], hits("c1")], 2))).toEqual(["a1", "c1"]);
    expect(mergeByRank([], 5)).toEqual([]);
  });
});
