/*
 * Catalog-driven PDF-fill pipeline. Walks an EvaluatedForm plus its
 * matching Catalog and writes each ok field result into its widget. The
 * same code path serves:
 *   - the live doc-gen tool (facts from app.db → rendered PDF saved via
 *     createDocument)
 *   - the integration test suite (in-memory facts → in-memory PDF → assert)
 *   - the catalog-fill regression test (synthetic field results → golden
 *     diff)
 * No I/O beyond the caller-supplied blank-PDF bytes; no database, no
 * network. Side-effect-free except that it mutates the in-memory PDF.
 *
 * Returns:
 *   pdfBytes — the flattened, filled PDF
 *   rendered — Map<fieldId, RenderedWidget[]> of what was actually
 *              written. Tests assert on these values because flatten()
 *              destroys the fillable AcroForm, so widgets cannot be
 *              re-read afterward.
 *   warnings — soft-failure log (widget missing, maxLength exceeded,
 *              etc.). Tests treat any non-empty warnings as a regression.
 *
 * Fill rules:
 *   - the verifiedWidget overlay takes precedence over the catalog's
 *     pdfWidgetName
 *   - missing/blocked/unsupported field results are skipped
 *   - multi_select fields iterate inv.options to check per-option widgets
 *   - numeric values render via fmtMoney (whole dollars, "0" for zero)
 */

import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField, type PDFForm } from "pdf-lib";
import { type Catalog, type FieldInventory } from "../catalog.js";
import { getFormatter } from "../defineForm.js";
import { type AnyFormField, type EvaluatedForm } from "../types.js";
import { verifiedWidget } from "./verifiedWidgets.js";

export interface RenderedWidget {
  widgetName: string;
  /** Text written for text/numeric/date fields. */
  text?: string;
  /** True if the widget was a checkbox that we checked. */
  checked?: boolean;
}

export interface FillFromCatalogResult {
  pdfBytes: Buffer;
  /** fieldId → widgets written (1+ entries; multi_select has many). */
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

/* Shared mutable state the widget writers append into. */
interface WriterCtx {
  pdfForm: PDFForm;
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

export async function fillFromCatalog(opts: {
  blankPdfBytes: Buffer | Uint8Array;
  form: EvaluatedForm<AnyFormField>;
  catalog: Catalog;
}): Promise<FillFromCatalogResult> {
  const { blankPdfBytes, form, catalog } = opts;
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

  ctx.pdfForm.flatten();
  const pdfBytes = Buffer.from(await pdf.save());
  return { pdfBytes, rendered: ctx.rendered, warnings: ctx.warnings };
}

// ─── Widget writers ──────────────────────────────────────────────────────

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
  /*
   * Most fields render their value verbatim. A few widgets have
   * maxLength constraints that conflict with the canonical fact
   * format: SSN widgets take 9 digits with no dashes, and some phone
   * widgets take 10 bare digits. On a length overflow, retry with
   * separators stripped before declaring a soft failure. This mirrors
   * the IRS pattern: facts carry the readable format ("###-##-####");
   * the PDF holds the bare digits.
   */
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

/*
 * Radio-group select. The parent field is a PDFRadioGroup whose options
 * come from PDFRadioGroup.getOptions(). The catalog records the exact
 * label per option; select(label) picks it.
 */
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
 * Try setText(value). On length overflow, retry with separators stripped.
 * On a further overflow, expand the widget's maxLength to fit and retry
 * once more. The renderer flattens the form before it saves, so a larger
 * maxLength has no visual consequence; it only lets pdf-lib write the
 * longer value through its strict validator. Returns the string actually
 * written, or null when all attempts failed.
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
  /*
   * Final attempt: expand the widget's maxLength to fit the value. PDF
   * viewers, and real users typing into the form, accept longer text than
   * the declared maxLength. The declared limit is often pessimistic (for
   * example email widgets limited to 12-15 chars that accept 30+ in
   * practice). Flattening hides the maxLength entirely.
   */
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

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  if (n === 0) return "0";
  /*
   * Comma-grouped whole dollars: 79000 → "79,000". Matches the IRS-form
   * convention in the CPA-completed golden PDFs.
   */
  return Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/*
 * Pre-render value coercion for text fields. SSN/phone widgets diverge by
 * jurisdiction. Federal forms use comb widgets: one box per digit, where
 * the visual gaps look like dashes, so the value must be digits-only.
 * State forms use single text widgets that expect embedded separators
 * ("###-##-####", "###-###-####"). Facts always carry the readable form;
 * only federal renders strip the separators.
 *
 * Branch on valueTypeRich (the classifier's structural verdict), not on a
 * label regex. The vision tier sometimes captures whole instructional
 * sentences as the label (for example an 8949 page-2 name field whose
 * label included the word "SSN" from neighbouring text).
 */
function coerceTextValue(inv: FieldInventory, value: string, jurisdiction: string): string {
  const isFormatted = inv.valueTypeRich === "ssn" || inv.valueTypeRich === "phone";
  if (isFormatted && jurisdiction === "federal") {
    return value.replace(/[^0-9]/g, "");
  }
  return value;
}

/*
 * Select rendering, shared by multi_select and single_select. Both walk
 * the selected value(s) and toggle the matching option's widget
 * (per-checkbox, 1040-style) or call PDFRadioGroup.select(label)
 * (radio-group, 540-style). single_select means "exactly one selected";
 * multi_select means "zero or more." The renderer ignores the
 * distinction and iterates whichever values are present.
 */
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
  /*
   * Per-field formatter override, registered via FormSpec.formatters in
   * a defineForm call. When present, the override decides exactly what
   * text is written. It bypasses the value-type defaults (fmtMoney,
   * coerceTextValue), so a form can opt into different conventions per
   * field. Example: 540 page 2 SSN renders with dashes via
   * formatters: { "page2.taxpayer_ssn": SSN.format }.
   */
  const override = getFormatter(inv.fieldId);

  /*
   * Selects resolve widgets per option, so they go first; every other
   * value type writes into the field's own widget and shares one guard.
   */
  if (inv.valueType === "multi_select" || inv.valueType === "single_select") {
    return fillSelect(ctx, widgetName, inv, value);
  }
  if (!widgetName) return false;

  switch (inv.valueType) {
    case "numeric": {
      if (typeof value === "number" && Number.isFinite(value)) {
        const text = override ? override(value as never) : fmtMoney(value);
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
