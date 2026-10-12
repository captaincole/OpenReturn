/*
 * Typed binding API (defineForm) — the public authoring surface for
 * per-form binding files.
 *
 * Each entry is a plain TS function `(f, info) => value`. `f` is a typed
 * proxy over the form's other field results; `info` is the form's
 * narrowed FilingInfo. The keys are typed against the per-form
 * `<FormName>` interface emitted from the catalog, so catalog drift (a
 * renamed field, a regenerated catalog) surfaces as a TS compile error
 * in the binding.
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
 *
 * The evaluator (registry, evaluateForm, fixpoint orchestration) lives in
 * engine.ts; this module registers rules into it via bindField /
 * bindMustFile.
 */

import { z } from "zod";
import {
  _resetBindingRegistryForTests,
  bindField,
  bindMustFile,
  type EngineContext,
  type Rule,
} from "./engine.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import { blocked } from "./types.js";

// ─── Authoring types ─────────────────────────────────────────────────────

/** Binding function. Takes the typed form accessor and resolved FilingInfo; returns the field's value, or undefined to block. */
export type BindingFn<TForm, TInfo extends BaseFilingInfo, K extends keyof TForm> = (
  f: FormAccessor<TForm>,
  info: TInfo,
) => TForm[K] | undefined;

/** Must-file predicate. Returns true (file), false (do not file), or undefined (blocked). */
export type MustFileFn<TInfo extends BaseFilingInfo> = (info: TInfo) => boolean | undefined;

/** Per-field formatter override. Receives the typed value (non-null). */
export type FormatterFn<V> = (value: NonNullable<V>) => string;

export interface FormSpec<TForm extends object, TInfo extends BaseFilingInfo> {
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

// ─── Spec metadata (reporting / introspection) ───────────────────────────

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

// ─── Registration ────────────────────────────────────────────────────────

/**
 * Walk a spec sub-map (bindings / unsupported / todos / formatters),
 * invoke `register` for each non-null entry, and return the short keys
 * that were registered.
 */
function registerEntries<V>(
  entries: object | undefined,
  register: (shortKey: string, value: NonNullable<V>) => void,
): string[] {
  const keys: string[] = [];
  for (const [shortKey, value] of Object.entries(entries ?? {}) as Array<[string, V]>) {
    if (value === undefined || value === null) continue;
    register(shortKey, value as NonNullable<V>);
    keys.push(shortKey);
  }
  return keys;
}

/**
 * Register a form's typed bindings. Idempotent: a second call with the
 * same formId overwrites the prior registration.
 */
export function defineForm<TForm extends object, TInfo extends BaseFilingInfo>(
  formId: string,
  spec: FormSpec<TForm, TInfo>,
): void {
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

  const bindingKeys = registerEntries<BindingFn<TForm, TInfo, keyof TForm>>(
    spec.bindings,
    (shortKey, fn) => {
      const fullId = `${formId}.${shortKey}`;
      bindField(
        formId,
        fullId,
        makeBindingRule(formId, fullId, fn as BindingFn<unknown, BaseFilingInfo, never>),
        null,
      );
    },
  );

  const unsupportedKeys = registerEntries<string>(spec.unsupported, (shortKey, reason) => {
    bindField(formId, `${formId}.${shortKey}`, makeUnsupportedRule(reason), null);
  });

  const todoKeys = registerEntries<string>(spec.todos, (shortKey, reason) => {
    bindField(formId, `${formId}.${shortKey}`, makeUnsupportedRule(`TODO: ${reason}`), null);
  });

  const formatterKeys = registerEntries<FormatterFn<unknown>>(
    spec.formatters,
    (shortKey, formatter) => {
      formatterRegistry.set(`${formId}.${shortKey}`, formatter);
    },
  );

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
          ? blocked(`${formId} mustFile: waiting on decision ${decisionKey}.`, { decisionKey })
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
          key.startsWith(`${formId}.`) || isLikelyFullFieldId(key) ? key : `${formId}.${key}`;
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

/** Test-only: clears all registrations. Production callers never use this. */
export function _resetRegistryForTests(): void {
  _resetBindingRegistryForTests();
  formatterRegistry.clear();
  formSpecMeta.clear();
}
