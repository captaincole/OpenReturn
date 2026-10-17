/*
 * Starts one server for the E2E run: `node e2e/servers.mjs agent|web`.
 * Output goes to <E2E_RUN_DIR>/<name>.log.
 *
 *   agent — mastra dev. mastra copies its --env file over process.env,
 *           so the data paths cannot come from the environment. We
 *           write a copy of apps/agent/.env.development with this run's
 *           data paths (into the gitignored run folder) and pass it.
 *   web   — next dev. Next.js lets process.env win over .env files, so
 *           the data paths pass straight through.
 */

import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runDir = process.env.E2E_RUN_DIR;
const DATA_KEYS = ["APP_DB_PATH", "MASTRA_DB_PATH", "DOCUMENTS_PATH"];

function agentEnvFile() {
  const source = readFileSync(join(root, "apps/agent/.env.development"), "utf8");
  const kept = source
    .split("\n")
    .filter((line) => !DATA_KEYS.some((key) => line.startsWith(`${key}=`)));
  const pinned = DATA_KEYS.map((key) => `${key}=${process.env[key]}`);
  const file = join(runDir, "agent.env");
  writeFileSync(file, [...kept, ...pinned].join("\n") + "\n");
  return file;
}

const COMMANDS = {
  agent: () => ({
    cwd: join(root, "apps/agent"),
    args: ["mastra", "dev", "--env", agentEnvFile()],
  }),
  web: () => ({ cwd: join(root, "apps/web"), args: ["next", "dev"] }),
};

const name = process.argv[2];
if (!runDir || !COMMANDS[name]) {
  console.error("usage: E2E_RUN_DIR=… node e2e/servers.mjs agent|web");
  process.exit(2);
}
mkdirSync(process.env.DOCUMENTS_PATH, { recursive: true });

const { cwd, args } = COMMANDS[name]();
const log = createWriteStream(join(runDir, `${name}.log`));
const child = spawn("npx", args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
child.stdout.pipe(log);
child.stderr.pipe(log);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
