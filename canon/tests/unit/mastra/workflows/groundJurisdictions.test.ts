import type { Mastra } from "@mastra/core";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GroundInput, GroundStepLog } from "../../../../src/mastra/workflows/ground/schemas";

// The ground loop with fake judges and fake searches: the jurisdictions reach every gather and the result.

const fakes = vi.hoisted(() => ({
  refSearch: vi.fn(async ({ query }: { query: string }) => [
    {
      blockId: `ca-540-inst-2025::sec::${query.replace(/\W+/g, "-")}::b01`,
      docId: "ca-540-inst-2025",
      text: "California residents file Form 540.",
      score: 1,
    },
  ]),
  lawSearch: vi.fn(async ({ source }: { source?: string }) => [
    source === "california"
      ? {
          blockId: "ca-rtc-2025::sec::s17014::a",
          citation: "Cal. Rev. & Tax. Code § 17014(a)",
          text: "Resident includes every individual who is in this state for other than a temporary or transitory purpose.",
          score: 1,
        }
      : {
          blockId: "usc-26-2025::sec::s7701::b-1",
          citation: "26 U.S.C. § 7701(b)(1)",
          text: "An alien individual shall be treated as a resident of the United States.",
          score: 1,
        },
  ]),
}));

vi.mock("../../../../src/db/corpusSearch", () => ({ hybridSearchRefDocs: fakes.refSearch }));
vi.mock("../../../../src/law/lawSearch", () => ({ searchLaw: fakes.lawSearch }));
vi.mock("../../../../src/db/libsql", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../src/db/libsql")>()),
  lawInstalled: async () => true,
}));

type Ground = (
  mastra: Mastra,
  input: GroundInput,
) => Promise<{
  verdict: string;
  citations: { blockId: string; quote?: string }[];
  conflicts: unknown[];
  statuteConsulted: boolean;
  jurisdictions: string[];
  log: { steps: GroundStepLog[] };
}>;
let groundDecision: Ground;
let groundInputSchema: typeof import("../../../../src/mastra/workflows/ground/schemas").groundInputSchema;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ groundDecision } = await import("../../../../src/mastra/workflows/ground"));
  ({ groundInputSchema } = await import("../../../../src/mastra/workflows/ground/schemas"));
});

beforeEach(() => {
  fakes.refSearch.mockClear();
  fakes.lawSearch.mockClear();
});

const decision = {
  taxYear: 2025,
  decisionKey: "decisions.ca_residency",
  decision: "full_year",
  rationale: "Lived in California all year.",
  confidence: "high",
};

const RESIDENT = "ca-rtc-2025::sec::s17014::a";
const verdict = {
  kind: "verdict",
  verdict: "accurate",
  reason: "ok",
  citations: [{ blockId: RESIDENT, quote: "other than a temporary or transitory purpose" }],
  conflicts: [
    {
      kind: "statute_vs_statute",
      a: { blockId: "ca-540-inst-2025::sec::ca-residency::b01", quote: "file Form 540" },
      b: { blockId: RESIDENT, quote: "temporary or transitory purpose" },
      note: "n",
    },
  ],
};

/* The rule judge asks for more evidence, then for the statute, then rules. */
function fakeMastra(prompts: string[] = []): Mastra {
  const rules = [
    { kind: "need_more_evidence", reason: "thin", suggestedQueries: ["ca residency"] },
    { kind: "consult_statute", reason: "names a rule", statuteQueries: ["section 7701"] },
    verdict,
  ];
  const agents: Record<string, (prompt: string) => Promise<unknown>> = {
    queryFormulator: async () => ({ object: { queries: ["california resident"] } }),
    assessRiskAgent: async () => ({
      object: {
        riskTier: "low",
        rationale: "r",
        consequenceNotes: "c",
        dissentingConsiderations: [],
      },
    }),
    ruleAgent: async (prompt: string) => {
      prompts.push(prompt);
      return { object: { result: rules.shift() } };
    },
  };
  return { getAgent: (id: string) => ({ name: id, generate: agents[id] }) } as unknown as Mastra;
}

// The source of each law search, in call order: never "regulations".
const lawSources = () =>
  fakes.lawSearch.mock.calls.map(([opts]) => (opts as { source?: string }).source);
const searchedLists = () =>
  fakes.refSearch.mock.calls.map(([opts]) => (opts as { jurisdictions?: unknown }).jurisdictions);
const gathers = (steps: GroundStepLog[]) =>
  steps.filter((step) => step.kind === "gather").map((step) => step.input);

describe("groundDecision and the jurisdictions", () => {
  it("gathers California only for ['CA'] on every iteration, and records it", async () => {
    const out = await groundDecision(fakeMastra(), { decision, jurisdictions: ["CA"] });
    expect(searchedLists()).toEqual([["CA"], ["CA"]]);
    expect(out.jurisdictions).toEqual(["CA"]);
    expect(gathers(out.log.steps)).toEqual([
      expect.objectContaining({ jurisdictions: ["CA"] }),
      expect.objectContaining({ jurisdictions: ["CA"] }),
    ]);
  });

  it("searches California's code for ['CA'], once, and checks its quotes word for word", async () => {
    const prompts: string[] = [];
    const out = await groundDecision(fakeMastra(prompts), { decision, jurisdictions: ["CA"] });
    expect(lawSources()).toEqual(["california"]);
    expect(out.statuteConsulted).toBe(true);
    expect(out.verdict).toBe("accurate");
    const statute = out.log.steps.find((step) => step.kind === "statute");
    expect(statute?.output).toMatchObject({ sources: ["california"] });
    expect(prompts.at(-1)).toContain(
      `Statute passages (Cal. Rev. & Tax. Code, the law the passages above explain; consulted once in this review):\n  [${RESIDENT}] Cal. Rev. & Tax. Code § 17014(a):`,
    );
    expect(out.citations).toEqual([
      { blockId: RESIDENT, quote: "other than a temporary or transitory purpose" },
    ]);
    expect(out.conflicts).toEqual([
      {
        kind: "instruction_vs_statute",
        a: { blockId: "ca-540-inst-2025::sec::ca-residency::b01", quote: "file Form 540" },
        b: {
          blockId: RESIDENT,
          quote: "temporary or transitory purpose",
          citation: "Cal. Rev. & Tax. Code § 17014(a)",
        },
        note: "n",
      },
    ]);
  });

  it("searches every jurisdiction and both statutes with no list, federal first", async () => {
    const prompts: string[] = [];
    const out = await groundDecision(fakeMastra(prompts), { decision });
    expect(searchedLists()).toEqual([
      ["federal", "CA"],
      ["federal", "CA"],
    ]);
    expect(out.jurisdictions).toEqual(["federal", "CA"]);
    expect(lawSources()).toEqual(["statute", "california"]);
    expect(prompts.at(-1)).toContain(
      "Statute passages (26 U.S.C. and Cal. Rev. & Tax. Code, the law the passages above explain;",
    );
    const last = prompts.at(-1)!;
    expect(last.indexOf("26 U.S.C. § 7701(b)(1)")).toBeLessThan(last.indexOf("§ 17014(a)"));
  });

  it("searches the Code alone for ['federal'], with the header as before", async () => {
    const prompts: string[] = [];
    await groundDecision(fakeMastra(prompts), { decision, jurisdictions: ["federal"] });
    expect(lawSources()).toEqual(["statute"]);
    expect(prompts.at(-1)).toContain(
      "Statute passages (26 U.S.C., the law the passages above explain; consulted once in this review):",
    );
  });
});

describe("run_ground input", () => {
  it("takes an optional list of known jurisdictions", () => {
    expect(groundInputSchema.parse({ decision }).jurisdictions).toBeUndefined();
    expect(groundInputSchema.safeParse({ decision, jurisdictions: [] }).success).toBe(false);
    expect(groundInputSchema.safeParse({ decision, jurisdictions: ["NY"] }).success).toBe(false);
  });

  it("refuses a bad list before any judge runs", async () => {
    await expect(groundDecision(fakeMastra(), { decision, jurisdictions: [] })).rejects.toThrow();
    expect(fakes.refSearch).not.toHaveBeenCalled();
  });
});
