import type { CatalogRow } from "./catalogRows.js";
import type { FieldLabel, LabelsFile, ValueType } from "./labelsFile.js";
import type { WidgetsFile } from "./workFiles.js";

/*
 * labels.json from a committed catalog, so a re-ingest keeps every fieldId
 * that bindings.ts refers to. Only the widgets the catalog lacks need a labeler.
 */
export interface SeededLabels {
  labels: LabelsFile;
  /** Widget fields with no catalog row (new, or skipped last time), by page. */
  unlabeled: Array<{ page: number; fieldNames: string[] }>;
  /** Catalog rows whose widget is gone from the PDF. */
  stale: string[];
}

function seedLabel(row: CatalogRow, hasTuLabel: boolean): FieldLabel {
  return {
    pdfFieldName: row.pdfWidgetName ?? "",
    fieldId: row.fieldId,
    ...(hasTuLabel ? {} : { label: row.label }),
    category: row.category as FieldLabel["category"],
    valueType: (row.valueTypeRich ?? row.valueType) as ValueType,
    ...(row.options
      ? {
          options: row.options.map((option) => ({
            radioOption: option.radioOption ?? option.value,
            value: option.value,
            ...(option.label ? { label: option.label } : {}),
          })),
        }
      : {}),
  };
}

export function seedLabels(widgets: WidgetsFile, catalog: CatalogRow[]): SeededLabels {
  const rowByName = new Map(catalog.map((row) => [row.pdfWidgetName, row]));
  const fields: FieldLabel[] = [];
  const unlabeledByPage = new Map<number, string[]>();
  for (const field of widgets.fields) {
    const row = rowByName.get(field.fieldName);
    if (row) {
      fields.push(seedLabel(row, field.tuLabel !== null));
      continue;
    }
    const page = field.widgets[0]?.page ?? 0;
    unlabeledByPage.set(page, [...(unlabeledByPage.get(page) ?? []), field.fieldName]);
  }
  const known = new Set(widgets.fields.map((field) => field.fieldName));
  return {
    labels: { fields, skipped: [] },
    unlabeled: [...unlabeledByPage].map(([page, fieldNames]) => ({ page, fieldNames })),
    stale: catalog.filter((row) => !known.has(row.pdfWidgetName ?? "")).map((row) => row.fieldId),
  };
}
