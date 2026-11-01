/*
 * plumbing: the app broke; the run stops at the first failure.
 * model: can be a model mistake; every model stage runs, then the run fails.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
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

export function check(name: string, kind: StageKind, problems: string[]): void {
  const shown = problems.slice(0, 6).join("; ");
  const more = problems.length > 6 ? ` (+${problems.length - 6} more)` : "";
  results.push({ name, kind, ok: problems.length === 0, detail: shown + more });
}

export function note(text: string): void {
  notes.push(text);
}

export const failedStages = () =>
  results.filter((result) => !result.ok).map((result) => `${result.kind}: ${result.name}`);

function verdict(testError: string | undefined): string {
  const failed = results.filter((result) => !result.ok);
  if (failed.some((result) => result.kind === "plumbing")) return "FAIL (plumbing)";
  if (failed.length > 0) return "FAIL (model — run again before you debug)";
  return testError ? "FAIL (test error)" : "PASS";
}

function models(): string {
  const file = join(RUN_DIR, "agent.env");
  if (!existsSync(file)) return "unknown";
  const env = parseEnv(readFileSync(file, "utf8"));
  const at = (role: string) => {
    const url = env[`${role}_MODEL_URL`];
    return `${env[`${role}_MODEL`] ?? "default"}${url ? ` (${new URL(url).host})` : ""}`;
  };
  return `Cade ${at("CADE")}, judges ${at("JUDGE")} (reviews ${env.DECISION_REVIEW ?? "on"})`;
}

export function writeSummary(opts: { durationMs: number; testError?: string }): void {
  const rel = (file: string) => relative(resolve(__dirname, "../.."), join(RUN_DIR, file));
  const rows = results.map(
    (result) =>
      `| ${result.ok ? "pass" : "**FAIL**"} | ${result.kind} | ${result.name} | ${result.detail} |`,
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
    ...(notes.length ? ["## Notes", "", ...notes.map((line) => `- ${line}`), ""] : []),
    "## Files",
    "",
    `- Transcript: ${rel("transcript.md")}`,
    `- Logs: ${rel("canon.log")}, ${rel("agent.log")}, ${rel("web.log")}`,
    `- Data: ${rel("data")}`,
    `- Trace and video (on failure): ${rel("test-results")}`,
    "",
  ];
  writeFileSync(join(RUN_DIR, "summary.md"), lines.join("\n"));
}
