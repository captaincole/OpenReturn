import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { libraryDbPath, type Library } from "../../src/db/libsql";
import type { Command } from "../lib/cli";

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED_DIR = resolve(HERE, "../../seed");

/** One release file: corpus.db, or one jurisdiction's law file. */
export interface ReleaseFile {
  /** The release asset's name; a local seed has the same name. */
  file: string;
  sha256: string;
  sizeBytes: number;
  url: string;
}

interface Manifest extends ReleaseFile {
  version: string;
}

/* What one install needs: the library, its release file, and the messages. */
export interface InstallSpec {
  library: Library;
  tag: string;
  version: string;
  release: ReleaseFile;
  /** A local copy, used instead of the download when it exists. */
  seedPath: string;
  reembed: string;
  /** Printed when the file is missing and there is no seed and no release url. */
  unavailable(target: string, seedPath: string): string;
}

const corpusUnavailable = (target: string, seedPath: string) =>
  `[corpus fetch] no corpus available: ${target} missing, no local seed at ` +
  `${seedPath}, and the manifest has no url (corpus release not published yet).\n` +
  `Options: set CORPUS_SEED_PATH to a corpus.db, or build one with ` +
  `'npm run corpus -- sync' (needs ANTHROPIC_API_KEY; Ollama for embeddings). ` +
  `The app runs without a corpus — grounding reviews ` +
  `will return needs_more_facts until one exists.`;

export const manifestPath = (name: "corpus" | "law"): string =>
  resolve(SEED_DIR, `${name}.manifest.json`);

function sha256Of(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export async function installLibrary(spec: InstallSpec, force: boolean): Promise<void> {
  const target = libraryDbPath(spec.library);
  mkdirSync(dirname(target), { recursive: true });

  // A different sha is a locally extended library: never clobber it without --force.
  if (existsSync(target) && !force) {
    const sha = sha256Of(target);
    if (sha === spec.release.sha256) {
      console.log(`${spec.tag} up to date (${spec.version}) at ${target}`);
    } else {
      console.log(
        `${spec.tag} ${target} exists with a different sha — leaving it alone ` +
          `(locally extended ${spec.library}?). Use --force to replace with ${spec.version}.`,
      );
    }
    return;
  }

  if (existsSync(spec.seedPath)) {
    copyFileSync(spec.seedPath, target);
    console.log(`${spec.tag} seeded from ${spec.seedPath} → ${target}`);
    await checkEmbeddingStamp(spec);
    return;
  }

  if (!spec.release.url) throw new Error(spec.unavailable(target, spec.seedPath));
  await downloadFromRelease(spec, target);
  await checkEmbeddingStamp(spec);
}

async function downloadFromRelease(spec: InstallSpec, target: string) {
  const { release } = spec;
  console.log(
    `${spec.tag} downloading ${spec.version} ${release.file} (${(release.sizeBytes / 1e6).toFixed(1)} MB)…`,
  );
  const res = await fetch(release.url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} from ${release.url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== release.sha256)
    throw new Error(
      `sha256 mismatch for ${release.file} — expected ${release.sha256}, got ${sha}. Not installing.`,
    );
  writeFileSync(target, bytes);
  console.log(`${spec.tag} installed ${spec.version} ${release.file} → ${target}`);
}

// Warn now, not at query time, when search will run keyword-only.
async function checkEmbeddingStamp(spec: InstallSpec): Promise<void> {
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

async function fetchCorpus(force: boolean): Promise<void> {
  const manifest = JSON.parse(readFileSync(manifestPath("corpus"), "utf8")) as Manifest;
  const fromEnv = process.env.CORPUS_SEED_PATH;
  await installLibrary(
    {
      library: "corpus",
      tag: "[corpus fetch]",
      version: manifest.version,
      release: manifest,
      seedPath: fromEnv ? resolve(fromEnv) : resolve(SEED_DIR, manifest.file),
      reembed: "npm run corpus -- reembed --all",
      unavailable: corpusUnavailable,
    },
    force,
  );
}

export const fetchCommand: Command = {
  name: "fetch",
  summary: "Install the prebuilt corpus.db (local seed or sha-verified release download)",
  options: [{ flag: "--force", desc: "replace an existing corpus.db even if its sha differs" }],
  run: (argv) => fetchCorpus(argv.includes("--force")),
};
