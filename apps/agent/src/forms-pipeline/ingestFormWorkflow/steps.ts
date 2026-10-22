/*
 * Form-ingest workflow steps. Three sequential phases:
 *   extract  — pdf.js (via unpdf): widget discovery + label resolution.
 *              Two label tiers (/TU when present, vision LLM when not).
 *              Throws when any widget cannot be labeled.
 *   classify — Claude enrichment per field: fieldId, category, valueType,
 *              stable option values for radios. Labels arrive
 *              deterministic; the classifier does not infer them.
 *   persist  — Merge deterministic + enrichment into the catalog shape,
 *              round-trip-validate (every widget ends up in the catalog),
 *              write JSON, optionally upsert into corpus.db
 *              (forms / form_fields tables).
 *
 * Round-trip invariant: every ExtractedField is in the persisted catalog.
 * Fields the AI could not enrich get a placeholder fieldId
 * (form-<id>.unclassified.<shortName>). The deterministic structure
 * (pdfWidgetName, label, valueType from kind, options[] for radios) is
 * preserved.
 */

import { createStep } from "@mastra/core/workflows";
import { SOURCES_ROOT } from "@openreturn/sources";
import { promises as fs } from "node:fs";
import { relative } from "node:path";
import { ensureCorpusSchema, getCorpusDb } from "../../mastra/db/libsql.js";
import { classifyFields, type FieldEnrichment, type ValueType } from "../classifyFields.js";
import { extractFormFields, type ExtractedField, type FieldKind } from "../extractFormFields.js";
import {
  afterClassifySchema,
  afterExtractSchema,
  workflowInputSchema,
  workflowOutputSchema,
} from "./schemas.js";

// ─── extract ─────────────────────────────────────────────────────────────

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

// ─── classify ────────────────────────────────────────────────────────────

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

// ─── persist ─────────────────────────────────────────────────────────────

interface CatalogOption {
  value: string;
  pdfWidgetName?: string;
  radioOption?: string;
  label?: string;
}

interface CatalogRow {
  fieldId: string;
  label: string;
  /**
   * Provenance of the label: "tu" (annotation /TU), "vision" (Claude
   * vision), or absent on rows built before the current extractor.
   */
  labelSource?: string;
  category: string;
  /**
   * Coarse value-type used by the runtime engine + renderer. Today's
   * vocabulary: numeric / single_select / multi_select / text / boolean /
   * date. Mapped down from the classifier's richer valueType (see
   * valueTypeRich).
   */
  valueType: string;
  /**
   * Richer value-type from the classifier: money / count / text / ssn /
   * phone / zip / email / date / boolean / single_select / multi_select /
   * signature. Carries formatter hints (e.g. "money" → comma separators)
   * that the renderer does not consume yet; data-driven formatters will.
   * Persisted alongside `valueType` so no information is lost.
   */
  valueTypeRich?: string;
  /**
   * Deterministic structural type from pdf.js: text / checkbox / radio /
   * signature / other. Source of truth for "is this mutually exclusive?",
   * "is this multi-line?", etc. Never derived from AI.
   */
  pdfFieldKind: string;
  pdfWidgetName?: string;
  options?: CatalogOption[];
  position: { page: number; x: number; y: number };
  maxLength?: number;
  multiline?: boolean;
}

/** Map the classifier's expanded enum down to the runtime vocabulary. */
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
        // Relative to packages/sources, so the committed catalog holds no local path.
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

    let dbWritten = false;
    if (inputData.writeDb) {
      await upsertCatalogDb(inputData, catalog);
      dbWritten = true;
    }

    return {
      outputPath: inputData.outputPath,
      totalFields: inputData.fields.length,
      enrichedCount: inputData.enrichments.length,
      unenrichedCount: unenriched.length,
      skippedCount: inputData.skipped.length,
      catalogEntryCount: catalog.length,
      dbWritten,
      usage: inputData.usage,
      skipSample: inputData.skipped.slice(0, 8),
      unenrichedSample: unenriched.slice(0, 8),
    };
  },
});

// ─── Merge: deterministic field + AI enrichment → catalog row ────────────

/*
 * Merge deterministic extraction + AI enrichment into catalog rows and
 * enforce the round-trip invariant: every non-skipped field must appear
 * in the catalog.
 */
function assembleCatalog(inputData: {
  formId: string;
  fields: Array<Parameters<typeof buildCatalogRow>[1]>;
  enrichments: FieldEnrichment[];
  skipped: Array<{ pdfFieldName: string }>;
}): { catalog: CatalogRow[]; unenriched: string[] } {
  const enrichmentByName = new Map<string, FieldEnrichment>();
  for (const e of inputData.enrichments) enrichmentByName.set(e.pdfFieldName, e);
  const skippedByName = new Set<string>(inputData.skipped.map((s) => s.pdfFieldName));

  const catalog: CatalogRow[] = [];
  const unenriched: string[] = [];

  for (const field of inputData.fields) {
    if (skippedByName.has(field.fieldName)) continue;
    const enrichment = enrichmentByName.get(field.fieldName);
    catalog.push(buildCatalogRow(inputData.formId, field, enrichment));
    if (!enrichment) unenriched.push(field.fieldName);
  }

  const expectedNames = new Set(
    inputData.fields.filter((f) => !skippedByName.has(f.fieldName)).map((f) => f.fieldName),
  );
  const actualNames = new Set(catalog.map((r) => r.pdfWidgetName ?? "").filter(Boolean));
  const missing = [...expectedNames].filter((n) => !actualNames.has(n));
  if (missing.length > 0) {
    throw new Error(
      `Round-trip invariant violated: ${missing.length} field(s) missing from catalog: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
    );
  }

  return { catalog, unenriched };
}

/* Upsert the form + its catalog rows into corpus.db (forms / form_fields). */
async function upsertCatalogDb(
  meta: { formId: string; taxYear: number; jurisdiction: string; formTitle: string },
  catalog: CatalogRow[],
): Promise<void> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO forms (form_id, tax_year, jurisdiction, title, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (form_id, tax_year) DO UPDATE SET
            jurisdiction = excluded.jurisdiction,
            title = excluded.title,
            updated_at = excluded.updated_at`,
    args: [meta.formId, meta.taxYear, meta.jurisdiction, meta.formTitle, now],
  });
  await db.batch(
    catalog.map((f, i) => ({
      sql: `INSERT INTO form_fields
              (field_id, form_id, tax_year, ordinal, label, category,
               value_type, pdf_widget_name, position, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (field_id, tax_year) DO UPDATE SET
              form_id = excluded.form_id,
              ordinal = excluded.ordinal,
              label = excluded.label,
              category = excluded.category,
              value_type = excluded.value_type,
              pdf_widget_name = excluded.pdf_widget_name,
              position = excluded.position,
              updated_at = excluded.updated_at`,
      args: [
        f.fieldId,
        meta.formId,
        meta.taxYear,
        i,
        f.label,
        f.category,
        f.valueType,
        f.pdfWidgetName ?? null,
        f.position ? JSON.stringify(f.position) : null,
        now,
      ],
    })),
    "write",
  );
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
   * Inject the widget's page index between the formId and the rest of the
   * fieldId: "form-8949.header.taxpayer_name" →
   * "form-8949.0.header.taxpayer_name". The classifier is instructed to
   * reuse fieldIds across batches when fields are semantically equivalent.
   * Multi-page forms (8949 Part I/II, 540 pages 1+/2, …) then emit the
   * same name for distinct widgets. The page prefix restores per-widget
   * uniqueness without making the classifier handle physical layout.
   * Catalogs ingested before this change kept their flat shape; their
   * bindings reference fieldIds without the page slot.
   */
  const fieldId = withPagePrefix(baseFieldId, formId, position.page);
  /*
   * The label is deterministic (extractFormFields tier-1 /TU or tier-2
   * vision). The classifier does not produce it.
   */
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
    /*
     * Zip the deterministic option labels with the AI's stable values.
     * When enrichment is missing or misaligned, fall back to a slug of
     * the option label itself. The rendering binding can then still
     * target the right radio option.
     */
    const enrichmentByRadioOption = new Map<string, string>(
      (enrichment?.options ?? []).map((o) => [o.radioOption, o.value]),
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
