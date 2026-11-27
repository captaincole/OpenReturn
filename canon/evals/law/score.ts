import {
  type LawSource,
  parseLawTarget,
  printsPath,
  sectionIdIn,
  type SectionTarget,
  sourceOfTarget,
} from "../../src/law/citation";
import type { LawHit } from "../../src/law/lawSearch";

/*
 * Pure scoring: the hits of each query merge by best rank, and the top 8
 * count. No model call anywhere in this eval.
 */

export interface LawCase {
  id: string;
  question: string;
  queries: string[];
  /** Sections that hold the rule: Code ("469"), regulation ("1.469-5T") or California ("CA 17041"); a hit in any of them counts. */
  expect: string[];
  /** The exact subdivision, "469(g)(1)(A)", "1.469-5T(a)(1)" or "CA 17041(i)(1)", when one holds the rule. */
  expectPath?: string;
  source: string;
}

export interface CaseScore {
  id: string;
  sectionHit: boolean;
  /** null when the case has no expectPath. */
  pathHit: boolean | null;
  top: string[];
}

export const TOP_K = 8;

/** The document of each source in law.db: section ids are spelled with it. */
export type DocIds = Record<LawSource, string>;

/* Each block keeps its best rank over the queries; a tie goes to the earlier query. */
export function mergeByBestRank(lists: LawHit[][]): LawHit[] {
  const best = new Map<string, { hit: LawHit; rank: number; query: number }>();
  lists.forEach((hits, query) =>
    hits.forEach((hit, rank) => {
      const seen = best.get(hit.blockId);
      if (!seen || rank < seen.rank) best.set(hit.blockId, { hit, rank, query });
    }),
  );
  return [...best.values()]
    .sort((left, right) => left.rank - right.rank || left.query - right.query)
    .map((entry) => entry.hit);
}

export function scoreCase(testCase: LawCase, merged: LawHit[], docIds: DocIds): CaseScore {
  const top = merged.slice(0, TOP_K);
  const sectionHit = top.some((hit) =>
    testCase.expect.some((section) => inSection(hit, docIds, section)),
  );
  const pathHit = testCase.expectPath
    ? top.some((hit) => onPath(hit, docIds, testCase.expectPath!))
    : null;
  return { id: testCase.id, sectionHit, pathHit, top: top.map((hit) => hit.citation) };
}

function sectionTarget(citation: string): SectionTarget | null {
  const target = parseLawTarget(citation);
  return target && target.kind !== "block" ? target : null;
}

function inTarget(hit: LawHit, docIds: DocIds, target: SectionTarget): boolean {
  const source = sourceOfTarget(target);
  return hit.blockId.startsWith(`${sectionIdIn(docIds[source], source, target.section)}::`);
}

const inSection = (hit: LawHit, docIds: DocIds, section: string) => {
  const target = sectionTarget(section);
  return target !== null && inTarget(hit, docIds, target);
};

/* The hit is the subdivision, sits inside it, or is the parent block that prints it. */
function onPath(hit: LawHit, docIds: DocIds, expectPath: string): boolean {
  const expected = sectionTarget(expectPath);
  const got = sectionTarget(hit.citation);
  if (!expected || !got) return false;
  if (!inTarget(hit, docIds, expected)) return false;
  const shorter = Math.min(expected.path.length, got.path.length);
  const shared = expected.path.slice(0, shorter).every((segment, i) => got.path[i] === segment);
  if (!shared) return false;
  if (got.path.length >= expected.path.length) return true;
  return printsPath(hit.text, expected.path.slice(got.path.length));
}
