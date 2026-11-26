import { table } from "./markdown";

/*
 * A case may expect the judge to consult the statute and to cite one Code
 * section. Both are scored on their own, next to the case's other scores:
 * they never change whether a run is correct.
 */

export interface StatuteExpectation {
  /** The Code section a citation must fall in: "461", "6654". */
  section: string;
}

const BLOCK_ID_MARK = "::";
const SECTION_SLUG_PREFIX = "s";

/** "usc-26-2025::sec::s461::l-3-B" cites section "461". */
export function citesSection(cited: string[], section: string): boolean {
  const slug = `${SECTION_SLUG_PREFIX}${section.toLowerCase()}`;
  return cited.some((blockId) => blockId.split(BLOCK_ID_MARK)[2] === slug);
}

export interface StatuteRun {
  model: string;
  case: string;
  statuteConsulted?: boolean;
  cited: string[];
}

/* One row per model: how many runs consulted the statute, and cited the expected section. */
export function statuteTable(
  models: { label: string }[],
  results: StatuteRun[],
  expectations: Map<string, StatuteExpectation>,
): string | null {
  const expected = results.filter((result) => expectations.has(result.case));
  if (expected.length === 0) return null;
  const rows = models.map((model) => {
    const mine = expected.filter((result) => result.model === model.label);
    const consulted = mine.filter((result) => result.statuteConsulted === true).length;
    const inSection = mine.filter((result) =>
      citesSection(result.cited, expectations.get(result.case)!.section),
    ).length;
    return [model.label, `${consulted}/${mine.length}`, `${inSection}/${mine.length}`];
  });
  return table(["Model", "Consulted the statute", "Cited the expected section"], rows);
}

export const STATUTE_SECTION_TEXT =
  "Cases where two IRS texts disagree (from `docs/rule-decisions.md`) expect the judge to consult the statute (law.db) and to cite one Code section. These two counts do not change any other score.";
