import { assembleCatalog, type CatalogRow } from "./catalogRows.js";
import type { ExtractedField } from "./extractFormFields.js";
import type { LabelsFile } from "./labelsFile.js";
import type { WidgetsFile } from "./workFiles.js";

/*
 * Every problem at once, so one fix pass covers them all: a missing or
 * unknown widget, a field with no label, a radio option the PDF lacks, a
 * fieldId outside the form, or two fields with one fieldId.
 */
export function labelProblems(widgets: WidgetsFile, labels: LabelsFile): string[] {
  return [...coverageProblems(widgets, labels), ...fieldProblems(widgets, labels)];
}

function counts(values: string[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
  return tally;
}

/* Every widget listed exactly once, in fields or skipped. */
function coverageProblems(widgets: WidgetsFile, labels: LabelsFile): string[] {
  const problems: string[] = [];
  const known = new Set(widgets.fields.map((field) => field.fieldName));
  const seen = counts([
    ...labels.fields.map((label) => label.pdfFieldName),
    ...labels.skipped.map((skip) => skip.pdfFieldName),
  ]);
  for (const [name, count] of seen) {
    if (!known.has(name)) problems.push(`unknown widget: ${name}`);
    if (count > 1) problems.push(`listed ${count} times: ${name}`);
  }
  for (const name of known) {
    if (!seen.has(name)) problems.push(`not labeled or skipped: ${name}`);
  }
  return problems;
}

function fieldProblems(widgets: WidgetsFile, labels: LabelsFile): string[] {
  const problems: string[] = [];
  const known = new Map(widgets.fields.map((field) => [field.fieldName, field]));
  for (const [fieldId, count] of counts(labels.fields.map((label) => label.fieldId))) {
    if (count > 1) problems.push(`fieldId used by ${count} fields: ${fieldId}`);
  }
  const prefix = `${widgets.form.formId}.`;
  for (const label of labels.fields) {
    const field = known.get(label.pdfFieldName);
    if (!field) continue;
    if (!field.tuLabel && !label.label?.trim()) problems.push(`no label: ${label.pdfFieldName}`);
    if (!label.fieldId.startsWith(prefix)) {
      problems.push(`fieldId outside ${widgets.form.formId}: ${label.fieldId}`);
    }
    for (const option of label.options ?? []) {
      if (!field.radioOptions?.includes(option.radioOption)) {
        problems.push(`no radio option "${option.radioOption}" on ${label.pdfFieldName}`);
      }
    }
  }
  return problems;
}

/* The /TU label wins: it is the form author's text. */
function labeledFields(widgets: WidgetsFile, labels: LabelsFile): ExtractedField[] {
  const byName = new Map(labels.fields.map((label) => [label.pdfFieldName, label]));
  return widgets.fields.map(({ tuLabel, ...field }) => ({
    ...field,
    label: tuLabel ?? byName.get(field.fieldName)?.label?.trim() ?? "",
    labelSource: tuLabel ? ("tu" as const) : ("vision" as const),
  }));
}

export function catalogFromLabels(widgets: WidgetsFile, labels: LabelsFile): CatalogRow[] {
  const problems = labelProblems(widgets, labels);
  if (problems.length > 0) {
    throw new Error(`labels.json has ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  }
  return assembleCatalog({
    formId: widgets.form.formId,
    fields: labeledFields(widgets, labels),
    enrichments: labels.fields,
    skipped: labels.skipped,
  }).catalog;
}
