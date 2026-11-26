import { existsSync } from "node:fs";
import { listBlocksWithoutEmbeddings } from "../../src/db/corpusStore";
import { embedLawBlocks, ingestLaw } from "../../src/law/ingestLaw";
import { requireLaw } from "../../src/law/lawRead";
import { walkLaw } from "../../src/law/lawSidecar";
import type { Command } from "../lib/cli";
import { fetchLibrary, manifestPath, type FetchSpec } from "./fetch";

/* The law commands that write law.db: sync, fetch, reembed. */

async function sync(argv: string[]): Promise<void> {
  const force = argv.includes("--force");
  const entries = await walkLaw();
  console.log(`[law sync] processing ${entries.length} doc(s)`);
  let failed = 0;
  for (const entry of entries) {
    const started = Date.now();
    try {
      const result = await ingestLaw(entry, { force });
      const seconds = Math.round((Date.now() - started) / 1000);
      const counts = result.skipped
        ? "skipped"
        : `${result.blocks} blocks, ${result.embedded} embedded, ${seconds}s`;
      console.log(`  ✓ ${result.docId} (${counts})`);
      if (!result.skipped && result.embedded < result.blocks) failed += 1;
    } catch (err) {
      failed += 1;
      console.error(
        `  ✗ ${entry.sidecar.docId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (failed > 0) process.exit(1);
}

const LAW_FETCH: FetchSpec = {
  library: "law",
  tag: "[law fetch]",
  seedEnv: "LAW_SEED_PATH",
  reembed: "npm run corpus -- law reembed --all",
  unavailable: (target) =>
    `[law fetch] ${target} is missing and the law release has no url yet: build it with \`npm run corpus -- law sync\`.`,
};

async function fetch(argv: string[]): Promise<void> {
  if (!existsSync(manifestPath("law"))) {
    console.error(
      "The prebuilt law.db is not published yet: build it with `npm run corpus -- law sync`.",
    );
    process.exit(1);
  }
  await fetchLibrary(LAW_FETCH, argv.includes("--force"));
}

// Chunked like the sync, so a stop keeps the vectors made so far.
async function reembed(argv: string[]): Promise<void> {
  await requireLaw();
  const rows = await listBlocksWithoutEmbeddings({ all: argv.includes("--all"), library: "law" });
  if (rows.length === 0) {
    console.log("[law reembed] no NULL-embedding blocks; nothing to do");
    return;
  }
  console.log(`[law reembed] ${rows.length} block(s)`);
  if ((await embedLawBlocks(rows)) < rows.length) process.exit(1);
}

export const lawSyncCommand: Command = {
  name: "sync",
  summary: "Build law.db from the pinned release zip (sha-checked; skipped when unchanged)",
  options: [{ flag: "--force", desc: "rebuild even if the sha matches (after a parser change)" }],
  run: sync,
};

export const lawFetchCommand: Command = {
  name: "fetch",
  summary: "Install the prebuilt law.db from seed/law.manifest.json",
  options: [{ flag: "--force", desc: "replace an existing law.db even if its sha differs" }],
  run: fetch,
};

export const lawReembedCommand: Command = {
  name: "reembed",
  summary: "Embed the law blocks that have no vector (or --all after a model change)",
  options: [{ flag: "--all", desc: "re-embed every block" }],
  run: reembed,
};
