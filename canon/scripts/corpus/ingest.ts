import { parseArgs } from "node:util";
import { ingestRefDoc } from "../../src/refdocs/ingest";
import type { Command } from "../lib/cli";

async function run(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      file: { type: "string", short: "f" },
      format: { type: "string", default: "pdf" },
      "doc-id": { type: "string" },
      title: { type: "string" },
      publisher: { type: "string", default: "IRS" },
      "tax-year": { type: "string" },
      "source-url": { type: "string" },
      force: { type: "boolean", default: false },
      "no-contextualize": { type: "boolean", default: false },
      "parser-style": { type: "string", default: "irs" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (!values.file || !values["doc-id"] || !values.title) {
    console.error(
      "required: --file <path> --doc-id <id> --title <title> (see --help for all options)",
    );
    process.exit(1);
  }
  const format = values.format;
  if (format !== "pdf" && format !== "html") {
    console.error(`--format must be "pdf" or "html" (got "${format}")`);
    process.exit(1);
  }

  const parserStyle = values["parser-style"];
  if (parserStyle !== "irs" && parserStyle !== "ftb") {
    console.error(`--parser-style must be "irs" or "ftb" (got "${parserStyle}")`);
    process.exit(1);
  }

  const result = await ingestRefDoc({
    sourcePath: values.file,
    format,
    docId: values["doc-id"],
    title: values.title,
    publisher: values.publisher ?? "IRS",
    taxYear: values["tax-year"] ? Number(values["tax-year"]) : null,
    sourceUrl: values["source-url"] ?? null,
    force: values.force,
    noContextualize: values["no-contextualize"],
    parserStyle,
  });

  printIngestResult(result);
}

function printIngestResult(result: Awaited<ReturnType<typeof ingestRefDoc>>): void {
  console.log("ingested:");
  console.log(`  doc_id:   ${result.docId}`);
  console.log(`  sha256:   ${result.sha256.slice(0, 16)}…`);
  console.log(`  pages:    ${result.totalPages}`);
  console.log(`  chars:    ${result.totalChars}`);
  console.log(`  sections: ${result.sectionCount}`);
  console.log(`  blocks:   ${result.blockCount}`);
  console.log(`  text:     ${result.canonicalTextPath}`);
  console.log(`  contextualized: ${result.contextualized ? "yes" : "no"}`);
  console.log(`  embedded:       ${result.embedded ? "yes" : "no"}`);
  if (result.replaced) console.log("  (replaced previous ingestion)");
}

export const ingestCommand: Command = {
  name: "ingest",
  summary: "Manually ingest one source file (any path on disk) into corpus.db",
  options: [
    { flag: "--file <path>", desc: "path to the source file (required; -f shorthand)" },
    { flag: "--format pdf|html", desc: "source format; html = a cleaned page (default: pdf)" },
    { flag: "--doc-id <id>", desc: "stable doc id, e.g. irs-1040-inst-2025 (required)" },
    { flag: "--title <title>", desc: "human-readable document title (required)" },
    { flag: "--publisher <name>", desc: "publisher (default: IRS)" },
    { flag: "--tax-year <year>", desc: "tax year, e.g. 2025" },
    { flag: "--source-url <url>", desc: "where the file was downloaded from" },
    { flag: "--force", desc: "re-ingest even if the sha matches the DB" },
    { flag: "--no-contextualize", desc: "skip the Haiku contextualization stage" },
    { flag: "--parser-style irs|ftb", desc: "heading-detection style (default: irs)" },
  ],
  run,
};
