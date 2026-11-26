import { z } from "zod";
import { lawInstalled } from "../../db/libsql";
import { searchLaw, type LawHit } from "../../law/lawSearch";
import { mergeByRank } from "./ask/mergeHits";

/*
 * The statute (law.db) is read only on purpose: a judge asks for it after it
 * has read the instruction passages, and a run searches it at most once. The
 * search runs here, in code: no judge gets a tool. When two texts disagree,
 * the judge reports both quotes and nothing here picks a winner.
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
  | { status: "searched"; queries: string[]; blocks: StatuteBlock[]; log: unknown[] }
  | { status: "skipped"; queries: string[]; skipped: StatuteSkip; error?: string };

export interface StatuteSearchOptions {
  hitsPerQuery: number;
  /** Most blocks kept over all queries; all of them when unset. */
  max?: number;
}

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
  try {
    const lists: LawHit[][] = [];
    for (const query of queries)
      // The judges' prompts and the conflict check are written for the statute; the regulations come later.
      lists.push(await searchLaw({ query, limit: options.hitsPerQuery, source: "statute" }));
    const log = queries.map((query, i) => ({
      query,
      hits: lists[i].map((hit) => ({
        blockId: hit.blockId,
        citation: hit.citation,
        score: hit.score,
      })),
    }));
    const max = options.max ?? lists.flat().length;
    return { status: "searched", queries, blocks: mergeByRank(lists, max).map(toBlock), log };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { status: "skipped", queries, skipped: "failed", error };
  }
}

/* The query log of one search: what ran, what came back, or why it did not run. */
export function statuteSearchLog(search: StatuteSearch): Record<string, unknown> {
  if (search.status === "searched") return { queries: search.log, statuteBlocks: search.blocks };
  return {
    queries: search.queries,
    skipped: search.skipped,
    why: STATUTE_SKIP_WHY[search.skipped],
    ...(search.error ? { error: search.error } : {}),
  };
}
