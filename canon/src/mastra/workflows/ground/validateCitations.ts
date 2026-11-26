import { isLawBlockId } from "../../../law/lawIds";
import type { Conflict, ConflictKind, ConflictOutput } from "../statute";
import type { AuthorityCitation } from "./schemas";

/*
 * The rule judge's hard rule, enforced in code instead of with a tool: a
 * citation must name a block retrieved in this run, and its quote must
 * appear word for word in that block. A conflict is held to the same rule
 * on both of its sides.
 */

/** A retrieved block: an instruction passage, or a statute passage with its citation. */
export interface RetrievedBlock {
  blockId: string;
  text: string;
  citation?: string;
}

export interface ValidatedCitations {
  citations: AuthorityCitation[];
  dropped: { blockIds: string[]; quotes: string[] };
}

export function normalizeQuote(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateCitations(
  citations: AuthorityCitation[],
  blocks: RetrievedBlock[],
): ValidatedCitations {
  const text = new Map(blocks.map((block) => [block.blockId, normalizeQuote(block.text)]));
  const dropped: ValidatedCitations["dropped"] = { blockIds: [], quotes: [] };
  const kept: AuthorityCitation[] = [];
  for (const citation of citations) {
    const block = text.get(citation.blockId);
    if (block === undefined) {
      dropped.blockIds.push(citation.blockId);
      continue;
    }
    if (citation.quote === undefined || block.includes(normalizeQuote(citation.quote))) {
      kept.push(citation);
      continue;
    }
    dropped.quotes.push(citation.quote);
    kept.push({ blockId: citation.blockId });
  }
  return { citations: kept, dropped };
}

export interface ValidatedConflicts {
  conflicts: Conflict[];
  dropped: number;
}

// The kind follows from the two blocks, so a mislabeled kind cannot mislead the reader.
function kindOf(first: string, second: string): ConflictKind {
  const statutes = [first, second].filter(isLawBlockId).length;
  if (statutes === 0) return "instruction_vs_instruction";
  return statutes === 1 ? "instruction_vs_statute" : "statute_vs_statute";
}

/* A conflict stays only when both sides name a retrieved block and quote it word for word. */
export function validateConflicts(
  conflicts: ConflictOutput[],
  blocks: RetrievedBlock[],
): ValidatedConflicts {
  const byId = new Map(blocks.map((block) => [block.blockId, block]));
  const side = (raw: ConflictOutput["a"]) => {
    const block = byId.get(raw.blockId);
    const quote = raw.quote.trim();
    if (!block || !quote || !normalizeQuote(block.text).includes(normalizeQuote(quote)))
      return null;
    return {
      blockId: block.blockId,
      quote,
      ...(block.citation ? { citation: block.citation } : {}),
    };
  };
  const kept: Conflict[] = [];
  for (const conflict of conflicts) {
    const first = side(conflict.a);
    const second = side(conflict.b);
    // One block may hold both texts: two of its sentences can disagree.
    if (!first || !second) continue;
    const kind = kindOf(first.blockId, second.blockId);
    kept.push({ kind, a: first, b: second, note: conflict.note.trim() });
  }
  return { conflicts: kept, dropped: conflicts.length - kept.length };
}
