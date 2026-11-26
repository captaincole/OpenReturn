import type { Mastra } from "@mastra/core";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerQuestionInput, AskStepLog } from "../../../../src/mastra/workflows/ask";
import type { AskResult } from "../../../../src/mastra/workflows/ask/types";

// Ask with fake judges and fake searches: the jurisdictions reach every search and the result.

const fakes = vi.hoisted(() => ({
  refSearch: vi.fn(async ({ query }: { query: string }) => [
    {
      blockId: `ca-540-inst-2025::sec::${query}::b01`,
      docId: "ca-540-inst-2025",
      documentTitle: "540 Booklet",
      format: "html",
      published: null,
      sectionHeading: "Line 18",
      pageNum: 1,
      text: "The standard deduction is listed here.",
      score: 1,
    },
  ]),
  lawSearch: vi.fn(async () => []),
}));

vi.mock("../../../../src/db/corpusSearch", () => ({ hybridSearchRefDocs: fakes.refSearch }));
vi.mock("../../../../src/law/lawSearch", () => ({ searchLaw: fakes.lawSearch }));
vi.mock("../../../../src/db/libsql", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../src/db/libsql")>()),
  lawInstalled: async () => true,
}));

type AnswerQuestion = (mastra: Mastra, input: AnswerQuestionInput) => Promise<AskResult>;
let answerQuestion: AnswerQuestion;
let askInputSchema: typeof import("../../../../src/mastra/workflows/ask/types").askInputSchema;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ answerQuestion } = await import("../../../../src/mastra/workflows/ask"));
  ({ askInputSchema } = await import("../../../../src/mastra/workflows/ask/types"));
});

beforeEach(() => {
  fakes.refSearch.mockClear();
  fakes.lawSearch.mockClear();
});

const partial = {
  coverage: "partial",
  answer: "It is listed [1].",
  citations: [{ passage: 1, quote: "is listed here" }],
  gaps: ["gap"],
  statuteQueries: ["standard deduction section 63"],
};
const settled = { ...partial, coverage: "covered", gaps: [] };

function fakeMastra(prompts: { formulate: string[]; answer: string[] }): Mastra {
  const answers = [partial, settled, settled];
  const agents: Record<string, (prompt: string) => Promise<unknown>> = {
    askQueryFormulator: async (prompt) => {
      prompts.formulate.push(prompt);
      return { object: { queries: ["q1"], namedDocuments: [] } };
    },
    askAnswerer: async (prompt) => {
      prompts.answer.push(prompt);
      return { object: answers.shift() };
    },
  };
  return {
    getAgent: (id: string) => ({ name: id, generate: agents[id] }),
    getLogger: () => ({ warn: () => undefined }),
  } as unknown as Mastra;
}

async function run(jurisdictions?: ("federal" | "CA")[]) {
  const prompts = { formulate: [] as string[], answer: [] as string[] };
  const steps: AskStepLog[] = [];
  const result = await answerQuestion(fakeMastra(prompts), {
    question: "What is the standard deduction?",
    jurisdictions,
    steps,
  });
  const searched = fakes.refSearch.mock.calls.map(
    ([opts]) => (opts as { jurisdictions?: unknown }).jurisdictions,
  );
  return { result, steps, prompts, searched };
}

describe("answerQuestion and the jurisdictions", () => {
  it("searches California only for ['CA'], in the first round and the gap round", async () => {
    const { result, steps, searched } = await run(["CA"]);
    expect(searched).toEqual([["CA"], ["CA"]]);
    expect(result.jurisdictions).toEqual(["CA"]);
    expect(steps.find((step) => step.kind === "retrieve")).toMatchObject({ jurisdictions: ["CA"] });
    expect(steps.find((step) => step.kind === "retrieve-gaps")).toMatchObject({
      jurisdictions: ["CA"],
    });
  });

  it("skips the federal statute for ['CA'] and logs why", async () => {
    const { result, steps } = await run(["CA"]);
    expect(fakes.lawSearch).not.toHaveBeenCalled();
    expect(result.statuteConsulted).toBe(false);
    expect(steps.find((step) => step.kind === "statute")).toMatchObject({
      skipped: "federal_off",
      why: expect.stringContaining("federal"),
    });
  });

  it("tells both judges which libraries were searched, in one line", async () => {
    const { prompts } = await run(["CA"]);
    expect(prompts.formulate[0]).toContain("Libraries searched: California only.\n\nQuestion:");
    for (const prompt of prompts.answer)
      expect(prompt).toContain("Libraries searched: California only.\n\nPassages:");
  });

  it("searches every jurisdiction and the statute with no list, and the prompts have no line", async () => {
    const { result, prompts, searched } = await run();
    expect(searched).toEqual([
      ["federal", "CA"],
      ["federal", "CA"],
    ]);
    expect(result.jurisdictions).toEqual(["federal", "CA"]);
    expect(fakes.lawSearch).toHaveBeenCalledTimes(1);
    expect([...prompts.formulate, ...prompts.answer].join("\n")).not.toContain(
      "Libraries searched",
    );
  });

  it("searches the statute for ['federal']", async () => {
    const { result } = await run(["federal"]);
    expect(fakes.lawSearch).toHaveBeenCalledTimes(1);
    expect(result.jurisdictions).toEqual(["federal"]);
  });

  it("refuses a bad list before any judge runs", async () => {
    await expect(run([])).rejects.toThrow(/Name at least one jurisdiction/);
    expect(fakes.refSearch).not.toHaveBeenCalled();
  });
});

describe("run_ask input", () => {
  it("takes an optional list of known jurisdictions", () => {
    expect(askInputSchema.parse({ question: "?" }).jurisdictions).toBeUndefined();
    expect(askInputSchema.parse({ question: "?", jurisdictions: ["CA"] }).jurisdictions).toEqual([
      "CA",
    ]);
    expect(askInputSchema.safeParse({ question: "?", jurisdictions: [] }).success).toBe(false);
    expect(askInputSchema.safeParse({ question: "?", jurisdictions: ["both"] }).success).toBe(
      false,
    );
  });
});
