import type { Span } from "./textSink";

/*
 * A law section as a tree of numbered units (subsection, paragraph, …),
 * the shape both parsers build: the statute's from nested XML, the
 * regulations' from flat paragraphs. unitBlocks.ts turns it into blocks.
 */

export interface UnitNode {
  /** The number as the text prints it: "g", "1", "A". Empty for the section. */
  segment: string;
  /** The segment, with "-dup2" when the text repeats a number under one parent. */
  idSegment: string;
  numText: string;
  heading: string;
  /** The lead's text that its list items finish; empty when the unit opens with nothing to finish. */
  chapeau: string;
  lead: Span | null;
  /** The lead is a number and heading with no text after it: "(1) Fully taxable transaction". */
  headingOnly: boolean;
  items: UnitItem[];
  span: Span;
}

/**
 * Text inside a unit that is not a child unit. `name` is the id step when
 * the parser knows one ("ex1" for an example); otherwise "cont", "cont2", ….
 */
export type UnitItem =
  { kind: "unit"; unit: UnitNode } | { kind: "continuation"; span: Span; name?: string };

export function spanOf(lead: Span | null, items: UnitItem[]): Span | null {
  const spans = [lead, ...items.map((item) => (item.kind === "unit" ? item.unit.span : item.span))];
  const present = spans.filter((span): span is Span => span !== null);
  if (present.length === 0) return null;
  return { start: present[0].start, end: present[present.length - 1].end };
}
