/*
 * Merges by rank, round-robin: scores from different queries are not
 * comparable (bm25 grows with query length).
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
