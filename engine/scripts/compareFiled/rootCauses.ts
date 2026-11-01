/* A root is a differing line whose inputs (the field ids its binding read) all match. */

import type { LineDiff } from "./compare.js";

export interface RootCause {
  root: LineDiff;
  downstream: LineDiff[];
}

export function groupRootCauses(
  diffs: LineDiff[],
  readsOf: (fieldId: string) => string[] | undefined,
): RootCause[] {
  const byId = new Map(diffs.map((diff) => [diff.fieldId, diff]));
  const parents = (id: string) =>
    (readsOf(id) ?? []).filter((read) => read !== id && byId.has(read));
  const rootsMemo = new Map<string, Set<string>>();

  const rootsOf = (id: string, seen: Set<string>): Set<string> => {
    const memo = rootsMemo.get(id);
    if (memo) return memo;
    const ps = parents(id).filter((parent) => !seen.has(parent));
    const out = new Set<string>();
    if (ps.length === 0) out.add(id);
    for (const parent of ps)
      for (const root of rootsOf(parent, new Set([...seen, id]))) out.add(root);
    rootsMemo.set(id, out);
    return out;
  };

  const groups = new Map<string, RootCause>();
  for (const diff of diffs) {
    for (const rootId of rootsOf(diff.fieldId, new Set())) {
      const group = groups.get(rootId) ?? { root: byId.get(rootId)!, downstream: [] };
      if (rootId !== diff.fieldId) group.downstream.push(diff);
      groups.set(rootId, group);
    }
  }
  /* Calculation order: the order the roots appear in `diffs`. */
  return diffs.filter((diff) => groups.has(diff.fieldId)).map((diff) => groups.get(diff.fieldId)!);
}
