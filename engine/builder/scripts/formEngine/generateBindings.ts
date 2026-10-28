import { engineSrcDir } from "@openreturn/engine/paths";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runGenerateBindings } from "../../src/generateBindingsWorkflow/index.js";
import type { Command } from "../lib/cli";

/* taxYear is unused here. It stays so the required --tax-year arg still drives the workflow. */
function findDefaultCatalog(formId: string, _taxYear: number): string {
  const shortName = formId.replace(/^form-/, "");
  const candidates = [
    `federal/${shortName}/catalog.json`,
    `state/ca/${shortName}/catalog.json`,
    `state/ny/${shortName}/catalog.json`,
  ];
  for (const c of candidates) {
    const abs = resolve(engineSrcDir, c);
    if (existsSync(abs)) return abs;
  }
  /* The federal fallback makes runGenerateBindings fail with a clear "file not found". */
  return resolve(engineSrcDir, `federal/${shortName}/catalog.json`);
}

interface Args {
  formId: string;
  taxYear: number;
  catalogPath: string;
  outputPath: string;
  minConfidence: "high" | "medium" | "low";
}

function findDefaultOutput(catalogPath: string): string {
  return resolve(dirname(catalogPath), "bindings.ts");
}

function parseCmdArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const arg = argv.find((a) => a.startsWith(`${flag}=`));
    return arg ? arg.slice(flag.length + 1) : undefined;
  };
  const formId = get("--form-id");
  const taxYearStr = get("--tax-year");
  if (!formId || !taxYearStr) {
    throw new Error("Required: --form-id, --tax-year");
  }
  const taxYear = parseInt(taxYearStr, 10);
  const catalogOverride = get("--catalog");
  const catalogPath = catalogOverride
    ? resolve(catalogOverride)
    : findDefaultCatalog(formId, taxYear);
  const outputPath = resolve(get("--output") ?? findDefaultOutput(catalogPath));
  const minConfidenceRaw = get("--min-confidence") ?? "high";
  if (minConfidenceRaw !== "high" && minConfidenceRaw !== "medium" && minConfidenceRaw !== "low") {
    throw new Error(
      `--min-confidence must be one of: high, medium, low (got "${minConfidenceRaw}")`,
    );
  }
  return {
    formId,
    taxYear,
    catalogPath,
    outputPath,
    minConfidence: minConfidenceRaw,
  };
}

async function run(argv: string[]): Promise<void> {
  const args = parseCmdArgs(argv);

  console.log(`generate-bindings: ${args.formId} (${args.taxYear})`);
  console.log(`  Catalog:        ${args.catalogPath}`);
  console.log(`  Output:         ${args.outputPath}`);
  console.log(`  Min confidence: ${args.minConfidence}`);
  console.log();

  const result = await runGenerateBindings({
    formId: args.formId,
    taxYear: args.taxYear,
    catalogPath: args.catalogPath,
    outputPath: args.outputPath,
    minConfidence: args.minConfidence,
  });

  console.log();
  console.log(
    `  Fields: ${result.fieldCount}, emitted: ${result.emittedCount}, todos: ${result.todoCount}, unsupported: ${result.unsupportedCount}, unbound: ${result.unboundCount}`,
  );
  console.log(`  Retrieved IRS context for ${result.retrievalCount} field(s)`);
  console.log(
    `  Usage: in=${result.usage.input_tokens} out=${result.usage.output_tokens} cache_read=${result.usage.cache_read_input_tokens} cache_create=${result.usage.cache_creation_input_tokens}`,
  );
  console.log(`  Confidence breakdown:`);
  for (const level of ["high", "medium", "low"] as const) {
    console.log(`    ${level}: ${result.confidenceBreakdown[level] ?? 0}`);
  }
  console.log(`  Rule breakdown:`);
  const sorted = Object.entries(result.ruleBreakdown).sort((a, b) => b[1] - a[1]);
  for (const [rule, count] of sorted) {
    console.log(`    ${rule}: ${count}`);
  }
}

export const generateBindingsCommand: Command = {
  name: "generate-bindings",
  summary: "AI-generate engine/src/<…>/bindings.ts from a form's catalog",
  options: [
    { flag: "--form-id=<id>", desc: "e.g. form-1040 (required)" },
    { flag: "--tax-year=<year>", desc: "e.g. 2025 (required)" },
    { flag: "--catalog=<path>", desc: "catalog.json (default: auto-discovered under forms/)" },
    { flag: "--output=<path>", desc: "bindings.ts (default: derived from catalog location)" },
    { flag: "--min-confidence=<l>", desc: "high | medium | low (default: high)" },
  ],
  run,
};
