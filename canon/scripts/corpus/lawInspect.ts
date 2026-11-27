import { parseArgs } from "node:util";
import { storedEmbeddingModel } from "../../src/db/corpusStore";
import { lawLibrary, libraryDbPath } from "../../src/db/libsql";
import { ALL_JURISDICTIONS, parseJurisdictions } from "../../src/jurisdiction";
import type { LawSource } from "../../src/law/citation";
import { CITATION_HINT, lawNotInstalledMessage, readLaw, requireLaw } from "../../src/law/lawRead";
import { lawCoverage, searchLaw, sourcesToSearch, type SearchMode } from "../../src/law/lawSearch";
import type { Command } from "../lib/cli";
import { checkLibrary } from "./check";

/* The law commands that only read the law files: check, search, read. */

// Each jurisdiction's file: its path, then its counts, or "not installed".
async function check(): Promise<void> {
  const installed = await requireLaw();
  for (const jurisdiction of ALL_JURISDICTIONS) {
    const library = lawLibrary(jurisdiction);
    console.log(`\n${jurisdiction}: ${libraryDbPath(library)}`);
    if (!installed.includes(jurisdiction)) {
      console.log("  not installed");
      continue;
    }
    console.log(`embedding model: ${(await storedEmbeddingModel(library)) ?? "(none)"}`);
    await checkLibrary(library);
  }
}

const MODES: SearchMode[] = ["fts", "vector", "hybrid"];
const SOURCES: LawSource[] = ["statute", "regulations", "california"];

async function search(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      limit: { type: "string", default: "8" },
      mode: { type: "string", default: "hybrid" },
      section: { type: "string" },
      source: { type: "string" },
      jurisdiction: { type: "string" },
    },
    allowPositionals: true,
  });
  const query = positionals.join(" ").trim();
  const mode = MODES.find((known) => known === values.mode);
  const source = SOURCES.find((known) => known === values.source);
  if (!query || !mode) throw new Error("required: a query string, and --mode fts|vector|hybrid");
  if (values.source && !source) throw new Error("--source is statute, regulations or california");
  const jurisdictions = values.jurisdiction
    ? parseJurisdictions(values.jurisdiction.split(",").map((one) => one.trim()))
    : undefined;
  const opts = { mode, section: values.section, source, jurisdictions };
  const sources = sourcesToSearch(opts);
  const { missing } = await lawCoverage(sources);
  const limit = Math.max(1, Math.min(Number(values.limit), 25));
  const hits = await searchLaw({ ...opts, query, limit });
  console.log(
    `query:   "${query}"\nmode:    ${mode}\nsource:  ${sources.join(" and ")}\nresults: ${hits.length}\n`,
  );
  if (missing.length > 0) console.log(`not searched: ${lawNotInstalledMessage(missing)}\n`);
  hits.forEach((hit, index) => {
    console.log(`${index + 1}. ${hit.citation}  [${hit.source}] (score ${hit.score.toFixed(4)})`);
    console.log(`   blockId: ${hit.blockId}`);
    console.log(
      `   ${hit.sectionHeading ?? ""}${hit.headings.length ? ` › ${hit.headings.join(" › ")}` : ""}`,
    );
    console.log(`   snippet: ${hit.text.slice(0, 220).replace(/\n/g, " ")}\n`);
  });
}

async function read(argv: string[]): Promise<void> {
  const citation = argv.join(" ").trim();
  if (!citation) throw new Error(`required: a citation (${CITATION_HINT})`);
  const reading = await readLaw(citation);
  if (!reading) {
    console.error(`nothing in the law library at ${citation}`);
    process.exit(1);
  }
  console.log(`# ${reading.citation} — ${reading.sectionHeading}`);
  for (const block of reading.blocks) {
    const headings = block.headings.length ? `\n  ${block.headings.join(" › ")}` : "";
    console.log(`\n[${block.blockId}] ${block.citation}${headings}\n${block.text}`);
  }
}

export const lawCheckCommand: Command = {
  name: "check",
  summary: "Each law file: row counts and embedding coverage",
  run: check,
};

export const lawSearchCommand: Command = {
  name: "search",
  summary: "Search the Code and the regulations, or California's code (the law files only)",
  usage: '"query"',
  options: [
    { flag: "--mode fts|vector|hybrid", desc: "retrieval mode (default: hybrid)" },
    { flag: "--limit <n>", desc: "max results, 1–25 (default: 8)" },
    {
      flag: "--source statute|regulations|california",
      desc: "one source only (default: the statute and the regulations; California only when named)",
    },
    {
      flag: "--jurisdiction federal|CA|federal,CA",
      desc: "the law of these jurisdictions: federal is the statute and the regulations, CA is California's code",
    },
    { flag: "--section <n>", desc: 'one section only, e.g. "469", "1.469-5T" or "CA 17041"' },
  ],
  run: search,
};

export const lawReadCommand: Command = {
  name: "read",
  summary: "Print a section or subdivision by citation, in order, with block ids",
  usage:
    '<citation> (469, "469(g)(1)(A)", 1.469-5T, "1.469-5T(a)(1)", "CA 17041(a)" or a block id)',
  run: read,
};
