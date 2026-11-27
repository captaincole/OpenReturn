import type { ParsedDoc } from "../refdocs/parse";
import { CA_SCHEME } from "./caDesignators";
import { lobFileOf } from "./caExtract";
import { caLevelSlug, caTree, withoutRange, type CaNode, type CaSection } from "./caTree";
import { camlEntries } from "./camlEntries";
import { layoutRegSection, type Unplaced } from "./ecfrUnits";
import { caCitationOf, caSlugOf, slugOf } from "./lawIds";
import { assertUnique, openRow, type RowState } from "./lawRows";
import { createSink } from "./textSink";
import { sectionBlocks, type SectionInfo } from "./unitBlocks";
import type { UnitNode } from "./unitTree";
import type { ZipEntry } from "./unzip";
import { squash } from "./uslmText";

/*
 * Parses the California extract (caExtract.ts) into the rows the other law
 * parsers return. Each level of the code's table of contents (division,
 * part, chapter, article) is a section row; each code section is a row
 * whose paragraphs are blocks. A section number with more than one version
 * in force or to come (one operative until a date, one from that date) has
 * a row for each, "s17058" and "s17058-v2", and each version's history
 * note is in its heading. California sections have no catchline: a block's
 * search text starts with the headings of the levels above the section.
 */

export interface CaStats {
  structureRows: number;
  /** Levels with no section under them ("Chapter 2.6. Special Tax Credit [ - ]"): no row. */
  emptyLevels: number;
  codeSections: number;
  /** Section numbers with more than one version, and how many versions each has. */
  versioned: Record<string, number>;
  /** Sections whose file holds no text. */
  emptySections: number;
  /** Levels that hold both sections and lower levels: the sections come first. */
  mixedLevels: number;
  unplaced: number;
  unplacedExamples: Array<Unplaced & { section: string }>;
  blocks: number;
}

export interface ParsedCaml extends ParsedDoc {
  canonicalText: string;
  stats: CaStats;
}

interface State extends RowState {
  laidOut: Array<{ info: SectionInfo; root: UnitNode }>;
  lobs: Map<string, string>;
  stats: CaStats;
}

const MAX_EXAMPLES = 20;

export function parseCaExtract(files: ZipEntry[], docId: string): ParsedCaml {
  const decoded = new Map(files.map((file) => [file.name, new TextDecoder().decode(file.data)]));
  const tree = caTree(decoded);
  const state = newState(docId, decoded);
  state.stats.versioned = tree.versioned;
  for (const root of tree.roots) walk(root, null, [], state);
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

function newState(docId: string, lobs: Map<string, string>): State {
  return {
    docId,
    sink: createSink(),
    sections: [],
    sectionIds: new Set(),
    laidOut: [],
    lobs,
    stats: {
      structureRows: 0,
      emptyLevels: 0,
      codeSections: 0,
      versioned: {},
      emptySections: 0,
      mixedLevels: 0,
      unplaced: 0,
      unplacedExamples: [],
      blocks: 0,
    },
  };
}

function walk(node: CaNode, parentId: string | null, above: CaNode[], state: State): void {
  if (node.sectionCount === 0) {
    state.stats.emptyLevels += 1;
    return;
  }
  const path = [...above, node];
  const slug = slugOf(path.map(caLevelSlug).join("/"));
  const row = openRow(state, slug, withoutRange(node.heading), parentId);
  state.stats.structureRows += 1;
  if (node.sections.length > 0 && node.children.length > 0) state.stats.mixedLevels += 1;
  for (const section of node.sections) addSection(section, row.sectionId, path, state);
  for (const child of node.children) walk(child, row.sectionId, path, state);
  row.charEnd = state.sink.length();
}

function addSection(section: CaSection, parentId: string, levels: CaNode[], state: State): void {
  const xml = state.lobs.get(lobFileOf(section.rowId));
  if (xml === undefined) throw new Error(`California extract: no file for ${section.rowId}`);
  const entries = camlEntries(xml);
  if (entries.length === 0) {
    state.stats.emptySections += 1;
    return;
  }
  const slug = caSlugOf(section.number, section.version);
  const row = openRow(state, slug, sectionHeading(section), parentId);
  const layout = layoutRegSection(entries, state.sink, CA_SCHEME);
  row.charEnd = state.sink.length();
  state.stats.codeSections += 1;
  recordUnplaced(state, section.number, layout.unplaced);
  if (!layout.root) return;
  const info: SectionInfo = {
    sectionId: row.sectionId,
    number: section.number,
    catchline: levelsLine(levels),
    cite: (path) => caCitationOf(section.number, path),
    packFlat: true,
    headings: section.versions > 1 ? [versionLabel(section)] : undefined,
  };
  state.laidOut.push({ info, root: layout.root });
}

/** "Version 2 of 2: Amended by Stats. 2026, Ch. 931, … Operative January 1, 2027, …". */
const versionLabel = (section: CaSection) =>
  [`Version ${section.version} of ${section.versions}`, section.history].filter(Boolean).join(": ");

/*
 * "§ 17041. (Amended by Stats. 2025, Ch. 22, Sec. 1. (SB 132) Effective
 * June 27, 2025.)": the number, then the history note as leginfo prints it.
 * A number with versions says which one: "§ 17058. Version 2 of 2. (…)".
 */
function sectionHeading(section: CaSection): string {
  const version = section.versions > 1 ? `Version ${section.version} of ${section.versions}.` : "";
  const history = section.history ? `(${section.history})` : "";
  return [`§ ${section.number}.`, version, history].filter(Boolean).join(" ");
}

/** The levels above a section, by title, without the division: "PERSONAL INCOME TAX › Imposition of Tax". */
const levelsLine = (levels: CaNode[]) =>
  levels
    .slice(1)
    .map((level) => squash(level.title))
    .filter(Boolean)
    .join(" › ");

function recordUnplaced(state: State, section: string, unplaced: Unplaced[]): void {
  state.stats.unplaced += unplaced.length;
  const room = MAX_EXAMPLES - state.stats.unplacedExamples.length;
  state.stats.unplacedExamples.push(
    ...unplaced.slice(0, Math.max(0, room)).map((item) => ({ ...item, section })),
  );
}
