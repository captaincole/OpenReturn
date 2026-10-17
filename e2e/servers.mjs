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
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseEnv } from "node:util";

const root = resolve(import.meta.dirname, "..");
const runDir = process.env.E2E_RUN_DIR;
const DATA_KEYS = ["APP_DB_PATH", "MASTRA_DB_PATH", "DOCUMENTS_PATH"];

/*
 * Decision reviews are off by default. On a local model they share the
 * GPU with Luca and make each turn several times slower, and the Alex
 * test does not test grounding. E2E_DECISION_REVIEW=on turns them on.
 */
const DECISION_REVIEW = process.env.E2E_DECISION_REVIEW ?? "off";

/*
 * E2E_LUCA_MODEL / E2E_JUDGE_MODEL run a role on another model for one
 * run, for example anthropic/claude-haiku-5-5. Its URL comes from
 * E2E_<ROLE>_MODEL_URL; without one, the model is a cloud model (key
 * from apps/agent/.env).
 */
const ROLES = ["LUCA", "JUDGE"].filter((role) => process.env[`E2E_${role}_MODEL`]);
const roleKeys = ROLES.flatMap((r) => [`${r}_MODEL`, `${r}_MODEL_URL`, `${r}_MODEL_API_KEY`]);
const roleOverrides = ROLES.flatMap((r) => {
  const url = process.env[`E2E_${r}_MODEL_URL`];
  return [`${r}_MODEL=${process.env[`E2E_${r}_MODEL`]}`, ...(url ? [`${r}_MODEL_URL=${url}`] : [])];
});

function agentEnvFile() {
  const replaced = [...DATA_KEYS, "DECISION_REVIEW", ...roleKeys];
  const source = readFileSync(join(root, "apps/agent/.env.development"), "utf8");
  const kept = source
    .split("\n")
    .filter((line) => !replaced.some((key) => line.startsWith(`${key}=`)));
  const pinned = [
    ...DATA_KEYS.map((key) => `${key}=${process.env[key]}`),
    `DECISION_REVIEW=${DECISION_REVIEW}`,
    ...roleOverrides,
  ];
  const file = join(runDir, "agent.env");
  writeFileSync(file, [...kept, ...pinned].join("\n") + "\n");
  return file;
}

/*
 * API keys live in apps/agent/.env. The agent's dotenv/config does not
 * find that file when mastra dev runs its bundle, so copy the *_API_KEY
 * entries into the agent's environment here. Only the keys: that file
 * also sets model URLs and data paths, which this run sets itself. The
 * keys stay in memory; agent.env never holds them.
 */
function loadAgentKeys() {
  const file = join(root, "apps/agent/.env");
  if (!existsSync(file)) return;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (key.endsWith("_API_KEY") && !roleKeys.includes(key)) process.env[key] ??= value;
  }
}

const COMMANDS = {
  agent: () => {
    loadAgentKeys();
    return { cwd: join(root, "apps/agent"), args: ["mastra", "dev", "--env", agentEnvFile()] };
  },
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
