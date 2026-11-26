import type { Element } from "domhandler";
import { citationSegment } from "./lawIds";
import type { Span, TextSink } from "./textSink";
import { attr, BODY_TAGS, childElements, firstChild, isUnit } from "./uslmDom";
import { type Extracted, extractText } from "./uslmText";

/*
 * Lays out one Code section as a tree of units (subsection, paragraph, …).
 * Each unit writes its lead (number, heading, chapeau or content) as one
 * piece, then its children and continuations in document order. The block
 * step decides later which ranges become blocks.
 */

export interface UnitNode {
  /** The number as the statute prints it: "g", "1", "A". Empty for the section. */
  segment: string;
  /** The segment, with "-dup2" when the statute repeats a number under one parent. */
  idSegment: string;
  numText: string;
  heading: string;
  /** The chapeau's text; empty when the unit opens with content or nothing. */
  chapeau: string;
  lead: Span | null;
  /** The lead is a number and heading with no text after it: "(1) Fully taxable transaction". */
  headingOnly: boolean;
  items: UnitItem[];
  span: Span;
}

export type UnitItem = { kind: "unit"; unit: UnitNode } | { kind: "continuation"; span: Span };

interface UnitParts {
  num?: Element;
  heading?: Element;
  body?: Element;
  rest: Element[];
}

interface LayoutOpts {
  names: Pick<UnitNode, "segment" | "idSegment">;
  /** False for the section: its number and catchline are the section row's heading. */
  labeled: boolean;
  /** A parent's bare number, printed run in: "(12)(A) Benevolent life insurance…". */
  carry: string;
}

/** The section is the root unit: its lead is its text before any subsection. */
export function layoutSection(section: Element, sink: TextSink): UnitNode | null {
  return layoutUnit(
    section,
    { names: { segment: "", idSegment: "" }, labeled: false, carry: "" },
    sink,
  );
}

function layoutUnit(el: Element, opts: LayoutOpts, sink: TextSink): UnitNode | null {
  const parts = splitParts(el);
  const numText = opts.labeled && parts.num ? extractText([parts.num]).text : "";
  const heading = opts.labeled && parts.heading ? extractText([parts.heading]) : null;
  const body = parts.body ? extractText([parts.body]) : null;
  const label = opts.carry + numText;
  const firstItem = parts.rest.at(0);
  const bareNumber = !heading?.text && !body && firstItem !== undefined && isUnit(firstItem);
  const lead = bareNumber ? null : sink.write(leadText(label, heading, body));
  const items = childItems(parts.rest, sink, bareNumber ? label : "");
  const span = spanOf(lead, items);
  if (!span) return null;
  return {
    ...opts.names,
    numText,
    heading: heading?.text ?? "",
    chapeau: parts.body?.tagName === "chapeau" ? (body?.text ?? "") : "",
    lead,
    headingOnly: lead !== null && body === null,
    items,
    span,
  };
}

// The lead is num, heading and the first chapeau or content before any child unit.
function splitParts(el: Element): UnitParts {
  const children = childElements(el);
  const firstUnit = children.findIndex(isUnit);
  const opening = firstUnit < 0 ? children : children.slice(0, firstUnit);
  const body = opening.find((child) => BODY_TAGS.has(child.tagName));
  return {
    num: firstChild(el, "num"),
    heading: firstChild(el, "heading"),
    body,
    rest: children.filter((child) => child !== body && isItem(child)),
  };
}

// A chapeau or content after a child unit reads like a continuation.
const isItem = (el: Element) =>
  isUnit(el) || el.tagName === "continuation" || BODY_TAGS.has(el.tagName);

function childItems(children: Element[], sink: TextSink, carry: string): UnitItem[] {
  const seen = new Map<string, number>();
  return children.flatMap((child, index): UnitItem[] => {
    if (!isUnit(child)) {
      const span = sink.write(extractText([child]));
      return span ? [{ kind: "continuation", span }] : [];
    }
    const segment = segmentOf(child, index);
    const count = (seen.get(segment) ?? 0) + 1;
    seen.set(segment, count);
    const idSegment = count === 1 ? segment : `${segment}-dup${count}`;
    const names = { segment, idSegment };
    const unit = layoutUnit(child, { names, labeled: true, carry: index === 0 ? carry : "" }, sink);
    return unit ? [{ kind: "unit", unit }] : [];
  });
}

/*
 * "(A) In general.—If all gain…": the heading and the text run together
 * as the Statutes at Large print them. A heading alone stays bare.
 */
export function leadText(numText: string, heading: Extracted | null, body: Extracted | null) {
  const label = [numText, heading?.text].filter(Boolean).join(" ");
  const joint = !body ? "" : heading?.text ? headingJoint(heading.text) : label ? " " : "";
  const prefix = label + joint;
  const headingStart = numText && heading ? numText.length + 1 : 0;
  return {
    text: prefix + (body?.text ?? ""),
    refs: [
      ...(heading?.refs ?? []).map((ref) => ({ ...ref, offset: ref.offset + headingStart })),
      ...(body?.refs ?? []).map((ref) => ({ ...ref, offset: ref.offset + prefix.length })),
    ],
  };
}

function headingJoint(heading: string): string {
  if (heading.endsWith("—")) return "";
  return heading.endsWith(".") ? "—" : ".—";
}

// The identifier's last step is the number in citation form; "1400Z–2" → "1400Z-2".
function segmentOf(el: Element, index: number): string {
  const identifier = attr(el, "identifier");
  const num = firstChild(el, "num");
  const raw = identifier
    ? identifier.slice(identifier.lastIndexOf("/") + 1)
    : num && attr(num, "value");
  return citationSegment(raw ?? "") || `n${index + 1}`;
}

function spanOf(lead: Span | null, items: UnitItem[]): Span | null {
  const spans = [lead, ...items.map((item) => (item.kind === "unit" ? item.unit.span : item.span))];
  const present = spans.filter((span): span is Span => span !== null);
  if (present.length === 0) return null;
  return { start: present[0].start, end: present[present.length - 1].end };
}
