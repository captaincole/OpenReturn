import { type Designator, follows, isFirstOf, type Kind, kindsOf, rankOf } from "./ecfrDesignators";

/*
 * Places each paragraph number on the outline of its section. A number is
 * the next of an open level ((h) then (i)) or opens a level below the
 * deepest one ((3) then (i)). When it can be both, the numbers that follow
 * decide: (j) next means a letter, (ii) a roman numeral. When they cannot
 * (a last "(i)"), the paragraph above decides: a lead that ends "—" or ":"
 * opens a list; any other text means the next letter, since no list has a
 * lone (i). A number that no rule
 * places for sure gets no place: the caller keeps its text, unplaced.
 * Pure and immutable: every step returns a new outline.
 */

export interface Level {
  kind: Kind;
  last: string;
}

export interface Placement {
  /** Index in the outline: a sibling replaces that level, a child is outline.length. */
  depth: number;
  kind: Kind;
}

const LOOKAHEAD = 4;
const OPEN_ENDS = ["—", ":"];

/*
 * Older rules print the deep levels upright: "(a)" under (a)(2)(ii), "(1)"
 * under (b)(2)(i)(D). An upright number takes its italic level only when it
 * has no place of its own.
 */
export function placements(outline: Level[], designator: Designator): Placement[] {
  const own = placementsFor(outline, kindsOf(designator), designator.token);
  if (own.length > 0 || designator.italic) return own;
  return placementsFor(outline, kindsOf({ ...designator, italic: true }), designator.token);
}

function placementsFor(outline: Level[], kinds: Kind[], token: string): Placement[] {
  const siblings = outline.flatMap((level, depth) =>
    kinds
      .filter((kind) => kind === level.kind && follows(kind, level.last, token))
      .map((kind) => ({ depth, kind })),
  );
  const deepest = outline.at(-1);
  const children = kinds
    .filter((kind) => isFirstOf(kind, token))
    .filter((kind) => !outline.some((level) => level.kind === kind))
    .filter((kind) => !deepest || rankOf(kind) > rankOf(deepest.kind))
    .map((kind) => ({ depth: outline.length, kind }));
  return [...siblings, ...children];
}

export function place(outline: Level[], placement: Placement, last: string): Level[] {
  return [...outline.slice(0, placement.depth), { kind: placement.kind, last }];
}

/** How many of the next numbers find a place after this one; a dead end stops the count. */
function reach(outline: Level[], upcoming: Designator[]): number {
  let current = outline;
  let count = 0;
  for (const next of upcoming.slice(0, LOOKAHEAD)) {
    const options = placements(current, next);
    if (options.length === 0) break;
    current = place(current, options[0], next.token);
    count += 1;
  }
  return count;
}

/** The one sure place for a number, or null. `before` is the text of the paragraph above it. */
export function choosePlacement(
  outline: Level[],
  designator: Designator,
  upcoming: Designator[],
  before: string,
): Placement | null {
  const options = placements(outline, designator);
  if (options.length <= 1) return options[0] ?? null;
  const scored = options.map((option) => ({
    option,
    score: reach(place(outline, option, designator.token), upcoming),
  }));
  const best = Math.max(...scored.map((entry) => entry.score));
  const winners = scored.filter((entry) => entry.score === best).map((entry) => entry.option);
  if (winners.length === 1) return winners[0];
  const opensList = OPEN_ENDS.some((mark) => before.trimEnd().endsWith(mark));
  const children = winners.filter((option) => option.depth === outline.length);
  const siblings = winners.filter((option) => option.depth < outline.length);
  if (opensList) return children.length === 1 ? children[0] : null;
  return siblings.length === 1 ? siblings[0] : null;
}
