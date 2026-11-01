/*
 * Binding contract: return undefined or null to block the field; the
 * engine retries on the next pass. A returned value commits, and the cache
 * locks it. To write an explicit 0 or "", return it, not undefined.
 */

import { z } from "zod";
import {
  _resetBindingRegistryForTests,
  bindField,
  type EngineContext,
  type Rule,
} from "./engine.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import { blocked } from "./types.js";

export type BindingFn<TForm, TInfo extends BaseFilingInfo, K extends keyof TForm> = (
  f: FormAccessor<TForm>,
  info: TInfo,
) => TForm[K] | undefined;

export type FormatterFn<V> = (value: NonNullable<V>) => string;

export interface FormSpec<TForm extends object, TInfo extends BaseFilingInfo> {
  bindings: Partial<{ [K in keyof TForm]: BindingFn<TForm, TInfo, K> }>;
  formatters?: Partial<{ [K in keyof TForm]: FormatterFn<TForm[K]> }>;
  unsupported?: Partial<{ [K in keyof TForm]: string }>;
}

// Also indexable by a full cross-form field id ("form-1040.line.11b").
export type FormAccessor<TForm> = {
  readonly [K in keyof TForm]: TForm[K] | undefined;
} & {
  readonly [crossFormFieldId: string]: unknown;
};

function registerEntries<V>(
  entries: object | undefined,
  register: (shortKey: string, value: NonNullable<V>) => void,
): void {
  for (const [shortKey, value] of Object.entries(entries ?? {}) as Array<[string, V]>) {
    if (value === undefined || value === null) continue;
    register(shortKey, value as NonNullable<V>);
  }
}

export function defineForm<TForm extends object, TInfo extends BaseFilingInfo>(
  formId: string,
  spec: FormSpec<TForm, TInfo>,
): void {
  registerEntries<BindingFn<TForm, TInfo, keyof TForm>>(spec.bindings, (shortKey, fn) => {
    const fullId = `${formId}.${shortKey}`;
    bindField(
      formId,
      fullId,
      makeBindingRule(formId, fullId, fn as BindingFn<unknown, BaseFilingInfo, never>),
      null,
    );
  });

  registerEntries<string>(spec.unsupported, (shortKey, reason) => {
    bindField(formId, `${formId}.${shortKey}`, makeUnsupportedRule(reason), null);
  });

  registerEntries<FormatterFn<unknown>>(spec.formatters, (shortKey, formatter) => {
    formatterRegistry.set(`${formId}.${shortKey}`, formatter);
  });
}

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

// A "form-" or "schedule-" prefix marks a cross-form full key.
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

/*
 * Commits 0 when the source is not ingested yet but the value is 0 for
 * every modeled scenario. `unsupported` blocks instead (blank line). Grep
 * `stubZero` to audit these assumptions.
 */
export function stubZero(_until: string): () => number {
  return () => 0;
}

const formatterRegistry = new Map<string, FormatterFn<unknown>>();

export function getFormatter(fieldId: string): FormatterFn<unknown> | undefined {
  return formatterRegistry.get(fieldId);
}

export function _resetRegistryForTests(): void {
  _resetBindingRegistryForTests();
  formatterRegistry.clear();
}
