import { describe, expect, it } from "vitest";
import { validateCitations } from "../../../../src/mastra/workflows/ground/validateCitations";

const blocks = [
  {
    blockId: "b1",
    docId: "d",
    text: "Your filing status is “Single” if you were never married.\n  See Pub 501.",
  },
  { blockId: "b2", docId: "d", text: "Married filing jointly." },
];

describe("validateCitations", () => {
  it("keeps citations to retrieved blocks and drops the rest", () => {
    const out = validateCitations([{ blockId: "b1" }, { blockId: "nope" }], blocks);
    expect(out.citations).toEqual([{ blockId: "b1" }]);
    expect(out.dropped).toEqual({ blockIds: ["nope"], quotes: [] });
  });

  it("keeps a quote that appears in its block, ignoring case, spacing and curly quotes", () => {
    const out = validateCitations(
      [{ blockId: "b1", quote: 'is "single" if you were  never married' }],
      blocks,
    );
    expect(out.citations).toEqual([
      { blockId: "b1", quote: 'is "single" if you were  never married' },
    ]);
    expect(out.dropped.quotes).toEqual([]);
  });

  it("drops a quote that is not in its block but keeps the citation", () => {
    const out = validateCitations([{ blockId: "b2", quote: "head of household" }], blocks);
    expect(out.citations).toEqual([{ blockId: "b2" }]);
    expect(out.dropped.quotes).toEqual(["head of household"]);
  });
});
