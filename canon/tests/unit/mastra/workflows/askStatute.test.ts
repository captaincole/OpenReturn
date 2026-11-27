import type { Mastra } from "@mastra/core";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnswerQuestionInput, AskStepLog } from "../../../../src/mastra/workflows/ask";
import type { AskResult } from "../../../../src/mastra/workflows/ask/types";

/*
 * The statute round of Ask, with fake judges and a fake law search.
 * "real" uses the real lawInstalled() on a temp path with no file.
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-ask-statute-test-"));
process.env.LAW_DB_DIR = path.join(dir, "law");
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const LAW = "usc-26-2025::sec::s461::l-3-B";
const IRS = "irs-461-inst-2025::sec::line-3::b01";

const law = vi.hoisted(() => ({
  installed: true as boolean | "real",
  search: vi.fn(async () => [
    {
      blockId: "usc-26-2025::sec::s461::l-3-B",
      citation: "26 U.S.C. § 461(l)(3)(B)",
      sectionHeading: "Limitation on excess business losses",
      headings: [],
      text: "Deductions for losses from sales or exchanges of capital assets shall not be taken into account.",
      score: 1,
    },
  ]),
}));

vi.mock("../../../../src/law/lawSearch", () => ({ searchLaw: law.search }));
vi.mock("../../../../src/db/libsql", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../src/db/libsql")>();
  return {
    ...actual,
    lawInstalled: (...args: Parameters<typeof actual.lawInstalled>) =>
      law.installed === "real" ? actual.lawInstalled(...args) : Promise.resolve(law.installed),
  };
});
vi.mock("../../../../src/db/corpusSearch", () => ({
  hybridSearchRefDocs: async ({ query }: { query: string }) => [
    {
      blockId: query === "gap" ? "irs-461-inst-2025::sec::line-11::b01" : IRS,
      docId: "irs-461-inst-2025",
      documentTitle: "Instructions for Form 461",
      format: "pdf",
      published: null,
      sectionHeading: "Line 3",
      pageNum: 2,
      text: "Losses from sales or exchanges of capital assets are not included.",
      score: 1,
    },
  ],
}));

type AnswerQuestion = (mastra: Mastra, input: AnswerQuestionInput) => Promise<AskResult>;
let answerQuestion: AnswerQuestion;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ answerQuestion } = await import("../../../../src/mastra/workflows/ask"));
});

beforeEach(() => {
  law.installed = true;
  law.search.mockClear();
});

const answerOf = (extra: object) => ({
  coverage: "covered",
  answer: "Capital losses do not count [1].",
  citations: [{ passage: 1, quote: "are not included" }],
  ...extra,
});
const askStatute = answerOf({ statuteQueries: ["excess business loss capital assets"] });

/* Each answerer call takes the next reply; the prompts are kept for the checks. */
function fakeMastra(answers: object[], prompts: string[] = []): Mastra {
  const agents: Record<string, (prompt: string) => Promise<unknown>> = {
    askQueryFormulator: async () => ({ object: { queries: ["q1"], namedDocuments: [] } }),
    askAnswerer: async (prompt) => {
      prompts.push(prompt);
      const next = answers.shift();
      if (!next) throw new Error("no more answers");
      return { object: next };
    },
  };
  const logger = { warn: () => undefined };
  return {
    getAgent: (id: string) => ({ name: id, generate: agents[id] }),
    getLogger: () => logger,
  } as unknown as Mastra;
}

const run = (mastra: Mastra) => {
  const steps: AskStepLog[] = [];
  return answerQuestion(mastra, { question: "Does a business capital loss count?", steps }).then(
    (result) => ({ result, kinds: steps.map((step) => step.kind), steps }),
  );
};

describe("answerQuestion and the statute", () => {
  it("never searches the statute when the answerer does not ask", async () => {
    const { result, kinds } = await run(fakeMastra([answerOf({})]));
    expect(law.search).not.toHaveBeenCalled();
    expect(kinds).toEqual(["formulate", "retrieve", "answer", "validate"]);
    expect(result.statuteConsulted).toBe(false);
    expect(result.statutePassages).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("searches once, answers again with both sets, and cites the statute by its citation", async () => {
    const prompts: string[] = [];
    const second = answerOf({
      answer: "Capital losses do not count [1] [2].",
      citations: [
        { passage: 1, quote: "are not included" },
        { passage: 2, quote: "shall not be taken into account" },
      ],
      statuteQueries: ["asks again"],
    });
    const { result, kinds } = await run(fakeMastra([askStatute, second], prompts));
    // One round, with no list: the Code, then California's code.
    const calls = law.search.mock.calls as unknown as [{ source?: string }][];
    expect(calls.map(([opts]) => opts.source)).toEqual(["statute", "california"]);
    expect(kinds).toEqual([
      "formulate",
      "retrieve",
      "answer",
      "statute",
      "answer-statute",
      "validate",
    ]);
    expect(prompts[0]).not.toContain("Statute passages");
    expect(prompts[1]).toContain("Statute passages");
    expect(prompts[1]).toContain("[2] 26 U.S.C. § 461(l)(3)(B)");
    expect(result.statuteConsulted).toBe(true);
    expect(result.statutePassages.map((passage) => passage.blockId)).toEqual([LAW]);
    expect(result.citations[1]).toMatchObject({
      blockId: LAW,
      citation: "26 U.S.C. § 461(l)(3)(B)",
    });
  });

  it("searches the instructions for the gaps first, then the statute", async () => {
    const partial = answerOf({ coverage: "partial", gaps: ["gap"] });
    const { kinds } = await run(fakeMastra([partial, askStatute, answerOf({})]));
    expect(kinds).toEqual([
      "formulate",
      "retrieve",
      "answer",
      "retrieve-gaps",
      "answer-gaps",
      "statute",
      "answer-statute",
      "validate",
    ]);
  });

  it("skips the search when no law file is installed, logs why, and creates no file", async () => {
    law.installed = "real";
    const { result, kinds, steps } = await run(fakeMastra([askStatute]));
    expect(law.search).not.toHaveBeenCalled();
    expect(existsSync(process.env.LAW_DB_DIR!)).toBe(false);
    expect(kinds).toEqual(["formulate", "retrieve", "answer", "statute", "validate"]);
    expect(steps.find((step) => step.kind === "statute")).toMatchObject({
      skipped: "not_installed",
      missing: expect.arrayContaining(["federal"]),
    });
    expect(result.statuteConsulted).toBe(false);
  });

  it("drops a marker for a statute passage that was not retrieved", async () => {
    law.installed = false;
    const reply = { ...askStatute, answer: "No [1]. The statute agrees [2]." };
    const { result } = await run(fakeMastra([reply]));
    expect(result.answer).toBe("No [1]. The statute agrees.");
    expect(result.citations.map((citation) => citation.blockId)).toEqual([IRS]);
  });

  it("keeps a conflict quoted word for word and drops one that is not", async () => {
    const conflicts = [
      {
        kind: "instruction_vs_instruction",
        a: { passage: 1, quote: "are not included" },
        b: { passage: 2, quote: "shall not be taken into account" },
        note: "kept",
      },
      {
        kind: "instruction_vs_statute",
        a: { passage: 1, quote: "are included" },
        b: { passage: 2, quote: "shall not be taken into account" },
        note: "not word for word",
      },
      {
        kind: "instruction_vs_statute",
        a: { passage: 1, quote: "are not included" },
        b: { passage: 9, quote: "anything" },
        note: "no such passage",
      },
    ];
    const { result, steps } = await run(fakeMastra([askStatute, answerOf({ conflicts })]));
    expect(result.conflicts).toEqual([
      {
        kind: "instruction_vs_statute",
        a: { blockId: IRS, quote: "are not included" },
        b: {
          blockId: LAW,
          quote: "shall not be taken into account",
          citation: "26 U.S.C. § 461(l)(3)(B)",
        },
        note: "kept",
      },
    ]);
    const validate = steps.find((step) => step.kind === "validate");
    expect((validate?.dropped as { conflicts: number }).conflicts).toBe(2);
  });
});
