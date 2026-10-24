/*
 * Catalog index. Scans the forms/ tree for catalog.json files and indexes
 * every form by its `form.formId`. The binding classifier's
 * `lookup_form_fields` tool uses it to fetch fieldIds + labels from other
 * forms on demand when it binds cross-form references.
 *
 * The scan runs once per `generate-bindings` invocation; the result stays
 * in memory. Rows are slim: only `fieldId`, `label`, `valueType` reach the
 * tool's return value. The full catalog also has positions, options, and
 * widget names. None of that helps the classifier decide which fieldId on
 * form-X a line of form-Y should reference.
 */

import { engineSrcDir } from "@openreturn/engine/paths";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface IndexedField {
  fieldId: string;
  label: string;
  valueType: string;
}

export interface IndexedForm {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  title: string;
  catalogPath: string;
  fields: IndexedField[];
}

export type CatalogIndex = Map<string, IndexedForm>;

/**
 * Walk the engine source tree for `catalog.json` files and build a Map keyed on formId.
 * Excludes the form currently being bound, so the AI cannot cite the form
 * as its own cross-form reference.
 */
export async function loadCatalogIndex(excludeFormId?: string): Promise<CatalogIndex> {
  const root = engineSrcDir;
  const files = await walkCatalogFiles(root);
  const index: CatalogIndex = new Map();
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as {
        form: { formId: string; taxYear: number; jurisdiction: string; title: string };
        fields: Array<{ fieldId: string; label: string; valueType: string }>;
      };
      if (excludeFormId && parsed.form.formId === excludeFormId) continue;
      index.set(parsed.form.formId, {
        formId: parsed.form.formId,
        taxYear: parsed.form.taxYear,
        jurisdiction: parsed.form.jurisdiction,
        title: parsed.form.title,
        catalogPath: file,
        fields: parsed.fields.map((f) => ({
          fieldId: f.fieldId,
          label: f.label,
          valueType: f.valueType,
        })),
      });
    } catch (err) {
      console.warn(
        `[catalog-index] skipping ${file}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return index;
}

async function walkCatalogFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkCatalogFiles(full)));
    } else if (entry.isFile() && entry.name === "catalog.json") {
      out.push(full);
    }
  }
  return out;
}

/**
 * Format an IndexedForm as a compact table the classifier can read. It
 * mirrors the row shape `buildInventoryBlock` produces for the form being
 * bound, so the model treats both as the same kind of context.
 */
export function formatIndexedForm(form: IndexedForm): string {
  const header = `Form: ${form.title} (${form.formId}, ${form.jurisdiction}, tax year ${form.taxYear}) — ${form.fields.length} fields`;
  const rows = form.fields.map((f) => `  ${f.fieldId} — "${f.label}" (valueType=${f.valueType})`);
  return [header, ...rows].join("\n");
}
