/*
 * npm run smoke:review. Costs real judge-model calls in Canon: run on demand, not in CI.
 * Uses a throwaway app DB. Skips when Canon is not running.
 */

import "dotenv/config";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the app DB at a temp file BEFORE importing anything that opens it.
const SMOKE_DB = join(tmpdir(), `openreturn-smoke-${Date.now()}.db`);
process.env.APP_DB_PATH = SMOKE_DB;
process.env.MASTRA_DB_PATH = join(tmpdir(), `openreturn-smoke-mastra-${Date.now()}.db`);

const YEAR = 2025;
const OWNER_ID = "smoke-owner";

interface Case {
  name: string;
  acceptVerdicts: Array<"accurate" | "inaccurate" | "needs_more_facts">;
  expectOpenQuestion: boolean | "if-not-accurate";
  facts: Array<{ category: string; key: string; value: unknown; sourceNote: string }>;
  decision: {
    decisionKey: string;
    decision: unknown;
    rationale: string;
    supportingFactKeys: string[];
    confidence: "low" | "medium" | "high";
    dissentingConsiderations?: string;
    sourceNote: string;
  };
}

const CASES: Case[] = [
  {
    name: "accurate: filing status = single with marital fact = never_married",
    acceptVerdicts: ["accurate"],
    expectOpenQuestion: false,
    facts: [
      {
        category: "identity",
        key: "identity.marital_status",
        value: "never_married",
        sourceNote: "user stated verbally 2026-04-23",
      },
      {
        category: "identity",
        key: "identity.has_qualifying_dependents",
        value: false,
        sourceNote: "user stated verbally 2026-04-23",
      },
    ],
    decision: {
      decisionKey: "decisions.filing_status_eligibility",
      decision: { status: "single" },
      rationale:
        "User confirmed marital_status=never_married and has no qualifying dependents. Per Form 1040 filing-status rules, a never-married taxpayer with no qualifying dependents files as Single.",
      supportingFactKeys: ["identity.marital_status", "identity.has_qualifying_dependents"],
      confidence: "high",
      sourceNote: "derived from intake conversation 2026-04-23",
    },
  },
  {
    name: "inaccurate: filing status = single but marital fact = married",
    acceptVerdicts: ["inaccurate"],
    expectOpenQuestion: true,
    facts: [
      {
        category: "identity",
        key: "identity.marital_status",
        value: "married",
        sourceNote: "user stated verbally 2026-04-23",
      },
    ],
    decision: {
      decisionKey: "decisions.filing_status_eligibility",
      decision: { status: "single" },
      rationale:
        "User confirmed marital_status=married but I am recording filing status as single because I got confused.",
      supportingFactKeys: ["identity.marital_status"],
      confidence: "low",
      dissentingConsiderations: "The supporting fact directly contradicts this.",
      sourceNote: "derived from intake conversation 2026-04-23",
    },
  },
  {
    /*
     * Borderline by design: the verdict varies run to run. This case asserts pipeline
     * mechanics, not judge calibration. Do not tune prompts off it.
     */
    name: "CA residency call (mechanics only — borderline verdict accepted)",
    acceptVerdicts: ["accurate", "needs_more_facts", "inaccurate"],
    expectOpenQuestion: "if-not-accurate",
    facts: [
      {
        category: "identity",
        key: "identity.residence_state",
        value: "CA",
        sourceNote: "user stated verbally 2026-04-23",
      },
      {
        category: "identity",
        key: "identity.days_outside_ca_2025",
        value: 20,
        sourceNote: "user stated verbally 2026-04-23",
      },
    ],
    decision: {
      decisionKey: "decisions.ca_residency",
      decision: "full_year_ca_resident",
      rationale:
        "User lived in CA all of 2025 except 20 days of business travel to Nevada. Under CA FTB rules, that is a full-year CA resident.",
      supportingFactKeys: ["identity.residence_state", "identity.days_outside_ca_2025"],
      confidence: "high",
      sourceNote: "derived from intake conversation 2026-04-23",
    },
  },
];

type SmokeCase = (typeof CASES)[number];

/* Imported AFTER the env override (see main). */
interface Deps {
  createOwnerFiling: typeof import("../src/mastra/db/filings").createOwnerFiling;
  recordFact: typeof import("../src/mastra/db/taxFacts").recordFact;
  listOpenQuestions: typeof import("../src/mastra/db/taxFacts").listOpenQuestions;
  recordDecision: typeof import("../src/mastra/db/aiDecisions").recordDecision;
  getDecisionById: typeof import("../src/mastra/db/aiDecisions").getDecisionById;
  reviewDecision: typeof import("../src/mastra/workflows/reviewDecision").reviewDecision;
}

async function seedCase(
  deps: Deps,
  c: SmokeCase,
  scope: { userId: string; filingId: string },
): Promise<string> {
  for (const f of c.facts) {
    await deps.recordFact(scope, {
      id: crypto.randomUUID(),
      userId: OWNER_ID,
      filingId: scope.filingId,
      taxYear: YEAR,
      category: f.category,
      key: f.key,
      value: f.value,
      sourceNote: f.sourceNote,
    });
  }
  const decisionId = crypto.randomUUID();
  await deps.recordDecision(scope, {
    id: decisionId,
    userId: OWNER_ID,
    filingId: scope.filingId,
    taxYear: YEAR,
    ...c.decision,
  });
  return decisionId;
}

function reportCase(
  c: SmokeCase,
  secs: string,
  result: Awaited<ReturnType<Deps["reviewDecision"]>>,
  row: Awaited<ReturnType<Deps["getDecisionById"]>>,
  questions: Awaited<ReturnType<Deps["listOpenQuestions"]>>,
): boolean {
  const passVerdict = (c.acceptVerdicts as string[]).includes(result.finalVerdict);
  const passPersist = row?.verdict === result.finalVerdict;
  const passCitations = result.finalVerdict !== "accurate" || result.citations.length > 0;
  const expectQ =
    c.expectOpenQuestion === "if-not-accurate"
      ? result.finalVerdict !== "accurate"
      : c.expectOpenQuestion;
  const passQuestion = expectQ ? questions.length > 0 : questions.length === 0;
  const pass = passVerdict && passPersist && passCitations && passQuestion;

  console.log(
    `${pass ? "✓" : "✗"} ${c.name} (${secs}s, ${result.iterationCount} iter)\n` +
      `    accept=[${c.acceptVerdicts.join("|")}]  got=${result.finalVerdict}` +
      (result.citations.length
        ? `\n    citations: ${result.citations.map((x) => x.blockId).join(", ")}`
        : "") +
      `\n    reason: ${result.reason.slice(0, 180)}`,
  );
  if (!passPersist) console.log(`    [!] DB verdict=${row?.verdict} ≠ workflow result`);
  if (!passCitations) console.log(`    [!] accurate verdict but no citations`);
  if (!passQuestion)
    console.log(
      `    [!] open_questions mismatch: expected ${expectQ ? ">0" : "0"}, got ${questions.length}`,
    );
  return pass;
}

async function runCase(deps: Deps, c: SmokeCase): Promise<boolean> {
  const filingId = crypto.randomUUID();
  await deps.createOwnerFiling({ filingId, userId: OWNER_ID, taxYear: YEAR });
  const scope = { userId: OWNER_ID, filingId };

  const decisionId = await seedCase(deps, c, scope);

  const t0 = Date.now();
  const result = await deps.reviewDecision(scope, decisionId);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const row = await deps.getDecisionById(scope, decisionId);
  const questions = await deps.listOpenQuestions(scope, "open");
  return reportCase(c, secs, result, row, questions);
}

async function main() {
  const canonUrl = process.env.CANON_URL ?? "http://127.0.0.1:4112";
  const canonUp = await fetch(`${canonUrl}/health`, { signal: AbortSignal.timeout(2_000) })
    .then((r) => r.ok)
    .catch(() => false);
  if (!canonUp) {
    console.error(`Canon is not running at ${canonUrl} — skipping smoke test (npm run dev:canon)`);
    process.exit(0);
  }

  // Import AFTER the env override so every module opens the temp DB.
  const { createOwnerFiling } = await import("../src/mastra/db/filings");
  const { recordFact, listOpenQuestions } = await import("../src/mastra/db/taxFacts");
  const { recordDecision, getDecisionById } = await import("../src/mastra/db/aiDecisions");
  const { reviewDecision, reviewDecisionWorkflow } =
    await import("../src/mastra/workflows/reviewDecision");
  await registerReviewWorkflow(reviewDecisionWorkflow);
  const { disconnectCanon } = await import("../src/mastra/canon/client");
  const deps: Deps = {
    createOwnerFiling,
    recordFact,
    listOpenQuestions,
    recordDecision,
    getDecisionById,
    reviewDecision,
  };

  console.log(`[smoke:review] temp app DB: ${SMOKE_DB}`);
  let passed = 0;
  for (const c of CASES) {
    if (await runCase(deps, c)) passed += 1;
  }

  for (const suffix of ["", "-wal", "-shm"]) {
    await rm(`${SMOKE_DB}${suffix}`, { force: true }).catch(() => {});
    await rm(`${process.env.MASTRA_DB_PATH}${suffix}`, { force: true }).catch(() => {});
  }

  console.log(`\n[smoke:review] ${passed}/${CASES.length} cases passed`);
  await disconnectCanon();
  process.exit(passed === CASES.length ? 0 : 1);
}

main().catch((err) => {
  console.error("[smoke:review] failed:", err);
  process.exit(1);
});

/*
 * A workflow must be registered on a Mastra instance. The app's instance uses top-level
 * await, which tsx cannot load in this CommonJS script.
 */
async function registerReviewWorkflow(workflow: unknown) {
  const { Mastra } = await import("@mastra/core");
  new Mastra({ workflows: { reviewDecision: workflow as never } });
}
