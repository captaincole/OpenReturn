/*
 * Merges the ranked hit lists of several queries into one passage list.
 * Raw scores from different queries are not comparable (bm25 has no
 * upper bound and grows with query length), so the merge goes by rank:
 * the 1st hit of each query, then the 2nd of each, and so on. A block
 * that two queries found keeps its first (best-ranked) place. Every
 * query therefore gets its top hits in, whatever its score scale.
 */
export function mergeByRank<T extends { blockId: string }>(lists: T[][], max: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  const depth = Math.max(0, ...lists.map((l) => l.length));
  for (let rank = 0; rank < depth && out.length < max; rank++) {
    for (const list of lists) {
      const hit = list[rank];
      if (!hit || seen.has(hit.blockId)) continue;
      seen.add(hit.blockId);
      out.push(hit);
      if (out.length === max) break;
    }
  }
  return out;
}
