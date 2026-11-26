import { describe, expect, it } from "vitest";
import { askRunResultSchema, groundRunResultSchema } from "../../../../src/mastra/canon/schemas";

// Cade's copy of Canon's contract must let the statute fields through, and read an older Canon.

const conflict = {
  kind: "instruction_vs_statute",
  a: { blockId: "irs-461-inst-2025::sec::line-3::b01", quote: "are not included" },
  b: {
    blockId: "usc-26-2025::sec::s461::l-3-B",
    quote: "shall not be taken into account",
    citation: "26 U.S.C. § 461(l)(3)(B)",
  },
  note: "The texts disagree.",
};

const ground = {
  status: "ok",
  verdict: "accurate",
  reason: "ok",
  citations: [{ blockId: "usc-26-2025::sec::s461::l-3-B" }],
  riskTier: "high",
  iterationCount: 1,
  log: { steps: [{ iteration: 1, kind: "statute", durationMs: 1, input: {}, output: {} }] },
};

const ask = {
  status: "ok",
  answer: "No [1].",
  coverage: "covered",
  citations: [
    {
      n: 1,
      blockId: "usc-26-2025::sec::s461::l-3-B",
      docId: "usc-26-2025",
      documentTitle: "Internal Revenue Code (26 U.S.C.)",
      format: "html",
      sectionHeading: null,
      pageNum: 1,
      quote: "shall not be taken into account",
      citation: "26 U.S.C. § 461(l)(3)(B)",
    },
  ],
  missingDocuments: [],
  log: { steps: [] },
};

describe("Canon result schemas", () => {
  it("keep a ground run's statute step, conflicts and statuteConsulted", () => {
    const out = groundRunResultSchema.parse({
      ...ground,
      conflicts: [conflict],
      statuteConsulted: true,
    });
    expect(out).toMatchObject({ conflicts: [conflict], statuteConsulted: true });
    expect(out.log.steps[0].kind).toBe("statute");
  });

  it("read a ground run from a Canon without the statute", () => {
    expect(groundRunResultSchema.parse(ground)).toMatchObject({
      conflicts: [],
      statuteConsulted: false,
    });
  });

  it("keep an answer's statute citation, passages and conflicts", () => {
    const statutePassages = [
      { blockId: conflict.b.blockId, citation: conflict.b.citation, text: "t" },
    ];
    const out = askRunResultSchema.parse({
      ...ask,
      statutePassages,
      statuteConsulted: true,
      conflicts: [conflict],
    });
    expect(out).toMatchObject({ statutePassages, statuteConsulted: true, conflicts: [conflict] });
    if (out.status !== "ok") throw new Error("expected ok");
    expect(out.citations[0].citation).toBe("26 U.S.C. § 461(l)(3)(B)");
  });
});
