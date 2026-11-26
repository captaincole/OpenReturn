import { kindsOf, rankOf, type Designator, type Kind } from "./ecfrDesignators";
import type { Entry } from "./ecfrEntries";
import type { Piece, QaParagraph } from "./ecfrLead";
import { choosePlacement, place, type Level } from "./ecfrLevels";
import type { Span, TextSink } from "./textSink";
import { spanOf, type UnitItem, type UnitNode } from "./unitTree";

/*
 * Lays out one regulation section as a unit tree. eCFR prints a section's
 * paragraphs flat; each one's number puts it on the outline. A paragraph
 * with no number (flush text, an example, a table) belongs to the unit
 * above it. A number with no sure place stays where it is, unplaced, with
 * a sequence id ("p017"), and is counted. A paragraph that restates its
 * parents' numbers ("(g)(1)(iii)") continues them, and a range
 * ("(a)-(g)(1)(ii) [Reserved]") leaves the outline at its last number; a
 * unit the text never prints on its own ((g)(1) there) has no lead. In a
 * section of questions and answers, each Q&A is a unit ("Q&A-1") and its
 * answer's numbering starts again.
 */

export interface Unplaced {
  /** The paragraph's text, cut short. */
  text: string;
  /** The citation path of the unit it was kept under. */
  under: string[];
}

export interface SectionLayout {
  root: UnitNode | null;
  unplaced: Unplaced[];
}

interface Draft extends Omit<UnitNode, "span" | "items"> {
  items: DraftItem[];
}

type DraftItem =
  { kind: "unit"; unit: Draft } | { kind: "continuation"; span: Span; name?: string };

interface Layout {
  sink: TextSink;
  root: Draft;
  /** The open units, outermost first; parallel to `outline`. null: a level a range opened, with no unit yet. */
  open: Array<Draft | null>;
  /** The last unit placed: text with no number belongs to it. */
  current: Draft | null;
  /** The unit the outline hangs from: the section, or the Q&A being read. */
  base: Draft;
  outline: Level[];
  examples: Map<Draft, number>;
  unplaced: Unplaced[];
  /** Every number of the section in order, for the lookahead. */
  upcoming: Piece[];
  nextNumber: number;
  before: string;
}

const UNPLACED_CLIP = 100;

export function layoutRegSection(entries: Entry[], sink: TextSink): SectionLayout {
  const root = draft("", "", "", "", null);
  const layout: Layout = {
    sink,
    root,
    open: [],
    current: null,
    base: root,
    outline: [],
    examples: new Map(),
    unplaced: [],
    upcoming: entries.flatMap(numberedPieces),
    nextNumber: 0,
    before: "",
  };
  entries.forEach((entry, index) => addEntry(layout, entry, index + 1));
  return { root: finish(root), unplaced: layout.unplaced };
}

function draft(
  segment: string,
  numText: string,
  heading: string,
  chapeau: string,
  lead: Span | null,
): Draft {
  return {
    segment,
    idSegment: segment,
    numText,
    heading,
    chapeau,
    lead,
    headingOnly: lead !== null && heading !== "" && chapeau === "",
    items: [],
  };
}

const numberedPieces = (entry: Entry): Piece[] => {
  const pieces =
    entry.kind === "paragraph" ? entry.pieces : entry.kind === "qa" ? entry.qa.pieces : [];
  return pieces.filter((piece) => piece.designator);
};

function addEntry(layout: Layout, entry: Entry, ordinal: number): void {
  if (entry.kind === "text") addText(layout, entry.text, entry.example);
  else if (entry.kind === "qa") addQa(layout, entry.qa, ordinal);
  else addPieces(layout, entry.pieces, ordinal);
}

function addPieces(layout: Layout, pieces: Piece[], ordinal: number): void {
  if (!pieces.some((piece) => piece.designator)) {
    addText(layout, pieces.map((piece) => piece.text).join(" "), false);
    return;
  }
  let restating = true;
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    restating = restating && !piece.text && restates(layout.outline[i], piece.designator!);
    if (restating) {
      layout.nextNumber += 1;
      continue;
    }
    if (!addPiece(layout, piece)) {
      keepUnplaced(layout, pieces.slice(i), ordinal);
      return;
    }
  }
}

/** "(g)" in "(g)(1)(iii)" when (g) is the open level at that depth. */
const restates = (level: Level | undefined, designator: Designator) =>
  level !== undefined &&
  level.last === designator.token &&
  kindsOf(designator).includes(level.kind);

// The section's own text before any number is its lead; the rest belongs to the deepest open unit.
function addText(layout: Layout, text: string, example: boolean): void {
  const span = layout.sink.write(text);
  if (!span) return;
  layout.before = text;
  const target = layout.current ?? layout.base;
  if (target === layout.root && !target.lead && target.items.length === 0 && !example) {
    target.lead = span;
    return;
  }
  const count = example ? (layout.examples.get(target) ?? 0) + 1 : 0;
  if (example) layout.examples.set(target, count);
  target.items.push({ kind: "continuation", span, name: example ? `ex${count}` : undefined });
}

function addPiece(layout: Layout, piece: Piece): boolean {
  const designator = piece.designator!;
  layout.nextNumber += 1;
  const upcoming = layout.upcoming.slice(layout.nextNumber).map((next) => next.designator!);
  const placement = choosePlacement(layout.outline, designator, upcoming, layout.before);
  if (!placement) return false;
  layout.outline = place(layout.outline, placement, designator.token);
  layout.open = layout.open.slice(0, placement.depth);
  const parent = materialize(layout, placement.depth - 1);
  const lead = piece.text ? layout.sink.write(piece.text) : null;
  const unit = draft(designator.token, piece.numText, piece.heading, piece.body, lead);
  attach(parent, unit);
  layout.open.push(unit);
  layout.current = unit;
  if (piece.text) layout.before = piece.text;
  if (piece.rangeEnd) applyRange(layout, placement.depth, piece.rangeEnd);
  return true;
}

function attach(parent: Draft, unit: Draft, idBase = unit.segment): void {
  unit.idSegment = uniqueSegment(parent, unit.segment, idBase);
  parent.items.push({ kind: "unit", unit });
}

const QA_SEGMENT = "Q&A-";
const QA_ID = "qa";

/*
 * "Q-1. …" opens Q&A-1 under the section; "A-1. …" continues it. The
 * answer's numbers hang from the Q&A, so "(a)" opens again in each one.
 */
function addQa(layout: Layout, qa: QaParagraph, ordinal: number): void {
  const segment = `${QA_SEGMENT}${qa.number}`;
  const open = layout.base !== layout.root && layout.base.segment === segment;
  if (qa.question || !open) {
    const unit = draft(segment, "", "", "", null);
    attach(layout.root, unit, `${QA_ID}${qa.number}`);
    layout.base = unit;
  }
  layout.outline = [];
  layout.open = [];
  layout.current = layout.base;
  const pieces = qa.pieces;
  const first = pieces.findIndex((piece) => piece.text);
  const marked = pieces.map((piece, i) =>
    i === first ? { ...piece, text: `${qa.mark} ${piece.text}` } : piece,
  );
  if (qa.question || !marked.some((piece) => piece.designator)) {
    const text =
      marked
        .map((piece) => piece.text)
        .filter(Boolean)
        .join(" ") || qa.mark;
    writeQaText(layout, text);
  } else addPieces(layout, marked, ordinal);
}

// The question is the Q&A's lead; an answer with no number continues it.
function writeQaText(layout: Layout, text: string): void {
  const span = layout.sink.write(text);
  if (!span) return;
  layout.before = text;
  if (!layout.base.lead && layout.base.items.length === 0) layout.base.lead = span;
  else layout.base.items.push({ kind: "continuation", span });
}

/** The unit open at a depth, made with no lead when only a range opened it. */
function materialize(layout: Layout, depth: number): Draft {
  if (depth < 0) return layout.base;
  const open = layout.open[depth];
  if (open) return open;
  const parent = materialize(layout, depth - 1);
  const last = layout.outline[depth].last;
  const unit = draft(last, `(${last})`, "", "", null);
  attach(parent, unit);
  layout.open[depth] = unit;
  return unit;
}

/*
 * "(a)-(g)(1)(ii)": the range's last number takes the level of the same
 * kind, at or above the piece; each number after it goes one level down.
 */
function applyRange(layout: Layout, depth: number, end: Designator[]): void {
  const kinds = kindsOf(end[0]);
  let at = depth;
  while (at >= 0 && !kinds.includes(layout.outline[at].kind)) at--;
  if (at < 0) return;
  const levels: Level[] = [{ kind: layout.outline[at].kind, last: end[0].token }];
  for (const next of end.slice(1)) {
    const kind = deeperKind(next, levels[levels.length - 1].kind);
    if (!kind) break;
    levels.push({ kind, last: next.token });
  }
  layout.outline = [...layout.outline.slice(0, at), ...levels];
  layout.open = [...layout.open.slice(0, at), ...levels.map(() => null)];
}

const deeperKind = (designator: Designator, above: Kind): Kind | undefined =>
  kindsOf(designator).find((kind) => rankOf(kind) > rankOf(above));

function uniqueSegment(parent: Draft, segment: string, idBase = segment): string {
  const count = parent.items.filter(
    (item) => item.kind === "unit" && item.unit.segment === segment,
  ).length;
  return count === 0 ? idBase : `${idBase}-dup${count + 1}`;
}

// The rest of the paragraph stays together, under the last unit placed for sure.
function keepUnplaced(layout: Layout, pieces: Piece[], ordinal: number): void {
  layout.nextNumber += pieces.filter((piece) => piece.designator).length - 1;
  // A bare number's text is in its child's piece ("(2)(i) For …"), so only pieces with text join.
  const text = pieces
    .map((piece) => piece.text)
    .filter(Boolean)
    .join(" ");
  const target = layout.current ?? layout.base;
  const span = layout.sink.write(text);
  if (!span) return;
  layout.before = text;
  target.items.push({ kind: "continuation", span, name: `p${String(ordinal).padStart(3, "0")}` });
  const under = layout.outline.map((level) => level.last);
  layout.unplaced.push({ text: text.slice(0, UNPLACED_CLIP), under });
}

function finish(unit: Draft): UnitNode | null {
  const items: UnitItem[] = unit.items.flatMap((item): UnitItem[] => {
    if (item.kind === "continuation") return [item];
    const child = finish(item.unit);
    return child ? [{ kind: "unit", unit: child }] : [];
  });
  const span = spanOf(unit.lead, items);
  return span ? { ...unit, items, span } : null;
}
