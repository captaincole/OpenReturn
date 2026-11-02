import { SOURCES_ROOT } from "@openreturn/sources";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { extractWidgets } from "../../src/extractFormFields.js";
import { formTargetFromArgv, REPO_ROOT, type FormTarget } from "../../src/formTarget.js";
import { renderOverlayTiles } from "../../src/renderPageWithOverlay.js";
import { tilesDir, widgetsPath, type WidgetsFile } from "../../src/workFiles.js";
import type { Command } from "../lib/cli";

/* A new form needs --title; a form with a catalog keeps its title. */
async function formTitle(target: FormTarget, argv: string[]): Promise<string> {
  const flag = argv.find((arg) => arg.startsWith("--title="));
  if (flag) return flag.slice("--title=".length);
  if (existsSync(target.catalogPath)) {
    const catalog = JSON.parse(await readFile(target.catalogPath, "utf8"));
    return catalog.form.title as string;
  }
  throw new Error(`${target.formId} has no catalog yet: pass --title="<official form title>"`);
}

async function run(argv: string[]): Promise<void> {
  const target = formTargetFromArgv(argv);
  if (!existsSync(target.pdfPath)) {
    throw new Error(`${target.pdfPath} not found: put the blank PDF in sources first`);
  }
  const title = await formTitle(target, argv);
  const extracted = await extractWidgets(target.pdfPath);

  await rm(tilesDir(target), { recursive: true, force: true });
  await mkdir(tilesDir(target), { recursive: true });
  const pages: WidgetsFile["pages"] = [];
  for (const { page, widgets } of extracted.pages) {
    if (widgets.length === 0) continue;
    const rendered = await renderOverlayTiles({
      pdf: extracted.pdf,
      pageIndex: page,
      widgets: widgets.map((widget) => ({ id: widget.badge, rect: widget.rect })),
    });
    const tiles = [];
    for (const [index, tile] of rendered.entries()) {
      const file = `pages/page-${page}-${index + 1}.png`;
      await writeFile(resolve(target.workDir, file), tile.png);
      tiles.push({ file, top: tile.top, bottom: tile.bottom });
    }
    pages.push({ page, tiles, badges: widgets });
  }

  const out: WidgetsFile = {
    form: {
      formId: target.formId,
      taxYear: target.taxYear,
      jurisdiction: target.jurisdiction,
      title,
    },
    sourcePdf: relative(SOURCES_ROOT, target.pdfPath),
    totalPages: extracted.totalPages,
    fields: extracted.fields,
    pages,
  };
  await writeFile(widgetsPath(target), JSON.stringify(out, null, 2), "utf8");

  const withTu = extracted.fields.filter((field) => field.tuLabel).length;
  const tileCount = pages.reduce((total, page) => total + page.tiles.length, 0);
  console.log(`extract-widgets: ${target.formId} (${target.taxYear})`);
  console.log(`  ${extracted.fields.length} fields, ${withTu} with a /TU label`);
  console.log(`  ${pages.length} page(s) with widgets, ${tileCount} overlay tile(s)`);
  console.log(`  wrote ${relative(REPO_ROOT, widgetsPath(target))}`);
}

export const extractWidgetsCommand: Command = {
  name: "extract-widgets",
  summary: "Blank PDF → widgets.json + numbered overlay tiles in .scratch/forms (no API calls)",
  usage: "<federal/<short> | state/<st>/<short>>",
  options: [
    { flag: "--title=<title>", desc: "official form title (required for a form with no catalog)" },
    { flag: "--tax-year=<year>", desc: "default 2025" },
  ],
  run,
};
