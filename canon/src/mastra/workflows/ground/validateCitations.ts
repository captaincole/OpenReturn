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

function normalize(s: string): string {
  return s
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
  const text = new Map(blocks.map((b) => [b.blockId, normalize(b.text)]));
  const dropped: ValidatedCitations["dropped"] = { blockIds: [], quotes: [] };
  const kept: AuthorityCitation[] = [];
  for (const c of citations) {
    const block = text.get(c.blockId);
    if (block === undefined) {
      dropped.blockIds.push(c.blockId);
      continue;
    }
    if (c.quote === undefined || block.includes(normalize(c.quote))) {
      kept.push(c);
      continue;
    }
    dropped.quotes.push(c.quote);
    kept.push({ blockId: c.blockId });
  }
  return { citations: kept, dropped };
}
