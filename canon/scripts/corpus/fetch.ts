import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { libraryDbPath, type Library } from "../../src/db/libsql";
import type { Command } from "../lib/cli";

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(HERE, "../../seed");

interface Manifest {
  version: string;
  file: string;
  sha256: string;
  sizeBytes: number;
  url: string;
}

/* What differs between installing corpus.db and law.db; the steps are the same. */
export interface FetchSpec {
  library: Library;
  tag: string;
  seedEnv: string;
  reembed: string;
  /** Printed when the file is missing and there is no seed and no release url. */
  unavailable(target: string, seedPath: string): string;
}

const CORPUS_FETCH: FetchSpec = {
  library: "corpus",
  tag: "[corpus fetch]",
  seedEnv: "CORPUS_SEED_PATH",
  reembed: "npm run corpus -- reembed --all",
  unavailable: (target, seedPath) =>
    `[corpus fetch] no corpus available: ${target} missing, no local seed at ` +
    `${seedPath}, and the manifest has no url (corpus release not published yet).\n` +
    `Options: set CORPUS_SEED_PATH to a corpus.db, or build one with ` +
    `'npm run corpus -- sync' (needs ANTHROPIC_API_KEY; Ollama for embeddings). ` +
    `The app runs without a corpus — grounding reviews ` +
    `will return needs_more_facts until one exists.`,
};

export const manifestPath = (library: Library): string =>
  resolve(SEED_DIR, `${library}.manifest.json`);

function sha256Of(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export async function fetchLibrary(spec: FetchSpec, force: boolean): Promise<void> {
  const manifest = JSON.parse(readFileSync(manifestPath(spec.library), "utf8")) as Manifest;
  const target = libraryDbPath(spec.library);
  mkdirSync(dirname(target), { recursive: true });

  // A different sha is a locally extended library: never clobber it without --force.
  if (existsSync(target) && !force) {
    const sha = sha256Of(target);
    if (sha === manifest.sha256) {
      console.log(`${spec.tag} up to date (${manifest.version}) at ${target}`);
    } else {
      console.log(
        `${spec.tag} ${target} exists with a different sha — leaving it alone ` +
          `(locally extended ${spec.library}?). Use --force to replace with ${manifest.version}.`,
      );
    }
    return;
  }

  const fromEnv = process.env[spec.seedEnv];
  const seedPath = fromEnv ? resolve(fromEnv) : resolve(SEED_DIR, `${spec.library}.db`);
  if (existsSync(seedPath)) {
    copyFileSync(seedPath, target);
    console.log(`${spec.tag} seeded from ${seedPath} → ${target}`);
    await checkEmbeddingStamp(spec);
    return;
  }

  if (!manifest.url) {
    console.error(spec.unavailable(target, seedPath));
    process.exit(1);
  }
  await downloadFromRelease(spec, manifest, target);
  await checkEmbeddingStamp(spec);
}

async function downloadFromRelease(spec: FetchSpec, manifest: Manifest, target: string) {
  console.log(
    `${spec.tag} downloading ${manifest.version} (${(manifest.sizeBytes / 1e6).toFixed(1)} MB)…`,
  );
  const res = await fetch(manifest.url);
  if (!res.ok) {
    console.error(`${spec.tag} download failed: HTTP ${res.status} from ${manifest.url}`);
    process.exit(1);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== manifest.sha256) {
    console.error(
      `${spec.tag} sha256 mismatch — expected ${manifest.sha256}, got ${sha}. Not installing.`,
    );
    process.exit(1);
  }
  writeFileSync(target, bytes);
  console.log(`${spec.tag} installed ${manifest.version} → ${target}`);
}

// Warn now, not at query time, when search will run keyword-only.
async function checkEmbeddingStamp(spec: FetchSpec): Promise<void> {
  const { storedEmbeddingModel } = await import("../../src/db/corpusStore");
  const { resolveEmbeddings } = await import("../../src/refdocs/embeddings");
  const stored = await storedEmbeddingModel(spec.library);
  const active = resolveEmbeddings().id;
  if (stored === active) {
    console.log(`${spec.tag} embeddings match the active model (${active}) — RAG ready.`);
  } else {
    console.log(
      `${spec.tag} ${spec.library} embeddings are ${stored ?? "unstamped"} but the active ` +
        `model is ${active} — run '${spec.reembed}' to rebuild them ` +
        `locally; until then reference search is keyword-only.`,
    );
  }
}

export const fetchCommand: Command = {
  name: "fetch",
  summary: "Install the prebuilt corpus.db (local seed or sha-verified release download)",
  options: [{ flag: "--force", desc: "replace an existing corpus.db even if its sha differs" }],
  run: (argv) => fetchLibrary(CORPUS_FETCH, argv.includes("--force")),
};
