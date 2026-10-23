/*
 * Scores a result against its case's current labels. The report rescores
 * saved runs with this too, so a label fix (a passage that also states
 * the rule, another accepted spelling) applies without rerunning models.
 */
import { CASES, type AskCase } from "./cases";
import type { AskResult } from "./report";

const hitsAll = (groups: string[][], ids: Set<string>) =>
  groups.length ? groups.every((g) => g.some((id) => ids.has(id))) : null;

function missingFacts(c: AskCase, answer: string): string[] {
  const text = answer.toLowerCase();
  return c.facts
    .filter((group) => !group.some((f) => text.includes(f.toLowerCase())))
    .map((group) => group[0]);
}

/*
 * Every cited block was retrieved (validate drops the rest), so a cited
 * passage counts as retrieved. A result from before results kept the
 * retrieved ids keeps its stored retrieval score unless its citations hit.
 */
export function scoreResult(r: AskResult): AskResult {
  const c = CASES.find((x) => x.name === r.case);
  if (!c) return r;
  const missing = missingFacts(c, r.answer);
  const citedAuthority = hitsAll(c.authority, new Set(r.cited));
  return {
    ...r,
    tier: c.tier,
    kind: c.kind,
    expectedCoverage: c.coverage,
    citedAuthority,
    retrievedAuthority: r.retrieved
      ? hitsAll(c.authority, new Set([...r.retrieved, ...r.cited]))
      : citedAuthority || r.retrievedAuthority,
    factsOk: c.facts.length ? missing.length === 0 : null,
    missingFacts: missing,
  };
}
