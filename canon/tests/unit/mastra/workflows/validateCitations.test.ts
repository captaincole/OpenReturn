import { describe, expect, it } from "vitest";
import {
  validateCitations,
  validateConflicts,
} from "../../../../src/mastra/workflows/ground/validateCitations";

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

describe("validateConflicts", () => {
  it("keeps two sentences of one block that disagree, and drops an unretrieved side", () => {
    const out = validateConflicts(
      [
        {
          kind: "statute_vs_statute",
          a: { blockId: "b1", quote: "never married" },
          b: { blockId: "b1", quote: "see pub 501" },
          note: "one block",
        },
        {
          kind: "instruction_vs_statute",
          a: { blockId: "b1", quote: "never married" },
          b: { blockId: "usc-26-2025::sec::s1::a", quote: "x" },
          note: "not retrieved",
        },
      ],
      blocks,
    );
    expect(out.conflicts).toEqual([
      {
        kind: "instruction_vs_instruction",
        a: { blockId: "b1", quote: "never married" },
        b: { blockId: "b1", quote: "see pub 501" },
        note: "one block",
      },
    ]);
    expect(out.dropped).toBe(1);
  });
});
