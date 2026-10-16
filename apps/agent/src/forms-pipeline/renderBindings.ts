/*
 * Phase D — render typed bindings into TypeScript source for a per-form
 * `bindings.ts` file under `src/engine/<jurisdiction>/<short>/`.
 *
 * The classifier outputs structured bindings (one of N rule shapes per
 * field) plus a confidence rating. This renderer translates each binding
 * into a typed TS function body for the `defineForm<TForm, TInfo>` shape.
 * It routes anything below `minConfidence` to a `todos` map. Fact /
 * decision keys without a known FilingInfo slot also become todos (with
 * rationale).
 *
 * Layout of the emitted file:
 *
 *   import { defineForm, sum, floor } from "<relative engine.ts>";
 *   import { lookupTax } from "<relative data/taxTable.ts>";
 *   import type { Form540 } from "./types.js";
 *   import type { Form540FilingInfo } from "./filingInfo.js";
 *
 *   export function register(): void {
 *     defineForm<Form540, Form540FilingInfo>("form-540", {
 *       mustFile: (info) => info.mustFileCA540,
 *       bindings: {
 *         "header.first_name": (_, info) => info.taxpayerFirstName,
 *         "line.12_state_wages": (_, info) => info.w2StateWages,
 *         "line.31_tax_amount": (f, info) => {
 *           if (!info.filingStatus) return undefined;
 *           const income = f["line.19_taxable_income"];
 *           if (typeof income !== "number") return undefined;
 *           const r = lookupTax("ca-2025", income, info.filingStatus);
 *           return r.ok ? r.tax : undefined;
 *         },
 *         …
 *       },
 *       unsupported: {
 *         "header.combat_zone_checkbox": "No combat-zone scenario built yet.",
 *       },
 *       todos: {
 *         "line.40_ctc": "fromFields with terms whose source form isn't ingested",
 *       },
 *     });
 *   }
 *
 * Each item the classifier rated below the minConfidence floor lands in
 * `todos`. Items whose rule is `unsupported` always land in `unsupported`.
 */

import { dirname, relative } from "node:path";
import type { FieldInventory } from "../engine/catalog.js";
import type { ClassifiedBinding, Confidence } from "./classifyBindings.js";
import { DECISION_TO_SLOT, quote, shortKey, translate } from "./translateBinding.js";

// ─── Public shapes ───────────────────────────────────────────────────────

export interface RenderBindingsOpts {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  formTitle: string;
  fields: FieldInventory[]; // catalog ordinal order
  bindings: ClassifiedBinding[];
  mustFile: { decisionKey: string; rationale: string };
  /** Absolute output path for the rendered TS. Used for relative imports. */
  outputPath: string;
  /**
   * Minimum confidence to commit a binding into `bindings`. Anything below
   * goes to `todos` for human review.
   */
  minConfidence: Confidence;
  /**
   * Names of the Form-id-specific types to import — derived from the
   * caller's per-form layout (e.g. `Form540`, `Form540FilingInfo`).
   */
  typeInterfaceName: string;
  filingInfoInterfaceName: string;
}

export interface RenderBindingsReport {
  source: string;
  emittedCount: number;
  todoCount: number;
  unsupportedCount: number;
  unboundCount: number;
  confidenceBreakdown: Record<Confidence, number>;
  ruleBreakdown: Record<string, number>;
}

// ─── Entry point ─────────────────────────────────────────────────────────

type RenderEntry =
  | { kind: "binding"; field: FieldInventory; body: string; rationale: string }
  | { kind: "unsupported"; field: FieldInventory; reason: string }
  | { kind: "todo"; field: FieldInventory; reason: string }
  | { kind: "unbound"; field: FieldInventory };

interface BucketResult {
  entries: RenderEntry[];
  ruleBreakdown: Record<string, number>;
  confidenceBreakdown: Record<Confidence, number>;
  usesLookupTax: boolean;
  usesSum: boolean;
  usesFloor: boolean;
}

/* Sort each catalog field into its bucket and tally the breakdowns. */
function bucketFields(opts: RenderBindingsOpts): BucketResult {
  const bindingByFieldId = new Map<string, ClassifiedBinding>();
  for (const b of opts.bindings) {
    if (!bindingByFieldId.has(b.fieldId)) bindingByFieldId.set(b.fieldId, b);
  }
  const minOrder = CONFIDENCE_ORDER[opts.minConfidence];

  const result: BucketResult = {
    entries: [],
    ruleBreakdown: {},
    confidenceBreakdown: { high: 0, medium: 0, low: 0 },
    usesLookupTax: false,
    usesSum: false,
    usesFloor: false,
  };

  for (const field of opts.fields) {
    const binding = bindingByFieldId.get(field.fieldId);
    if (!binding) {
      result.entries.push({ kind: "unbound", field });
      continue;
    }
    result.ruleBreakdown[binding.ruleName] = (result.ruleBreakdown[binding.ruleName] ?? 0) + 1;
    result.confidenceBreakdown[binding.confidence]++;
    result.entries.push(bucketOneField(field, binding, minOrder, opts.formId, result));
  }
  return result;
}

/*
 * Bucket one bound field. The `unsupported` rule always goes to the
 * unsupported map regardless of confidence; bindings below the
 * confidence floor become todos; the rest translate to TS bodies (and
 * failed translations become todos too). Sets the uses* flags on
 * `result` as translations require helpers.
 */
function bucketOneField(
  field: FieldInventory,
  binding: ClassifiedBinding,
  minOrder: number,
  formId: string,
  result: BucketResult,
): RenderEntry {
  if (binding.ruleName === "unsupported") {
    const reason = String(binding.params.reason ?? binding.rationale);
    return { kind: "unsupported", field, reason };
  }

  if (CONFIDENCE_ORDER[binding.confidence] < minOrder) {
    return {
      kind: "todo",
      field,
      reason: `confidence=${binding.confidence}: ${binding.rationale}`,
    };
  }

  const translated = translate(binding, formId);
  if (translated.kind === "todo") {
    return { kind: "todo", field, reason: `${binding.ruleName}: ${translated.reason}` };
  }
  if (translated.usesLookupTax) result.usesLookupTax = true;
  if (translated.usesSum) result.usesSum = true;
  if (translated.usesFloor) result.usesFloor = true;
  return { kind: "binding", field, body: translated.body, rationale: binding.rationale };
}

/* File header, imports, register() opener, and the mustFile line(s). */
function renderPreamble(opts: RenderBindingsOpts, b: BucketResult): string[] {
  const engineImport = relImport(opts.outputPath, "src/engine/defineForm.ts");
  const taxTableImport = relImport(opts.outputPath, "src/engine/data/taxTable.ts");

  const engineSymbols = ["defineForm"];
  if (b.usesSum) engineSymbols.push("sum");
  if (b.usesFloor) engineSymbols.push("floor");

  const out: string[] = [];
  out.push(`/*`);
  out.push(` * AI-generated by \`form-engine generate-bindings\`. Hand edits are`);
  out.push(` * allowed. Mark them with \`// MANUAL EDIT:\` so they are easy to find`);
  out.push(` * and re-apply after a regen.`);
  out.push(` * Source: forms-pipeline/generateBindingsWorkflow`);
  out.push(` * Form: ${opts.formTitle} (${opts.formId}, tax year ${opts.taxYear})`);
  out.push(` * Generated at: ${new Date().toISOString()}`);
  out.push(` */`);
  out.push("");
  out.push(`import { ${engineSymbols.join(", ")} } from "${engineImport}";`);
  if (b.usesLookupTax) {
    out.push(`import { lookupTax } from "${taxTableImport}";`);
  }
  out.push(`import type { ${opts.typeInterfaceName} } from "./types.js";`);
  out.push(`import type { ${opts.filingInfoInterfaceName} } from "./filingInfo.js";`);
  out.push("");
  out.push(`/*`);
  out.push(` * register() wraps the defineForm side effect. Callers import it and`);
  out.push(` * run the registration once at startup. The call is idempotent; a`);
  out.push(` * second call overwrites in place.`);
  out.push(` */`);
  out.push(`export function register(): void {`);
  out.push(
    `  defineForm<${opts.typeInterfaceName}, ${opts.filingInfoInterfaceName}>(${quote(opts.formId)}, {`,
  );

  const mustFileSlot = DECISION_TO_SLOT[opts.mustFile.decisionKey];
  if (mustFileSlot) {
    out.push(`    // ${opts.mustFile.rationale}`);
    out.push(`    mustFile: (info) => info.${mustFileSlot},`);
  } else {
    /*
     * No slot for this decision: leave a TODO. The engine refuses to
     * evaluate the form until a slot is filled in.
     */
    out.push(
      `    // TODO: must-file decision "${opts.mustFile.decisionKey}" has no FilingInfo slot.`,
    );
    out.push(`    // ${opts.mustFile.rationale}`);
    out.push(`    // mustFile: (info) => info.???,`);
  }
  out.push("");
  return out;
}

/* The bindings / unsupported / todos sections of the defineForm spec. */
function renderSpecSections(opts: RenderBindingsOpts, entries: RenderEntry[]): string[] {
  const out: string[] = [];

  out.push(`    bindings: {`);
  for (const e of entries) {
    if (e.kind !== "binding") continue;
    out.push(`      // ${e.rationale}`);
    out.push(`      ${quote(shortKey(e.field.fieldId, opts.formId))}: ${e.body},`);
  }
  out.push(`    },`);
  out.push("");

  const unsupported = entries.filter((e) => e.kind === "unsupported");
  if (unsupported.length > 0) {
    out.push(`    unsupported: {`);
    for (const e of unsupported) {
      out.push(`      ${quote(shortKey(e.field.fieldId, opts.formId))}: ${quote(e.reason)},`);
    }
    out.push(`    },`);
    out.push("");
  }

  const todos = entries.filter((e) => e.kind === "todo");
  if (todos.length > 0) {
    out.push(`    todos: {`);
    for (const e of todos) {
      out.push(`      ${quote(shortKey(e.field.fieldId, opts.formId))}: ${quote(e.reason)},`);
    }
    out.push(`    },`);
    out.push("");
  }

  out.push(`  });`);
  out.push(`}`);
  out.push("");
  return out;
}

export function renderBindings(opts: RenderBindingsOpts): RenderBindingsReport {
  const bucketed = bucketFields(opts);
  const { entries } = bucketed;

  const out = [...renderPreamble(opts, bucketed), ...renderSpecSections(opts, entries)];

  const emittedCount = entries.filter((e) => e.kind === "binding").length;
  const todoCount = entries.filter((e) => e.kind === "todo").length;
  const unsupportedCount = entries.filter((e) => e.kind === "unsupported").length;
  const unboundCount = entries.filter((e) => e.kind === "unbound").length;

  out.push(`/*`);
  out.push(
    ` * Summary: ${emittedCount} binding(s), ${todoCount} todo(s), ${unsupportedCount} unsupported, ${unboundCount} unbound.`,
  );
  out.push(
    ` * Confidence: ${bucketed.confidenceBreakdown.high} high, ${bucketed.confidenceBreakdown.medium} medium, ${bucketed.confidenceBreakdown.low} low.`,
  );
  out.push(` */`);
  out.push("");

  return {
    source: out.join("\n"),
    emittedCount,
    todoCount,
    unsupportedCount,
    unboundCount,
    confidenceBreakdown: bucketed.confidenceBreakdown,
    ruleBreakdown: bucketed.ruleBreakdown,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/**
 * Compute an ESM-friendly relative import path from `fromFilePath` to
 * `toRelativePath`, both anchored at the agent's project root. Replaces
 * the `.ts` extension with `.js` so the runtime resolver works under tsx
 * and in the compiled output.
 */
function relImport(fromFilePath: string, toRelativePath: string): string {
  /*
   * toRelativePath is like "src/engine/defineForm.ts". Turn it into an
   * absolute path under the same root as fromFilePath.
   */
  const fromAbs = fromFilePath;
  const matchRoot = fromAbs.match(/^(.*?)(\/apps\/agent\/)/);
  const projectRoot = matchRoot
    ? `${matchRoot[1]}${matchRoot[2]}`.replace(/\/$/, "")
    : process.cwd();
  const toAbs = `${projectRoot}/${toRelativePath}`;
  let rel = relative(dirname(fromAbs), toAbs);
  rel = rel.replace(/\.ts$/, ".js");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}
