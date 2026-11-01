import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField } from "@cantoo/pdf-lib";
import { promises as fs } from "node:fs";

export type GoldenKind = "text" | "checkbox" | "radio" | "other";

export interface GoldenValue {
  widgetName: string;
  kind: GoldenKind;
  value: string | boolean | null;
}

export async function readGoldenPdfValues(pdfPath: string): Promise<Map<string, GoldenValue>> {
  const bytes = await fs.readFile(pdfPath);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  const out = new Map<string, GoldenValue>();
  for (const field of form.getFields()) {
    const widgetName = field.getName();
    if (field instanceof PDFTextField) {
      out.set(widgetName, {
        widgetName,
        kind: "text",
        value: field.getText() ?? "",
      });
    } else if (field instanceof PDFCheckBox) {
      let checked = false;
      try {
        checked = field.isChecked();
      } catch {
        /* pdf-lib throws on an unset checkbox. */
      }
      out.set(widgetName, { widgetName, kind: "checkbox", value: checked });
    } else if (field instanceof PDFRadioGroup) {
      const selected = field.getSelected();
      out.set(widgetName, {
        widgetName,
        kind: "radio",
        value: selected ?? null,
      });
    } else {
      out.set(widgetName, { widgetName, kind: "other", value: null });
    }
  }
  return out;
}

export function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value.trim();
  return String(value);
}
