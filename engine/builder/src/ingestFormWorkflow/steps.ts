/*
 * Round-trip invariant: every non-skipped field lands in the catalog.
 * A field the AI did not enrich gets a placeholder fieldId.
 */

import { createStep } from "@mastra/core/workflows";
import { SOURCES_ROOT } from "@openreturn/sources";
import { promises as fs } from "node:fs";
import { relative } from "node:path";
import { classifyFields, type FieldEnrichment, type ValueType } from "../classifyFields.js";
import { extractFormFields, type ExtractedField, type FieldKind } from "../extractFormFields.js";
import {
  afterClassifySchema,
  afterExtractSchema,
  workflowInputSchema,
  workflowOutputSchema,
} from "./schemas.js";

export const extractStep = createStep({
  id: "extract",
  inputSchema: workflowInputSchema,
  outputSchema: afterExtractSchema,
  execute: async ({ inputData }) => {
    const form = await extractFormFields(inputData.pdfPath);
    return {
      ...inputData,
      fields: form.fields,
      totalPages: form.totalPages,
    };
  },
});

export const classifyStep = createStep({
  id: "classify",
  inputSchema: afterExtractSchema,
  outputSchema: afterClassifySchema,
  execute: async ({ inputData }) => {
    const result = await classifyFields({
      formId: inputData.formId,
      taxYear: inputData.taxYear,
      jurisdiction: inputData.jurisdiction,
      formTitle: inputData.formTitle,
      fields: inputData.fields,
    });
    return {
      ...inputData,
      enrichments: result.enrichments,
      skipped: result.skipped,
      usage: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        cache_creation_input_tokens: result.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: result.usage.cache_read_input_tokens ?? 0,
      },
    };
  },
});

interface CatalogOption {
  value: string;
  pdfWidgetName?: string;
  radioOption?: string;
  label?: string;
}

interface CatalogRow {
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

export const persistStep = createStep({
  id: "persist",
  inputSchema: afterClassifySchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const { catalog, unenriched } = assembleCatalog(inputData);

    const payload = {
      form: {
        formId: inputData.formId,
        taxYear: inputData.taxYear,
        jurisdiction: inputData.jurisdiction,
        title: inputData.formTitle,
      },
      fields: catalog,
      _meta: {
        // Relative to sources, so the committed catalog holds no local path.
        sourcePdf: relative(SOURCES_ROOT, inputData.pdfPath),
        ingestedAt: new Date().toISOString(),
        totalFields: inputData.fields.length,
        enriched: inputData.enrichments.length,
        unenriched: unenriched.length,
        skipped: inputData.skipped.length,
        catalogEntries: catalog.length,
        tokensIn: inputData.usage.input_tokens,
        tokensOut: inputData.usage.output_tokens,
        cacheRead: inputData.usage.cache_read_input_tokens,
        cacheCreate: inputData.usage.cache_creation_input_tokens,
      },
    };
    await fs.writeFile(inputData.outputPath, JSON.stringify(payload, null, 2), "utf8");

    return {
      outputPath: inputData.outputPath,
      totalFields: inputData.fields.length,
      enrichedCount: inputData.enrichments.length,
      unenrichedCount: unenriched.length,
      skippedCount: inputData.skipped.length,
      catalogEntryCount: catalog.length,
      usage: inputData.usage,
      skipSample: inputData.skipped.slice(0, 8),
      unenrichedSample: unenriched.slice(0, 8),
    };
  },
});

function assembleCatalog(inputData: {
  formId: string;
  fields: Array<Parameters<typeof buildCatalogRow>[1]>;
  enrichments: FieldEnrichment[];
  skipped: Array<{ pdfFieldName: string }>;
}): { catalog: CatalogRow[]; unenriched: string[] } {
  const enrichmentByName = new Map<string, FieldEnrichment>();
  for (const enrichment of inputData.enrichments)
    enrichmentByName.set(enrichment.pdfFieldName, enrichment);
  const skippedByName = new Set<string>(inputData.skipped.map((skipped) => skipped.pdfFieldName));

  const catalog: CatalogRow[] = [];
  const unenriched: string[] = [];

  for (const field of inputData.fields) {
    if (skippedByName.has(field.fieldName)) continue;
    const enrichment = enrichmentByName.get(field.fieldName);
    catalog.push(buildCatalogRow(inputData.formId, field, enrichment));
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
  enrichment: FieldEnrichment | undefined,
): CatalogRow {
  const primary = field.widgets[0];
  const position = primary
    ? { page: primary.page, x: primary.position.x, y: primary.position.y }
    : { page: 0, x: 0, y: 0 };

  const baseFieldId = enrichment
    ? enrichment.fieldId
    : `${formId}.unclassified.${slugifyShortName(field.shortName)}`;
  /*
   * "form-8949.header.x" → "form-8949.0.header.x". The classifier reuses a
   * fieldId for equivalent widgets on different pages; the page keeps them unique.
   */
  const fieldId = withPagePrefix(baseFieldId, formId, position.page);
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
    /* When the AI's options are missing or misaligned, fall back to a slug of the label. */
    const enrichmentByRadioOption = new Map<string, string>(
      (enrichment?.options ?? []).map((option) => [option.radioOption, option.value]),
    );
    row.options = field.radioOptions.map((radioOption) => ({
      value: enrichmentByRadioOption.get(radioOption) ?? slugifyOption(radioOption),
      radioOption,
      label: radioOption,
    }));
  }

  return row;
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
