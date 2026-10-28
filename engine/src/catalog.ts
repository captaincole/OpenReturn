import { promises as fs } from "node:fs";
import { z } from "zod";
import type { Category, FieldValueType } from "./types.js";

export interface FormDefinition {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  title: string;
}

export interface FieldOption {
  value: string;
  /*
   * Set when each option is its own checkbox widget. Unset for a
   * PDFRadioGroup: the parent's pdfWidgetName names the group.
   */
  pdfWidgetName?: string;
  radioOption?: string;
  label?: string;
}

export type PdfFieldKind = "text" | "checkbox" | "radio" | "signature" | "other";

export interface FieldInventory {
  fieldId: string;
  formId: string;
  label: string;
  category: Category;
  valueType: FieldValueType;
  valueTypeRich?: string;
  /** pdf-lib's structural type. Read it, not valueType, for "is this a real radio group?". */
  pdfFieldKind?: PdfFieldKind;
  pdfWidgetName?: string;
  position?: { page: number; x: number; y: number };
  /** Per-option widgets: filing status has 5 options across 3 AcroForm fields. */
  options?: FieldOption[];
  /** Advisory: the renderer expands it when needed. Test harnesses honor it strictly. */
  maxLength?: number;
  ordinal: number;
}

export interface Catalog {
  getForm(formId: string): FormDefinition | undefined;
  getFields(formId: string): FieldInventory[];
  getField(fieldId: string): FieldInventory | undefined;
  listForms(): FormDefinition[];
}

interface CatalogPayload {
  forms: FormDefinition[];
  fields: FieldInventory[];
}

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

export interface FixtureFile {
  form: FormDefinition;
  fields: Array<Omit<FieldInventory, "formId" | "ordinal">>;
}

/*
 * TS widens JSON strings to `string`, which fails the Category and
 * FieldValueType unions, so the registries parse their imports here.
 * Zod strips the unknown keys that the ingest pipeline emits.
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

export function makeCatalog(payload: CatalogPayload): Catalog {
  return buildCatalog(payload);
}
