// The report rescores saved runs with this, so a label fix needs no model rerun.
import { hitsAll, type AnyOf } from "../lib/anyOf";
import { CASES, type AskCase } from "./cases";
import type { AskResult } from "./report";

const hitsAllOrNull = (groups: AnyOf[], ids: Set<string>) =>
  groups.length ? hitsAll(groups, ids) : null;

function missingFacts(testCase: AskCase, answer: string): string[] {
  const text = answer.toLowerCase();
  return testCase.facts
    .filter((group) => !group.some((fact) => text.includes(fact.toLowerCase())))
    .map((group) => group[0]);
}

// validate drops unretrieved citations, so a cited passage counts as retrieved.
export function scoreResult(result: AskResult): AskResult {
  const testCase = CASES.find((candidate) => candidate.name === result.case);
  if (!testCase) return result;
  const missing = missingFacts(testCase, result.answer);
  const citedAuthority = hitsAllOrNull(testCase.authority, new Set(result.cited));
  return {
    ...result,
    tier: testCase.tier,
    kind: testCase.kind,
    expectedCoverage: testCase.coverage,
    citedAuthority,
    retrievedAuthority: result.retrieved
      ? hitsAllOrNull(testCase.authority, new Set([...result.retrieved, ...result.cited]))
      : citedAuthority || result.retrievedAuthority,
    factsOk: testCase.facts.length ? missing.length === 0 : null,
    missingFacts: missing,
  };
}
