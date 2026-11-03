import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { OverlayBadge, WidgetField } from "./extractFormFields.js";
import type { FormTarget } from "./formTarget.js";
import { labelsFileSchema, type LabelsFile } from "./labelsFile.js";

/* What extract-widgets writes. write-catalog and the form skills read it. */
export interface WidgetsFile {
  form: { formId: string; taxYear: number; jurisdiction: string; title: string };
  /** Relative to sources/, so the file holds no local path. */
  sourcePdf: string;
  totalPages: number;
  fields: WidgetField[];
  pages: Array<{
    page: number;
    /** Relative to the work dir, top band first. */
    tiles: Array<{ file: string; top: number; bottom: number }>;
    badges: OverlayBadge[];
  }>;
}

export const widgetsPath = (target: FormTarget) => resolve(target.workDir, "widgets.json");
export const labelsPath = (target: FormTarget) => resolve(target.workDir, "labels.json");
export const tilesDir = (target: FormTarget) => resolve(target.workDir, "pages");

export async function readWidgetsFile(target: FormTarget): Promise<WidgetsFile> {
  const path = widgetsPath(target);
  const text = await readFile(path, "utf8").catch(() => {
    throw new Error(`${path} not found: run extract-widgets ${target.subpath} first`);
  });
  return JSON.parse(text) as WidgetsFile;
}

async function readOneLabelsFile(path: string): Promise<LabelsFile> {
  const parsed = labelsFileSchema.safeParse(JSON.parse(await readFile(path, "utf8")));
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`${path} does not match the labels schema:\n${issues.join("\n")}`);
  }
  return parsed.data;
}

/* labels.json plus each labels.page-<n>.json a form-labeler wrote, as one file. */
export async function readLabelsFile(target: FormTarget): Promise<LabelsFile> {
  const pageFiles = (await readdir(target.workDir).catch(() => []))
    .filter((name) => /^labels\.page-\d+\.json$/.test(name))
    .map((name) => resolve(target.workDir, name));
  const paths = [labelsPath(target), ...pageFiles].filter((path) => existsSync(path));
  if (paths.length === 0) {
    throw new Error(`no labels.json in ${target.workDir}: write the labels first`);
  }
  const files = await Promise.all(paths.map(readOneLabelsFile));
  return {
    fields: files.flatMap((file) => file.fields),
    skipped: files.flatMap((file) => file.skipped),
  };
}
