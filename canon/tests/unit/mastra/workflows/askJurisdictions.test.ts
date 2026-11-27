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
  lawSearch: vi.fn(async ({ source }: { source?: string }) =>
    source === "california"
      ? [
          {
            blockId: "ca-rtc-2025::sec::s17073.5::a",
            source: "california",
            citation: "Cal. Rev. & Tax. Code § 17073.5(a)",
            sectionHeading: "§ 17073.5",
            headings: [],
            text: "The standard deduction shall be an amount set by this section.",
            score: 1,
          },
        ]
      : [
          {
            blockId: "usc-26-2025::sec::s63::c-1",
            source: "statute",
            citation: "26 U.S.C. § 63(c)(1)",
            sectionHeading: "§ 63",
            headings: [],
            text: "The term standard deduction means the sum of the basic standard deduction.",
            score: 1,
          },
        ],
  ),
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

function fakeMastra(
  prompts: { formulate: string[]; answer: string[] },
  answers: object[] = [partial, settled, settled],
): Mastra {
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

async function run(jurisdictions?: ("federal" | "CA")[], answers?: object[]) {
  const prompts = { formulate: [] as string[], answer: [] as string[] };
  const steps: AskStepLog[] = [];
  const result = await answerQuestion(fakeMastra(prompts, answers), {
    question: "What is the standard deduction?",
    jurisdictions,
    steps,
  });
  const searched = fakes.refSearch.mock.calls.map(
    ([opts]) => (opts as { jurisdictions?: unknown }).jurisdictions,
  );
  return { result, steps, prompts, searched };
}

// The source of each law search, in call order: the statute round runs once.
const lawSources = () =>
  fakes.lawSearch.mock.calls.map(([opts]) => (opts as { source?: string }).source);

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

  it("searches California's code for ['CA'], once, and never the federal law", async () => {
    const { result, steps, prompts } = await run(["CA"]);
    expect(lawSources()).toEqual(["california"]);
    expect(result.statuteConsulted).toBe(true);
    expect(result.statutePassages.map((passage) => passage.blockId)).toEqual([
      "ca-rtc-2025::sec::s17073.5::a",
    ]);
    expect(steps.find((step) => step.kind === "statute")).toMatchObject({
      sources: ["california"],
    });
    const last = prompts.answer.at(-1)!;
    expect(last).toContain(
      "Statute passages (California's Revenue and Taxation Code, the law the passages above explain):",
    );
    expect(last).toContain("[3] Cal. Rev. & Tax. Code § 17073.5(a)");
    expect(last).not.toContain("Internal Revenue Code");
  });

  it("cites a California passage with its citation and California's title, and checks its quote", async () => {
    const reply = {
      ...settled,
      answer: "It is listed [1]. California sets it [3].",
      citations: [
        { passage: 1, quote: "is listed here" },
        { passage: 3, quote: "set by this section" },
      ],
      conflicts: [
        {
          kind: "statute_vs_statute",
          a: { passage: 1, quote: "is listed here" },
          b: { passage: 3, quote: "set by this section" },
          note: "n",
        },
        {
          kind: "instruction_vs_statute",
          a: { passage: 1, quote: "is listed here" },
          b: { passage: 3, quote: "not in the passage" },
          note: "misquote",
        },
      ],
    };
    const { result } = await run(["CA"], [partial, settled, reply]);
    expect(result.citations[1]).toMatchObject({
      blockId: "ca-rtc-2025::sec::s17073.5::a",
      documentTitle: "California Revenue and Taxation Code",
      citation: "Cal. Rev. & Tax. Code § 17073.5(a)",
      quote: "set by this section",
    });
    expect(result.conflicts).toEqual([
      {
        kind: "instruction_vs_statute",
        a: { blockId: "ca-540-inst-2025::sec::q1::b01", quote: "is listed here" },
        b: {
          blockId: "ca-rtc-2025::sec::s17073.5::a",
          quote: "set by this section",
          citation: "Cal. Rev. & Tax. Code § 17073.5(a)",
        },
        note: "n",
      },
    ]);
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
    expect(lawSources()).toEqual(["statute", "california"]);
    expect(result.statutePassages.map((passage) => passage.blockId)).toEqual([
      "usc-26-2025::sec::s63::c-1",
      "ca-rtc-2025::sec::s17073.5::a",
    ]);
    expect(prompts.answer.at(-1)).toContain(
      "Statute passages (the Internal Revenue Code and California's Revenue and Taxation Code, the law the passages above explain):",
    );
    expect([...prompts.formulate, ...prompts.answer].join("\n")).not.toContain(
      "Libraries searched",
    );
  });

  it("searches the Code alone for ['federal'], with the header as before", async () => {
    const { result, prompts } = await run(["federal"]);
    expect(lawSources()).toEqual(["statute"]);
    expect(result.jurisdictions).toEqual(["federal"]);
    expect(result.citations).toHaveLength(1);
    expect(prompts.answer.at(-1)).toContain(
      "Statute passages (the Internal Revenue Code, the law the passages above explain):",
    );
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
