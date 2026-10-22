/*
 * Add (or refresh) a corpus document whose source is a publisher web page.
 * Fetches the page, cleans it (refdocs/html/cleanFtb.ts), and writes the
 * cleaned HTML plus its sidecar into a packages/sources folder:
 *
 *   npm run corpus -- add-html <url> --dir 2025/forms/state/ca/540 --doc-id ca-540-inst-2025
 *
 * The HTML file is gitignored; the sidecar (with the cleaned file's
 * sha256 and "format": "html") is what gets committed. Run `corpus sync`
 * afterwards to ingest. On an existing sidecar, flags left out keep their
 * values, so a re-run after FTB edits the page only refreshes the sha256.
 */

import { SOURCES_ROOT } from "@summa/sources";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fetchCleanHtml, sha256 } from "../../src/refdocs/fetchSource";
import { CLEANER_VERSION } from "../../src/refdocs/html/cleanFtb";
import type { Command } from "../lib/cli";

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function run(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      dir: { type: "string" },
      "doc-id": { type: "string" },
      title: { type: "string" },
      publisher: { type: "string" },
      "tax-year": { type: "string" },
      kind: { type: "string", default: "instructions" },
    },
    strict: true,
    allowPositionals: true,
  });
  const url = positionals[0];
  const kind = values.kind;
  if (!url || !values.dir || (kind !== "instructions" && kind !== "publication")) {
    console.error("usage: add-html <url> --dir <folder under packages/sources> [--doc-id <id>]");
    process.exit(1);
  }
  const dir = resolve(SOURCES_ROOT, values.dir);
  const sidecarPath = join(dir, `${kind}.meta.json`);
  const existing = (await readJson(sidecarPath)) ?? {};
  const docId = values["doc-id"] ?? existing.docId;
  if (typeof docId !== "string") {
    console.error(`${relative(SOURCES_ROOT, sidecarPath)} does not exist yet: pass --doc-id`);
    process.exit(1);
  }

  const { html, title } = await fetchCleanHtml(url);
  const bytes = new TextEncoder().encode(html);
  const yearInUrl = /\/(20\d\d)\//.exec(url)?.[1];
  const sidecar = {
    docId,
    title: values.title ?? existing.title ?? title,
    publisher: values.publisher ?? existing.publisher ?? "FTB",
    taxYear: Number(values["tax-year"] ?? existing.taxYear ?? yearInUrl) || null,
    sourceUrl: url,
    sha256: sha256(bytes),
    format: "html",
    cleanerVersion: CLEANER_VERSION,
  };
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${kind}.html`), bytes);
  await writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);
  console.log(
    `[corpus add-html] ${docId}: ${html.length} chars, sha256 ${sidecar.sha256.slice(0, 12)}… → ${relative(SOURCES_ROOT, sidecarPath)}`,
  );
}

export const addHtmlCommand: Command = {
  name: "add-html",
  summary: "Fetch and clean a publisher web page into a sources folder (HTML file + sidecar)",
  options: [
    {
      flag: "<url>",
      desc: "the page, e.g. https://www.ftb.ca.gov/forms/2025/2025-540-instructions.html",
    },
    {
      flag: "--dir <path>",
      desc: "folder under packages/sources, e.g. 2025/forms/state/ca/540 (required)",
    },
    { flag: "--doc-id <id>", desc: "stable doc id (required for a new sidecar)" },
    { flag: "--title <title>", desc: "document title (default: the page's h1)" },
    { flag: "--publisher <name>", desc: "publisher (default: FTB)" },
    { flag: "--tax-year <year>", desc: "tax year (default: the year in the URL)" },
    { flag: "--kind instructions|publication", desc: "file name stem (default: instructions)" },
  ],
  run,
};
