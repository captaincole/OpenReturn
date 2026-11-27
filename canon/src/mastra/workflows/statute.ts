import { z } from "zod";
import { lawInstalled } from "../../db/libsql";
import { statutesOf, type Jurisdiction } from "../../jurisdiction";
import type { LawSource } from "../../law/citation";
import { lawSourceOfId } from "../../law/lawIds";
import { searchLaw, type LawHit } from "../../law/lawSearch";
import { mergeByRank } from "./ask/mergeHits";

/*
 * The statute (law.db) is read only on purpose: a judge asks for it after it
 * has read the instruction passages, and a run searches it at most once. The
 * search runs here, in code: no judge gets a tool. When two texts disagree,
 * the judge reports both quotes and nothing here picks a winner.
 *
 * The statute is that of each jurisdiction on: the Internal Revenue Code for
 * federal, California's Revenue and Taxation Code for CA. Never the
 * regulations: the judges' prompts are written for a statute.
 */

const MAX_STATUTE_QUERIES = 3;

export const statuteBlockSchema = z.object({
  blockId: z.string(),
  citation: z.string().describe('"26 U.S.C. § 469(g)(1)"'),
  text: z.string(),
});
export type StatuteBlock = z.infer<typeof statuteBlockSchema>;

export const conflictKindSchema = z.enum([
  "instruction_vs_instruction",
  "instruction_vs_statute",
  "statute_vs_statute",
]);
export type ConflictKind = z.infer<typeof conflictKindSchema>;

const conflictSideSchema = z.object({ blockId: z.string(), quote: z.string() });

// What a judge writes. A side names a block retrieved in this run.
export const conflictOutputSchema = z.object({
  kind: conflictKindSchema,
  a: conflictSideSchema,
  b: conflictSideSchema,
  note: z.string().describe("One sentence: what the two texts disagree on."),
});
export type ConflictOutput = z.infer<typeof conflictOutputSchema>;

// What a run returns: the code adds the statute citation to a statute side.
const checkedSideSchema = conflictSideSchema.extend({ citation: z.string().optional() });
export const conflictSchema = conflictOutputSchema.extend({
  a: checkedSideSchema,
  b: checkedSideSchema,
});
export type Conflict = z.infer<typeof conflictSchema>;

export type StatuteSkip = "no_queries" | "not_installed" | "failed";

export const STATUTE_SKIP_WHY: Record<StatuteSkip | "already_consulted", string> = {
  no_queries: "The judge gave no statute queries.",
  not_installed: "The law library (law.db) is not installed.",
  failed: "The statute search failed.",
  already_consulted: "The statute was already consulted in this run.",
};

export type StatuteSearch =
  | {
      status: "searched";
      queries: string[];
      sources: LawSource[];
      blocks: StatuteBlock[];
      log: unknown[];
    }
  | { status: "skipped"; queries: string[]; skipped: StatuteSkip; error?: string };

export interface StatuteSearchOptions {
  hitsPerQuery: number;
  /** Most blocks kept over all queries and statutes; hitsPerQuery for each query when unset. */
  max?: number;
  /** The jurisdictions on in this run: the statute of each one is searched. */
  jurisdictions: readonly Jurisdiction[];
}

/*
 * How a prompt and a reference card name a statute. A prompt names only the
 * statutes its passages come from, so a run with the Code alone reads as
 * it did before California's code was in the library.
 */
const STATUTE_NAMES: Record<LawSource, { name: string; short: string; title: string }> = {
  statute: {
    name: "the Internal Revenue Code",
    short: "26 U.S.C.",
    title: "Internal Revenue Code (26 U.S.C.)",
  },
  regulations: {
    name: "the Treasury regulations",
    short: "26 CFR",
    title: "Treasury Regulations (26 CFR)",
  },
  california: {
    name: "California's Revenue and Taxation Code",
    short: "Cal. Rev. & Tax. Code",
    title: "California Revenue and Taxation Code",
  },
};
const NAME_ORDER = Object.keys(STATUTE_NAMES) as LawSource[];

const sourceOfBlock = (blockId: string): LawSource => lawSourceOfId(blockId) ?? "statute";

/** "the Internal Revenue Code", or "… and California's Revenue and Taxation Code": the statutes of the blocks. */
export function statuteNamesOf(blockIds: string[], form: "name" | "short"): string {
  const present = new Set(blockIds.map(sourceOfBlock));
  const sources = NAME_ORDER.filter((source) => present.has(source));
  return (sources.length ? sources : NAME_ORDER.slice(0, 1))
    .map((source) => STATUTE_NAMES[source][form])
    .join(" and ");
}

/** The document title of a statute block: "Internal Revenue Code (26 U.S.C.)". */
export const statuteTitleOf = (blockId: string): string =>
  STATUTE_NAMES[sourceOfBlock(blockId)].title;

export const statuteQueriesOf = (raw: string[]): string[] =>
  raw
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, MAX_STATUTE_QUERIES);

const toBlock = (hit: LawHit): StatuteBlock => ({
  blockId: hit.blockId,
  citation: hit.citation,
  text: hit.text,
});

/* lawInstalled() checks the file first: a search of a missing law.db would create it. */
export async function searchStatute(
  raw: string[],
  options: StatuteSearchOptions,
): Promise<StatuteSearch> {
  const queries = statuteQueriesOf(raw);
  if (queries.length === 0) return { status: "skipped", queries, skipped: "no_queries" };
  if (!(await lawInstalled())) return { status: "skipped", queries, skipped: "not_installed" };
  const sources = statutesOf(options.jurisdictions);
  try {
    const searches: { query: string; source: LawSource; hits: LawHit[] }[] = [];
    for (const query of queries)
      for (const source of sources)
        searches.push({
          query,
          source,
          hits: await searchLaw({ query, limit: options.hitsPerQuery, source }),
        });
    const log = searches.map(({ query, source, hits }) => ({
      query,
      source,
      hits: hits.map((hit) => ({ blockId: hit.blockId, citation: hit.citation, score: hit.score })),
    }));
    // The statutes take turns, federal first, within the budget of one statute.
    const max = options.max ?? queries.length * options.hitsPerQuery;
    const lists = searches.map((search) => search.hits);
    const blocks = mergeByRank(lists, max).map(toBlock);
    return { status: "searched", queries, sources, blocks, log };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { status: "skipped", queries, skipped: "failed", error };
  }
}

/* The query log of one search: what ran, what came back, or why it did not run. */
export function statuteSearchLog(search: StatuteSearch): Record<string, unknown> {
  if (search.status === "searched")
    return { sources: search.sources, queries: search.log, statuteBlocks: search.blocks };
  return {
    queries: search.queries,
    skipped: search.skipped,
    why: STATUTE_SKIP_WHY[search.skipped],
    ...(search.error ? { error: search.error } : {}),
  };
}
