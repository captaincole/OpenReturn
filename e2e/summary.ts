/*
 * Stage results for one E2E run, written to <runDir>/summary.md.
 *
 * Each stage has a kind:
 *   plumbing — the app itself (UI, proxy, agent, DB, document storage).
 *              A failure here means a code change probably broke something.
 *              The run stops at the first one.
 *   model    — what the model did (W-2 read, decisions, final values).
 *              A failure here can be a model mistake: run again before you
 *              debug. The run checks every model stage, then fails.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseEnv } from "node:util";
import { RUN_DIR } from "./run";

export type StageKind = "plumbing" | "model";

interface StageResult {
  name: string;
  kind: StageKind;
  ok: boolean;
  detail: string;
}

const results: StageResult[] = [];
const notes: string[] = [];

const firstLine = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).split("\n")[0].slice(0, 300);

/* Run a plumbing stage. Records the result and rethrows on failure. */
export async function plumbing<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    const value = await fn();
    results.push({ name, kind: "plumbing", ok: true, detail: "" });
    return value;
  } catch (err) {
    results.push({ name, kind: "plumbing", ok: false, detail: firstLine(err) });
    throw err;
  }
}

/* Record a stage from its list of problems (empty = pass). Does not throw. */
export function check(name: string, kind: StageKind, problems: string[]): void {
  const shown = problems.slice(0, 6).join("; ");
  const more = problems.length > 6 ? ` (+${problems.length - 6} more)` : "";
  results.push({ name, kind, ok: problems.length === 0, detail: shown + more });
}

/* A warning that does not fail the run (for example an empty reply). */
export function note(text: string): void {
  notes.push(text);
}

export const failedStages = () => results.filter((r) => !r.ok).map((r) => `${r.kind}: ${r.name}`);

function verdict(testError: string | undefined): string {
  const failed = results.filter((r) => !r.ok);
  if (failed.some((r) => r.kind === "plumbing")) return "FAIL (plumbing)";
  if (failed.length > 0) return "FAIL (model — run again before you debug)";
  return testError ? "FAIL (test error)" : "PASS";
}

/* The models this run used, from the env file servers.mjs wrote for the agent. */
function models(): string {
  const file = join(RUN_DIR, "agent.env");
  if (!existsSync(file)) return "unknown";
  const env = parseEnv(readFileSync(file, "utf8"));
  const at = (role: string) => {
    const url = env[`${role}_MODEL_URL`];
    return `${env[`${role}_MODEL`] ?? "default"}${url ? ` (${new URL(url).host})` : ""}`;
  };
  return `Luca ${at("LUCA")}, judges ${at("JUDGE")} (reviews ${env.DECISION_REVIEW ?? "on"})`;
}

export function writeSummary(opts: { durationMs: number; testError?: string }): void {
  const rel = (p: string) => relative(process.cwd(), join(RUN_DIR, p));
  const rows = results.map(
    (r) => `| ${r.ok ? "pass" : "**FAIL**"} | ${r.kind} | ${r.name} | ${r.detail} |`,
  );
  const lines = [
    `# Alex E2E — ${verdict(opts.testError)}`,
    "",
    `Duration: ${Math.round(opts.durationMs / 1000)} s`,
    "",
    `Models: ${models()}`,
    "",
    "| result | kind | stage | detail |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    ...(opts.testError ? ["## Test error", "", "```", opts.testError, "```", ""] : []),
    ...(notes.length ? ["## Notes", "", ...notes.map((n) => `- ${n}`), ""] : []),
    "## Files",
    "",
    `- Transcript: ${rel("transcript.md")}`,
    `- Logs: ${rel("agent.log")}, ${rel("web.log")}`,
    `- Data: ${rel("data")}`,
    `- Trace and video (on failure): ${rel("test-results")}`,
    "",
  ];
  writeFileSync(join(RUN_DIR, "summary.md"), lines.join("\n"));
}
