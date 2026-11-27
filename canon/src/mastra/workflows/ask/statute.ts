import {
  searchStatute,
  statuteQueriesOf,
  statuteSearchLog,
  statuteTitleOf,
  type StatuteBlock,
  type StatuteSearchOptions,
} from "../statute";
import type { AskAnswerOutput } from "./judges/askAnswerer";
import type { AskStage } from "./types";
import type { Passage } from "./validate";

/*
 * The answerer's statuteQueries, handled in code: one statute search per
 * question, after the instruction rounds, then one more answer with both
 * sets of passages. Best effort: if the round fails, the answer before it
 * stands.
 */

const BLOCK_ID_MARK = "::";

// The statute has no pages, like a web page: citations show its citation instead.
const toPassage = (block: StatuteBlock): Passage => ({
  blockId: block.blockId,
  docId: block.blockId.split(BLOCK_ID_MARK)[0],
  documentTitle: statuteTitleOf(block.blockId),
  format: "html",
  published: null,
  sectionHeading: null,
  pageNum: 1,
  text: block.text,
  citation: block.citation,
});

export interface Answered {
  raw: AskAnswerOutput;
  passages: Passage[];
}

export interface StatuteRound extends Answered {
  /** The statute passages the standing answer saw. */
  statutePassages: StatuteBlock[];
  /** True when the statute was searched. */
  statuteConsulted: boolean;
}

export interface StatuteRoundDeps {
  onStage?: (stage: AskStage) => Promise<void> | void;
  reanswer: (passages: Passage[]) => Promise<AskAnswerOutput>;
  steps: { kind: string; durationMs: number; [key: string]: unknown }[];
  warn: (message: string, err: string) => void;
}

export async function statuteRound(
  before: Answered,
  deps: StatuteRoundDeps,
  options: StatuteSearchOptions,
): Promise<StatuteRound> {
  const unchanged = { ...before, statutePassages: [], statuteConsulted: false };
  if (statuteQueriesOf(before.raw.statuteQueries).length === 0) return unchanged;
  let searched = false;
  try {
    await deps.onStage?.("retrieving");
    const t0 = Date.now();
    const search = await searchStatute(before.raw.statuteQueries, options);
    deps.steps.push({ kind: "statute", durationMs: Date.now() - t0, ...statuteSearchLog(search) });
    if (search.status === "skipped") return unchanged;
    searched = true;
    if (search.blocks.length === 0) return { ...unchanged, statuteConsulted: true };

    await deps.onStage?.("answering");
    const passages = [...before.passages, ...search.blocks.map(toPassage)];
    const raw = await deps.reanswer(passages);
    return { raw, passages, statutePassages: search.blocks, statuteConsulted: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    deps.steps.push({ kind: "statute-failed", durationMs: 0, error: reason });
    deps.warn("ask statute round failed; keeping the answer before it", reason);
    return { ...unchanged, statuteConsulted: searched };
  }
}
