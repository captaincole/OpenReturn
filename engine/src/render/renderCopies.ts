import { PDFDocument } from "@cantoo/pdf-lib";
import type { Catalog } from "../catalog.js";
import { evaluateForm, type EvaluateFormSharedState } from "../engine.js";
import type { FormSpec } from "../formSpec.js";
import type { AnyFormField, DerivationContext, EvaluatedForm } from "../types.js";
import { fillFromCatalog, type FillFromCatalogResult } from "./fillFromCatalog.js";

/*
 * A later copy reads the other forms' settled lines (Form 1116 reads Form 1040
 * for every copy). Its own form's lines start empty, and the settle flag stops
 * the wait on any form that was not evaluated.
 */
function sharedFrom(
  formId: string,
  forms: ReadonlyMap<string, EvaluatedForm<AnyFormField>> | undefined,
): EvaluateFormSharedState | undefined {
  if (forms === undefined) return undefined;
  const shared: EvaluateFormSharedState = {
    fieldResults: new Map(),
    formMustFiles: new Map(),
    settling: true,
  };
  for (const [otherId, other] of forms) {
    shared.formMustFiles.set(otherId, other.mustFile);
    if (otherId === formId) continue;
    for (const field of other.fields) shared.fieldResults.set(field.fieldId, field.result);
  }
  return shared;
}

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
  /* Every evaluated form of the return, so a later copy can read the others. */
  forms?: ReadonlyMap<string, EvaluatedForm<AnyFormField>>;
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
    const copyForm = evaluateForm(
      spec.formId,
      copyCtx,
      catalog,
      sharedFrom(spec.formId, opts.forms),
    );
    const filled = await fillFromCatalog({ blankPdfBytes, form: copyForm, catalog });
    warnings.push(...filled.warnings.map((warning) => `copy ${i + 1}: ${warning}`));
    await appendPages(merged, filled.pdfBytes, spec.copies.laterCopyPages);
  }
  return {
    pdfBytes: Buffer.from(await merged.save()),
    rendered: first.rendered,
    warnings,
    copies: count,
  };
}

async function appendPages(
  target: PDFDocument,
  pdfBytes: Uint8Array,
  only?: readonly number[],
): Promise<void> {
  const source = await PDFDocument.load(pdfBytes);
  const indices = source
    .getPageIndices()
    .filter((index) => only === undefined || only.includes(index));
  const pages = await target.copyPages(source, indices);
  for (const page of pages) target.addPage(page);
}
