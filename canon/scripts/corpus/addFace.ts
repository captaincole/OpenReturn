/*
 * Writes blank.meta.json for a form whose instructions are their own
 * document, so the form face (what blank.pdf prints) enters the corpus.
 * The docId and title come from instructions.meta.json when it has the
 * usual shape; otherwise pass --doc-id and --title. blank.pdf is committed,
 * so the sidecar needs no sourceUrl.
 */

import { SOURCES_ROOT } from "@openreturn/sources";
import { readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256 } from "../../src/refdocs/fetchSource";
import type { Command } from "../lib/cli";

// "irs-8824-inst-2025" → "irs-8824-face-2025"; "ca-3805z-booklet-2025" → "ca-3805z-face-2025".
const INSTRUCTIONS_DOC_ID_RE = /-(?:inst|booklet)-(\d{4})$/;
// "2025 Instructions for Form 8824 — Like-Kind Exchanges", "Instructions for Form 6198 (Rev. November 2025) — At-Risk Limitations".
const INSTRUCTIONS_TITLE_RE =
  /^(?:\d{4} )?Instructions for (.+?)(?: \((?:Rev\.[^)]*|\d{4})\))? — (.+)$/;

interface Instructions {
  docId?: unknown;
  title?: unknown;
  publisher?: unknown;
  taxYear?: unknown;
  sha256?: unknown;
}

async function readInstructions(dir: string): Promise<Instructions> {
  try {
    return JSON.parse(await readFile(join(dir, "instructions.meta.json"), "utf8")) as Instructions;
  } catch {
    return {};
  }
}

function faceDocId(instructions: Instructions): string | undefined {
  const docId = typeof instructions.docId === "string" ? instructions.docId : "";
  return INSTRUCTIONS_DOC_ID_RE.test(docId)
    ? docId.replace(INSTRUCTIONS_DOC_ID_RE, "-face-$1")
    : undefined;
}

function faceTitle(instructions: Instructions, taxYear: number): string | undefined {
  const match =
    typeof instructions.title === "string" ? instructions.title.match(INSTRUCTIONS_TITLE_RE) : null;
  return match ? `${taxYear} ${match[1]} (form face) — ${match[2]}` : undefined;
}

function fail(message: string): never {
  console.error(`[corpus add-face] ${message}`);
  process.exit(1);
}

async function run(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: "string" },
      "doc-id": { type: "string" },
      title: { type: "string" },
      publisher: { type: "string" },
      "tax-year": { type: "string" },
    },
    strict: true,
  });
  if (!values.dir) fail("usage: add-face --dir <form folder under sources>");
  const dir = resolve(SOURCES_ROOT, values.dir);
  const bytes = new Uint8Array(await readFile(join(dir, "blank.pdf")));
  const instructions = await readInstructions(dir);
  if (instructions.sha256 === sha256(bytes)) {
    fail(
      `${values.dir}: instructions.meta.json is this same PDF; its face is already in ${String(instructions.docId)}`,
    );
  }
  const taxYear = Number(values["tax-year"] ?? instructions.taxYear ?? values.dir.slice(0, 4));
  const docId = values["doc-id"] ?? faceDocId(instructions);
  const title = values.title ?? faceTitle(instructions, taxYear);
  if (!docId || !title)
    fail(`${values.dir}: pass --doc-id and --title (no usual instructions sidecar)`);
  const publisher =
    values.publisher ??
    (typeof instructions.publisher === "string" ? instructions.publisher : "IRS");
  const sidecar = { docId, title, publisher, taxYear, sha256: sha256(bytes) };
  const sidecarPath = join(dir, "blank.meta.json");
  await writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);
  console.log(`[corpus add-face] ${docId}: ${title} → ${relative(SOURCES_ROOT, sidecarPath)}`);
}

export const addFaceCommand: Command = {
  name: "add-face",
  summary: "Write blank.meta.json so a form's face (its blank.pdf) enters the corpus",
  options: [
    {
      flag: "--dir <path>",
      desc: "form folder under sources, e.g. 2025/forms/federal/8824 (required)",
    },
    { flag: "--doc-id <id>", desc: "default: the instructions docId with -face- for -inst-" },
    { flag: "--title <title>", desc: "default: from the instructions title, with (form face)" },
    { flag: "--publisher <name>", desc: "default: the instructions publisher, else IRS" },
    { flag: "--tax-year <year>", desc: "default: the instructions tax year" },
  ],
  run,
};
