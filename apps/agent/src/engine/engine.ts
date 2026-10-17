/*
 * Form engine: binding registry plus Catalog-driven evaluator.
 *
 * Per-form binding files live at `src/engine/federal/<short>/bindings.ts`
 * and `src/engine/state/<state>/<short>/bindings.ts`. Each file exports
 * `register()`, which calls `defineForm<TForm, TInfo>` (see
 * defineForm.ts — the typed authoring surface) with the form's binding
 * functions. defineForm registers rules here via bindField. Must-file
 * comes from FilingInfo.mustFile, which each form's resolver writes.
 * The engine joins those bindings against a `Catalog`: inventory metadata
 * (label, category, valueType, PDF widget, position) loaded from
 * `forms/<jurisdiction>/<short>/catalog.json`.
 *
 * At evaluation time the engine walks the catalog in field-ordinal order.
 * It calls each field's binding with a typed form accessor and the
 * resolved `FilingInfo`, and produces an `EvaluatedForm`. Multi-form
 * scenarios run through `evaluateAllForms`, which iterates to a fixpoint
 * over cross-form references.
 */

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

// ─── Public shapes ───────────────────────────────────────────────────────

export interface Rule<Params = unknown, V = unknown> {
  name: string;
  paramsSchema: z.ZodType<Params>;
  evaluate: (params: Params, ctx: EngineContext) => DerivationResult<V>;
}

/*
 * EngineContext adds lookup hooks to DerivationContext. The internal
 * binding wrapper uses them to read previously evaluated fields and other
 * forms' must-file results. Binding functions (the authoring API) see
 * these values through the `f` accessor proxy, not through this context.
 */
export interface EngineContext extends DerivationContext {
  /** Look up a previously-evaluated field by its fieldId. */
  fieldResult: (fieldId: string) => DerivationResult<unknown> | undefined;
  /** Look up another form's must-file result. */
  formMustFile: (formId: string) => DerivationResult<boolean> | undefined;
  /**
   * The catalog field under evaluation. Internal binding wrappers read it
   * for per-field metadata (for example multi_select options). Undefined
   * during a must-file evaluation.
   */
  field?: FieldInventory;
  /** Final fixpoint pass: cross-form reads stop waiting (pendingReads.ts). */
  settling?: boolean;
}

// ─── Internal registry state ─────────────────────────────────────────────

interface FieldBinding {
  formId: string;
  fieldId: string;
  rule: Rule;
  params: unknown;
}

const fieldBindings = new Map<string, FieldBinding>(); // keyed by fieldId

// ─── Registration API (called by defineForm) ─────────────────────────────

export function bindField<P>(formId: string, fieldId: string, ruleDef: Rule<P>, params: P): void {
  ruleDef.paramsSchema.parse(params);
  fieldBindings.set(fieldId, {
    formId,
    fieldId,
    rule: ruleDef as Rule,
    params,
  });
}

/** Test-only: clears this module's binding map. defineForm.ts composes it into _resetRegistryForTests. */
export function _resetBindingRegistryForTests(): void {
  fieldBindings.clear();
}

// ─── Evaluation ──────────────────────────────────────────────────────────

/**
 * Optional shared state for fixpoint orchestration across multiple forms.
 * When supplied, evaluateForm reads cross-form lookups from these maps and
 * writes its own results back into them. `evaluateAllForms` uses this to
 * propagate cross-form references (for example CA 540 line 13 reads
 * federal AGI from form-1040.line.11b) across passes until results stop
 * changing.
 *
 * Monotonicity invariant: once a field result is `ok`, later passes MUST
 * NOT overwrite it. Fixpoint termination depends on this rule. Fields can
 * only resolve; they never un-resolve.
 */
export interface EvaluateFormSharedState {
  fieldResults: Map<string, DerivationResult<unknown>>;
  formMustFiles: Map<string, DerivationResult<boolean>>;
  /** Set by evaluateAllForms for the final settle pass. */
  settling?: boolean;
}

/**
 * Evaluate a single form against the supplied Catalog. The engine walks
 * fields in Catalog ordinal order. Intra-form arithmetic (for example
 * line 11 = line 9 − line 10) works when the inventory is ordered
 * top-to-bottom. Cross-form references resolve only through
 * `evaluateAllForms`, which threads shared state across passes. A
 * standalone call evaluates one form in isolation.
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
    /* The provenance resolveFilingInfo wrote next to the must-file value. */
    mustFileDerivation: ctx.filingInfo?.mustFile?.[formId]?.derivation,
    missingInputs: [...(ctx.filingInfo?.missingInputs?.[formId] ?? [])],
  };

  /*
   * When must-file is blocked or false, return immediately with no
   * fields. This prevents a cascade of blocked results downstream when a
   * form does not apply at all.
   */
  if (!mustFile.ok || !mustFile.value) {
    return { ...base, fields: [] };
  }

  return { ...base, fields: evaluateFields(formId, engineCtx, catalog, fieldResults) };
}

/*
 * Resolve must-file from FilingInfo.mustFile[formId]. It is a pure read
 * of resolved facts + decisions, so the first result is cached for the
 * other forms' cross-form reads (pendingReads.ts).
 */
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
  r: MustFileResolution | undefined,
  hasFilingInfo: boolean,
): DerivationResult<boolean> {
  if (!hasFilingInfo) return blocked(`${formId} mustFile: ctx.filingInfo is missing.`);
  if (!r) return blocked(`No must-file rule resolved for ${formId}`);
  if (r.value === undefined) {
    return blocked(`${formId} mustFile: waiting on decision ${r.decisionKey}.`, {
      decisionKey: r.decisionKey,
    });
  }
  return ok(r.value, r.derivation?.rule ?? `must-file for ${formId}`, [
    ...(r.derivation?.triggeredByFactKeys ?? []),
  ]);
}

/*
 * Walk the Catalog's inventory in order. For each field, look up the
 * registered binding. A missing binding surfaces as a blocked field
 * result. That signals a misalignment between the Catalog (inventory)
 * and the bindings file (behavior); fix it, do not hide it.
 *
 * Fixpoint optimization: skip re-evaluation when an `ok` result is
 * already cached. Bindings are pure functions of (params, ctx), and ctx
 * only grows, so the next pass returns the same answer.
 */
/*
 * Field ids each result's binding read. Keyed by the result object, so a
 * cached ok result from an earlier pass keeps the reads that produced it.
 */
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
    if (cached && cached.ok) {
      result = cached;
    } else {
      const binding = fieldBindings.get(inv.fieldId);
      if (!binding) {
        result = blocked(
          `No binding registered for ${inv.fieldId}. ` +
            `Either remove it from the catalog or add an entry to the ` +
            `form's defineForm spec (bindings/unsupported/todos).`,
        );
      } else {
        /*
         * Per-field context: the same engine context plus the current
         * field's inventory. The internal binding wrapper reads it for
         * per-field metadata (multi_select options).
         */
        const reads = trackPendingReads({ ...engineCtx, field: inv }, formId);
        result = binding.rule.evaluate(binding.params, reads.ctx);
        if (reads.hadPendingRead()) result = pendingResult(inv.fieldId);
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

// ─── Multi-form orchestration via fixpoint iteration ─────────────────────

/**
 * Max passes before the evaluator gives up. A cross-form read of a form
 * not evaluated yet waits one pass (pendingReads.ts), so the pass count
 * grows with the depth of the form-to-form chain: 4 for the simple
 * scenarios, 6 for jordan (2026-10-15), plus the settle pass. The
 * ceiling turns a genuine cycle into a loud error, not an infinite loop.
 */
const MAX_FIXPOINT_PASSES = 20;

/**
 * Evaluate multiple forms with shared state. Iterate until results stop
 * changing. Cross-form references (for example CA 540 line 13 → form-1040
 * line 11b) resolve because dependent forms re-evaluate after their
 * sources resolve.
 *
 * Monotonicity guarantees termination: each pass can only resolve more
 * fields to `ok`, never un-resolve them. The loop exits when a pass
 * produces zero new `ok` results, or fails loudly at MAX_FIXPOINT_PASSES.
 */
export function evaluateAllForms(
  formIds: string[],
  ctx: DerivationContext,
  catalog: Catalog,
): {
  forms: Map<string, EvaluatedForm<AnyFormField>>;
  passes: number;
  resolvedPerPass: number[];
} {
  /*
   * Fail fast on a missing resolver. Without filingInfo, every typed
   * binding blocks with the same "ctx.filingInfo is missing" reason. Forms
   * then render empty, and forms with a filingInfo-dependent mustFile get
   * skipped entirely. We shipped this bug once. Surface it loudly here
   * rather than as silent blank PDFs.
   */
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
    for (const formId of formIds) {
      const evaluated = evaluateForm(formId, ctx, catalog, shared);
      forms.set(formId, evaluated);
    }
    const okAfter = countOk(shared.fieldResults) + countOk(shared.formMustFiles);
    const delta = okAfter - okBefore;
    resolvedPerPass.push(delta);
    if (delta === 0) {
      if (shared.settling || !hasPending(shared)) return { forms, passes: pass, resolvedPerPass };
      shared.settling = true;
    }
  }

  throw nonConvergenceError(shared);
}

/*
 * Convergence failure. List the still-blocked fields so the operator can
 * see the suspected cycle locations.
 */
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
  let n = 0;
  for (const r of map.values()) if (r.ok) n++;
  return n;
}
