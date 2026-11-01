import type { Mastra } from "@mastra/core";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { GroundInput, GroundStepLog } from "../../../../src/mastra/workflows/ground/schemas";

vi.mock("../../../../src/db/corpusSearch", () => ({
  hybridSearchRefDocs: async ({ query }: { query: string }) => [
    {
      blockId: `block-for-${query.replace(/\W+/g, "-")}`,
      docId: "doc",
      documentTitle: "Doc",
      format: "pdf",
      published: null,
      sectionId: "sec",
      sectionHeading: "Section",
      pageNum: 1,
      blockType: "paragraph",
      text: `passage for ${query}`,
      snippet: "",
      score: 1,
    },
  ],
}));

type Ground = (
  mastra: Mastra,
  input: GroundInput,
  options?: { steps?: GroundStepLog[] },
) => Promise<{
  verdict: string;
  citations: { blockId: string; quote?: string }[];
  iterationCount: number;
  whatsMissing?: string;
  log: { steps: GroundStepLog[] };
}>;
let groundDecision: Ground;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ groundDecision } = await import("../../../../src/mastra/workflows/ground"));
});

const decision = {
  taxYear: 2025,
  decisionKey: "decisions.scope.must_file_8959",
  decision: true,
  rationale: "Medicare wages over the single threshold.",
  confidence: "high",
};

type Reply = () => Promise<{ object: unknown }>;
function fakeMastra(agents: Record<string, Reply>): Mastra {
  const getAgent = (id: string) => ({ name: id, generate: agents[id] });
  return { getAgent } as unknown as Mastra;
}

const formulator: Reply = async () => ({ object: { queries: ["additional medicare tax"] } });
const assessor: Reply = async () => ({
  object: {
    riskTier: "medium",
    rationale: "r",
    consequenceNotes: "c",
    dissentingConsiderations: [],
  },
});
const needMore =
  (count: number): Reply =>
  async () => ({
    object: {
      result: {
        kind: "need_more_evidence",
        reason: `thin ${count}`,
        suggestedQueries: [`query ${count}`],
      },
    },
  });
const verdict: Reply = async () => ({
  object: {
    result: { kind: "verdict", verdict: "accurate", reason: "ok", citations: [{ blockId: "b1" }] },
  },
});

describe("groundDecision", () => {
  it("rules on the first iteration when the rule judge commits", async () => {
    const mastra = fakeMastra({
      queryFormulator: formulator,
      assessRiskAgent: assessor,
      ruleAgent: verdict,
    });
    const out = await groundDecision(mastra, { decision });
    expect(out.verdict).toBe("accurate");
    expect(out.iterationCount).toBe(1);
    expect(out.log.steps.map((step) => `${step.iteration}:${step.kind}`)).toEqual([
      "1:gather",
      "1:assess",
      "1:rule",
    ]);
  });

  it("loops on need_more_evidence with the suggested queries, then stops at maxIterations", async () => {
    let calls = 0;
    const rule: Reply = () => needMore(++calls)();
    const mastra = fakeMastra({
      queryFormulator: formulator,
      assessRiskAgent: assessor,
      ruleAgent: rule,
    });
    const out = await groundDecision(mastra, { decision, maxIterations: 2 });
    expect(calls).toBe(2);
    expect(out.verdict).toBe("needs_more_facts");
    expect(out.iterationCount).toBe(2);
    expect(out.whatsMissing).toBe("thin 1 → thin 2");
    const gathers = out.log.steps.filter((step) => step.kind === "gather");
    expect(gathers.map((gather) => (gather.input as { queries: string[] }).queries)).toEqual([
      ["additional medicare tax"],
      ["query 1"],
    ]);
  });

  it("drops a citation to a block that was not retrieved, and logs it", async () => {
    const mastra = fakeMastra({
      queryFormulator: formulator,
      assessRiskAgent: assessor,
      ruleAgent: async () => ({
        object: {
          result: {
            kind: "verdict",
            verdict: "accurate",
            reason: "ok",
            citations: [
              { blockId: "block-for-additional-medicare-tax", quote: "PASSAGE for additional" },
              { blockId: "invented" },
            ],
          },
        },
      }),
    });
    const out = await groundDecision(mastra, { decision });
    expect(out.citations).toEqual([
      { blockId: "block-for-additional-medicare-tax", quote: "PASSAGE for additional" },
    ]);
    const rule = out.log.steps.find((step) => step.kind === "rule")!;
    expect((rule.output as { dropped: unknown }).dropped).toEqual({
      blockIds: ["invented"],
      quotes: [],
    });
  });

  it("leaves the completed steps with the caller when a judge throws", async () => {
    const steps: GroundStepLog[] = [];
    const mastra = fakeMastra({
      queryFormulator: formulator,
      assessRiskAgent: assessor,
      ruleAgent: async () => {
        throw new Error("model down");
      },
    });
    await expect(groundDecision(mastra, { decision }, { steps })).rejects.toThrow("model down");
    expect(steps.map((step) => step.kind)).toEqual(["gather", "assess"]);
  });
});
