/*
 * On an existing sidecar, flags left out keep their values, so a re-run
 * after FTB edits the page refreshes only the sha256 and the date.
 */

import { SOURCES_ROOT } from "@openreturn/sources";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fetchCleanHtml, sha256 } from "../../src/refdocs/fetchSource";
import { CLEANER_VERSION } from "../../src/refdocs/html/cleanFtb";
import { isPublishedDate } from "../../src/refdocs/published";
import type { Command } from "../lib/cli";

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* A fetch date is not a publication date, so an unknown date is left out. */
const withPublished = (published: unknown) => (isPublishedDate(published) ? { published } : {});

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
      published: { type: "string" },
    },
    strict: true,
    allowPositionals: true,
  });
  const url = positionals[0];
  const kind = values.kind;
  if (!url || !values.dir || (kind !== "instructions" && kind !== "publication")) {
    console.error("usage: add-html <url> --dir <folder under sources> [--doc-id <id>]");
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

  const { html, title, published } = await fetchCleanHtml(url);
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
    ...withPublished(values.published ?? published ?? existing.published),
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
      desc: "folder under sources, e.g. 2025/forms/state/ca/540 (required)",
    },
    { flag: "--doc-id <id>", desc: "stable doc id (required for a new sidecar)" },
    { flag: "--title <title>", desc: "document title (default: the page's h1)" },
    { flag: "--publisher <name>", desc: "publisher (default: FTB)" },
    { flag: "--tax-year <year>", desc: "tax year (default: the year in the URL)" },
    { flag: "--kind instructions|publication", desc: "file name stem (default: instructions)" },
    {
      flag: "--published <YYYY-MM[-DD]>",
      desc: "publication date (default: the page's Revised date, if it shows one)",
    },
  ],
  run,
};
