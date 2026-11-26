import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ParsedDoc } from "../refdocs/parse";
import { entriesOf, sectionHeading, sectionNumber, trailingHeadings } from "./ecfrEntries";
import { plainText } from "./ecfrText";
import { layoutRegSection, type Unplaced } from "./ecfrUnits";
import { regCitationOf, regSlugOf, slugOf } from "./lawIds";
import { assertUnique, openRow, type RowState, type SectionRow } from "./lawRows";
import { createSink } from "./textSink";
import { sectionBlocks, type SectionInfo } from "./unitBlocks";
import type { UnitNode } from "./unitTree";
import { childElements, findFirst } from "./uslmDom";

/*
 * Parses the eCFR XML of Treasury regulation parts into the rows the
 * statute parser returns. Part (DIV5), subpart (DIV6) and subject group
 * (DIV7) are section rows; each regulation section (DIV8) is a row whose
 * paragraphs are blocks. One call takes every part of the document, in
 * order, into one text. There are no pages: page 1.
 */

export interface EcfrStats {
  structureRows: number;
  regSections: number;
  reservedSections: number;
  /** Sections with no text but their heading and source note. */
  emptySections: number;
  /** Paragraph numbers with no sure place on the outline, kept with a sequence id. */
  unplaced: number;
  unplacedExamples: Array<Unplaced & { section: string }>;
  /** Center headings at a section's end: they head the sections that follow, so they are dropped. */
  trailingHeadings: number;
  blocks: number;
}

export interface ParsedEcfr extends ParsedDoc {
  canonicalText: string;
  stats: EcfrStats;
}

interface State extends RowState {
  laidOut: Array<{ info: SectionInfo; root: UnitNode }>;
  stats: EcfrStats;
}

const STRUCTURE_STEPS: Record<string, string> = { DIV5: "pt", DIV6: "sp", DIV7: "sg" };
const RESERVED = "[Reserved]";
const MAX_EXAMPLES = 20;

export function parseEcfrParts(xmls: string[], docId: string): ParsedEcfr {
  const state = newState(docId);
  for (const xml of xmls) {
    const dom = cheerio.load(xml, { xml: true });
    const part = findFirst(dom.root().get(0)?.children ?? [], "DIV5");
    if (!part) throw new Error("eCFR: no <DIV5> part element");
    walk(part, null, "", state);
  }
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

function newState(docId: string): State {
  return {
    docId,
    sink: createSink(),
    sections: [],
    sectionIds: new Set(),
    laidOut: [],
    stats: {
      structureRows: 0,
      regSections: 0,
      reservedSections: 0,
      emptySections: 0,
      unplaced: 0,
      unplacedExamples: [],
      trailingHeadings: 0,
      blocks: 0,
    },
  };
}

function walk(el: Element, parentId: string | null, path: string, state: State): void {
  const step = STRUCTURE_STEPS[el.tagName];
  if (step) {
    const own = `${path}${path ? "/" : ""}${step}${el.attribs.N ?? ""}`;
    const row = openRow(state, slugOf(own), structureHeading(el), parentId);
    state.stats.structureRows += 1;
    for (const child of childElements(el)) walk(child, row.sectionId, own, state);
    row.charEnd = state.sink.length();
  } else if (el.tagName === "DIV8") addRegSection(el, parentId, state);
}

const structureHeading = (el: Element): string => {
  const head = childElements(el).find((child) => child.tagName === "HEAD");
  return head ? plainText(head) : (el.attribs.N ?? "");
};

function addRegSection(el: Element, parentId: string | null, state: State): void {
  const number = sectionNumber(el);
  const heading = sectionHeading(el);
  if (heading.includes(RESERVED)) {
    state.stats.reservedSections += 1;
    return;
  }
  const entries = entriesOf(el);
  if (entries.length === 0) {
    state.stats.emptySections += 1;
    return;
  }
  state.stats.trailingHeadings += trailingHeadings(el);
  const row = openRow(state, regSlugOf(number), heading, parentId);
  const layout = layoutRegSection(entries, state.sink);
  row.charEnd = state.sink.length();
  state.stats.regSections += 1;
  recordUnplaced(state, number, layout.unplaced);
  if (layout.root)
    state.laidOut.push({ info: sectionInfo(row, number, heading), root: layout.root });
}

function recordUnplaced(state: State, section: string, unplaced: Unplaced[]): void {
  state.stats.unplaced += unplaced.length;
  const room = MAX_EXAMPLES - state.stats.unplacedExamples.length;
  state.stats.unplacedExamples.push(
    ...unplaced.slice(0, Math.max(0, room)).map((item) => ({ ...item, section })),
  );
}

function sectionInfo(row: SectionRow, number: string, heading: string): SectionInfo {
  return {
    sectionId: row.sectionId,
    number,
    catchline: catchlineOf(heading, number),
    cite: (path) => regCitationOf(number, path),
    packFlat: true,
  };
}

/** "§ 1.469-5T Material participation (temporary)." → "Material participation (temporary)." */
function catchlineOf(heading: string, number: string): string {
  const at = heading.indexOf(number);
  return at < 0 ? heading : heading.slice(at + number.length).trim();
}
