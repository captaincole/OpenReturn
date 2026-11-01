import { engineSrcDir } from "@openreturn/engine/paths";
import { resolve } from "node:path";
import { runIngestForm } from "../../src/ingestFormWorkflow/index.js";
import type { Command } from "../lib/cli";

interface Args {
  pdf: string;
  formId: string;
  taxYear: number;
  jurisdiction: string;
  title: string;
}

function parseCmdArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const arg = argv.find((candidate) => candidate.startsWith(`${flag}=`));
    return arg ? arg.slice(flag.length + 1) : undefined;
  };
  const pdf = get("--pdf");
  const formId = get("--form-id");
  const taxYearStr = get("--tax-year");
  const jurisdiction = get("--jurisdiction") ?? "federal";
  const title = get("--title");
  if (!pdf || !formId || !taxYearStr || !title) {
    throw new Error(
      "Required: --pdf, --form-id, --tax-year, --title. Optional: --jurisdiction (default federal).",
    );
  }
  return {
    pdf: resolve(pdf),
    formId,
    taxYear: parseInt(taxYearStr, 10),
    jurisdiction,
    title,
  };
}

function defaultOutputDir(jurisdiction: string, formId: string): string {
  const shortName = formId.replace(/^form-/, "");
  if (jurisdiction.startsWith("state-")) {
    const state = jurisdiction.slice("state-".length);
    return `state/${state}/${shortName}`;
  }
  return `federal/${shortName}`;
}

async function run(argv: string[]): Promise<void> {
  const args = parseCmdArgs(argv);
  const outputPath = resolve(
    engineSrcDir,
    `${defaultOutputDir(args.jurisdiction, args.formId)}/catalog.json`,
  );

  console.log(`generate-catalog: ${args.formId} (${args.taxYear})`);
  console.log(`  PDF:    ${args.pdf}`);
  console.log(`  Output: ${outputPath}`);
  console.log();

  const result = await runIngestForm({
    pdfPath: args.pdf,
    formId: args.formId,
    taxYear: args.taxYear,
    jurisdiction: args.jurisdiction,
    formTitle: args.title,
    outputPath,
  });

  console.log(
    `  ${result.totalFields} fields total: ${result.enrichedCount} enriched, ${result.unenrichedCount} placeholder, ${result.skippedCount} skipped → ${result.catalogEntryCount} catalog entries`,
  );
  console.log(
    `  usage: input=${result.usage.input_tokens} output=${result.usage.output_tokens} cached_read=${result.usage.cache_read_input_tokens} cached_create=${result.usage.cache_creation_input_tokens}`,
  );
  if (result.unenrichedSample.length > 0) {
    console.log(`  Unenriched fields (first ${result.unenrichedSample.length}):`);
    for (const name of result.unenrichedSample) console.log(`    - ${name}`);
    if (result.unenrichedCount > result.unenrichedSample.length) {
      console.log(`    … and ${result.unenrichedCount - result.unenrichedSample.length} more`);
    }
  }
  if (result.skipSample.length > 0) {
    console.log(`  Skipped fields (first ${result.skipSample.length}):`);
    for (const skip of result.skipSample) {
      console.log(`    - ${skip.pdfFieldName}: ${skip.skipReason}`);
    }
    if (result.skippedCount > result.skipSample.length) {
      console.log(`    … and ${result.skippedCount - result.skipSample.length} more`);
    }
  }
}

export const generateCatalogCommand: Command = {
  name: "generate-catalog",
  summary: "Extract + AI-label a blank PDF's widgets → engine/src/<…>/catalog.json",
  options: [
    { flag: "--pdf=<path>", desc: "blank fillable PDF (required)" },
    { flag: "--form-id=<id>", desc: "e.g. form-1040 (required)" },
    { flag: "--tax-year=<year>", desc: "e.g. 2025 (required)" },
    { flag: "--title=<title>", desc: "official form title (required)" },
    { flag: "--jurisdiction=<j>", desc: "federal | state-<st> (default: federal)" },
  ],
  run,
};
