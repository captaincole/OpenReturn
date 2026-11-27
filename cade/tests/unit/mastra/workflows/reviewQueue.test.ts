import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "openreturn-review-test-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");
process.env.MASTRA_DB_PATH = path.join(dir, "mastra.db");

type GroundFn = (input: unknown) => Promise<unknown>;
let ground: GroundFn = async () => {
  throw new Error("no fake set");
};

vi.mock("../../../../src/mastra/canon/client", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../../../src/mastra/canon/client")>();
  return { ...real, groundCanon: (input: unknown) => ground(input) };
});

const client = await import("../../../../src/mastra/canon/client");
const db = await import("../../../../src/mastra/db/appDb");
const filings = await import("../../../../src/mastra/db/filings");
const decisions = await import("../../../../src/mastra/db/aiDecisions");
const taxFacts = await import("../../../../src/mastra/db/taxFacts");
const review = await import("../../../../src/mastra/workflows/reviewDecision");

const YEAR = 2025;
const userId = "owner";
let filingId: string;
let scope: { userId: string; filingId: string };

const okRun = {
  status: "ok" as const,
  verdict: "accurate" as const,
  reason: "the facts support it",
  citations: [{ blockId: "b1" }],
  riskTier: "low" as const,
  iterationCount: 1,
  log: {
    steps: [
      { iteration: 1, kind: "gather" as const, durationMs: 1, input: {}, output: {} },
      { iteration: 1, kind: "assess" as const, durationMs: 1, input: {}, output: {} },
      { iteration: 1, kind: "rule" as const, durationMs: 1, input: {}, output: {} },
    ],
  },
};

async function seedDecision(
  within = scope,
  decisionKey = "decisions.scope.must_file_federal",
): Promise<string> {
  const id = crypto.randomUUID();
  await decisions.recordDecision(within, {
    id,
    userId,
    filingId: within.filingId,
    taxYear: YEAR,
    decisionKey,
    decision: true,
    rationale: "income over the threshold",
    supportingFactKeys: [],
    confidence: "high",
  });
  return id;
}

async function stepOutput(decisionId: string, kind: string): Promise<Record<string, unknown>> {
  const res = await db.getAppDb().execute({
    sql: `SELECT s.output_json FROM review_run_steps s
          JOIN ai_decisions d ON d.latest_review_run_id = s.run_id
          WHERE d.id = ? AND s.step_kind = ?`,
    args: [decisionId, kind],
  });
  return JSON.parse(String(res.rows[0].output_json)) as Record<string, unknown>;
}

async function stepKinds(decisionId: string): Promise<string[]> {
  const res = await db.getAppDb().execute({
    sql: `SELECT s.step_kind FROM review_run_steps s
          JOIN ai_decisions d ON d.latest_review_run_id = s.run_id
          WHERE d.id = ? ORDER BY s.created_at, s.rowid`,
    args: [decisionId],
  });
  return res.rows.map((row) => String(row.step_kind));
}

beforeAll(async () => {
  const { Mastra } = await import("@mastra/core");
  new Mastra({ workflows: { reviewDecision: review.reviewDecisionWorkflow } });
  filingId = crypto.randomUUID();
  await filings.createOwnerFiling({ filingId, userId, taxYear: YEAR });
  scope = { userId, filingId };
});

afterEach(() => {
  ground = async () => {
    throw new Error("no fake set");
  };
});

describe("reviewDecision", () => {
  it("stamps accurate and persists every judge step on success", async () => {
    ground = async () => okRun;
    const id = await seedDecision();
    const out = await review.reviewDecision(scope, id);
    expect(out.finalVerdict).toBe("accurate");
    expect((await decisions.getDecisionById(scope, id))?.verdict).toBe("accurate");
    expect(await stepKinds(id)).toEqual(["init", "gather", "assess", "rule", "finalize"]);
  });

  it("stores the statute step, and writes one open question for texts that disagree", async () => {
    const own = { userId, filingId: crypto.randomUUID() };
    await filings.createOwnerFiling({ ...own, taxYear: YEAR });
    const side = (blockId: string, quote: string, citation?: string) => ({
      blockId,
      quote,
      ...(citation ? { citation } : {}),
    });
    const law = "usc-26-2025::sec::s461::l-3-B";
    ground = async () => ({
      ...okRun,
      statuteConsulted: true,
      conflicts: [
        {
          kind: "instruction_vs_statute",
          a: side("irs-pub-225-2025::sec::excess-business-loss::b01", "Form 8949 are included"),
          b: side(law, "shall not be taken into account", "26 U.S.C. § 461(l)(3)(B)"),
          note: "Pub 225 counts business capital losses; the statute does not.",
        },
        {
          kind: "instruction_vs_statute",
          a: side("irs-461-inst-2025::sec::line-3::b01", "should be added back"),
          b: side(law, "shall not exceed the lesser of"),
          note: "A second point.",
        },
      ],
      log: {
        steps: [
          ...okRun.log.steps,
          { iteration: 1, kind: "statute" as const, durationMs: 1, input: {}, output: {} },
          { iteration: 1, kind: "rule" as const, durationMs: 1, input: {}, output: {} },
        ],
      },
    });
    const id = await seedDecision(own);
    const out = await review.reviewDecision(own, id);
    expect(out.finalVerdict).toBe("accurate");
    expect(await stepKinds(id)).toEqual([
      "init",
      "gather",
      "assess",
      "rule",
      "statute",
      "rule",
      "finalize",
    ]);
    const questions = await taxFacts.listOpenQuestions(own);
    expect(questions).toHaveLength(1);
    expect(questions[0].question).toBe(
      "Decide which text to follow for decision `decisions.scope.must_file_federal`: the IRS instructions and the statute disagree.",
    );
    expect(questions[0].context).toContain(
      "26 U.S.C. § 461(l)(3)(B) (usc-26-2025::sec::s461::l-3-B)",
    );
    expect(questions[0].context).toContain("“Form 8949 are included”");
  });

  it("asks Canon for the decision's jurisdictions and stores the ones it searched", async () => {
    const seen: unknown[] = [];
    ground = async (input) => {
      const { jurisdictions } = input as { jurisdictions?: string[] };
      seen.push(jurisdictions);
      return { ...okRun, jurisdictions };
    };
    const california = await seedDecision(scope, "decisions.scope.ca_residency");
    const federal = await seedDecision(scope, "decisions.scope.must_file_federal");
    const both = await seedDecision(scope, "decisions.scope.filing_status");
    for (const id of [california, federal, both]) await review.reviewDecision(scope, id);
    expect(seen).toEqual([["CA"], ["federal"], ["federal", "CA"]]);
    expect(await stepOutput(california, "init")).toMatchObject({
      jurisdictions: ["CA"],
      jurisdictionRule: "table",
    });
    expect(await stepOutput(california, "finalize")).toMatchObject({ jurisdictions: ["CA"] });
  });

  it("stores every jurisdiction as searched when Canon sends no list", async () => {
    ground = async () => okRun;
    const id = await seedDecision(scope, "decisions.scope.ca_residency");
    const out = await review.reviewDecision(scope, id);
    expect(out.jurisdictions).toEqual(["federal", "CA"]);
  });

  it("names the FTB instructions and California's code in a California conflict", async () => {
    const own = { userId, filingId: crypto.randomUUID() };
    await filings.createOwnerFiling({ ...own, taxYear: YEAR });
    const instruction = { blockId: "ca-540-inst-2025::sec::line-91::b01", quote: "use tax" };
    const code = {
      blockId: "ca-rtc-2025::sec::s6202::a",
      quote: "every retailer",
      citation: "Cal. Rev. & Tax. Code § 6202(a)",
    };
    const note = "They disagree.";
    ground = async () => ({
      ...okRun,
      jurisdictions: ["CA"],
      conflicts: [
        { kind: "instruction_vs_statute", a: code, b: instruction, note },
        { kind: "instruction_vs_instruction", a: instruction, b: instruction, note },
      ],
    });
    await review.reviewDecision(
      own,
      await seedDecision(own, "decisions.scope.use_tax_zero_reason"),
    );
    const [question] = await taxFacts.listOpenQuestions(own);
    expect(question.question).toBe(
      "Decide which text to follow for decision `decisions.scope.use_tax_zero_reason`: official texts disagree.",
    );
    expect(question.context).toContain("The review followed the FTB instructions until");

    const single = { userId, filingId: crypto.randomUUID() };
    await filings.createOwnerFiling({ ...single, taxYear: YEAR });
    ground = async () => ({
      ...okRun,
      conflicts: [{ kind: "instruction_vs_statute", a: code, b: instruction, note }],
    });
    await review.reviewDecision(
      single,
      await seedDecision(single, "decisions.scope.use_tax_zero_reason"),
    );
    const [one] = await taxFacts.listOpenQuestions(single);
    expect(one.question).toContain(": the FTB instructions and California's code disagree.");
  });

  it("passes CANON_GROUND_MAX_ITERATIONS to Canon, and nothing when unset", async () => {
    const seen: unknown[] = [];
    ground = async (input) => {
      seen.push((input as { maxIterations?: number }).maxIterations);
      return okRun;
    };
    process.env.CANON_GROUND_MAX_ITERATIONS = "1";
    try {
      await review.reviewDecision(scope, await seedDecision());
    } finally {
      delete process.env.CANON_GROUND_MAX_ITERATIONS;
    }
    await review.reviewDecision(scope, await seedDecision());
    expect(seen).toEqual([1, undefined]);
  });

  it("stamps review_unreached when the call never reached Canon", async () => {
    ground = async () => {
      throw new client.CanonUnreachableError("Canon ground: Request timed out");
    };
    const id = await seedDecision();
    const out = await review.reviewDecision(scope, id);
    expect(out.finalVerdict).toBe("review_unreached");
    const row = await decisions.getDecisionById(scope, id);
    expect(row?.verdict).toBe("review_unreached");
    expect(row?.verdictReason).toContain("Request timed out");
    expect(await stepKinds(id)).toEqual(["init"]);
  });

  it("stamps review_failed, keeping the steps that ran, when Canon's judges broke", async () => {
    ground = async () => ({
      status: "failed",
      error: "rule: no structured output",
      log: { steps: okRun.log.steps.slice(0, 2) },
    });
    const id = await seedDecision();
    const out = await review.reviewDecision(scope, id);
    expect(out.finalVerdict).toBe("review_failed");
    expect(out.reason).toContain("rule: no structured output");
    expect(await stepKinds(id)).toEqual(["init", "gather", "assess"]);
  });
});

describe("the review queue", () => {
  it("runs reviews one at a time and refuses a duplicate", async () => {
    let inFlight = 0;
    let peak = 0;
    ground = async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      inFlight -= 1;
      return okRun;
    };
    const firstId = await seedDecision();
    const secondId = await seedDecision();
    const first = review.enqueueReview(scope, firstId);
    const second = review.enqueueReview(scope, secondId);
    await expect(review.enqueueReview(scope, firstId)).rejects.toThrow("already queued");
    const outs = await Promise.all([first, second]);
    expect(outs.map((out) => out.finalVerdict)).toEqual(["accurate", "accurate"]);
    expect(peak).toBe(1);
  });

  it("retries only the unreached reviews, never the one that just ran", async () => {
    /* Its own filing: the sweep is per filing, and earlier tests left unreached rows. */
    const own = { userId, filingId: crypto.randomUUID() };
    await filings.createOwnerFiling({ ...own, taxYear: YEAR });
    ground = async () => {
      throw new client.CanonUnreachableError("down");
    };
    const stale = await seedDecision(own);
    const current = await seedDecision(own);
    await review.reviewDecision(own, stale);
    const last = await review.reviewDecision(own, current);
    expect(last.finalVerdict).toBe("review_unreached");

    /* An unreached result is no evidence Canon is back: no sweep. */
    ground = async () => okRun;
    await review.retryAfter(own, last);
    expect((await decisions.getDecisionById(own, stale))?.verdict).toBe("review_unreached");

    const retried = await review.retryUnreachedReviews(own, current);
    expect(retried.map((entry) => entry.decisionId)).toEqual([stale]);
    expect((await decisions.getDecisionById(own, stale))?.verdict).toBe("accurate");
    expect((await decisions.getDecisionById(own, current))?.verdict).toBe("review_unreached");
  });
});
