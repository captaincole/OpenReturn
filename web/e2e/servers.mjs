/*
 * mastra dev copies its --env file over process.env, so the agent gets a
 * copy of its env file with this run's data paths. Next.js lets process.env
 * win over .env files, so web needs no copy.
 */

import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseEnv } from "node:util";

const root = resolve(import.meta.dirname, "../..");
const runDir = process.env.E2E_RUN_DIR;
const DATA_KEYS = ["APP_DB_PATH", "MASTRA_DB_PATH", "DOCUMENTS_PATH"];

/* Off by default: on a local model reviews share the GPU and slow each turn several times. */
const DECISION_REVIEW = process.env.E2E_DECISION_REVIEW ?? "off";

/* One round: the run checks that a review comes back, not the verdict. */
const GROUND_MAX_ITERATIONS = process.env.E2E_GROUND_MAX_ITERATIONS ?? "1";

/* E2E_* lines in the gitignored cade/.env are defaults; the shell wins. */
function loadE2eDefaults() {
  const file = join(root, "cade/.env");
  if (!existsSync(file)) return;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (key.startsWith("E2E_")) process.env[key] ??= value;
  }
}
loadE2eDefaults();

const ROLES = ["CADE", "JUDGE"].filter((role) => process.env[`E2E_${role}_MODEL`]);
const roleKeys = ROLES.flatMap((r) => [`${r}_MODEL`, `${r}_MODEL_URL`, `${r}_MODEL_API_KEY`]);
const roleOverrides = ROLES.flatMap((r) => {
  const url = process.env[`E2E_${r}_MODEL_URL`];
  return [`${r}_MODEL=${process.env[`E2E_${r}_MODEL`]}`, ...(url ? [`${r}_MODEL_URL=${url}`] : [])];
});

function agentEnvFile() {
  const replaced = [...DATA_KEYS, "DECISION_REVIEW", "CANON_GROUND_MAX_ITERATIONS", ...roleKeys];
  const source = readFileSync(join(root, "cade/.env.development"), "utf8");
  const kept = source
    .split("\n")
    .filter((line) => !replaced.some((key) => line.startsWith(`${key}=`)));
  const pinned = [
    ...DATA_KEYS.map((key) => `${key}=${process.env[key]}`),
    `DECISION_REVIEW=${DECISION_REVIEW}`,
    `CANON_GROUND_MAX_ITERATIONS=${GROUND_MAX_ITERATIONS}`,
    ...roleOverrides.filter((line) => line.startsWith("CADE_")),
  ];
  const file = join(runDir, "agent.env");
  writeFileSync(file, [...kept, ...pinned].join("\n") + "\n");
  return file;
}

/* Canon keeps the normal corpus; only its Mastra state goes to the run folder. */
function canonEnvFile() {
  const replaced = ["MASTRA_DB_PATH", ...roleKeys];
  const source = readFileSync(join(root, "canon/.env.development"), "utf8");
  const kept = source
    .split("\n")
    .filter((line) => !replaced.some((key) => line.startsWith(`${key}=`)));
  const judge = roleOverrides.filter((line) => line.startsWith("JUDGE_"));
  const pinned = [`MASTRA_DB_PATH=${join(runDir, "data", "canon.db")}`, ...judge];
  const file = join(runDir, "canon.env");
  writeFileSync(file, [...kept, ...pinned].join("\n") + "\n");
  return file;
}

/*
 * dotenv does not find cade/.env from mastra dev's bundle, so copy only the
 * *_API_KEY entries. They stay in memory; agent.env never holds them.
 */
function loadAgentKeys() {
  const file = join(root, "cade/.env");
  if (!existsSync(file)) return;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (key.endsWith("_API_KEY") && !roleKeys.includes(key)) process.env[key] ??= value;
  }
}

const COMMANDS = {
  canon: () => {
    loadAgentKeys();
    return { cwd: join(root, "canon"), args: ["mastra", "dev", "--env", canonEnvFile()] };
  },
  agent: () => {
    loadAgentKeys();
    return { cwd: join(root, "cade"), args: ["mastra", "dev", "--env", agentEnvFile()] };
  },
  web: () => ({ cwd: join(root, "web"), args: ["next", "dev"] }),
};

const name = process.argv[2];
if (!runDir || !COMMANDS[name]) {
  console.error("usage: E2E_RUN_DIR=… node e2e/servers.mjs canon|agent|web");
  process.exit(2);
}
mkdirSync(process.env.DOCUMENTS_PATH, { recursive: true });

/* The agent reads blank PDFs from a gitignored tree; build it first. */
if (name === "agent") {
  const sync = spawnSync("npm", ["--prefix", join(root, "cade"), "run", "sources:sync"], {
    stdio: "inherit",
  });
  if (sync.status !== 0) {
    console.error(
      `sources:sync failed (${sync.error?.message ?? `exit ${sync.status}`}); not starting the agent`,
    );
    process.exit(1);
  }
}

const { cwd, args } = COMMANDS[name]();
const log = createWriteStream(join(runDir, `${name}.log`));
const child = spawn("npx", args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
child.stdout.pipe(log);
child.stderr.pipe(log);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
