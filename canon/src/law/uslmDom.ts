import type { AnyNode, Element } from "domhandler";

// Small readers over the USLM element tree, so the parser never needs cheerio's wrappers.

/** The levels inside a Code section, outermost first; "level" is USLM's generic one. */
export const UNIT_TAGS = new Set([
  "subsection",
  "paragraph",
  "subparagraph",
  "clause",
  "subclause",
  "item",
  "subitem",
  "level",
]);

/** The levels above a Code section. The title itself is the document. */
export const STRUCTURE_TAGS = new Set(["subtitle", "chapter", "subchapter", "part", "subpart"]);

/** The text a unit opens with, before its children. */
export const BODY_TAGS = new Set(["chapeau", "content"]);

export const isElement = (node: AnyNode): node is Element => node.type === "tag";

export const childElements = (el: Element): Element[] => el.children.filter(isElement);

export const firstChild = (el: Element, tag: string): Element | undefined =>
  childElements(el).find((child) => child.tagName === tag);

export const attr = (el: Element, name: string): string | undefined => el.attribs[name];

/** Repealed, omitted, reserved, renumbered or transferred: no statute text. */
export const statusOf = (el: Element): string | undefined => attr(el, "status");

export const isUnit = (el: Element): boolean => UNIT_TAGS.has(el.tagName);

export function findFirst(nodes: AnyNode[], tag: string): Element | undefined {
  for (const node of nodes) {
    if (!isElement(node)) continue;
    if (node.tagName === tag) return node;
    const inner = findFirst(node.children, tag);
    if (inner) return inner;
  }
  return undefined;
}
