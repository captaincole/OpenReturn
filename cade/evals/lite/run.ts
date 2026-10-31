/*
 *   npm run evals:lite -- [model…] [--flow=ask,review,ingest]   (from the repo root)
 *
 * One run of the lite cases of each flow, on Haiku and the 31b on the second
 * machine (whichever is configured). Each flow runs in its own process: the
 * judges read their model when the module loads. Results and a summary go to
 * .scratch/evals/lite/<runId>/; nothing under docs/ changes.
 */
import "./env";

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { modelsFromArgs, type EvalModel } from "../lib/models";
import { FLOWS, fromResults, writeSummary, type CaseResult, type Flow } from "./summary";

const CADE = path.resolve(__dirname, "../..");
const REPO = path.resolve(CADE, "..");
const CANON = path.join(REPO, "canon");

const ARGS = process.argv.slice(2);
const OUT = path.join(REPO, ".scratch/evals/lite");

function flowsFromArgs(argv: string[]): Flow[] {
  const flag = argv.find((a) => a.startsWith("--flow="))?.slice(7);
  if (!flag) return FLOWS;
  const picked = flag.split(",").map((f) => f.trim());
  const unknown = picked.filter((f) => !FLOWS.includes(f as Flow));
  if (unknown.length) throw new Error(`unknown flow: ${unknown.join(", ")} (${FLOWS.join(", ")})`);
  return FLOWS.filter((f) => picked.includes(f));
}

/* A child inherits this process's env; its --env-file fills in what is unset. */
function runEval(cwd: string, script: string, args: string[]): void {
  const res = spawnSync("npx", ["tsx", "--env-file=.env.development", script, ...args], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) throw new Error(`${script} ${args.join(" ")} exited ${res.status}`);
}

const slug = (m: EvalModel) => m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function runFlow(flow: Flow, models: EvalModel[], runDir: string): CaseResult[] {
  if (flow === "ingest") {
    const out = path.join(runDir, "ingest");
    runEval(CADE, "evals/ingest/run.ts", [...models.map((m) => m.id), `--out=${out}`]);
    return fromResults(path.join(out, "results.json"));
  }
  return models.flatMap((m) => {
    const out = path.join(runDir, `${flow}-${slug(m)}`);
    runEval(CANON, `evals/${flow}/run.ts`, [m.id, `--out=${out}`]);
    return fromResults(path.join(out, "results.json"));
  });
}

function main() {
  const models = modelsFromArgs(ARGS);
  const flows = flowsFromArgs(ARGS);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(OUT, runId);
  mkdirSync(runDir, { recursive: true });
  console.log(`evals lite: ${flows.join(", ")} on ${models.map((m) => m.label).join(", ")}`);
  const cases = flows.flatMap((flow) => {
    console.log(`\n=== ${flow} ===`);
    return runFlow(flow, models, runDir);
  });
  console.log(`\n${writeSummary(OUT, runId, cases)}`);
  console.log(`\nSummary: ${path.relative(REPO, path.join(runDir, "summary.md"))}`);
}

main();
