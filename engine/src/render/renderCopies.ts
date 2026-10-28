import { PDFDocument } from "pdf-lib";
import type { Catalog } from "../catalog.js";
import { evaluateForm } from "../engine.js";
import type { FormSpec } from "../formSpec.js";
import type { AnyFormField, DerivationContext, EvaluatedForm } from "../types.js";
import { fillFromCatalog, type FillFromCatalogResult } from "./fillFromCatalog.js";

/*
 * The engine keeps a multi-copy form as one evaluated form (copy 0). Each
 * later copy is evaluated here with its own FilingInfo and appended.
 */
export async function renderFormCopies(opts: {
  spec: FormSpec;
  form: EvaluatedForm<AnyFormField>;
  ctx: DerivationContext;
  catalog: Catalog;
  blankPdfBytes: Buffer | Uint8Array;
}): Promise<FillFromCatalogResult & { copies: number }> {
  const { spec, form, ctx, catalog, blankPdfBytes } = opts;
  const count = Math.max(1, spec.copies?.count(ctx.filingInfo) ?? 1);
  const first = await fillFromCatalog({ blankPdfBytes, form, catalog });
  if (count === 1 || !spec.copies) return { ...first, copies: 1 };

  const merged = await PDFDocument.create();
  const warnings = [...first.warnings];
  await appendPages(merged, first.pdfBytes);
  for (let i = 1; i < count; i++) {
    const copyCtx = { ...ctx, filingInfo: spec.copies.select(ctx.filingInfo, i) };
    const copyForm = evaluateForm(spec.formId, copyCtx, catalog);
    const filled = await fillFromCatalog({ blankPdfBytes, form: copyForm, catalog });
    warnings.push(...filled.warnings.map((w) => `copy ${i + 1}: ${w}`));
    await appendPages(merged, filled.pdfBytes);
  }
  return {
    pdfBytes: Buffer.from(await merged.save()),
    rendered: first.rendered,
    warnings,
    copies: count,
  };
}

async function appendPages(target: PDFDocument, pdfBytes: Uint8Array): Promise<void> {
  const source = await PDFDocument.load(pdfBytes);
  const pages = await target.copyPages(source, source.getPageIndices());
  for (const page of pages) target.addPage(page);
}
