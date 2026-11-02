import { z } from "zod";

/*
 * labels.json: what the form-catalog skill (or a person) decides for each
 * widget field that extract-widgets found. write-catalog turns it into
 * catalog.json. Every widget field appears exactly once, in fields or skipped.
 */

export const CATEGORIES = [
  "personal_info",
  "filing_scope",
  "income",
  "deductions_credits",
  "other",
] as const;

/* The catalog narrows these to the runtime valueType (money → numeric, ssn → text). */
export const VALUE_TYPES = [
  "money",
  "count",
  "text",
  "ssn",
  "phone",
  "zip",
  "email",
  "date",
  "boolean",
  "single_select",
  "multi_select",
  "signature",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type ValueType = (typeof VALUE_TYPES)[number];

const fieldLabelSchema = z.object({
  pdfFieldName: z.string(),
  /** The catalog fieldId as written: "<formId>.<page>.<part>.<name>", page 0-based. */
  fieldId: z.string(),
  /** Required when the widget has no /TU label; ignored when it has one. */
  label: z.string().optional(),
  category: z.enum(CATEGORIES),
  valueType: z.enum(VALUE_TYPES),
  /** Radio fields: one entry per PDF option; radioOption is the name on the widget's badge in widgets.json. */
  options: z
    .array(z.object({ radioOption: z.string(), value: z.string(), label: z.string().optional() }))
    .optional(),
});

export const labelsFileSchema = z.object({
  fields: z.array(fieldLabelSchema),
  skipped: z.array(z.object({ pdfFieldName: z.string(), reason: z.string() })).default([]),
});

export type FieldLabel = z.infer<typeof fieldLabelSchema>;
export type LabelsFile = z.infer<typeof labelsFileSchema>;
