import type { Mastra } from "@mastra/core";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GroundInput, GroundStepLog } from "../../../../src/mastra/workflows/ground/schemas";

/*
 * The statute round of the ground loop, with fake judges and a fake law
 * search. "real" uses the real lawInstalled() on a temp path with no file.
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-ground-statute-test-"));
process.env.LAW_DB_DIR = path.join(dir, "law");
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const law = vi.hoisted(() => ({
  installed: true as boolean | "real",
  search: vi.fn(async ({ query }: { query: string }) => [
    {
      blockId: "usc-26-2025::sec::s461::l-3-B",
      citation: "26 U.S.C. § 461(l)(3)(B)",
      sectionHeading: "Limitation on excess business losses",
      headings: [],
      text: `Deductions for losses from sales or exchanges of capital assets shall not be taken into account (${query}).`,
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
  hybridSearchRefDocs: async () => [
    {
      blockId: "irs-461-inst-2025::sec::line-3::b01",
      docId: "irs-461-inst-2025",
      text: "Losses from sales or exchanges of capital assets are not included.",
      score: 1,
    },
  ],
}));

type Ground = (
  mastra: Mastra,
  input: GroundInput,
) => Promise<{
  verdict: string;
  citations: { blockId: string; quote?: string }[];
  conflicts: { kind: string; a: { blockId: string }; b: { blockId: string } }[];
  statuteConsulted: boolean;
  whatsMissing?: string;
  log: { steps: GroundStepLog[] };
}>;
let groundDecision: Ground;

beforeAll(async () => {
  process.env.JUDGE_MODEL ??= "test/model";
  ({ groundDecision } = await import("../../../../src/mastra/workflows/ground"));
});

beforeEach(() => {
  law.installed = true;
  law.search.mockClear();
});

const decision = {
  taxYear: 2025,
  decisionKey: "decisions.scope.must_file_461",
  decision: false,
  rationale: "The business capital loss does not count.",
  confidence: "high",
};

const IRS = "irs-461-inst-2025::sec::line-3::b01";
const LAW = "usc-26-2025::sec::s461::l-3-B";

type Reply = () => Promise<{ object: unknown }>;
const reply =
  (object: unknown): Reply =>
  async () => ({ object });
const formulator = reply({ queries: ["excess business loss"] });
const assessor = reply({ riskTier: "high", rationale: "r", consequenceNotes: "c" });
const consult = reply({
  result: {
    kind: "consult_statute",
    reason: "Pub 225 and Form 461 differ",
    statuteQueries: ["excess business loss capital assets"],
  },
});
const verdictWith = (extra: object) =>
  reply({
    result: { kind: "verdict", verdict: "accurate", reason: "ok", citations: [], ...extra },
  });

/* Each rule call takes the next reply; the prompts are kept for the checks. */
function fakeMastra(ruleReplies: Reply[], prompts: string[] = []): Mastra {
  const rule = async (prompt: string) => {
    prompts.push(prompt);
    const next = ruleReplies.shift();
    if (!next) throw new Error("no more rule replies");
    return next();
  };
  const agents: Record<string, unknown> = {
    queryFormulator: formulator,
    assessRiskAgent: assessor,
    ruleAgent: rule,
  };
  return { getAgent: (id: string) => ({ name: id, generate: agents[id] }) } as unknown as Mastra;
}

// With no list, one statute round searches two statutes: the Code, then California's code.
const ONE_ROUND = 2;

const kinds = (steps: GroundStepLog[]) => steps.map((step) => `${step.iteration}:${step.kind}`);

describe("groundDecision and the statute", () => {
  it("never searches the statute when the judge does not ask", async () => {
    const out = await groundDecision(fakeMastra([verdictWith({})]), { decision });
    expect(law.search).not.toHaveBeenCalled();
    expect(out.statuteConsulted).toBe(false);
    expect(out.conflicts).toEqual([]);
    expect(kinds(out.log.steps)).toEqual(["1:gather", "1:assess", "1:rule"]);
  });

  it("consults once, shows the passages, and rules in the same iteration", async () => {
    const prompts: string[] = [];
    const verdict = verdictWith({
      citations: [{ blockId: LAW, quote: "shall not be taken into account" }],
    });
    const out = await groundDecision(fakeMastra([consult, verdict], prompts), { decision });
    expect(law.search).toHaveBeenCalledTimes(ONE_ROUND);
    for (const [nth, source] of [
      [1, "statute"],
      [2, "california"],
    ] as const)
      expect(law.search).toHaveBeenNthCalledWith(nth, {
        query: "excess business loss capital assets",
        limit: 6,
        source,
      });
    expect(kinds(out.log.steps)).toEqual(["1:gather", "1:assess", "1:rule", "1:statute", "1:rule"]);
    expect(prompts[0]).not.toContain("Statute passages");
    expect(prompts[1]).toContain(`[${LAW}] 26 U.S.C. § 461(l)(3)(B):`);
    expect(out.verdict).toBe("accurate");
    expect(out.statuteConsulted).toBe(true);
    expect(out.citations).toEqual([{ blockId: LAW, quote: "shall not be taken into account" }]);
  });

  it("treats a second consult_statute as a request for more evidence", async () => {
    const out = await groundDecision(fakeMastra([consult, consult]), {
      decision,
      maxIterations: 1,
    });
    expect(law.search).toHaveBeenCalledTimes(ONE_ROUND);
    expect(out.verdict).toBe("needs_more_facts");
    expect(out.whatsMissing).toBe("Pub 225 and Form 461 differ");
  });

  it("does not search again in a later iteration, and says so", async () => {
    const prompts: string[] = [];
    const needMore = reply({
      result: { kind: "need_more_evidence", reason: "thin", suggestedQueries: ["q"] },
    });
    const replies = [consult, needMore, consult, verdictWith({})];
    const out = await groundDecision(fakeMastra(replies, prompts), { decision });
    expect(law.search).toHaveBeenCalledTimes(ONE_ROUND);
    const statute = out.log.steps.filter((step) => step.kind === "statute");
    expect(statute.map((step) => (step.output as { skipped?: string }).skipped)).toEqual([
      undefined,
      "already_consulted",
    ]);
    expect(prompts[3]).toContain("already consulted");
    expect(prompts[3]).toContain(`[${LAW}]`);
  });

  it("skips the search when no law file is installed, and creates no file", async () => {
    law.installed = "real";
    const prompts: string[] = [];
    const out = await groundDecision(fakeMastra([consult, verdictWith({})], prompts), { decision });
    expect(law.search).not.toHaveBeenCalled();
    expect(existsSync(process.env.LAW_DB_DIR!)).toBe(false);
    const statute = out.log.steps.find((step) => step.kind === "statute")!;
    expect(statute.output).toMatchObject({ skipped: "not_installed", missing: ["federal", "CA"] });
    expect(prompts[1]).toContain("The statute is not available in this review.");
    expect(out.statuteConsulted).toBe(false);
  });

  it("drops a citation to a statute block that was not retrieved", async () => {
    const verdict = verdictWith({
      citations: [{ blockId: "usc-26-2025::sec::s469::g-1" }, { blockId: IRS }],
    });
    const out = await groundDecision(fakeMastra([verdict]), { decision });
    expect(out.citations).toEqual([{ blockId: IRS }]);
  });

  it("keeps a conflict quoted word for word, and drops one that is not", async () => {
    const conflicts = [
      {
        kind: "statute_vs_statute",
        a: { blockId: IRS, quote: "are not included" },
        b: { blockId: LAW, quote: "shall not be taken into account" },
        note: "same rule",
      },
      {
        kind: "instruction_vs_statute",
        a: { blockId: IRS, quote: "are included" },
        b: { blockId: LAW, quote: "shall not be taken into account" },
        note: "a misquote",
      },
    ];
    const out = await groundDecision(fakeMastra([consult, verdictWith({ conflicts })]), {
      decision,
    });
    expect(out.conflicts).toEqual([
      {
        kind: "instruction_vs_statute",
        a: { blockId: IRS, quote: "are not included" },
        b: {
          blockId: LAW,
          quote: "shall not be taken into account",
          citation: "26 U.S.C. § 461(l)(3)(B)",
        },
        note: "same rule",
      },
    ]);
    const rules = out.log.steps.filter((step) => step.kind === "rule");
    expect((rules[1].output as { droppedConflicts: number }).droppedConflicts).toBe(1);
  });
});
