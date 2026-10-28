import type { Mastra } from "@mastra/core";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AnswerQuestionInput, AskStepLog } from "../../../../src/mastra/workflows/ask";

// A failed turn's log is the record we diagnose from, so a throw must keep the steps.

vi.mock("../../../../src/db/corpusSearch", () => ({
  hybridSearchRefDocs: async ({ query }: { query: string }) => [
    {
      blockId: "doc::sec::b01",
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

type AnswerQuestion = (mastra: Mastra, input: AnswerQuestionInput) => Promise<unknown>;
let answerQuestion: AnswerQuestion;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ answerQuestion } = await import("../../../../src/mastra/workflows/ask"));
});

function fakeMastra(generate: Record<string, () => Promise<unknown>>): Mastra {
  const getAgent = (id: string) => ({ name: id, generate: generate[id] });
  return { getAgent } as unknown as Mastra;
}

describe("answerQuestion's query log", () => {
  it("leaves the completed steps with the caller when a judge throws", async () => {
    const steps: AskStepLog[] = [];
    const mastra = fakeMastra({
      askQueryFormulator: async () => ({ object: { queries: ["q1"], namedDocuments: [] } }),
      askAnswerer: async () => {
        throw new Error("model down");
      },
    });

    await expect(answerQuestion(mastra, { question: "?", steps })).rejects.toThrow("model down");
    expect(steps.map((s) => s.kind)).toEqual(["formulate", "retrieve"]);
  });
});
