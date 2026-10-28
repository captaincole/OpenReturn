/*
 * `rendered` records what was written: flatten() destroys the AcroForm, so
 * tests cannot read the widgets back. A locked golden passes flatten: false.
 */

import {
  PDFCheckBox,
  PDFDocument,
  PDFRadioGroup,
  PDFTextField,
  type PDFForm,
} from "@cantoo/pdf-lib";
import { type Catalog, type FieldInventory } from "../catalog.js";
import { getFormatter } from "../defineForm.js";
import { formatDollars } from "../money.js";
import { type AnyFormField, type EvaluatedForm } from "../types.js";
import { verifiedWidget } from "./verifiedWidgets.js";

export interface RenderedWidget {
  widgetName: string;
  text?: string;
  checked?: boolean;
}

export interface FillFromCatalogResult {
  pdfBytes: Buffer;
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

interface WriterCtx {
  pdfForm: PDFForm;
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

export async function fillFromCatalog(opts: {
  blankPdfBytes: Buffer | Uint8Array;
  form: EvaluatedForm<AnyFormField>;
  catalog: Catalog;
  flatten?: boolean;
}): Promise<FillFromCatalogResult> {
  const { blankPdfBytes, form, catalog, flatten = true } = opts;
  const pdf = await PDFDocument.load(blankPdfBytes);
  const ctx: WriterCtx = {
    pdfForm: pdf.getForm(),
    rendered: new Map<string, RenderedWidget[]>(),
    warnings: [],
  };

  for (const field of form.fields) {
    const inv = catalog.getField(field.fieldId);
    if (!inv) continue;
    if (!field.result.ok) continue;
    const value = field.result.value;
    if (value === null || value === undefined) continue;

    const widgetName = verifiedWidget(form.formId, field.fieldId) ?? inv.pdfWidgetName;
    fillByType(ctx, widgetName, inv, value, form.jurisdiction);
  }

  if (flatten) ctx.pdfForm.flatten();
  const pdfBytes = Buffer.from(await pdf.save());
  return { pdfBytes, rendered: ctx.rendered, warnings: ctx.warnings };
}

function setText(ctx: WriterCtx, fieldId: string, widgetName: string, value: string): void {
  if (!value) return;
  let f;
  try {
    f = ctx.pdfForm.getField(widgetName);
  } catch (err) {
    ctx.warnings.push(
      `fieldId=${fieldId} widget=${widgetName} getField failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return;
  }
  if (!(f instanceof PDFTextField)) {
    ctx.warnings.push(
      `fieldId=${fieldId} widget=${widgetName} is ${f.constructor.name}, expected PDFTextField.`,
    );
    return;
  }
  const written = trySetTextWithFallback(f, value);
  if (written === null) {
    ctx.warnings.push(
      `fieldId=${fieldId} widget=${widgetName} setText failed even after stripping separators (value="${value}").`,
    );
    return;
  }
  appendRendered(ctx.rendered, fieldId, { widgetName, text: written });
}

function check(ctx: WriterCtx, fieldId: string, widgetName: string): void {
  try {
    const f = ctx.pdfForm.getField(widgetName);
    if (f instanceof PDFCheckBox) {
      f.check();
      appendRendered(ctx.rendered, fieldId, { widgetName, checked: true });
    } else {
      ctx.warnings.push(
        `fieldId=${fieldId} widget=${widgetName} is ${f.constructor.name}, expected PDFCheckBox.`,
      );
    }
  } catch (err) {
    ctx.warnings.push(
      `fieldId=${fieldId} widget=${widgetName} check failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

function selectRadio(
  ctx: WriterCtx,
  fieldId: string,
  widgetName: string,
  radioOption: string,
): void {
  try {
    const f = ctx.pdfForm.getField(widgetName);
    if (f instanceof PDFRadioGroup) {
      f.select(radioOption);
      appendRendered(ctx.rendered, fieldId, { widgetName, text: radioOption });
    } else {
      ctx.warnings.push(
        `fieldId=${fieldId} widget=${widgetName} is ${f.constructor.name}, expected PDFRadioGroup.`,
      );
    }
  } catch (err) {
    ctx.warnings.push(
      `fieldId=${fieldId} widget=${widgetName} radio select(${radioOption}) failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/*
 * pdf-lib rejects text over maxLength. Retry with separators stripped,
 * then raise maxLength to fit: flattening hides the limit, and declared
 * limits are often too small (email widgets of 12–15 chars).
 */
function trySetTextWithFallback(f: PDFTextField, value: string): string | null {
  try {
    f.setText(value);
    return value;
  } catch (err) {
    if (!isLengthOverflow(err)) return null;
  }
  const stripped = value.replace(/[\s\-_.()]/g, "");
  if (stripped !== value) {
    try {
      f.setText(stripped);
      return stripped;
    } catch (err) {
      if (!isLengthOverflow(err)) return null;
    }
  }
  try {
    f.setMaxLength(value.length);
    f.setText(value);
    return value;
  } catch {
    return null;
  }
}

function isLengthOverflow(err: unknown): boolean {
  return err instanceof Error && /maxLength/i.test(err.message);
}

function appendRendered(
  map: Map<string, RenderedWidget[]>,
  fieldId: string,
  w: RenderedWidget,
): void {
  const arr = map.get(fieldId);
  if (arr) arr.push(w);
  else map.set(fieldId, [w]);
}

/*
 * Federal SSN/phone widgets are combs (one box per digit), so they take
 * digits only; state widgets expect separators. Branch on valueTypeRich,
 * not the label: AI labels sometimes catch "SSN" from nearby text.
 */
function coerceTextValue(inv: FieldInventory, value: string, jurisdiction: string): string {
  const isFormatted = inv.valueTypeRich === "ssn" || inv.valueTypeRich === "phone";
  if (isFormatted && jurisdiction === "federal") {
    return value.replace(/[^0-9]/g, "");
  }
  return value;
}

function fillSelect(
  ctx: WriterCtx,
  widgetName: string | undefined,
  inv: FieldInventory,
  value: unknown,
): boolean {
  if (!inv.options) return false;
  const selectedValues = Array.isArray(value) ? value : [value];
  let touched = false;
  for (const selected of selectedValues) {
    const opt = inv.options.find((o) => o.value === selected);
    if (!opt) continue;
    if (opt.radioOption && widgetName) {
      selectRadio(ctx, inv.fieldId, widgetName, opt.radioOption);
      touched = true;
    } else if (opt.pdfWidgetName) {
      check(ctx, inv.fieldId, opt.pdfWidgetName);
      touched = true;
    }
  }
  return touched;
}

function fillByType(
  ctx: WriterCtx,
  widgetName: string | undefined,
  inv: FieldInventory,
  value: unknown,
  jurisdiction: string,
): boolean {
  // A per-field formatter override bypasses formatDollars and coerceTextValue.
  const override = getFormatter(inv.fieldId);

  if (inv.valueType === "multi_select" || inv.valueType === "single_select") {
    return fillSelect(ctx, widgetName, inv, value);
  }
  if (!widgetName) return false;

  switch (inv.valueType) {
    case "numeric": {
      if (typeof value === "number" && Number.isFinite(value)) {
        const text = override ? override(value as never) : formatDollars(value);
        setText(ctx, inv.fieldId, widgetName, text);
        return true;
      }
      return false;
    }
    case "text": {
      if (typeof value === "string" && value.length > 0) {
        const text = override
          ? override(value as never)
          : coerceTextValue(inv, value, jurisdiction);
        setText(ctx, inv.fieldId, widgetName, text);
        return true;
      }
      return false;
    }
    case "boolean": {
      if (value === true) {
        check(ctx, inv.fieldId, widgetName);
        return true;
      }
      return false;
    }
    case "date": {
      if (typeof value === "string" && value.length > 0) {
        setText(ctx, inv.fieldId, widgetName, value);
        return true;
      }
      return false;
    }
  }
  return false;
}
