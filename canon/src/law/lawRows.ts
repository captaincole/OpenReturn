import type { ParsedDoc } from "../refdocs/parse";
import type { TextSink } from "./textSink";

/* The section rows both law parsers write: one per structure level and one per section. */

export type SectionRow = ParsedDoc["sections"][number];

export interface RowState {
  docId: string;
  sink: TextSink;
  sections: SectionRow[];
  sectionIds: Set<string>;
}

// Writes the row's heading line, so the row's range starts at its heading.
export function openRow(
  state: RowState,
  slug: string,
  heading: string,
  parentId: string | null,
): SectionRow {
  const start = state.sink.write(heading)?.start ?? state.sink.length();
  const row: SectionRow = {
    sectionId: uniqueSectionId(state, `${state.docId}::sec::${slug}`),
    heading,
    headingSlug: slug,
    parentSectionId: parentId,
    ordinal: state.sections.length,
    firstPage: 1,
    charStart: start,
    charEnd: start,
  };
  state.sections.push(row);
  return row;
}

// A repeated structure id (two chapters 38, one repealed) gets "-dup2".
function uniqueSectionId(state: RowState, sectionId: string): string {
  let candidate = sectionId;
  for (let count = 2; state.sectionIds.has(candidate); count++)
    candidate = `${sectionId}-dup${count}`;
  state.sectionIds.add(candidate);
  return candidate;
}

export function assertUnique(what: string, ids: string[]): void {
  const seen = new Set<string>();
  const repeated = ids.filter((id) => seen.size === seen.add(id).size);
  if (repeated.length > 0)
    throw new Error(
      `law parse: duplicate ${what}: ${[...new Set(repeated)].slice(0, 5).join(", ")}`,
    );
}
