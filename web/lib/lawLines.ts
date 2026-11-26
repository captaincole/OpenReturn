/*
 * How deep each line of a statute block sits, so the page indents it like
 * the printed Code. A block holds several lines ("(1) …\n(A) …\n(i) …"); the
 * leading number of a line says its level: (a) subsection, (1) paragraph,
 * (A) subparagraph, (i) clause, (I) subclause, (aa) item, (AA) subitem.
 * Pure: the page renders what this returns.
 */

type Kind =
  | "lowerLetter"
  | "digit"
  | "upperLetter"
  | "lowerRoman"
  | "upperRoman"
  | "doubleLower"
  | "doubleUpper";

export interface LawLine {
  text: string;
  /** 0 is a subsection's margin (or a section's own text); each level below adds 1. */
  depth: number;
  /** Where the leading numbers end: "(1)(A)" in "(1)(A) Benevolent…" is 6 characters. */
  markerEnd: number;
  /** A table row: cells joined by " | ". */
  tableRow: boolean;
}

export type LawPart =
  { kind: "line"; line: LawLine } | { kind: "table"; depth: number; rows: string[][] };

const TABLE_CELL_JOINT = " | ";
const MAX_MARKER_CHARS = 6;
const ROMAN_DIGITS: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
const FIRST_OF: Record<Kind, string> = {
  lowerLetter: "a",
  digit: "1",
  upperLetter: "A",
  lowerRoman: "i",
  upperRoman: "I",
  doubleLower: "aa",
  doubleUpper: "AA",
};

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string) => char.toLowerCase() !== char.toUpperCase();
const isMarker = (text: string) =>
  text.length > 0 &&
  text.length <= MAX_MARKER_CHARS &&
  [...text].every((char) => isDigit(char) || isLetter(char));

/** "(12)(A) Benevolent…" → ["12", "A"]; a line that opens with words → []. */
export function leadingMarkers(line: string): string[] {
  const markers: string[] = [];
  for (let rest = line; rest.startsWith("(");) {
    const close = rest.indexOf(")");
    const inside = close < 0 ? "" : rest.slice(1, close);
    if (!isMarker(inside)) break;
    markers.push(inside);
    rest = rest.slice(close + 1);
  }
  return markers;
}

const isRoman = (text: string) => [...text.toLowerCase()].every((char) => char in ROMAN_DIGITS);
const isRepeated = (text: string) => text.length > 1 && [...text].every((char) => char === text[0]);

/** The levels a number can be: "i" is a subsection letter or a clause. */
export function kindsOf(marker: string): Kind[] {
  if (isDigit(marker[0])) return ["digit"];
  const lower = marker === marker.toLowerCase();
  if (!lower && marker !== marker.toUpperCase()) return [];
  const kinds: Kind[] = [];
  if (marker.length === 1) kinds.push(lower ? "lowerLetter" : "upperLetter");
  if (isRoman(marker)) kinds.push(lower ? "lowerRoman" : "upperRoman");
  if (isRepeated(marker)) kinds.push(lower ? "doubleLower" : "doubleUpper");
  return kinds;
}

function romanValue(text: string): number {
  const values = [...text.toLowerCase()].map((char) => ROMAN_DIGITS[char]);
  return values.reduce(
    (total, value, i) => total + (value < (values[i + 1] ?? 0) ? -value : value),
    0,
  );
}

const nextLetter = (text: string) =>
  [...text].map((char) => String.fromCharCode(char.charCodeAt(0) + 1)).join("");

/* True when `marker` is the number after `last` in a list of that kind: (h) then (i). */
function follows(kind: Kind, last: string, marker: string): boolean {
  if (kind === "digit") return Number.parseInt(marker, 10) === Number.parseInt(last, 10) + 1;
  if (kind === "lowerRoman" || kind === "upperRoman")
    return romanValue(marker) === romanValue(last) + 1;
  return nextLetter(last) === marker;
}

interface Level {
  kinds: Kind[];
  last: string;
  items: number;
}

/* Places one number on the outline and returns its depth. Mutates the stack it is given. */
function place(stack: Level[], marker: string): number {
  const kinds = kindsOf(marker);
  const sibling = (match: (level: Level) => Kind[]): number => {
    for (let depth = stack.length - 1; depth >= 0; depth--) {
      const shared = match(stack[depth]);
      if (shared.length === 0) continue;
      stack.length = depth + 1;
      stack[depth] = { kinds: shared, last: marker, items: stack[depth].items + 1 };
      return depth;
    }
    return -1;
  };
  const next = sibling((level) => level.kinds.filter((kind) => follows(kind, level.last, marker)));
  if (next >= 0) return next;
  const opens = kinds.filter((kind) => FIRST_OF[kind] === marker);
  const loose =
    opens.length > 0 ? -1 : sibling((level) => level.kinds.filter((kind) => kinds.includes(kind)));
  if (loose >= 0) return loose;
  stack.push({ kinds: opens.length > 0 ? opens : kinds, last: marker, items: 1 });
  return stack.length - 1;
}

/*
 * The depth of the block's first line. A block can open with the headings
 * of its parents ("(3) Phase-out\n(A) In general.—…" is block i-3-A): the
 * smallest start where the leading numbers spell path[start..] is the first line's level.
 */
function baseDepth(path: string[], markers: string[], firstMarked: boolean): number {
  if (!firstMarked) return Math.max(0, path.length - 1);
  for (let start = 0; start < path.length; start++) {
    if (path.slice(start).every((segment, i) => markers[i] === segment)) return start;
  }
  // A repealed paragraph prints as "[(1) Repealed…]" with no number of its own.
  const first = path.indexOf(markers[0]);
  return first >= 0 ? first : path.length;
}

/*
 * An unnumbered line after a list ("shall be treated as…") finishes the
 * list's parent; after one item it is that item's next paragraph. Depths
 * here are relative to the block's first line.
 */
function unnumberedDepth(stack: Level[], previous: LawLine | undefined): number {
  if (previous && previous.markerEnd === 0) return previous.depth;
  const top = stack.at(-1);
  if (top && top.items > 1 && stack.length > 1) stack.pop();
  return Math.max(0, stack.length - 1);
}

/** Each line of a block with its depth. `path` is the block's citation path: ["g", "1"]. */
export function lawLines(path: string[], text: string): LawLine[] {
  const rows = text.split("\n");
  const markersOf = rows.map(leadingMarkers);
  const base = baseDepth(path, markersOf.flat(), markersOf[0].length > 0);
  const stack: Level[] = [];
  const lines: LawLine[] = [];
  rows.forEach((row, i) => {
    const markers = markersOf[i];
    const tableRow = row.includes(TABLE_CELL_JOINT);
    const previous = lines.at(-1);
    let relative: number;
    if (markers.length > 0) relative = markers.map((marker) => place(stack, marker))[0];
    else if (tableRow) relative = (previous?.depth ?? base) - base;
    else
      relative = unnumberedDepth(stack, previous && { ...previous, depth: previous.depth - base });
    const markerEnd = markers.reduce((end, marker) => end + marker.length + 2, 0);
    lines.push({ text: row, depth: base + relative, markerEnd, tableRow });
  });
  return lines;
}

/** Runs of table rows become one table, at the depth of the line that introduces it. */
export function lawParts(lines: LawLine[]): LawPart[] {
  const parts: LawPart[] = [];
  for (const line of lines) {
    const last = parts.at(-1);
    const cells = line.text.split(TABLE_CELL_JOINT);
    if (!line.tableRow) parts.push({ kind: "line", line });
    else if (last?.kind === "table") last.rows.push(cells);
    else parts.push({ kind: "table", depth: line.depth, rows: [cells] });
  }
  return parts;
}
