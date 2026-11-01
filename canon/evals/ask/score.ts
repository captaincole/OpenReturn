// The report rescores saved runs with this, so a label fix needs no model rerun.
import { hitsAll, type AnyOf } from "../lib/anyOf";
import { CASES, type AskCase } from "./cases";
import type { AskResult } from "./report";

const hitsAllOrNull = (groups: AnyOf[], ids: Set<string>) =>
  groups.length ? hitsAll(groups, ids) : null;

function missingFacts(c: AskCase, answer: string): string[] {
  const text = answer.toLowerCase();
  return c.facts
    .filter((group) => !group.some((f) => text.includes(f.toLowerCase())))
    .map((group) => group[0]);
}

// validate drops unretrieved citations, so a cited passage counts as retrieved.
export function scoreResult(r: AskResult): AskResult {
  const c = CASES.find((x) => x.name === r.case);
  if (!c) return r;
  const missing = missingFacts(c, r.answer);
  const citedAuthority = hitsAllOrNull(c.authority, new Set(r.cited));
  return {
    ...r,
    tier: c.tier,
    kind: c.kind,
    expectedCoverage: c.coverage,
    citedAuthority,
    retrievedAuthority: r.retrieved
      ? hitsAllOrNull(c.authority, new Set([...r.retrieved, ...r.cited]))
      : citedAuthority || r.retrievedAuthority,
    factsOk: c.facts.length ? missing.length === 0 : null,
    missingFacts: missing,
  };
}
