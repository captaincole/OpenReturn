import { listBlocksWithoutEmbeddings, setBlockEmbeddings } from "../../src/db/corpusStore";
import { embedDocuments, resolveEmbeddings } from "../../src/refdocs/embeddings";
import type { Command } from "../lib/cli";

async function run(argv: string[]): Promise<void> {
  const all = argv.includes("--all");

  const cfg = resolveEmbeddings();
  const allRows = await listBlocksWithoutEmbeddings({ all });

  if (allRows.length === 0) {
    console.log("[corpus reembed] no NULL-embedding blocks; nothing to do");
    return;
  }

  const byDoc = new Map<string, typeof allRows>();
  for (const r of allRows) {
    const arr = byDoc.get(r.docId) ?? [];
    arr.push(r);
    byDoc.set(r.docId, arr);
  }

  console.log(
    `[corpus reembed] ${allRows.length} block(s) across ${byDoc.size} doc(s) → ${cfg.id}${all ? " (--all: full rebuild)" : ""}`,
  );

  for (const [docId, rows] of byDoc) {
    console.log(`  ${docId}: ${rows.length} blocks`);
    const inputs = rows.map((r) => r.contextualizedText ?? r.text);
    const vectors = await embedDocuments(cfg, inputs, (done, total) =>
      console.log(`    embedding ${done}/${total}`),
    );
    await setBlockEmbeddings(
      rows.map((r, i) => ({ blockId: r.blockId, embedding: vectors[i] })),
      { embeddingModel: cfg.id },
    );
    console.log(`  ✓ ${docId} embedded`);
  }
}

export const reembedCommand: Command = {
  name: "reembed",
  summary:
    "Embed blocks via the active provider (recover a failed sync, or --all to switch models)",
  options: [
    {
      flag: "--all",
      desc: "re-embed every block, not just NULL ones (required after changing EMBEDDINGS_MODEL)",
    },
  ],
  run,
};
