import type { AnyNode, Element, Text } from "domhandler";
import { type Piece, type QaParagraph, qaParagraph, splitParagraph } from "./ecfrLead";
import { plainText, runsOf, tableLines } from "./ecfrText";
import { attr, childElements, isElement } from "./uslmDom";
import { squash } from "./uslmText";

/*
 * The content of one eCFR section (DIV8) as a list of entries in order: a
 * paragraph that may carry numbers, or text that carries none (flush text,
 * an example, a table, a quoted extract). Source citations, authority and
 * editorial notes are not regulation text and leave no entry.
 */

export type Entry =
  | { kind: "paragraph"; pieces: Piece[] }
  | { kind: "qa"; qa: QaParagraph }
  | { kind: "text"; text: string; example: boolean };

/** Paragraphs whose text can open with a number. */
const PARAGRAPH_TAGS = new Set(["P", "P-2", "P-DASH"]);
/** Notes about the text, not the text. */
export const SKIPPED_TAGS = new Set([
  "HEAD",
  "CITA",
  "SECAUTH",
  "EDNOTE",
  "AUTH",
  "SOURCE",
  "APPRO",
  "XREF",
  "PARAUTH",
  "STARS",
  "MATH",
]);
/** Center headings inside a section. One at the end heads the next group of sections, not this one. */
const CENTER_HEADING_TAGS = new Set(["HD1", "HD2", "HD3", "HED1"]);
const TABLE_TAGS = new Set(["TABLE", "GPOTABLE"]);
/** One line of text each; a container of any other tag reads child by child. */
const LINE_TAGS = new Set([
  ...PARAGRAPH_TAGS,
  "FP",
  "FP-1",
  "FP-2",
  "FP1-2",
  "FP-DASH",
  "FRP",
  "PSPACE",
  "HED",
  "FL-2",
  "LDRFIG",
  "LI",
  ...CENTER_HEADING_TAGS,
]);

export function entriesOf(section: Element): Entry[] {
  const content = childElements(section).filter((child) => !SKIPPED_TAGS.has(child.tagName));
  const last = lastTextIndex(content);
  return content.slice(0, last + 1).flatMap(entryOf);
}

// Trailing center headings belong to what follows the section.
function lastTextIndex(content: Element[]): number {
  for (let i = content.length - 1; i >= 0; i--)
    if (!CENTER_HEADING_TAGS.has(content[i].tagName)) return i;
  return -1;
}

/** Center headings dropped from the end of a section, for the parser's counts. */
export const trailingHeadings = (section: Element): number => {
  const content = childElements(section).filter((child) => !SKIPPED_TAGS.has(child.tagName));
  return content.length - 1 - lastTextIndex(content);
};

function entryOf(el: Element): Entry[] {
  if (PARAGRAPH_TAGS.has(el.tagName)) {
    const runs = runsOf(el);
    const qa = qaParagraph(runs);
    if (qa) return [{ kind: "qa", qa: { ...qa, pieces: qa.pieces.filter(hasContent) } }];
    const pieces = splitParagraph(runs).filter(hasContent);
    return pieces.length > 0 ? [{ kind: "paragraph", pieces }] : [];
  }
  const text = linesOf(el).filter(Boolean).join("\n");
  return text ? [{ kind: "text", text, example: el.tagName === "EXAMPLE" }] : [];
}

const hasContent = (piece: Piece) => piece.text !== "" || piece.designator !== null;

/** Every line of an element: a table row by row, a container child by child. */
export function linesOf(el: Element): string[] {
  if (SKIPPED_TAGS.has(el.tagName)) return [];
  if (TABLE_TAGS.has(el.tagName)) return tableLines(el);
  if (LINE_TAGS.has(el.tagName)) return [plainText(el)];
  if (!childElements(el).some(isBlock)) return [plainText(el)];
  return el.children.flatMap(nodeLines);
}

function nodeLines(node: AnyNode): string[] {
  if (node.type === "text") return [squash((node as Text).data)];
  return isElement(node) ? linesOf(node) : [];
}

const isBlock = (el: Element): boolean =>
  LINE_TAGS.has(el.tagName) ||
  TABLE_TAGS.has(el.tagName) ||
  SKIPPED_TAGS.has(el.tagName) ||
  childElements(el).some(isBlock);

/** "§ 1.469-5T Material participation (temporary)." */
export const sectionHeading = (section: Element): string => {
  const head = childElements(section).find((child) => child.tagName === "HEAD");
  return head ? plainText(head) : "";
};

/** The section number as the N attribute gives it: "1.469-5T". */
export const sectionNumber = (section: Element): string => attr(section, "N") ?? "";
