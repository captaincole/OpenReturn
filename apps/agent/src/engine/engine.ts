/*
 * Form engine: binding registry plus Catalog-driven evaluator.
 *
 * Per-form binding files live at `src/engine/federal/<short>/bindings.ts`
 * and `src/engine/state/<state>/<short>/bindings.ts`. Each file exports
 * `register()`, which calls `defineForm<TForm, TInfo>` with the form's
 * typed binding functions. The engine joins those bindings against a
 * `Catalog`: inventory metadata (label, category, valueType, PDF widget,
 * position) loaded from `forms/<jurisdiction>/<short>/catalog.json`.
 *
 * At evaluation time the engine walks the catalog in field-ordinal order.
 * It calls each field's binding with a typed form accessor and the
 * resolved `FilingInfo`, and produces an `EvaluatedForm`. Multi-form
 * scenarios run through `evaluateAllForms`, which iterates to a fixpoint
 * over cross-form references.
 */

import { z } from "zod";
import {
  blocked,
  type AnyFormField,
  type DerivationContext,
  type DerivationResult,
  type EvaluatedForm,
} from "./types.js";
import type { Catalog, FieldInventory } from "./catalog.js";
import type { BaseFilingInfo, FilingInfo } from "./filingInfo.js";

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
}

// ─── Internal registry state ─────────────────────────────────────────────

interface FieldBinding {
  formId: string;
  fieldId: string;
  rule: Rule;
  params: unknown;
}

interface MustFileBinding {
  rule: Rule<unknown, unknown>;
  params: unknown;
}

const mustFileBindings = new Map<string, MustFileBinding>();
const fieldBindings = new Map<string, FieldBinding>(); // keyed by fieldId

// ─── Registration API (called by defineForm) ─────────────────────────────

/*
 * Accepts any rule. The engine coerces the result's value to boolean at
 * evaluation time, so a rule that returns a non-boolean decision value
 * works as a must-file binding without a typed-bool wrapper.
 */
export function bindMustFile<P>(
  formId: string,
  ruleDef: Rule<P, unknown>,
  params: P,
): void {
  ruleDef.paramsSchema.parse(params);
  mustFileBindings.set(formId, {
    rule: ruleDef as Rule<unknown, unknown>,
    params,
  });
}

export function bindField<P>(
  formId: string,
  fieldId: string,
  ruleDef: Rule<P>,
  params: P,
): void {
  ruleDef.paramsSchema.parse(params);
  fieldBindings.set(fieldId, {
    formId,
    fieldId,
    rule: ruleDef as Rule,
    params,
  });
}

// ─── Inspection API ──────────────────────────────────────────────────────

/** Test-only: clears all registrations. Production callers never use this. */
export function _resetRegistryForTests(): void {
  mustFileBindings.clear();
  fieldBindings.clear();
  formatterRegistry.clear();
  formSpecMeta.clear();
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
  };

  /*
   * Resolve must-file. Skip when a previous pass already produced an `ok`
   * result for this form; monotonicity guarantees the same answer.
   * Re-evaluate `blocked` results so cross-form dependencies that resolved
   * this pass can unblock this form's must-file.
   */
  let mustFile: DerivationResult<boolean>;
  const cachedMustFile = formMustFiles.get(formId);
  if (cachedMustFile && cachedMustFile.ok) {
    mustFile = cachedMustFile;
  } else {
    const mf = mustFileBindings.get(formId);
    if (!mf) {
      mustFile = blocked(`No must-file binding registered for ${formId}`);
    } else {
      const raw = mf.rule.evaluate(mf.params, engineCtx);
      mustFile = raw.ok
        ? {
            ok: true,
            value: raw.value === true,
            rationale: raw.rationale,
            supportingFactKeys: raw.supportingFactKeys,
            decisionKey: raw.decisionKey,
          }
        : raw;
    }
    formMustFiles.set(formId, mustFile);
  }

  /*
   * Look up the engine-derivation provenance that resolveFilingInfo wrote
   * next to the boolean must-file flag. Undefined for forms not yet wired
   * through resolveMustFile; the field is optional.
   */
  const mustFileDerivation = lookupMustFileDerivation(formId, ctx.filingInfo);

  const fields: AnyFormField[] = [];

  /*
   * When must-file is blocked or false, return immediately with no
   * fields. This prevents a cascade of blocked results downstream when a
   * form does not apply at all.
   */
  if (!mustFile.ok || !mustFile.value) {
    return {
      formId: def.formId,
      jurisdiction: def.jurisdiction,
      title: def.title,
      taxYear: ctx.taxYear,
      mustFile,
      mustFileDerivation,
      fields,
    };
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
        const fieldCtx: EngineContext = { ...engineCtx, field: inv };
        result = binding.rule.evaluate(binding.params, fieldCtx);
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
    });
  }

  return {
    formId: def.formId,
    jurisdiction: def.jurisdiction,
    title: def.title,
    taxYear: ctx.taxYear,
    mustFile,
    mustFileDerivation,
    fields,
  };
}

/*
 * Map from formId to the FilingInfo slot that carries the engine
 * derivation for that form's must-file determination. Kept here, not on
 * the form spec, because the slot names live in the per-form FilingInfo
 * types. This map bridges the engine's formId namespace and the
 * resolver's slot namespace.
 */
const MUST_FILE_DERIVATION_SLOTS: Record<string, string> = {
  "form-1040": "mustFileFederalDerivation",
  "form-540": "mustFileCA540Derivation",
  "schedule-ca": "mustFileScheduleCADerivation",
  "form-8949": "mustFile8949Derivation",
  "schedule-d": "mustFileScheduleDDerivation",
};

function lookupMustFileDerivation(
  formId: string,
  filingInfo: DerivationContext["filingInfo"],
): EvaluatedForm["mustFileDerivation"] {
  if (!filingInfo) return undefined;
  const slot = MUST_FILE_DERIVATION_SLOTS[formId];
  if (!slot) return undefined;
  return (filingInfo as Record<string, unknown>)[slot] as
    | EvaluatedForm["mustFileDerivation"];
}

// ─── Multi-form orchestration via fixpoint iteration ─────────────────────

/**
 * Max passes before the evaluator gives up. In practice evaluation
 * converges in 2-3 passes: federal resolves on pass 1, state cross-form
 * references resolve on pass 2. The 5-pass ceiling turns genuine
 * non-convergence into a loud error instead of an infinite loop.
 */
const MAX_FIXPOINT_PASSES = 5;

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
    const okBefore = countOk(shared.fieldResults) + countOkMustFiles(shared.formMustFiles);
    for (const formId of formIds) {
      const evaluated = evaluateForm(formId, ctx, catalog, shared);
      forms.set(formId, evaluated);
    }
    const okAfter = countOk(shared.fieldResults) + countOkMustFiles(shared.formMustFiles);
    const delta = okAfter - okBefore;
    resolvedPerPass.push(delta);
    if (delta === 0) {
      return { forms, passes: pass, resolvedPerPass };
    }
  }

  /*
   * Convergence failure. List the still-blocked fields so the operator
   * can see the suspected cycle locations.
   */
  const stillBlocked: string[] = [];
  for (const [fieldId, result] of shared.fieldResults) {
    if (!result.ok) stillBlocked.push(fieldId);
  }
  throw new Error(
    `evaluateAllForms: did not converge in ${MAX_FIXPOINT_PASSES} passes. ` +
      `Still-blocked fields (${stillBlocked.length}): ${stillBlocked.slice(0, 10).join(", ")}${stillBlocked.length > 10 ? "…" : ""}. ` +
      `Suspect a real binding cycle. Add intermediate decisions or split bindings to break it.`,
  );
}

function countOk(map: Map<string, DerivationResult<unknown>>): number {
  let n = 0;
  for (const r of map.values()) if (r.ok) n++;
  return n;
}

function countOkMustFiles(map: Map<string, DerivationResult<boolean>>): number {
  let n = 0;
  for (const r of map.values()) if (r.ok) n++;
  return n;
}

/*
 * ─── Typed binding API (defineForm) ──────────────────────────────────────
 *
 * Public authoring surface for per-form binding files. Each entry is a
 * plain TS function `(f, info) => value`. `f` is a typed proxy over the
 * form's other field results; `info` is the form's narrowed FilingInfo.
 * The keys are typed against the per-form `<FormName>` interface emitted
 * from the catalog, so catalog drift (a renamed field, a regenerated
 * catalog) surfaces as a TS compile error in the binding.
 *
 * Authoring contract:
 *   - Return `undefined` / `null` to block the field. The engine retries
 *     on the next fixpoint pass (use for "dependency not resolved yet").
 *   - Return a value to commit the field. The cache locks it (monotonic).
 *   - To write an explicit 0 / "" / etc., return the literal value, NOT
 *     undefined.
 *   - `sum(...)` treats undefined / non-numeric terms as 0. Use it for
 *     line sums where some terms route to `unsupported`.
 *   - `floor(min, value)` clamps a value at `min`. With `min = 0` it
 *     matches IRS "if less than zero enter -0-" instructions.
 *   - `stubZero(reason)` commits a field to 0 when its real source is not
 *     ingested yet but the answer is 0 for every modeled scenario. Grep
 *     `stubZero` to audit these assumptions. Distinct from `unsupported`,
 *     which blocks the field.
 */

/** Binding function. Takes the typed form accessor and resolved FilingInfo; returns the field's value, or undefined to block. */
export type BindingFn<TForm, TInfo extends BaseFilingInfo, K extends keyof TForm> = (
  f: FormAccessor<TForm>,
  info: TInfo,
) => TForm[K] | undefined;

/** Must-file predicate. Returns true (file), false (do not file), or undefined (blocked). */
export type MustFileFn<TInfo extends BaseFilingInfo> = (info: TInfo) => boolean | undefined;

/** Per-field formatter override. Receives the typed value (non-null). */
export type FormatterFn<V> = (value: NonNullable<V>) => string;

export interface FormSpec<
  TForm extends object,
  TInfo extends BaseFilingInfo,
> {
  /** Form-level must-file predicate. */
  mustFile?: MustFileFn<TInfo>;
  /**
   * The explicit decision key the must-file predicate reads (for example
   * "decisions.scope.must_file_federal"). When the predicate returns
   * undefined, the blocked result carries this key as missingDecisionKey.
   * caseState's pendingDecisions reads that key, and it drives Luca to
   * record the decision. Without it, an unrecorded must-file decision
   * blocks the form silently.
   */
  mustFileDecisionKey?: string;
  /** One entry per field; key is the short fieldId (form-id prefix stripped). */
  bindings: Partial<{ [K in keyof TForm]: BindingFn<TForm, TInfo, K> }>;
  /**
   * Optional per-field formatter overrides. Default formatters live with
   * each branded type (Money.format, SSN.digits, etc.). The renderer
   * consults this map first.
   */
  formatters?: Partial<{ [K in keyof TForm]: FormatterFn<TForm[K]> }>;
  /**
   * Fields the form intentionally does not compute yet. These surface as
   * `blocked + unsupported:true` results, so the renderer skips them and
   * caseState does not ask the user about them.
   */
  unsupported?: Partial<{ [K in keyof TForm]: string }>;
  /**
   * Bindings the generator emitted as low-confidence stubs. At runtime the
   * engine treats them like `unsupported`, so the form still loads. They
   * are tracked separately so the bindings-review report can list them.
   */
  todos?: Partial<{ [K in keyof TForm]: string }>;
}

/**
 * Read-only view of a form's evaluated field values, keyed by short
 * fieldId. Reads return `T[K] | undefined`. Undefined means "binding not
 * yet evaluated this pass" or "binding produced a non-ok result".
 *
 * The accessor is also indexable by a full cross-form field id (for
 * example "form-1040.line.11b"), so binding bodies can read values from
 * related forms in the same scenario. The runtime proxy resolves both
 * shapes; the `string`-keyed fallback reflects that in the type system.
 */
export type FormAccessor<TForm> = {
  readonly [K in keyof TForm]: TForm[K] | undefined;
} & {
  readonly [crossFormFieldId: string]: unknown;
};

/** Per-form metadata for reporting and introspection. */
interface FormSpecMeta {
  formId: string;
  bindingKeys: string[];
  unsupportedKeys: string[];
  todoKeys: string[];
  formatterKeys: string[];
  mustFileBound: boolean;
}

const formSpecMeta = new Map<string, FormSpecMeta>();

export function getFormSpecMeta(formId: string): FormSpecMeta | undefined {
  return formSpecMeta.get(formId);
}

export function listFormSpecMeta(): FormSpecMeta[] {
  return Array.from(formSpecMeta.values());
}

/**
 * Register a form's typed bindings. Idempotent: a second call with the
 * same formId overwrites the prior registration.
 */
export function defineForm<
  TForm extends object,
  TInfo extends BaseFilingInfo,
>(formId: string, spec: FormSpec<TForm, TInfo>): void {
  if (spec.mustFile) {
    bindMustFile(
      formId,
      makeMustFileRule(
        formId,
        spec.mustFile as MustFileFn<BaseFilingInfo>,
        spec.mustFileDecisionKey,
      ),
      null,
    );
  }

  const bindingKeys: string[] = [];
  for (const [shortKey, fn] of Object.entries(spec.bindings) as Array<
    [string, BindingFn<TForm, TInfo, keyof TForm> | undefined]
  >) {
    if (!fn) continue;
    const fullId = `${formId}.${shortKey}`;
    bindField(
      formId,
      fullId,
      makeBindingRule(formId, fullId, fn as BindingFn<unknown, BaseFilingInfo, never>),
      null,
    );
    bindingKeys.push(shortKey);
  }

  const unsupportedKeys: string[] = [];
  for (const [shortKey, reason] of Object.entries(spec.unsupported ?? {}) as Array<
    [string, string | undefined]
  >) {
    if (!reason) continue;
    const fullId = `${formId}.${shortKey}`;
    bindField(formId, fullId, makeUnsupportedRule(reason), null);
    unsupportedKeys.push(shortKey);
  }

  const todoKeys: string[] = [];
  for (const [shortKey, reason] of Object.entries(spec.todos ?? {}) as Array<
    [string, string | undefined]
  >) {
    if (!reason) continue;
    const fullId = `${formId}.${shortKey}`;
    bindField(formId, fullId, makeUnsupportedRule(`TODO: ${reason}`), null);
    todoKeys.push(shortKey);
  }

  const formatterKeys: string[] = [];
  for (const [shortKey, formatter] of Object.entries(spec.formatters ?? {})) {
    if (!formatter) continue;
    const fullId = `${formId}.${shortKey}`;
    formatterRegistry.set(fullId, formatter as FormatterFn<unknown>);
    formatterKeys.push(shortKey);
  }

  formSpecMeta.set(formId, {
    formId,
    bindingKeys,
    unsupportedKeys,
    todoKeys,
    formatterKeys,
    mustFileBound: !!spec.mustFile,
  });
}

// ─── Internal: rule factories that wrap typed BindingFns ─────────────────

function makeBindingRule(
  formId: string,
  fieldFullId: string,
  fn: BindingFn<unknown, BaseFilingInfo, never>,
): Rule<unknown, unknown> {
  return {
    name: `typed-binding:${fieldFullId}`,
    paramsSchema: z.unknown(),
    evaluate: (_params, ctx) => {
      const info = ctx.filingInfo;
      if (!info) {
        return blocked(
          `${fieldFullId}: ctx.filingInfo is missing. defineForm bindings need resolveFilingInfo to populate ctx.filingInfo before evaluation.`,
        );
      }
      const accessor = makeFormAccessor(formId, ctx);
      let value: unknown;
      try {
        value = fn(accessor as never, info);
      } catch (err) {
        return blocked(
          `${fieldFullId}: binding threw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      if (value === undefined || value === null) {
        return blocked(`${fieldFullId}: binding returned undefined (blocked).`);
      }
      return {
        ok: true,
        value,
        rationale: `Typed binding ${fieldFullId}.`,
        supportingFactKeys: [],
      };
    },
  };
}

function makeMustFileRule(
  formId: string,
  fn: MustFileFn<BaseFilingInfo>,
  decisionKey?: string,
): Rule<unknown, unknown> {
  return {
    name: `typed-mustFile:${formId}`,
    paramsSchema: z.unknown(),
    evaluate: (_params, ctx) => {
      const info = ctx.filingInfo;
      if (!info) {
        return blocked(`${formId} mustFile: ctx.filingInfo is missing.`);
      }
      let value: boolean | undefined;
      try {
        value = fn(info);
      } catch (err) {
        return blocked(
          `${formId} mustFile: threw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      if (value === undefined) {
        return decisionKey
          ? blocked(
              `${formId} mustFile: waiting on decision ${decisionKey}.`,
              { decisionKey },
            )
          : blocked(`${formId} mustFile: returned undefined.`);
      }
      return {
        ok: true,
        value,
        rationale: `Typed mustFile for ${formId}.`,
        supportingFactKeys: [],
      };
    },
  };
}

function makeUnsupportedRule(reason: string): Rule<unknown, unknown> {
  return {
    name: "typed-unsupported",
    paramsSchema: z.unknown(),
    evaluate: () => ({
      ok: false as const,
      reason,
      unsupported: true,
    }),
  };
}

/*
 * ─── Form accessor proxy ─────────────────────────────────────────────────
 *
 * Bindings read other fields via `f["line.1z"]` (short key) or
 * `f["form-other.line.X"]` (cross-form full key). The proxy tells the two
 * apart by a "form-" / "schedule-" prefix.
 */

function makeFormAccessor(formId: string, ctx: EngineContext): unknown {
  return new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key !== "string") return undefined;
        const fullId =
          key.startsWith(`${formId}.`) || isLikelyFullFieldId(key)
            ? key
            : `${formId}.${key}`;
        const result = ctx.fieldResult(fullId);
        if (!result) return undefined;
        if (result.ok) return result.value;
        return undefined;
      },
    },
  );
}

function isLikelyFullFieldId(key: string): boolean {
  return /^(form-|schedule-)/.test(key);
}

// ─── sum / floor helpers (used inside binding bodies) ────────────────────

/**
 * Sum any number of numeric inputs. Undefined / null / NaN / non-numeric
 * values count as 0. The parameter type is `unknown` so cross-form
 * accessor reads (which the type system widens to `unknown`) flow through
 * without casts. The runtime `typeof v === "number"` filter keeps the
 * math honest.
 *
 * An unsupported or not-yet-resolved upstream term contributes 0 rather
 * than blocking the sum. To block the sum when any term is missing, write
 * the arithmetic by hand and return undefined from the binding.
 */
export function sum(...values: unknown[]): number {
  let total = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

/** max(value, min). Treats undefined / non-numeric as `min`. */
export function floor(min: number, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  return Math.max(min, value);
}

/**
 * Stub binding for a numeric field whose real data source is not ingested
 * yet, but whose value is 0 for every supported taxpayer scenario. The
 * `until` reason documents what must land to remove the stub. Grep for
 * `stubZero` to find every such assumption.
 *
 * Differs from `unsupported`:
 *   - `unsupported` blocks the field. The renderer leaves it blank, and
 *     caseState does not ask the user. Use it when the value is unknown.
 *   - `stubZero` commits the field to 0. Use it when the value IS zero
 *     for our worked scenarios. Example: CA 540 line 14 (Schedule CA
 *     subtractions) is always 0 for a single W-2 filer with no
 *     adjustments. Downstream sums get the same result either way; the
 *     difference is whether the form shows "0" or leaves the line blank.
 *
 * Example:
 *   "line.14_ca_adjustments_subtractions":
 *     stubZero("until Schedule CA Part I line 27 col B is ingested"),
 */
export function stubZero(_until: string): () => number {
  return () => 0;
}

// ─── Formatter registry (consulted by the renderer) ──────────────────────

const formatterRegistry = new Map<string, FormatterFn<unknown>>();

/** Read a per-field formatter override, registered via FormSpec.formatters. */
export function getFormatter(fieldId: string): FormatterFn<unknown> | undefined {
  return formatterRegistry.get(fieldId);
}
