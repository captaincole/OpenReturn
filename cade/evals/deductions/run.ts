/*
 * npx tsx --env-file=.env evals/deductions/run.ts [model…] [--full] [--runs=N] [--case=…] [--out=dir]   (from cade)
 * --case=<substring> runs only matching cases. Only a full run without --case
 * publishes the report; the lite tier (the default) writes results.json only.
 * Both tiers run every case: the set is small.
 */
import { Agent } from "@mastra/core/agent";
import type { RequestContext } from "@mastra/core/request-context";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cadeDeductionsInstructions } from "../../src/mastra/agents/cadeDeductions.instructions";
import { listDecisions } from "../../src/mastra/db/aiDecisions";
import type { Scope } from "../../src/mastra/db/appDb";
import { listAssumptions } from "../../src/mastra/db/assumptions";
import { listFacts } from "../../src/mastra/db/taxFacts";
import { LIFE_QUESTION_IDS } from "../../src/mastra/deductions/lifeQuestions";
import { namedDecisionKey, NOTHING_ELSE_KEY } from "../../src/mastra/deductions/openDoor";
import { modelFor } from "../../src/mastra/models";
import { deductionsTools } from "../../src/mastra/tools/deductionsTools";
import { modelsFromArgs, tierFromArgs, useModel, type EvalModel } from "../lib/models";
import { freshScope } from "../lib/scope";
import "../lib/tempDb";
import { CASES, type DoorCase } from "./cases";
import { failure } from "./flow";
import { publishReport, type DoorResult } from "./report";

/* The grounding review of each decision is Canon's work, and the review eval's. */
process.env.DECISION_REVIEW = "off";

const REPO = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO, ".scratch/evals/deductions");

/* The door's own facts (the taxpayer's words, a yes that opens an item, the closing fact) start with this. */
const DOOR_FACTS = "deductions.";
const NAMED_DECISIONS = namedDecisionKey("");

/* The production agent's instructions and tools; no memory, because a run is one turn. */
function agentFor(model: EvalModel): Agent {
  useModel("CADE", model);
  return new Agent({
    id: "deductions-eval",
    name: "Cade",
    instructions: cadeDeductionsInstructions,
    model: modelFor("cade"),
    tools: deductionsTools,
  });
}

const allFacts = (scope: Scope) => listFacts(scope, { limit: 500 });

/* A no to every life question, through the real tool: the open door is then the step to take. */
async function seedEveryNo(requestContext: RequestContext): Promise<void> {
  const answers = LIFE_QUESTION_IDS.map((id) => ({
    id,
    answer: false,
    sourceNote: "The eval's setup: the taxpayer said no.",
  }));
  const tool = deductionsTools.answerLifeQuestions as unknown as {
    execute: (input: unknown, context: unknown) => Promise<{ next: { step: string } }>;
  };
  const { next } = await tool.execute({ answers }, { requestContext });
  if (next.step !== "ask_anything_else")
    throw new Error(`setup: the step after every no is ${next.step}, not the open door`);
}

/* What the model's turn wrote, read from the database. */
async function written(scope: Scope, seeded: ReadonlySet<string>) {
  const facts = (await allFacts(scope)).filter((fact) => !seeded.has(fact.id));
  const assumptions = await listAssumptions(scope);
  const decisions = await listDecisions(scope, { limit: 500 });
  const recorded = decisions
    .filter((row) => row.decisionKey.startsWith(NAMED_DECISIONS))
    .map((row) => {
      const { outcome, item } = (row.decision ?? {}) as { outcome?: string; item?: string };
      return { slug: row.decisionKey.slice(NAMED_DECISIONS.length), outcome: outcome ?? "", item };
    });
  const amountKeys = [
    ...facts.filter((fact) => !fact.key.startsWith(DOOR_FACTS)).map((fact) => fact.key),
    ...assumptions.map((assumption) => `${assumption.key} (assumption)`),
  ];
  return { recorded, amountKeys, closedDoor: facts.some((fact) => fact.key === NOTHING_ELSE_KEY) };
}

async function evalCase(
  agent: Agent,
  model: EvalModel,
  testCase: DoorCase,
  run: number,
): Promise<DoorResult> {
  const base = {
    model: model.label,
    case: testCase.name,
    run,
    expected: testCase.outcome,
    expectedItem: testCase.item,
  };
  const started = Date.now();
  const { scope, requestContext } = await freshScope();
  await seedEveryNo(requestContext);
  const seeded = new Set((await allFacts(scope)).map((fact) => fact.id));
  try {
    /* maxSteps: read the step, record the expense, read the step again, reply. */
    const result = await agent.generate([{ role: "user" as const, content: testCase.says }], {
      requestContext,
      maxSteps: 8,
    });
    return {
      ...base,
      ...(await written(scope, seeded)),
      latencyMs: Date.now() - started,
      replyText: result.text,
    };
  } catch (err) {
    const cause = (err as { cause?: { cause?: unknown } }).cause?.cause ?? err;
    return {
      ...base,
      recorded: [],
      amountKeys: [],
      closedDoor: false,
      latencyMs: Date.now() - started,
      replyText: "",
      error: String((cause as Error).message ?? cause).slice(0, 200),
    };
  }
}

/* One row per run for the lite summary (evals/lite): pass or fail. */
const liteCase = (result: DoorResult) => {
  const why = failure(result);
  return {
    flow: "deductions",
    model: result.model,
    name: result.case,
    run: result.run,
    score: why ? 0 : 1,
    note: why ?? `recorded ${result.expected}`,
  };
};

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir =
    process.argv.find((arg) => arg.startsWith("--out="))?.slice(6) ?? path.join(OUT_DIR, runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = process.argv.find((arg) => arg.startsWith("--case="))?.slice(7);
  const tier = tierFromArgs(process.argv);
  const cases = CASES.filter((testCase) => !caseFilter || testCase.name.includes(caseFilter));
  const models = modelsFromArgs(process.argv.slice(2));
  console.log(
    `${tier} tier: ${cases.length} cases, ${models.map((model) => `${model.label} ×${model.runs}`).join(", ")}`,
  );

  const results: DoorResult[] = [];
  for (const model of models) {
    console.log(`\n${model.label} (${model.id})`);
    const agent = agentFor(model);
    for (const testCase of cases) {
      for (let run = 1; run <= model.runs; run++) {
        const result = await evalCase(agent, model, testCase, run);
        console.log(`  ${testCase.name} #${run}: ${failure(result) ?? "ok"}`);
        results.push(result);
        writeFileSync(
          path.join(outDir, "results.json"),
          JSON.stringify({ tier, models, results, cases: results.map(liteCase) }, null, 2),
        );
      }
    }
    /* Publish after each model, so a long run shows results early. */
    if (!caseFilter && tier === "full")
      console.log(`Report: ${publishReport([{ models, results }])}`);
  }
  console.log(`\nResults: ${path.relative(REPO, outDir)}/results.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
