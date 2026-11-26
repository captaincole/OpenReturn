import type { AnyNode, Element, Text } from "domhandler";
import { attr, childElements, isElement } from "./uslmDom";
import { squash } from "./uslmText";

/*
 * Plain text from eCFR XML. A paragraph's inline text is a list of runs,
 * each italic or not: the italic marks tell a heading and a deep paragraph
 * number apart. Footnote markers and figures leave no text.
 */

export interface Run {
  text: string;
  italic: boolean;
}

/** Inline tags with no text of their own: footnote markers, images, page stars. */
const SILENT_TAGS = new Set(["FTREF", "SU", "img", "STARS"]);
/* E T="03" is italic, as <I> is; T="04" is bold italic. */
const ITALIC_E_TYPES = new Set(["03", "04"]);
const TABLE_ROW_TAGS = new Set(["TR"]);
const TABLE_CELL_TAGS = new Set(["TH", "TD"]);
const TABLE_CAPTION_TAGS = new Set(["CAPTION", "TCAP"]);
const CELL_JOINT = " | ";

const isItalicTag = (el: Element) =>
  el.tagName === "I" || (el.tagName === "E" && ITALIC_E_TYPES.has(attr(el, "T") ?? ""));

/** The runs of one paragraph, adjacent runs of the same kind merged. */
export function runsOf(el: Element): Run[] {
  const runs: Run[] = [];
  collectRuns(el.children, false, runs);
  return mergeRuns(runs);
}

function collectRuns(nodes: AnyNode[], italic: boolean, runs: Run[]): void {
  for (const node of nodes) {
    if (node.type === "text") runs.push({ text: (node as Text).data, italic });
    else if (isElement(node)) collectElement(node, italic, runs);
  }
}

function collectElement(el: Element, italic: boolean, runs: Run[]): void {
  if (SILENT_TAGS.has(el.tagName)) return;
  if (el.tagName === "br") runs.push({ text: " ", italic });
  else if (el.tagName === "FR") runs.push({ text: fractionText(el, runs), italic });
  else collectRuns(el.children, italic || isItalicTag(el), runs);
}

// "33<FR>1/3</FR> percent" prints as 33⅓: a space keeps "33 1/3" from reading as 331/3.
function fractionText(el: Element, runs: Run[]): string {
  const before = runs.at(-1)?.text ?? "";
  const text = plainText(el);
  const glued = before.length > 0 && isDigit(before[before.length - 1]);
  return glued ? ` ${text}` : text;
}

const isDigit = (char: string) => char >= "0" && char <= "9";

function mergeRuns(runs: Run[]): Run[] {
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged.at(-1);
    if (last && last.italic === run.italic) last.text += run.text;
    else if (run.text) merged.push({ ...run });
  }
  return merged;
}

/** One line of text from runs: whitespace squashed, ends trimmed. */
export const runsText = (runs: Run[]): string => squash(runs.map((run) => run.text).join(""));

export const plainText = (el: Element): string => runsText(runsOf(el));

/** A table: its caption, then one line per row, cells joined by " | " as the statute's tables are. */
export function tableLines(el: Element): string[] {
  const captions = descendants(el, TABLE_CAPTION_TAGS).map(plainText).filter(Boolean);
  const rows = descendants(el, TABLE_ROW_TAGS).map((row) =>
    childElements(row)
      .filter((cell) => TABLE_CELL_TAGS.has(cell.tagName))
      .map(plainText)
      .filter(Boolean)
      .join(CELL_JOINT),
  );
  return [...captions, ...rows.filter(Boolean)];
}

function descendants(el: Element, tags: Set<string>): Element[] {
  return childElements(el).flatMap((child) =>
    tags.has(child.tagName) ? [child] : descendants(child, tags),
  );
}
