import { z } from "zod";
import type { Catalog, FieldInventory } from "./catalog.js";
import type { MustFileResolution } from "./filingInfo.js";
import { isPendingResult, pendingResult, trackPendingReads } from "./pendingReads.js";
import {
  blocked,
  ok,
  type AnyFormField,
  type DerivationContext,
  type DerivationResult,
  type EvaluatedForm,
} from "./types.js";

export interface Rule<Params = unknown, V = unknown> {
  name: string;
  paramsSchema: z.ZodType<Params>;
  evaluate: (params: Params, ctx: EngineContext) => DerivationResult<V>;
}

export interface EngineContext extends DerivationContext {
  fieldResult: (fieldId: string) => DerivationResult<unknown> | undefined;
  formMustFile: (formId: string) => DerivationResult<boolean> | undefined;
  field?: FieldInventory;
  /** Final fixpoint pass: cross-form reads stop waiting (pendingReads.ts). */
  settling?: boolean;
}

interface FieldBinding {
  formId: string;
  fieldId: string;
  rule: Rule;
  params: unknown;
}

const fieldBindings = new Map<string, FieldBinding>(); // keyed by fieldId

export function bindField<P>(formId: string, fieldId: string, ruleDef: Rule<P>, params: P): void {
  ruleDef.paramsSchema.parse(params);
  fieldBindings.set(fieldId, {
    formId,
    fieldId,
    rule: ruleDef as Rule,
    params,
  });
}

export function _resetBindingRegistryForTests(): void {
  fieldBindings.clear();
}

/*
 * Infinite-loop guard: a later pass never changes a field that is already
 * `ok`. The pass loop stops only when a pass changes nothing, so without
 * this rule two fields could flip each other forever.
 */
export interface EvaluateFormSharedState {
  fieldResults: Map<string, DerivationResult<unknown>>;
  formMustFiles: Map<string, DerivationResult<boolean>>;
  settling?: boolean;
}

/*
 * Catalog ordinal order drives intra-form arithmetic. Cross-form reads
 * resolve only through evaluateAllForms.
 */
export function evaluateForm(
  formId: string,
  ctx: DerivationContext,
  catalog: Catalog,
  shared?: EvaluateFormSharedState,
): EvaluatedForm<AnyFormField> {
  const def = catalog.getForm(formId);
  if (!def) {
    throw new Error(
      `evaluateForm: no form "${formId}" in the Catalog. ` +
        `Did you forget to load its fixture / seed the DB?`,
    );
  }

  const fieldResults = shared?.fieldResults ?? new Map<string, DerivationResult<unknown>>();
  const formMustFiles = shared?.formMustFiles ?? new Map<string, DerivationResult<boolean>>();

  const engineCtx: EngineContext = {
    ...ctx,
    fieldResult: (id) => fieldResults.get(id),
    formMustFile: (id) => formMustFiles.get(id),
    settling: shared?.settling,
  };

  const mustFile = resolveMustFile(formId, ctx, formMustFiles);
  const base = {
    formId: def.formId,
    jurisdiction: def.jurisdiction,
    title: def.title,
    taxYear: ctx.taxYear,
    mustFile,
    mustFileDerivation: ctx.filingInfo?.mustFile?.[formId]?.derivation,
    missingInputs: [...(ctx.filingInfo?.missingInputs?.[formId] ?? [])],
  };

  // Must-file blocked or false: no fields, so blocked results do not cascade.
  if (!mustFile.ok || !mustFile.value) {
    return { ...base, fields: [] };
  }

  return { ...base, fields: evaluateFields(formId, engineCtx, catalog, fieldResults) };
}

function resolveMustFile(
  formId: string,
  ctx: DerivationContext,
  formMustFiles: Map<string, DerivationResult<boolean>>,
): DerivationResult<boolean> {
  const cached = formMustFiles.get(formId);
  if (cached) return cached;
  const mustFile = mustFileResult(formId, ctx.filingInfo?.mustFile?.[formId], !!ctx.filingInfo);
  formMustFiles.set(formId, mustFile);
  return mustFile;
}

function mustFileResult(
  formId: string,
  resolution: MustFileResolution | undefined,
  hasFilingInfo: boolean,
): DerivationResult<boolean> {
  if (!hasFilingInfo) return blocked(`${formId} mustFile: ctx.filingInfo is missing.`);
  if (!resolution) return blocked(`No must-file rule resolved for ${formId}`);
  if (resolution.value === undefined) {
    return blocked(`${formId} mustFile: waiting on decision ${resolution.decisionKey}.`, {
      decisionKey: resolution.decisionKey,
    });
  }
  return ok(resolution.value, resolution.derivation?.rule ?? `must-file for ${formId}`, [
    ...(resolution.derivation?.triggeredByFactKeys ?? []),
  ]);
}

/*
 * A cached `ok` result is not evaluated again: ctx only grows. A settle-pass
 * result is the exception. It may predate an input, so it runs every pass.
 */
const settledResults = new WeakSet<object>();

// Keyed by the result object, so a cached ok result keeps the reads that produced it.
const readsByResult = new WeakMap<object, string[]>();

function evaluateFields(
  formId: string,
  engineCtx: EngineContext,
  catalog: Catalog,
  fieldResults: Map<string, DerivationResult<unknown>>,
): AnyFormField[] {
  const fields: AnyFormField[] = [];
  for (const inv of catalog.getFields(formId)) {
    const cached = fieldResults.get(inv.fieldId);
    let result: DerivationResult<unknown>;
    if (cached && cached.ok && !settledResults.has(cached)) {
      result = cached;
    } else {
      const binding = fieldBindings.get(inv.fieldId);
      if (!binding) {
        result = blocked(
          `No binding registered for ${inv.fieldId}. ` +
            `Either remove it from the catalog or add an entry to the ` +
            `form's defineForm spec (bindings/unsupported).`,
        );
      } else {
        const reads = trackPendingReads({ ...engineCtx, field: inv }, formId);
        result = binding.rule.evaluate(binding.params, reads.ctx);
        if (reads.hadPendingRead()) result = pendingResult(inv.fieldId);
        if (engineCtx.settling) settledResults.add(result);
        readsByResult.set(result, reads.readIds());
      }
      fieldResults.set(inv.fieldId, result);
    }
    fields.push({
      formFieldKind: `${formId}.${inv.valueType}`,
      fieldId: inv.fieldId,
      label: inv.label,
      category: inv.category,
      valueType: inv.valueType,
      result,
      reads: readsByResult.get(result),
    });
  }
  return fields;
}

// Each cross-form wait costs a pass. The cap turns a real cycle into an error.
const MAX_FIXPOINT_PASSES = 20;

export function evaluateAllForms(
  formIds: string[],
  ctx: DerivationContext,
  catalog: Catalog,
): {
  forms: Map<string, EvaluatedForm<AnyFormField>>;
  passes: number;
  resolvedPerPass: number[];
} {
  // Fail loud: without filingInfo every binding blocks and the PDFs render blank.
  if (!ctx.filingInfo) {
    throw new Error(
      "evaluateAllForms: ctx.filingInfo is missing. " +
        "Call resolveFilingInfo({ facts, decisions }) and attach the result " +
        "to DerivationContext.filingInfo before invoking the engine.",
    );
  }

  const shared: EvaluateFormSharedState = {
    fieldResults: new Map(),
    formMustFiles: new Map(),
  };

  const forms = new Map<string, EvaluatedForm<AnyFormField>>();
  const resolvedPerPass: number[] = [];

  for (let pass = 1; pass <= MAX_FIXPOINT_PASSES; pass++) {
    const okBefore = countOk(shared.fieldResults) + countOk(shared.formMustFiles);
    const valuesBefore = okValues(shared.fieldResults);
    for (const formId of formIds) {
      const evaluated = evaluateForm(formId, ctx, catalog, shared);
      forms.set(formId, evaluated);
    }
    const okAfter = countOk(shared.fieldResults) + countOk(shared.formMustFiles);
    const delta = okAfter - okBefore;
    resolvedPerPass.push(delta);
    // A settle-pass value can change with no new ok result: wait until values are stable.
    if (delta === 0 && okValues(shared.fieldResults) === valuesBefore) {
      if (shared.settling || !hasPending(shared)) return { forms, passes: pass, resolvedPerPass };
      shared.settling = true;
    }
  }

  throw nonConvergenceError(shared);
}

function nonConvergenceError(shared: EvaluateFormSharedState): Error {
  const stillBlocked: string[] = [];
  for (const [fieldId, result] of shared.fieldResults) {
    if (!result.ok) stillBlocked.push(fieldId);
  }
  return new Error(
    `evaluateAllForms: did not converge in ${MAX_FIXPOINT_PASSES} passes. ` +
      `Still-blocked fields (${stillBlocked.length}): ${stillBlocked.slice(0, 10).join(", ")}${stillBlocked.length > 10 ? "…" : ""}. ` +
      `Suspect a real binding cycle. Add intermediate decisions or split bindings to break it.`,
  );
}

function hasPending(shared: EvaluateFormSharedState): boolean {
  for (const result of shared.fieldResults.values()) if (isPendingResult(result)) return true;
  return false;
}

function countOk<V>(map: Map<string, DerivationResult<V>>): number {
  let count = 0;
  for (const result of map.values()) if (result.ok) count++;
  return count;
}

function okValues(map: Map<string, DerivationResult<unknown>>): string {
  const out: Array<[string, unknown]> = [];
  for (const [id, result] of map) if (result.ok) out.push([id, result.value]);
  return JSON.stringify(out);
}
