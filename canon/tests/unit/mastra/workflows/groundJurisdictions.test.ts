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
  lawSearch: vi.fn(async () => []),
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

/* The rule judge asks for more evidence, then for the statute, then rules. */
function fakeMastra(): Mastra {
  const rules = [
    { kind: "need_more_evidence", reason: "thin", suggestedQueries: ["ca residency"] },
    { kind: "consult_statute", reason: "names a rule", statuteQueries: ["section 7701"] },
    { kind: "verdict", verdict: "accurate", reason: "ok", citations: [] },
  ];
  const agents: Record<string, () => Promise<unknown>> = {
    queryFormulator: async () => ({ object: { queries: ["california resident"] } }),
    assessRiskAgent: async () => ({
      object: {
        riskTier: "low",
        rationale: "r",
        consequenceNotes: "c",
        dissentingConsiderations: [],
      },
    }),
    ruleAgent: async () => ({ object: { result: rules.shift() } }),
  };
  return { getAgent: (id: string) => ({ name: id, generate: agents[id] }) } as unknown as Mastra;
}

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

  it("skips the federal statute for ['CA'], logs why, and still rules", async () => {
    const out = await groundDecision(fakeMastra(), { decision, jurisdictions: ["CA"] });
    expect(fakes.lawSearch).not.toHaveBeenCalled();
    expect(out.statuteConsulted).toBe(false);
    expect(out.verdict).toBe("accurate");
    const statute = out.log.steps.find((step) => step.kind === "statute");
    expect(statute?.output).toMatchObject({ skipped: "federal_off" });
  });

  it("searches every jurisdiction and the statute with no list", async () => {
    const out = await groundDecision(fakeMastra(), { decision });
    expect(searchedLists()).toEqual([
      ["federal", "CA"],
      ["federal", "CA"],
    ]);
    expect(out.jurisdictions).toEqual(["federal", "CA"]);
    expect(fakes.lawSearch).toHaveBeenCalledTimes(1);
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
