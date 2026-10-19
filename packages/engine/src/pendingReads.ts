import type { EngineContext } from "./engine.js";
import { blocked, type DerivationResult } from "./types.js";

/*
 * Cross-form reads that are not ready yet. A binding that reads another
 * form's field before that form is evaluated sees `undefined`. `sum()`
 * counts it as 0 and returns ok, and the fixpoint never re-evaluates an
 * ok result. So the binding waits for the next pass instead.
 *
 * "No result" means one of three things:
 *   - The source form has no must-file result yet: not evaluated yet, so
 *     the read is pending.
 *   - The source form is filed but the field is missing: pending.
 *   - The source form is not filed, or its must-file can never resolve
 *     (a catalog-only form): `undefined` is final.
 * A read of a field that is itself waiting also waits, so the wait
 * passes through intra-form arithmetic.
 *
 * A source form outside the evaluated set never gets a must-file result,
 * so "not evaluated yet" can last forever. evaluateAllForms ends with a
 * settle pass (`ctx.settling`): reads no longer wait, and a missing value
 * counts as final, as `sum()` treats it.
 *
 * The tracker also records every field id the binding read (`readIds`).
 * The engine keeps them on the field (`reads`), so a report can tell a
 * root difference from one that only inherits an upstream difference.
 */

const pendingResults = new WeakSet<object>();

export function pendingResult(fieldId: string): DerivationResult<unknown> {
  const result = blocked(`${fieldId}: waiting on a cross-form field (next pass).`);
  pendingResults.add(result);
  return result;
}

export function isPendingResult(result: DerivationResult<unknown>): boolean {
  return pendingResults.has(result);
}

export function trackPendingReads(
  ctx: EngineContext,
  formId: string,
): { ctx: EngineContext; hadPendingRead: () => boolean; readIds: () => string[] } {
  let pending = false;
  const read = new Set<string>();
  const tracked: EngineContext = {
    ...ctx,
    fieldResult: (id) => {
      read.add(id);
      const result = ctx.fieldResult(id);
      if (ctx.settling) return result;
      if (result === undefined ? isPendingSource(ctx, formId, id) : pendingResults.has(result)) {
        pending = true;
      }
      return result;
    },
  };
  return { ctx: tracked, hadPendingRead: () => pending, readIds: () => [...read] };
}

function isPendingSource(ctx: EngineContext, formId: string, fieldId: string): boolean {
  const sourceFormId = fieldId.split(".")[0];
  if (sourceFormId === formId) return false; // intra-form: catalog order decides
  const mustFile = ctx.formMustFile(sourceFormId);
  if (mustFile === undefined) return true; // not evaluated yet
  return mustFile.ok && mustFile.value === true; // filed, field not evaluated yet
}
