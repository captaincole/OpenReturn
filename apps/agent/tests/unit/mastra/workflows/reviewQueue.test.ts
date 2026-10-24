import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/*
 * The review workflow around a fake Canon: how a review's outcome maps to
 * the decision's verdict, that the step log is persisted on success and on
 * failure, that reviews run one at a time, and that the retry sweep
 * re-queues only what never reached Canon. app.db is a throwaway file.
 */

const dir = mkdtempSync(path.join(tmpdir(), "openreturn-review-test-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");
process.env.MASTRA_DB_PATH = path.join(dir, "mastra.db");

type GroundFn = () => Promise<unknown>;
let ground: GroundFn = async () => {
  throw new Error("no fake set");
};

vi.mock("../../../../src/mastra/canon/client", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../../../src/mastra/canon/client")>();
  return { ...real, groundCanon: () => ground() };
});

const client = await import("../../../../src/mastra/canon/client");
const db = await import("../../../../src/mastra/db/appDb");
const filings = await import("../../../../src/mastra/db/filings");
const decisions = await import("../../../../src/mastra/db/aiDecisions");
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

async function seedDecision(within = scope): Promise<string> {
  const id = crypto.randomUUID();
  await decisions.recordDecision(within, {
    id,
    userId,
    filingId: within.filingId,
    taxYear: YEAR,
    decisionKey: "decisions.scope.must_file_federal",
    decision: true,
    rationale: "income over the threshold",
    supportingFactKeys: [],
    confidence: "high",
  });
  return id;
}

/* The judge steps of the decision's latest review run, in order. */
async function stepKinds(decisionId: string): Promise<string[]> {
  const res = await db.getAppDb().execute({
    sql: `SELECT s.step_kind FROM review_run_steps s
          JOIN ai_decisions d ON d.latest_review_run_id = s.run_id
          WHERE d.id = ? ORDER BY s.created_at, s.rowid`,
    args: [decisionId],
  });
  return res.rows.map((r) => String(r.step_kind));
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
      await new Promise((r) => setTimeout(r, 20));
      inFlight -= 1;
      return okRun;
    };
    const a = await seedDecision();
    const b = await seedDecision();
    const first = review.enqueueReview(scope, a);
    const second = review.enqueueReview(scope, b);
    await expect(review.enqueueReview(scope, a)).rejects.toThrow("already queued");
    const outs = await Promise.all([first, second]);
    expect(outs.map((o) => o.finalVerdict)).toEqual(["accurate", "accurate"]);
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

    /* A sweep after a review that reached Canon re-queues the stale one, not the trigger. */
    const retried = await review.retryUnreachedReviews(own, current);
    expect(retried.map((r) => r.decisionId)).toEqual([stale]);
    expect((await decisions.getDecisionById(own, stale))?.verdict).toBe("accurate");
    expect((await decisions.getDecisionById(own, current))?.verdict).toBe("review_unreached");
  });
});
