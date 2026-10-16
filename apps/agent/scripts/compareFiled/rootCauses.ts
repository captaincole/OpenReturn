/*
 * Group differences by root cause.
 *
 * A root difference is a differing line whose inputs (the field ids its
 * binding read) all match. Every other differing line inherits from one
 * or more roots upstream. Fixing a root usually fixes its downstream
 * lines, so the report leads with roots.
 */

import type { LineDiff } from "./compare.js";

export interface RootCause {
  root: LineDiff;
  /** Differing lines that read this root, directly or through other differing lines. */
  downstream: LineDiff[];
}

/** `readsOf(fieldId)` returns the field ids the line's binding read. */
export function groupRootCauses(
  diffs: LineDiff[],
  readsOf: (fieldId: string) => string[] | undefined,
): RootCause[] {
  const byId = new Map(diffs.map((d) => [d.fieldId, d]));
  const parents = (id: string) => (readsOf(id) ?? []).filter((r) => r !== id && byId.has(r));
  const rootsMemo = new Map<string, Set<string>>();

  const rootsOf = (id: string, seen: Set<string>): Set<string> => {
    const memo = rootsMemo.get(id);
    if (memo) return memo;
    const ps = parents(id).filter((p) => !seen.has(p));
    const out = new Set<string>();
    if (ps.length === 0) out.add(id);
    for (const p of ps) for (const r of rootsOf(p, new Set([...seen, id]))) out.add(r);
    rootsMemo.set(id, out);
    return out;
  };

  const groups = new Map<string, RootCause>();
  for (const d of diffs) {
    for (const rootId of rootsOf(d.fieldId, new Set())) {
      const group = groups.get(rootId) ?? { root: byId.get(rootId)!, downstream: [] };
      if (rootId !== d.fieldId) group.downstream.push(d);
      groups.set(rootId, group);
    }
  }
  /* Calculation order: the order the roots appear in `diffs`. */
  return diffs.filter((d) => groups.has(d.fieldId)).map((d) => groups.get(d.fieldId)!);
}
