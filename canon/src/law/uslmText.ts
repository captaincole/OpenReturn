import type { AnyNode, Element, Text } from "domhandler";
import { attr, childElements, isElement, UNIT_TAGS } from "./uslmDom";

/*
 * Plain statute text from USLM nodes. Paragraphs and table rows become lines;
 * all other whitespace squashes to one space. Footnotes ("So in original")
 * and notes are editorial, not statute, so they never reach the text.
 */

export interface RefMark {
  /** Offset of the ref's first character in the text. */
  offset: number;
  href: string;
}

export interface Extracted {
  text: string;
  refs: RefMark[];
}

const LINE_TAGS = new Set(["p", "br", "tr", ...UNIT_TAGS]);
const SKIPPED_TAGS = new Set(["note", "notes", "sourceCredit", "toc"]);
const CELL_TAGS = new Set(["th", "td"]);
const SOFT_HYPHEN = "­";
const US_CODE_HREF = "/us/usc/";

/*
 * A ref leaves a marker with its index in the raw text. Markers survive the
 * whitespace pass, so each ref's final offset is exact.
 */
const MARK_OPEN = "";
const MARK_CLOSE = "";
const REF_MARK = new RegExp(`${MARK_OPEN}(\\d+)${MARK_CLOSE}`, "g");

export function extractText(nodes: AnyNode[]): Extracted {
  const hrefs: string[] = [];
  const raw = nodes.map((node) => rawText(node, hrefs)).join("");
  const lines = raw.replaceAll(SOFT_HYPHEN, "").split("\n").map(squash).filter(hasVisibleText);
  return placeRefs(lines.join("\n"), hrefs);
}

export const squash = (text: string): string => text.replace(/\s+/g, " ").trim();

const withoutMarks = (text: string) => text.replace(REF_MARK, "");

const hasVisibleText = (line: string) => withoutMarks(line).trim() !== "";

function rawText(node: AnyNode, hrefs: string[]): string {
  if (node.type === "text") return (node as Text).data;
  if (!isElement(node) || isSkipped(node)) return "";
  if (node.tagName === "table") return tableText(node, hrefs);
  const inner = node.children.map((child) => rawText(child, hrefs)).join("");
  if (node.tagName === "ref") return refText(node, inner, hrefs);
  return LINE_TAGS.has(node.tagName) ? `\n${inner}\n` : inner;
}

// The marker for a footnote ("1") is not statute text either.
const isSkipped = (el: Element) =>
  SKIPPED_TAGS.has(el.tagName) ||
  (el.tagName === "ref" && attr(el, "class") === "footnoteRef") ||
  isFootnoteSup(el);

/*
 * A bare <sup>2</sup> marks a footnote; a fraction prints as
 * <sup>1</sup>⁄<sub>12</sub>, so a sup before the fraction slash stays.
 */
const FRACTION_SLASH = "\u2044";
function isFootnoteSup(el: Element): boolean {
  if (el.tagName !== "sup") return false;
  const next = el.next;
  return !(next?.type === "text" && (next as Text).data.startsWith(FRACTION_SLASH));
}

function refText(el: Element, inner: string, hrefs: string[]): string {
  const href = attr(el, "href");
  if (!href?.startsWith(US_CODE_HREF)) return inner;
  const lead = inner.length - inner.trimStart().length;
  const mark = `${MARK_OPEN}${hrefs.length}${MARK_CLOSE}`;
  hrefs.push(href);
  return inner.slice(0, lead) + mark + inner.slice(lead);
}

// One line per row, cells joined by " | "; the header row comes first in the XML.
function tableText(table: Element, hrefs: string[]): string {
  const rows = descendants(table, "tr").map((row) =>
    childElements(row)
      .filter((cell) => CELL_TAGS.has(cell.tagName))
      .map((cell) => squash(cell.children.map((child) => rawText(child, hrefs)).join(" ")))
      .filter(hasVisibleText)
      .join(" | "),
  );
  return `\n${rows.join("\n")}\n`;
}

function descendants(el: Element, tag: string): Element[] {
  return childElements(el).flatMap((child) =>
    child.tagName === tag ? [child] : descendants(child, tag),
  );
}

function placeRefs(marked: string, hrefs: string[]): Extracted {
  const refs: RefMark[] = [];
  let removed = 0;
  const text = marked.replace(REF_MARK, (mark: string, index: string, at: number) => {
    refs.push({ offset: at - removed, href: hrefs[Number(index)] });
    removed += mark.length;
    return "";
  });
  return { text, refs };
}
