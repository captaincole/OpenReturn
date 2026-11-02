/*
 * Round-trip invariant: every non-skipped field lands in the catalog.
 * A field with no enrichment gets a placeholder fieldId.
 */

import type { ExtractedField, FieldKind } from "./extractFormFields.js";
import type { ValueType } from "./labelsFile.js";

/* What a catalog row needs from labeling. classifyFields and labels.json both supply it. */
export interface CatalogEnrichment {
  pdfFieldName: string;
  fieldId: string;
  category: string;
  valueType: ValueType;
  /** Same length and order as the field's radioOptions. */
  options?: Array<{ radioOption: string; value: string; label?: string }>;
}

export interface CatalogOption {
  value: string;
  pdfWidgetName?: string;
  radioOption?: string;
  label?: string;
}

export interface CatalogRow {
  fieldId: string;
  label: string;
  labelSource?: string;
  category: string;
  /** The runtime vocabulary, narrowed from valueTypeRich. */
  valueType: string;
  /** Kept for formatter hints ("money", "ssn") that the renderer does not read yet. */
  valueTypeRich?: string;
  /** From pdf.js, never from AI. */
  pdfFieldKind: string;
  pdfWidgetName?: string;
  options?: CatalogOption[];
  position: { page: number; x: number; y: number };
  maxLength?: number;
  multiline?: boolean;
}

function narrowValueType(rich: string): string {
  switch (rich) {
    case "money":
    case "count":
      return "numeric";
    case "ssn":
    case "phone":
    case "zip":
    case "email":
    case "signature":
      return "text";
    case "text":
    case "date":
    case "boolean":
    case "single_select":
    case "multi_select":
      return rich;
    default:
      return rich;
  }
}

export function assembleCatalog(inputData: {
  formId: string;
  fields: ExtractedField[];
  enrichments: CatalogEnrichment[];
  skipped: Array<{ pdfFieldName: string }>;
  /** The AI classifier's fieldIds have no page; labels.json fieldIds are final. */
  prefixPage?: boolean;
}): { catalog: CatalogRow[]; unenriched: string[] } {
  const enrichmentByName = new Map<string, CatalogEnrichment>();
  for (const enrichment of inputData.enrichments)
    enrichmentByName.set(enrichment.pdfFieldName, enrichment);
  const skippedByName = new Set<string>(inputData.skipped.map((skipped) => skipped.pdfFieldName));

  const catalog: CatalogRow[] = [];
  const unenriched: string[] = [];

  for (const field of inputData.fields) {
    if (skippedByName.has(field.fieldName)) continue;
    const enrichment = enrichmentByName.get(field.fieldName);
    catalog.push(buildCatalogRow(inputData.formId, field, enrichment, inputData.prefixPage));
    if (!enrichment) unenriched.push(field.fieldName);
  }

  const expectedNames = new Set(
    inputData.fields
      .filter((field) => !skippedByName.has(field.fieldName))
      .map((field) => field.fieldName),
  );
  const actualNames = new Set(catalog.map((row) => row.pdfWidgetName ?? "").filter(Boolean));
  const missing = [...expectedNames].filter((name) => !actualNames.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Round-trip invariant violated: ${missing.length} field(s) missing from catalog: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
    );
  }

  return { catalog, unenriched };
}

function buildCatalogRow(
  formId: string,
  field: ExtractedField,
  enrichment: CatalogEnrichment | undefined,
  prefixPage = false,
): CatalogRow {
  const primary = field.widgets[0];
  const position = primary
    ? { page: primary.page, x: primary.position.x, y: primary.position.y }
    : { page: 0, x: 0, y: 0 };

  const fieldId = !enrichment
    ? `${formId}.${position.page}.unclassified.${slugifyShortName(field.shortName)}`
    : prefixPage
      ? withPagePrefix(enrichment.fieldId, formId, position.page)
      : enrichment.fieldId;
  const label = field.label;
  const labelSource = field.labelSource;
  const category = enrichment ? enrichment.category : "other";
  const valueTypeRich: string = enrichment
    ? enrichment.valueType
    : defaultValueTypeFor(field.fieldKind);
  const valueType = narrowValueType(valueTypeRich);

  const row: CatalogRow = {
    fieldId,
    label,
    labelSource,
    category,
    valueType,
    valueTypeRich,
    pdfFieldKind: field.fieldKind,
    pdfWidgetName: field.fieldName,
    position,
  };

  if (field.fieldKind === "text") {
    if (typeof field.maxLength === "number") row.maxLength = field.maxLength;
    if (field.multiline) row.multiline = true;
  }

  if (field.fieldKind === "radio" && field.radioOptions) {
    row.options = radioOptions(field.radioOptions, enrichment);
  }

  return row;
}

function radioOptions(
  pdfOptions: string[],
  enrichment: CatalogEnrichment | undefined,
): CatalogOption[] {
  /* When the AI's options are missing or misaligned, fall back to a slug of the label. */
  const enrichmentByRadioOption = new Map(
    (enrichment?.options ?? []).map((option) => [option.radioOption, option]),
  );
  /* The enrichment's order first, then any PDF option it left out. */
  const ordered = [
    ...(enrichment?.options ?? [])
      .map((option) => option.radioOption)
      .filter((radioOption) => pdfOptions.includes(radioOption)),
    ...pdfOptions.filter((radioOption) => !enrichmentByRadioOption.has(radioOption)),
  ];
  return ordered.map((radioOption) => ({
    value: enrichmentByRadioOption.get(radioOption)?.value ?? slugifyOption(radioOption),
    radioOption,
    label: enrichmentByRadioOption.get(radioOption)?.label ?? radioOption,
  }));
}

function defaultValueTypeFor(kind: FieldKind): ValueType {
  switch (kind) {
    case "text":
      return "text";
    case "checkbox":
      return "boolean";
    case "radio":
      return "single_select";
    case "signature":
      return "signature";
    case "other":
      return "text";
  }
}

/*
 * "form-8949.header.x" → "form-8949.0.header.x". The classifier reuses a
 * fieldId for equivalent widgets on different pages; the page keeps them unique.
 */
function withPagePrefix(baseFieldId: string, formId: string, page: number): string {
  const prefix = `${formId}.`;
  if (!baseFieldId.startsWith(prefix)) return baseFieldId;
  return `${formId}.${page}.${baseFieldId.slice(prefix.length)}`;
}

function slugifyShortName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function slugifyOption(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}
