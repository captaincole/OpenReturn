/*
 * Read-only diff between the sidecars under sources/
 * (instructions.meta.json under forms/, publication.meta.json under
 * publications/) and the ref_documents rows in the local corpus DB. It
 * compares each sidecar's sha256 with the DB row, so no source file is
 * needed.
 * Exits 0 unless --strict is set and drift exists.
 */

import { docIdsWithSource } from "../../src/db/corpusFiles";
import { getDocument, listDocuments } from "../../src/db/corpusStore";
import { walkCorpus, type CorpusEntry } from "../../src/refdocs/walkCorpus";
import type { Command } from "../lib/cli";

interface Categorized {
  present: CorpusEntry[];
  drift: { entry: CorpusEntry; dbSha: string }[];
  missing: CorpusEntry[];
  extra: { docId: string; sha: string }[];
  /** In the DB and current, but its source file is not stored (run sync). */
  noSource: CorpusEntry[];
}

async function categorize(): Promise<{
  walk: Awaited<ReturnType<typeof walkCorpus>>;
  cats: Categorized;
}> {
  const walk = await walkCorpus();
  const cats: Categorized = {
    present: [],
    drift: [],
    missing: [],
    extra: [],
    noSource: [],
  };
  const stored = await docIdsWithSource();

  const seenInRepo = new Set<string>();
  for (const entry of walk.entries) {
    seenInRepo.add(entry.sidecar.docId);
    const row = await getDocument(entry.sidecar.docId);
    if (!row) {
      cats.missing.push(entry);
    } else if (row.sha256 !== entry.sidecar.sha256) {
      cats.drift.push({ entry, dbSha: row.sha256 });
    } else {
      cats.present.push(entry);
      if (!stored.has(entry.sidecar.docId)) cats.noSource.push(entry);
    }
  }

  // Find DB-only docs: rows with no matching sidecar in the repo.
  for (const row of await listDocuments()) {
    if (!seenInRepo.has(row.docId)) {
      cats.extra.push({ docId: row.docId, sha: row.sha256 });
    }
  }

  return { walk, cats };
}

/* The count table at the top of the report. */
function summaryLines(walk: Awaited<ReturnType<typeof walkCorpus>>, cats: Categorized): string[] {
  const total =
    cats.present.length +
    cats.drift.length +
    cats.missing.length +
    cats.extra.length +
    walk.unconfigured.length;
  const row = (label: string, n: number, note: string) =>
    `  ${label.padEnd(12)}${n.toString().padStart(3)} (${note})`;
  return [
    `[corpus status] ${total} doc(s):`,
    row("present", cats.present.length, "sha matches DB"),
    row("drift", cats.drift.length, "sidecar sha256 differs from DB"),
    row("missing", cats.missing.length, "in repo, not in DB"),
    row("extra", cats.extra.length, "in DB, no sidecar in repo"),
    row("unconfigured", walk.unconfigured.length, "bad sidecar, or source file without one"),
    row("no source", cats.noSource.length, "current, source file not stored; run sync"),
  ];
}

function format(walk: Awaited<ReturnType<typeof walkCorpus>>, cats: Categorized): string {
  const lines = summaryLines(walk, cats);

  if (cats.drift.length > 0) {
    lines.push("");
    lines.push("drift:");
    for (const d of cats.drift) {
      lines.push(
        `  ${d.entry.sidecar.docId}  db=${d.dbSha.slice(0, 12)}…  sidecar=${d.entry.sidecar.sha256.slice(0, 12)}…`,
      );
    }
  }
  if (cats.missing.length > 0) {
    lines.push("");
    lines.push("missing:");
    for (const m of cats.missing) {
      lines.push(`  ${m.sidecar.docId}  ${m.sourceRelPath}`);
    }
  }
  if (cats.extra.length > 0) {
    lines.push("");
    lines.push("extra (DB-only):");
    for (const e of cats.extra) {
      lines.push(`  ${e.docId}  sha=${e.sha.slice(0, 12)}…`);
    }
  }
  if (walk.unconfigured.length > 0) {
    lines.push("");
    lines.push("unconfigured:");
    for (const u of walk.unconfigured) {
      lines.push(`  ${u.sourceRelPath} — ${u.reason}`);
    }
  }
  return lines.join("\n");
}

async function run(argv: string[]): Promise<void> {
  const strict = argv.includes("--strict");
  const { walk, cats } = await categorize();
  console.log(format(walk, cats));

  if (strict) {
    const dirty =
      cats.drift.length + cats.missing.length + cats.extra.length + walk.unconfigured.length;
    if (dirty > 0) {
      console.error(`\n[corpus status] --strict: ${dirty} drift item(s)`);
      process.exit(1);
    }
  }
}

export const statusCommand: Command = {
  name: "status",
  summary:
    "Diff the repo's sidecars vs corpus.db (present/drift/missing/extra/unconfigured/no source)",
  options: [
    {
      flag: "--strict",
      desc: "exit non-zero on drift, missing, extra or unconfigured (a missing stored source file does not count)",
    },
  ],
  run,
};
