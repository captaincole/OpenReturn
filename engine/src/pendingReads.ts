import type { EngineContext } from "./engine.js";
import { blocked, type DerivationResult } from "./types.js";

/*
 * A cross-form read of a not-yet-evaluated form sees `undefined`. `sum()`
 * counts it as 0 and returns ok, and the fixpoint never re-evaluates an ok
 * result, so the binding must wait for the next pass instead. A form
 * outside the evaluated set never gets a must-file result, so the final
 * settle pass (`ctx.settling`) stops the wait.
 *
 * A read of a line later on the same form waits the same way: before this
 * pass reaches it, the line has no result. Without the wait, Form 2441 line 10
 * (which reads line 29) was blank in the first pass, and Form 1040 line 21
 * kept line 19 alone as an ok sum.
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
  // Intra-form: a field later in catalog order has no result until this pass reaches it.
  if (sourceFormId === formId) return true;
  const mustFile = ctx.formMustFile(sourceFormId);
  if (mustFile === undefined) return true; // not evaluated yet
  return mustFile.ok && mustFile.value === true; // filed, field not evaluated yet
}
