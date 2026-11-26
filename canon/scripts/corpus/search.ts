import { parseArgs } from "node:util";
import { parseJurisdictions, type Jurisdiction } from "../../src/jurisdiction";
import { searchRefDocsTool } from "../../src/mastra/tools/refDocs";
import type { Command } from "../lib/cli";
import { requireCorpus } from "./requireCorpus";

interface SearchToolInput {
  query: string;
  limit?: number;
  mode?: "fts" | "vector" | "hybrid";
  docId?: string;
  jurisdictions?: Jurisdiction[];
}

interface SearchToolOutput {
  query: string;
  jurisdictions: Jurisdiction[];
  results: {
    blockId: string;
    citation: string;
    sectionHeading: string | null;
    pageNum: number;
    blockType: string;
    score: number;
    snippet: string;
    text: string;
  }[];
}

// Mastra wraps the tool's execute type; the cast allows a direct call outside an agent.
function execSearch(input: SearchToolInput): Promise<SearchToolOutput> {
  const tool = searchRefDocsTool as unknown as {
    execute: (input: SearchToolInput) => Promise<SearchToolOutput>;
  };
  return tool.execute(input);
}

async function run(argv: string[]): Promise<void> {
  await requireCorpus();
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      limit: { type: "string", default: "5" },
      mode: { type: "string", default: "hybrid" },
      "doc-id": { type: "string" },
      jurisdiction: { type: "string" },
    },
    allowPositionals: true,
  });
  const query = positionals.join(" ").trim();
  if (!query) {
    console.error("required: a query string (see --help)");
    process.exit(1);
  }

  const jurisdictions = values.jurisdiction
    ? parseJurisdictions(values.jurisdiction.split(","))
    : undefined;
  const t0 = Date.now();
  const result = await execSearch({
    query,
    limit: Math.max(1, Math.min(Number(values.limit), 25)),
    mode: values.mode as "fts" | "vector" | "hybrid",
    docId: values["doc-id"],
    jurisdictions,
  });
  const ms = Date.now() - t0;

  console.log(`query:   "${result.query}"`);
  console.log(`mode:    ${values.mode}`);
  console.log(`jurisdictions: ${result.jurisdictions.join(", ")}`);
  console.log(`results: ${result.results.length} in ${ms} ms\n`);

  result.results.forEach((hit, i) => {
    console.log(`${i + 1}. ${hit.citation}  (score ${hit.score.toFixed(3)})`);
    console.log(`   blockId: ${hit.blockId}`);
    if (hit.blockType === "form_face") console.log("   printed on the form (form face)");
    console.log(`   snippet: ${hit.snippet.slice(0, 220).replace(/\n/g, " ")}`);
    console.log();
  });
}

export const searchCommand: Command = {
  name: "search",
  summary: "Run the production search-ref-docs tool against the corpus",
  usage: '"query"',
  options: [
    { flag: "--limit <n>", desc: "max results, 1–25 (default: 5)" },
    {
      flag: "--mode fts|vector|hybrid",
      desc: "retrieval mode; hybrid degrades to FTS when Ollama is unavailable (default: hybrid)",
    },
    { flag: "--doc-id <id>", desc: "restrict to one document, e.g. irs-1040-inst-2025" },
    {
      flag: "--jurisdiction <list>",
      desc: "search only these jurisdictions, comma-separated: federal, CA (default: all)",
    },
  ],
  run,
};
