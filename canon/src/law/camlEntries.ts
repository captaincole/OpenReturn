import * as cheerio from "cheerio";
import type { AnyNode, Element, Text } from "domhandler";
import { isCaDesignatorToken } from "./caDesignators";
import type { Entry } from "./ecfrEntries";
import type { Piece } from "./ecfrLead";
import { childElements, isElement } from "./uslmDom";
import { squash } from "./uslmText";

/*
 * The text of one California code section (its CAML XML file) as the list
 * of entries the regulations' outline step reads. California prints a
 * section's paragraphs flat; a paragraph opens with its numbers, each one
 * followed by a space: "(a) (1) There shall be imposed…". A table is one
 * entry, a row a line, its cells joined by " | ". The numbers run together
 * in the text, as a citation writes them: "(a)(1) There shall be imposed…".
 */

const SPACE_CLASSES = new Set([
  "EnSpace",
  "EmSpace",
  "ThinSpace",
  "DottedLeaders",
  "DashedLeaders",
]);
const TABLE_TAG = "table";
const ROW_TAG = "tr";
const CELL_TAGS = new Set(["td", "th"]);
const FRACTION_TAG = "caml:Fraction";
const NUMERATOR_TAG = "caml:Numerator";
const DENOMINATOR_TAG = "caml:Denominator";
const CELL_JOINT = " | ";
const MAX_TOKEN = 8;

export function camlEntries(xml: string): Entry[] {
  const dom = cheerio.load(xml, { xml: true });
  const content = dom.root().get(0)?.children.find(isElement);
  if (!content) return [];
  return childElements(content).flatMap(entryOf);
}

function entryOf(el: Element): Entry[] {
  if (el.tagName === TABLE_TAG) {
    const text = tableRows(el).join("\n");
    return text ? [{ kind: "text", text, example: false }] : [];
  }
  const text = squash(inlineText(el.children));
  if (!text) return [];
  const pieces = paragraphPieces(text);
  return pieces ? [{ kind: "paragraph", pieces }] : [{ kind: "text", text, example: false }];
}

/** Inline text: a space span is a space, a line break a space, a fraction "1/2". */
function inlineText(nodes: AnyNode[]): string {
  return nodes.map(nodeText).join("");
}

function nodeText(node: AnyNode): string {
  if (node.type === "text") return (node as Text).data;
  if (!isElement(node)) return "";
  if (node.tagName === "br" || SPACE_CLASSES.has(node.attribs.class ?? "")) return " ";
  if (node.tagName === FRACTION_TAG) return fractionText(node);
  return inlineText(node.children);
}

function fractionText(el: Element): string {
  const part = (tag: string) => {
    const found = childElements(el).find((child) => child.tagName === tag);
    return found ? squash(inlineText(found.children)) : "";
  };
  return `${part(NUMERATOR_TAG)}/${part(DENOMINATOR_TAG)}`;
}

/** One line per row; empty cells and empty rows leave nothing. */
function tableRows(table: Element): string[] {
  return descendants(table, ROW_TAG)
    .map((row) =>
      childElements(row)
        .filter((cell) => CELL_TAGS.has(cell.tagName))
        .map((cell) => squash(cellText(cell)))
        .filter(Boolean)
        .join(CELL_JOINT),
    )
    .filter(Boolean);
}

// The paragraphs of a cell are one line: a cell prints in one table column.
const cellText = (cell: Element): string =>
  cell.children.map((node) => (isElement(node) ? ` ${nodeText(node)} ` : nodeText(node))).join("");

function descendants(el: Element, tag: string): Element[] {
  return childElements(el).flatMap((child) =>
    child.tagName === tag ? [child] : descendants(child, tag),
  );
}

/** The numbers a paragraph opens with, each one before a space: "(a) (1) …" → ["a", "1"]. */
export function leadingNumbers(text: string): { tokens: string[]; body: string } {
  const tokens: string[] = [];
  let rest = text;
  for (;;) {
    const close = rest.indexOf(")");
    const token = rest.startsWith("(") && close > 1 ? rest.slice(1, close) : "";
    const spaced = rest.length === close + 1 || rest[close + 1] === " ";
    if (!token || token.length > MAX_TOKEN || !spaced || !isCaDesignatorToken(token)) break;
    tokens.push(token);
    rest = rest.slice(close + 1).trimStart();
  }
  return { tokens, body: rest };
}

/*
 * One piece per number, as the outline step reads them. A number with no
 * text of its own (the "(a)" of "(a) (1) …") runs into the next: its piece
 * has no text, and the last piece's line holds every number.
 */
function paragraphPieces(text: string): Piece[] | null {
  const { tokens, body } = leadingNumbers(text);
  if (tokens.length === 0) return null;
  const numbers = tokens.map((token) => `(${token})`).join("");
  return tokens.map((token, index) => {
    const last = index === tokens.length - 1;
    return {
      designator: { token, italic: false },
      numText: `(${token})`,
      heading: "",
      body: last ? body : "",
      text: last ? [numbers, body].filter(Boolean).join(" ") : "",
    };
  });
}
