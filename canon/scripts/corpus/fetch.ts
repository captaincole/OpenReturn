import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "../lib/cli";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, "../../seed/corpus.manifest.json");
const DEFAULT_TARGET = resolve(HERE, "../../.data/corpus.db");

interface Manifest {
  version: string;
  file: string;
  sha256: string;
  sizeBytes: number;
  url: string;
}

function sha256Of(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function run(argv: string[]): Promise<void> {
  const force = argv.includes("--force");
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  const target = process.env.CORPUS_DB_PATH ? resolve(process.env.CORPUS_DB_PATH) : DEFAULT_TARGET;
  mkdirSync(dirname(target), { recursive: true });

  // A different sha is a locally extended corpus: never clobber it without --force.
  if (existsSync(target) && !force) {
    const sha = sha256Of(target);
    if (sha === manifest.sha256) {
      console.log(`[corpus fetch] up to date (${manifest.version}) at ${target}`);
    } else {
      console.log(
        `[corpus fetch] ${target} exists with a different sha — leaving it alone ` +
          `(locally extended corpus?). Use --force to replace with ${manifest.version}.`,
      );
    }
    return;
  }

  const seedPath = process.env.CORPUS_SEED_PATH
    ? resolve(process.env.CORPUS_SEED_PATH)
    : resolve(HERE, "../../seed/corpus.db");
  if (existsSync(seedPath)) {
    copyFileSync(seedPath, target);
    console.log(`[corpus fetch] seeded from ${seedPath} → ${target}`);
    await checkEmbeddingStamp();
    return;
  }

  if (!manifest.url) {
    console.error(
      `[corpus fetch] no corpus available: ${target} missing, no local seed at ` +
        `${seedPath}, and the manifest has no url (corpus release not published yet).\n` +
        `Options: set CORPUS_SEED_PATH to a corpus.db, or build one with ` +
        `'npm run corpus -- sync' (needs ANTHROPIC_API_KEY; Ollama for embeddings). ` +
        `The app runs without a corpus — grounding reviews ` +
        `will return needs_more_facts until one exists.`,
    );
    process.exit(1);
  }
  await downloadFromRelease(manifest, target);
  await checkEmbeddingStamp();
}

async function downloadFromRelease(manifest: Manifest, target: string): Promise<void> {
  console.log(
    `[corpus fetch] downloading ${manifest.version} (${(manifest.sizeBytes / 1e6).toFixed(1)} MB)…`,
  );
  const res = await fetch(manifest.url);
  if (!res.ok) {
    console.error(`[corpus fetch] download failed: HTTP ${res.status} from ${manifest.url}`);
    process.exit(1);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== manifest.sha256) {
    console.error(
      `[corpus fetch] sha256 mismatch — expected ${manifest.sha256}, got ${sha}. Not installing.`,
    );
    process.exit(1);
  }
  writeFileSync(target, bytes);
  console.log(`[corpus fetch] installed ${manifest.version} → ${target}`);
}

// Warn now, not at query time, when search will run keyword-only.
async function checkEmbeddingStamp(): Promise<void> {
  const { storedEmbeddingModel } = await import("../../src/db/corpusStore");
  const { resolveEmbeddings } = await import("../../src/refdocs/embeddings");
  const stored = await storedEmbeddingModel();
  const active = resolveEmbeddings().id;
  if (stored === active) {
    console.log(`[corpus fetch] embeddings match the active model (${active}) — RAG ready.`);
  } else {
    console.log(
      `[corpus fetch] corpus embeddings are ${stored ?? "unstamped"} but the active ` +
        `model is ${active} — run 'npm run corpus -- reembed --all' to rebuild them ` +
        `locally; until then reference search is keyword-only.`,
    );
  }
}

export const fetchCommand: Command = {
  name: "fetch",
  summary: "Install the prebuilt corpus.db (local seed or sha-verified release download)",
  options: [{ flag: "--force", desc: "replace an existing corpus.db even if its sha differs" }],
  run,
};
