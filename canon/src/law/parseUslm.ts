import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ParsedDoc } from "../refdocs/parse";
import { slugOf } from "./lawIds";
import { assertUnique, openRow, type RowState, type SectionRow } from "./lawRows";
import { createSink } from "./textSink";
import { sectionBlocks, type SectionInfo } from "./unitBlocks";
import type { UnitNode } from "./unitTree";
import {
  attr,
  BODY_TAGS,
  childElements,
  findFirst,
  firstChild,
  isUnit,
  statusOf,
  STRUCTURE_TAGS,
} from "./uslmDom";
import { extractText } from "./uslmText";
import { layoutSection } from "./uslmUnits";

/*
 * Parses the official USLM XML of a US Code title into the rows the other
 * parsers return. Structure levels (subtitle … subpart) and Code sections
 * are section rows; the units inside a section are blocks. Notes and source
 * credits are not statute text and stay out. There are no pages: page 1.
 */

export interface UslmStats {
  structureRows: number;
  codeSections: number;
  /** Sections with no statute text (repealed, omitted, reserved, renumbered…). */
  skippedSections: number;
  skippedByStatus: Record<string, number>;
  /** Structure levels marked repealed: no row, their sections attach above. */
  skippedStructureRows: number;
  sectionsWithStatutoryNotes: number;
  blocks: number;
}

export interface ParsedUslm extends ParsedDoc {
  canonicalText: string;
  stats: UslmStats;
}

interface LaidOutSection {
  info: SectionInfo;
  root: UnitNode;
}

interface State extends RowState {
  titlePrefix: string;
  laidOut: LaidOutSection[];
  stats: UslmStats;
}

const NO_STATUS = "no text";

export function parseUslmTitle(xml: string, docId: string): ParsedUslm {
  const dom = cheerio.load(xml, { xml: true });
  const main = findFirst(dom.root().get(0)?.children ?? [], "main");
  const title = main && firstChild(main, "title");
  if (!title) throw new Error("USLM: no <main><title> element");
  const state = newState(docId, `${attr(title, "identifier") ?? ""}/`);
  walkChildren(title, null, state);
  const canonicalText = state.sink.text();
  const laidOut = { text: canonicalText, refsIn: state.sink.refsIn };
  const blocks: ParsedDoc["blocks"] = [];
  for (const section of state.laidOut)
    blocks.push(...sectionBlocks(section.info, section.root, laidOut, blocks.length));
  assertUnique(
    "section id",
    state.sections.map((row) => row.sectionId),
  );
  assertUnique(
    "block id",
    blocks.map((block) => block.blockId),
  );
  return {
    canonicalText,
    sections: state.sections,
    blocks,
    stats: { ...state.stats, blocks: blocks.length },
  };
}

function newState(docId: string, titlePrefix: string): State {
  return {
    docId,
    titlePrefix,
    sink: createSink(),
    sections: [],
    sectionIds: new Set(),
    laidOut: [],
    stats: {
      structureRows: 0,
      codeSections: 0,
      skippedSections: 0,
      skippedByStatus: {},
      skippedStructureRows: 0,
      sectionsWithStatutoryNotes: 0,
      blocks: 0,
    },
  };
}

function walkChildren(el: Element, parentId: string | null, state: State): void {
  for (const child of childElements(el)) {
    if (STRUCTURE_TAGS.has(child.tagName)) addStructure(child, parentId, state);
    else if (child.tagName === "section") addCodeSection(child, parentId, state);
  }
}

function addStructure(el: Element, parentId: string | null, state: State): void {
  if (statusOf(el)) {
    state.stats.skippedStructureRows += 1;
    walkChildren(el, parentId, state);
    return;
  }
  const row = openRow(state, slugOf(pathOf(el, state)), labelOf(el, ""), parentId);
  state.stats.structureRows += 1;
  walkChildren(el, row.sectionId, state);
  row.charEnd = state.sink.length();
}

function addCodeSection(el: Element, parentId: string | null, state: State): void {
  const status = statusOf(el) ?? (hasStatuteText(el) ? undefined : NO_STATUS);
  if (status) {
    state.stats.skippedSections += 1;
    state.stats.skippedByStatus[status] = (state.stats.skippedByStatus[status] ?? 0) + 1;
    return;
  }
  const row = openRow(state, slugOf(pathOf(el, state)), labelOf(el, " "), parentId);
  const root = layoutSection(el, state.sink);
  row.charEnd = state.sink.length();
  state.stats.codeSections += 1;
  if (hasStatutoryNotes(el)) state.stats.sectionsWithStatutoryNotes += 1;
  if (root) state.laidOut.push({ info: sectionInfo(el, row, state), root });
}

/** "Subtitle A—Income Taxes"; "§ 469. Passive activity losses and credits limited". */
function labelOf(el: Element, joint: string): string {
  const num = firstChild(el, "num");
  const heading = firstChild(el, "heading");
  const numText = num ? extractText([num]).text : "";
  const headingText = heading ? extractText([heading]).text : "";
  const glue = numText.endsWith("—") ? "" : joint;
  return [numText, headingText].filter(Boolean).join(glue);
}

// "/us/usc/t26/stA/ch1/schB/ptVI" → "stA/ch1/schB/ptVI".
function pathOf(el: Element, state: State): string {
  const identifier = attr(el, "identifier") ?? "";
  return identifier.startsWith(state.titlePrefix)
    ? identifier.slice(state.titlePrefix.length)
    : identifier;
}

const hasStatuteText = (el: Element) =>
  childElements(el).some(
    (child) => isUnit(child) || BODY_TAGS.has(child.tagName) || child.tagName === "continuation",
  );

const hasStatutoryNotes = (el: Element) =>
  childElements(el)
    .filter((child) => child.tagName === "notes")
    .some((notes) => childElements(notes).some((note) => attr(note, "topic") === "statutoryNotes"));

function sectionInfo(el: Element, row: SectionRow, state: State): SectionInfo {
  const num = firstChild(el, "num");
  const heading = firstChild(el, "heading");
  return {
    sectionId: row.sectionId,
    number: (num && attr(num, "value")) || pathOf(el, state).replace(/^s/, ""),
    catchline: heading ? extractText([heading]).text : "",
  };
}
