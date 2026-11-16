import { catalogRow, type CatalogRow } from "./catalogRows.js";
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

export function catalogFromLabels(widgets: WidgetsFile, labels: LabelsFile): CatalogRow[] {
  const problems = labelProblems(widgets, labels);
  if (problems.length > 0) {
    throw new Error(`labels.json has ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  }
  /* A widget with no label is in skipped: labelProblems checked that each is in one of the two. */
  const labelByFieldName = new Map(labels.fields.map((label) => [label.pdfFieldName, label]));
  return widgets.fields.flatMap((field) => {
    const label = labelByFieldName.get(field.fieldName);
    return label ? [catalogRow(field, label)] : [];
  });
}
