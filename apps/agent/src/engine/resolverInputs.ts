/*
 * Shared inputs for the per-form slot resolvers (filingInfoResolvers.ts):
 * the ResolverInputs view over facts + decisions, typed fact readers,
 * and must-file resolution with provenance.
 */

import { partitionTrades, type PartitionedTrades } from "./federal/8949/partitionTrades.js";
import type { MustFileResolution } from "./filingInfo.js";

// ─── Shared inputs view ──────────────────────────────────────────────────

export interface ResolverInputs {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  factByKey: Map<string, unknown>;
  decisionByKey: Map<string, unknown>;
  trades: PartitionedTrades;
}

export function makeResolverInputs(opts: {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  decisions: ReadonlyArray<{ decisionKey: string; decision: unknown }>;
}): ResolverInputs {
  const factByKey = new Map<string, unknown>();
  for (const f of opts.facts) factByKey.set(f.key, f.value);
  const decisionByKey = new Map<string, unknown>();
  for (const d of opts.decisions) decisionByKey.set(d.decisionKey, d.decision);
  return {
    facts: opts.facts,
    factByKey,
    decisionByKey,
    trades: partitionTrades(opts.facts, decisionByKey),
  };
}

// ─── Fact readers ────────────────────────────────────────────────────────

export function text(inputs: ResolverInputs, key: string): string | undefined {
  const v = inputs.factByKey.get(key);
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") {
    throw new Error(
      `resolveFilingInfo: fact "${key}" expected string, got ${typeof v} ` +
        `(value=${JSON.stringify(v).slice(0, 100)}). Re-record this fact as a ` +
        `plain string via record-tax-facts.`,
    );
  }
  return v;
}

/*
 * Single-key numeric read. Returns undefined when missing or
 * non-numeric. Callers use ?? 0 when they compose a sum.
 */
export function num(inputs: ResolverInputs, key: string): number | undefined {
  const v = inputs.factByKey.get(key);
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function factsInCategory(
  inputs: ResolverInputs,
  cat: string,
): Array<{ key: string; value: unknown }> {
  return inputs.facts.filter((f) => f.category === cat);
}

export function sumW2Box(inputs: ResolverInputs, boxKey: string): number {
  let total = 0;
  for (const row of factsInCategory(inputs, "wages")) {
    const v = (row.value as Record<string, unknown>)?.[boxKey];
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

/*
 * Sum a numeric field across investment_income facts. The optional
 * `keyFilter` narrows the read to one 1099 section. 1099-DIV box1a does
 * not overlap 1099-INT box1 today, but the filter makes the read
 * explicit and protects against future box-name overlap. Returns 0 when
 * no facts match, same convention as sumW2Box: "no 1099-INT at all → 0
 * taxable interest" rather than "we do not know."
 */
export function sumInvestmentBox(
  inputs: ResolverInputs,
  boxKey: string,
  keyFilter?: (key: string) => boolean,
): number {
  let total = 0;
  for (const row of factsInCategory(inputs, "investment_income")) {
    if (keyFilter && !keyFilter(row.key)) continue;
    const v = (row.value as Record<string, unknown>)?.[boxKey];
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

export function sumCaSdi(wageRows: Array<{ value: unknown }>): number {
  let total = 0;
  for (const row of wageRows) {
    const box14 = (row.value as Record<string, unknown>)?.box14;
    if (!Array.isArray(box14)) continue;
    for (const entry of box14) {
      const label = (entry as Record<string, unknown>)?.label;
      const amount = (entry as Record<string, unknown>)?.amount;
      if (
        typeof label === "string" &&
        /CA\s*SDI/i.test(label) &&
        typeof amount === "number" &&
        Number.isFinite(amount)
      ) {
        total += amount;
      }
    }
  }
  return total;
}

// ─── Required inputs ─────────────────────────────────────────────────────

/**
 * The keys whose resolved value is still undefined: the inputs a form
 * needs before it is complete. Pass each required input's fact or
 * decision key with the value the resolver read for it. A 0 or false is
 * an input; only undefined is missing.
 */
export function missingInputs(required: Record<string, unknown>): string[] {
  return Object.entries(required)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);
}

// ─── Must-file resolution with provenance ────────────────────────────────

/**
 * Resolve a must-file flag with explicit-decision-wins semantics, and
 * capture an audit trail (EngineDerivation) for the path that fired.
 *
 * Semantics:
 *  - An explicit boolean decision wins, even when false. This lets a
 *    scenario opt out of a form it would otherwise default into.
 *  - Otherwise, walk `fallbacks` in order and return the first whose
 *    `value` is true. Source order is the priority.
 *  - All fallbacks false → return false with a "no signal" derivation.
 *  - No fallbacks AND no explicit decision → value is undefined (caller
 *    decides), derivation is undefined.
 *
 * We record provenance even though the must_file_* keys are not in
 * ai_decisions. A CPA who reviews the doc-gen sidecar should see WHY
 * Schedule D was generated. The engine makes these scope calls today; the
 * EngineDerivation captures that honestly.
 */
export interface MustFileFallback {
  /** Plain-English description of the rule. CPA-readable. */
  rule: string;
  /** True when this fallback signal currently fires. */
  value: boolean;
  /** Fact keys this rule consumed. */
  triggeredByFactKeys?: readonly string[];
  /** Decision keys this rule consumed. */
  triggeredByDecisionKeys?: readonly string[];
}

export function resolveMustFile(
  decisions: Map<string, unknown>,
  opts: { explicitKey: string; fallbacks?: MustFileFallback[] },
): MustFileResolution {
  const decisionKey = opts.explicitKey;
  const explicit = decisions.get(opts.explicitKey);
  if (typeof explicit === "boolean") {
    return {
      decisionKey,
      value: explicit,
      derivation: {
        decidedBy: "engine",
        rule: `explicit decision: ${opts.explicitKey} = ${explicit}`,
        triggeredByFactKeys: [],
        triggeredByDecisionKeys: [opts.explicitKey],
      },
    };
  }
  const fallbacks = opts.fallbacks ?? [];
  for (const fb of fallbacks) {
    if (fb.value === true) {
      return {
        decisionKey,
        value: true,
        derivation: {
          decidedBy: "engine",
          rule: fb.rule,
          triggeredByFactKeys: fb.triggeredByFactKeys ?? [],
          triggeredByDecisionKeys: fb.triggeredByDecisionKeys ?? [],
        },
      };
    }
  }
  if (fallbacks.length > 0) {
    return {
      decisionKey,
      value: false,
      derivation: {
        decidedBy: "engine",
        rule: "no triggering signal (no explicit decision; all fallback signals absent)",
        triggeredByFactKeys: [],
        triggeredByDecisionKeys: [],
      },
    };
  }
  return { decisionKey, value: undefined, derivation: undefined };
}

/*
 * Shared fallback pair for Form 8949 and Schedule D: trade facts win when
 * present (the more specific signal); has_reportable_sales is the safety
 * net.
 */
export function reportableSalesFallbacks(inputs: ResolverInputs): MustFileFallback[] {
  const tradeCount = inputs.trades.short.length + inputs.trades.long.length;
  return [
    {
      rule: `fallback: ${tradeCount} trade fact(s) present`,
      value: tradeCount > 0,
      triggeredByFactKeys: inputs.trades.factKeys,
    },
    {
      rule: "fallback: decisions.scope.has_reportable_sales = true",
      value: inputs.decisionByKey.get("decisions.scope.has_reportable_sales") === true,
      triggeredByDecisionKeys: ["decisions.scope.has_reportable_sales"],
    },
  ];
}
