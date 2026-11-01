import type { AuthorityCitation, EvidenceBundle } from "./schemas";

/*
 * The rule judge's hard rule, enforced in code instead of with a tool: a
 * citation must name a block retrieved in this run, and its quote must
 * appear word for word in that block.
 */

export interface ValidatedCitations {
  citations: AuthorityCitation[];
  dropped: { blockIds: string[]; quotes: string[] };
}

function normalize(text: string): string {
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
  blocks: EvidenceBundle["irsBlocks"],
): ValidatedCitations {
  const text = new Map(blocks.map((block) => [block.blockId, normalize(block.text)]));
  const dropped: ValidatedCitations["dropped"] = { blockIds: [], quotes: [] };
  const kept: AuthorityCitation[] = [];
  for (const citation of citations) {
    const block = text.get(citation.blockId);
    if (block === undefined) {
      dropped.blockIds.push(citation.blockId);
      continue;
    }
    if (citation.quote === undefined || block.includes(normalize(citation.quote))) {
      kept.push(citation);
      continue;
    }
    dropped.quotes.push(citation.quote);
    kept.push({ blockId: citation.blockId });
  }
  return { citations: kept, dropped };
}
