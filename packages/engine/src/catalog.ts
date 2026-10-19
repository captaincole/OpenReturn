/*
 * Form Catalog — the read model the engine evaluates against.
 *
 * The Catalog holds the inventory layer: label, category, valueType, PDF
 * widget, position. The per-form bindings files
 * (src/<jurisdiction>/<short>/bindings.ts) declare only the
 * behavior layer: typed (f, info) => value functions registered via
 * defineForm.
 *
 * Catalog data comes from `catalog.json` files. The offline source of
 * truth is `forms/<jurisdiction>/<short>/catalog.json`; the runtime uses
 * the promoted copies under `src/mastra/public/forms/`, imported
 * statically by the jurisdiction registries. The forms-ingest pipeline
 * also stages catalog rows in corpus.db (`forms` / `form_fields`), but
 * the engine does not read them (see the note on the removed loadFromDb
 * below).
 */

import { promises as fs } from "node:fs";
import { z } from "zod";
import type { Category, FieldValueType } from "./types.js";

// ─── Shapes ──────────────────────────────────────────────────────────────

export interface FormDefinition {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  title: string;
}

export interface FieldOption {
  /** Stable selection value, e.g. "single" / "mfj" / "yes" / "checking". */
  value: string;
  /**
   * PDF AcroForm widget that the renderer checks when this option is
   * selected. Set when each option is its own checkbox widget (for
   * example Form 1040's filing-status checkboxes). Unset for true
   * PDFRadioGroup fields, where the group is a single AcroForm field: the
   * parent FieldInventory.pdfWidgetName names the group and the renderer
   * calls `.select(radioOption)` instead.
   */
  pdfWidgetName?: string;
  /**
   * For PDFRadioGroup-backed options: the exact option label from
   * `PDFRadioGroup.getOptions()`. The renderer passes it verbatim to
   * `.select(...)`. Mutually exclusive with `pdfWidgetName`.
   */
  radioOption?: string;
  /** Optional human label for UI display. Not required for PDF fill. */
  label?: string;
}

export type PdfFieldKind = "text" | "checkbox" | "radio" | "signature" | "other";

export interface FieldInventory {
  fieldId: string;
  formId: string;
  label: string;
  category: Category;
  valueType: FieldValueType;
  /**
   * Richer value-type from the classifier. It distinguishes within the
   * coarse buckets: "money" and "count" both narrow to numeric; "ssn",
   * "phone", "zip", "email", and "signature" all narrow to text.
   * Consumers that format values per shape (renderer SSN digit stripping,
   * test-harness synthetic values) branch on this field instead of a
   * label regex. Optional for backward compatibility; every
   * post-pipeline-rewrite catalog carries it.
   */
  valueTypeRich?: string;
  /**
   * Deterministic structural type from pdf-lib. Optional for backward
   * compatibility with catalogs ingested before this field existed. New
   * catalogs always carry it. Consumers that need the structural truth
   * (for example "is this a real radio group?") read this field rather
   * than valueType.
   */
  pdfFieldKind?: PdfFieldKind;
  pdfWidgetName?: string;
  position?: { page: number; x: number; y: number };
  /**
   * For multi_select fields: the selectable values and the PDF AcroForm
   * widget each one toggles. Required when valueType === "multi_select";
   * ignored otherwise. Each option carries its own pdfWidgetName because
   * one form field can map to multiple widgets (filing_status has 5
   * options across 3 AcroForm fields).
   */
  options?: FieldOption[];
  /**
   * Widget-level character cap from the PDF AcroForm. Small values (≤ 4)
   * usually signal a structural sub-field: date components, 2-letter
   * state, 2-digit year, credit code. There the renderer needs a
   * digit/letter subset, not the canonical fact value. The renderer
   * treats the cap as advisory and expands it when needed. Test harnesses
   * honor it strictly so generated values do not overflow.
   */
  maxLength?: number;
  /** Stable ordinal among the form's fields. Drives evaluation and display order. */
  ordinal: number;
}

export interface Catalog {
  /** Look up a form's static metadata. */
  getForm(formId: string): FormDefinition | undefined;
  /** Inventory rows for a single form, in ordinal order. */
  getFields(formId: string): FieldInventory[];
  /** Inventory row for a single field, regardless of form. */
  getField(fieldId: string): FieldInventory | undefined;
  /** Every registered form. */
  listForms(): FormDefinition[];
}

interface CatalogPayload {
  forms: FormDefinition[];
  fields: FieldInventory[];
}

// ─── In-memory implementation ────────────────────────────────────────────

function buildCatalog(payload: CatalogPayload): Catalog {
  const formsById = new Map<string, FormDefinition>();
  for (const f of payload.forms) {
    formsById.set(f.formId, f);
  }
  const fieldsByForm = new Map<string, FieldInventory[]>();
  const fieldsById = new Map<string, FieldInventory>();
  for (const field of payload.fields) {
    fieldsById.set(field.fieldId, field);
    const list = fieldsByForm.get(field.formId) ?? [];
    list.push(field);
    fieldsByForm.set(field.formId, list);
  }
  for (const list of fieldsByForm.values()) {
    list.sort((a, b) => a.ordinal - b.ordinal);
  }
  return {
    getForm: (formId) => formsById.get(formId),
    getFields: (formId) => fieldsByForm.get(formId) ?? [],
    getField: (fieldId) => fieldsById.get(fieldId),
    listForms: () => Array.from(formsById.values()),
  };
}

// ─── Fixture loader (JSON file on disk) ──────────────────────────────────

export interface FixtureFile {
  form: FormDefinition;
  fields: Array<Omit<FieldInventory, "formId" | "ordinal">>;
}

/*
 * ─── Zod schema for catalog.json validation ──────────────────────────────
 *
 * Mirrors the TypeScript types above so the jurisdiction registries can
 * validate their static JSON imports at module load. Without it, TS
 * widens JSON string fields (for example `category: "personal_info"`) to
 * plain `string`, which does not satisfy the `Category` /
 * `FieldValueType` unions, and passing the import to FixtureFile-typed
 * code fails with a structural mismatch. fixtureFileSchema.parse(x)
 * narrows correctly and fails loud on drift (renamed category, bad
 * valueType, ingestion-pipeline schema change).
 *
 * The ingestion pipeline emits keys the engine does not use
 * (`labelSource`, `multiline`, top-level `_meta`). Zod strips unknown
 * keys by default.
 */

const categoryEnum = z.enum([
  "personal_info",
  "filing_scope",
  "income",
  "deductions_credits",
  "other",
]);

const fieldValueTypeEnum = z.enum([
  "numeric",
  "single_select",
  "multi_select",
  "text",
  "boolean",
  "date",
]);

const pdfFieldKindEnum = z.enum(["text", "checkbox", "radio", "signature", "other"]);

const fieldOptionSchema = z.object({
  value: z.string(),
  pdfWidgetName: z.string().optional(),
  radioOption: z.string().optional(),
  label: z.string().optional(),
});

const fieldInventoryInputSchema = z.object({
  fieldId: z.string(),
  label: z.string(),
  category: categoryEnum,
  valueType: fieldValueTypeEnum,
  valueTypeRich: z.string().optional(),
  pdfFieldKind: pdfFieldKindEnum.optional(),
  pdfWidgetName: z.string().optional(),
  position: z.object({ page: z.number(), x: z.number(), y: z.number() }).optional(),
  options: z.array(fieldOptionSchema).optional(),
  maxLength: z.number().optional(),
});

const formDefinitionSchema = z.object({
  formId: z.string(),
  taxYear: z.number(),
  jurisdiction: z.string(),
  title: z.string(),
});

export const fixtureFileSchema = z.object({
  form: formDefinitionSchema,
  fields: z.array(fieldInventoryInputSchema),
}) satisfies z.ZodType<FixtureFile>;

/**
 * Load a Catalog from a single fixture file. The file holds one form's
 * inventory. Compose multi-form catalogs with `loadFromFixtures([…])`.
 */
export async function loadFromFixture(filePath: string): Promise<Catalog> {
  return loadFromFixtures([filePath]);
}

export async function loadFromFixtures(filePaths: string[]): Promise<Catalog> {
  const fixtures: FixtureFile[] = [];
  for (const path of filePaths) {
    const raw = await fs.readFile(path, "utf8");
    fixtures.push(JSON.parse(raw) as FixtureFile);
  }
  return buildCatalogFromFixtures(fixtures);
}

/**
 * Build a Catalog from FixtureFile objects already in memory. The prod
 * hot path uses this: it imports catalog.json files statically, so the
 * bundler ships them and the function does not depend on filesystem
 * layout. The fs-based loaders above stay for tests and scripts that load
 * arbitrary catalog paths at runtime.
 */
export function buildCatalogFromFixtures(fixtures: FixtureFile[]): Catalog {
  const forms: FormDefinition[] = [];
  const fields: FieldInventory[] = [];
  for (const fx of fixtures) {
    forms.push(fx.form);
    fx.fields.forEach((f, i) => {
      fields.push({
        ...f,
        formId: fx.form.formId,
        ordinal: i,
      });
    });
  }
  return buildCatalog({ forms, fields });
}

/*
 * NOTE: a corpus-DB catalog loader (loadFromDb) used to live here. It was
 * dormant (the runtime uses the bundled JSON fixtures), and it was the
 * engine's only import of the db layer, so it moved out with the
 * engine/mastra boundary split. When the AI forms-ingest output is
 * trusted, the loader belongs on the mastra side: load rows there, build
 * the Catalog via makeCatalog(), and pass it in.
 */

// ─── Pure utility ────────────────────────────────────────────────────────

/** Build a Catalog from in-memory data. No I/O. */
export function makeCatalog(payload: CatalogPayload): Catalog {
  return buildCatalog(payload);
}
