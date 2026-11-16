/*
 * One catalog.json row: what the PDF says about a field (kind, position,
 * length, radio options) with what labels.json decides for it (fieldId,
 * label, category, value type).
 */

import type { WidgetField } from "./extractWidgets.js";
import type { FieldLabel, ValueType } from "./labelsFile.js";

export interface CatalogOption {
  value: string;
  pdfWidgetName?: string;
  radioOption?: string;
  label?: string;
}

export interface CatalogRow {
  fieldId: string;
  label: string;
  /** "tu": the form author's /TU text. "vision": read from the page image. */
  labelSource?: string;
  category: string;
  /** The runtime vocabulary, narrowed from valueTypeRich. */
  valueType: string;
  /** Kept for formatter hints ("money", "ssn") that the renderer does not read yet. */
  valueTypeRich?: string;
  /** From pdf.js, never from a label. */
  pdfFieldKind: string;
  pdfWidgetName?: string;
  options?: CatalogOption[];
  position: { page: number; x: number; y: number };
  maxLength?: number;
  multiline?: boolean;
}

function narrowValueType(rich: ValueType): string {
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
    default:
      return rich;
  }
}

/* The /TU label wins: it is the form author's text. */
export function catalogRow(field: WidgetField, label: FieldLabel): CatalogRow {
  const primary = field.widgets[0];
  const position = primary
    ? { page: primary.page, x: primary.position.x, y: primary.position.y }
    : { page: 0, x: 0, y: 0 };

  const row: CatalogRow = {
    fieldId: label.fieldId,
    label: field.tuLabel ?? label.label?.trim() ?? "",
    labelSource: field.tuLabel ? "tu" : "vision",
    category: label.category,
    valueType: narrowValueType(label.valueType),
    valueTypeRich: label.valueType,
    pdfFieldKind: field.fieldKind,
    pdfWidgetName: field.fieldName,
    position,
  };

  if (field.fieldKind === "text") {
    if (typeof field.maxLength === "number") row.maxLength = field.maxLength;
    if (field.multiline) row.multiline = true;
  }

  if (field.fieldKind === "radio" && field.radioOptions) {
    row.options = radioOptions(field.radioOptions, label.options ?? []);
  }

  return row;
}

/*
 * The label's order first, then any PDF option it left out. An option the
 * label left out gets a slug of its PDF name as its value.
 */
function radioOptions(
  pdfOptions: string[],
  labeled: NonNullable<FieldLabel["options"]>,
): CatalogOption[] {
  const labeledByRadioOption = new Map(labeled.map((option) => [option.radioOption, option]));
  const ordered = [
    ...labeled
      .map((option) => option.radioOption)
      .filter((radioOption) => pdfOptions.includes(radioOption)),
    ...pdfOptions.filter((radioOption) => !labeledByRadioOption.has(radioOption)),
  ];
  return ordered.map((radioOption) => ({
    value: labeledByRadioOption.get(radioOption)?.value ?? slugifyOption(radioOption),
    radioOption,
    label: labeledByRadioOption.get(radioOption)?.label ?? radioOption,
  }));
}

function slugifyOption(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}
