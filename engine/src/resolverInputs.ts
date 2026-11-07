import { partitionTrades, type PartitionedTrades } from "./federal/8949/partitionTrades.js";
import type { MustFileResolution } from "./filingInfo.js";
import { sum } from "./money.js";

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
  for (const fact of opts.facts) factByKey.set(fact.key, fact.value);
  const decisionByKey = new Map<string, unknown>();
  for (const decision of opts.decisions) decisionByKey.set(decision.decisionKey, decision.decision);
  return {
    facts: opts.facts,
    factByKey,
    decisionByKey,
    trades: partitionTrades(opts.facts, decisionByKey),
  };
}

export function text(inputs: ResolverInputs, key: string): string | undefined {
  const value = inputs.factByKey.get(key);
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(
      `resolveFilingInfo: fact "${key}" expected string, got ${typeof value} ` +
        `(value=${JSON.stringify(value).slice(0, 100)}). Re-record this fact as a ` +
        `plain string via record-tax-facts.`,
    );
  }
  return value;
}

export function num(inputs: ResolverInputs, key: string): number | undefined {
  const value = inputs.factByKey.get(key);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function factsInCategory(
  inputs: ResolverInputs,
  cat: string,
): Array<{ key: string; value: unknown }> {
  return inputs.facts.filter((fact) => fact.category === cat);
}

export function sumW2Box(inputs: ResolverInputs, boxKey: string): number {
  return sum(
    ...factsInCategory(inputs, "wages").map(
      (row) => (row.value as Record<string, unknown>)?.[boxKey],
    ),
  );
}

// No matching facts means 0 (no 1099-INT → no interest), not unknown.
export function sumInvestmentBox(
  inputs: ResolverInputs,
  boxKey: string,
  keyFilter?: (key: string) => boolean,
): number {
  return sum(
    ...factsInCategory(inputs, "investment_income")
      .filter((row) => !keyFilter || keyFilter(row.key))
      .map((row) => (row.value as Record<string, unknown>)?.[boxKey]),
  );
}

export function sumCaSdi(wageRows: Array<{ value: unknown }>): number {
  const box14 = wageRows.flatMap((row) => {
    const entries = (row.value as Record<string, unknown>)?.box14;
    return Array.isArray(entries) ? (entries as Array<Record<string, unknown>>) : [];
  });
  return sum(
    ...box14
      .filter((entry) => typeof entry?.label === "string" && /CA\s*SDI/i.test(entry.label))
      .map((entry) => entry.amount),
  );
}

// A 0 or false is an input; only undefined is missing.
export function missingInputs(required: Record<string, unknown>): string[] {
  return Object.entries(required)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);
}

export interface MustFileFallback {
  rule: string;
  value: boolean;
  triggeredByFactKeys?: readonly string[];
  triggeredByDecisionKeys?: readonly string[];
}

// An explicit boolean decision wins, even false, so a scenario can opt out of a form.
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
