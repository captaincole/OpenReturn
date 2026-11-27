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

describe("a California statute passage", () => {
  const CA = "ca-rtc-2025::sec::s17014::a";
  const FTB = "ca-540-inst-2025::sec::residency::b01";
  const USC = "usc-26-2025::sec::s7701::b-1";
  const law = [
    { blockId: FTB, text: "You are a resident if you live in California." },
    {
      blockId: CA,
      citation: "Cal. Rev. & Tax. Code § 17014(a)",
      text: "Every individual who is in this state for other than a temporary or transitory purpose.",
    },
    {
      blockId: USC,
      citation: "26 U.S.C. § 7701(b)(1)",
      text: "An alien individual shall be treated as a resident.",
    },
  ];

  it("keeps a word-for-word quote and drops one that is not", () => {
    const out = validateCitations(
      [
        { blockId: CA, quote: "other than a temporary or  transitory purpose" },
        { blockId: CA, quote: "for a temporary purpose" },
      ],
      law,
    );
    expect(out.citations).toEqual([
      { blockId: CA, quote: "other than a temporary or  transitory purpose" },
      { blockId: CA },
    ]);
    expect(out.dropped.quotes).toEqual(["for a temporary purpose"]);
  });

  it("is a statute side of a conflict, with its citation; an FTB block is an instruction", () => {
    const side = (blockId: string, quote: string) => ({ blockId, quote });
    const out = validateConflicts(
      [
        {
          kind: "instruction_vs_instruction",
          a: side(FTB, "live in California"),
          b: side(CA, "temporary or transitory purpose"),
          note: "ftb and ca",
        },
        {
          kind: "instruction_vs_statute",
          a: side(USC, "treated as a resident"),
          b: side(CA, "temporary or transitory purpose"),
          note: "two statutes",
        },
        {
          kind: "instruction_vs_statute",
          a: side(FTB, "live in California"),
          b: side(CA, "permanent purpose"),
          note: "a misquote",
        },
      ],
      law,
    );
    expect(out.conflicts.map((conflict) => conflict.kind)).toEqual([
      "instruction_vs_statute",
      "statute_vs_statute",
    ]);
    expect(out.conflicts[0].b).toEqual({
      blockId: CA,
      quote: "temporary or transitory purpose",
      citation: "Cal. Rev. & Tax. Code § 17014(a)",
    });
    expect(out.dropped).toBe(1);
  });
});
