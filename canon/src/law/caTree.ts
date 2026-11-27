import { levelOf } from "./caExtract";
import {
  parentPath,
  parseTable,
  SECTION_COLUMNS,
  SECTION_TABLE,
  TOC_COLUMNS,
  TOC_SECTION_COLUMNS,
  TOC_SECTIONS_TABLE,
  TOC_TABLE,
  type TocRow,
} from "./caTables";
import { squash } from "./uslmText";

/*
 * The table of contents of the California extract as a tree: each level
 * (division, part, chapter, article) with its sections and the levels
 * below it, in the code's order. A section is one version of a number.
 */

export interface CaSection {
  /** The law table's row id: "RTC17041.20252212". */
  rowId: string;
  /** As cited, without the code's closing period: "17041", "17024.5". */
  number: string;
  /** The history note: "Amended by Stats. 2025, Ch. 22, Sec. 1. (SB 132) Effective June 27, 2025." */
  history: string;
  /** 1 for the first version of the number in the code's order. */
  version: number;
  versions: number;
}

export interface CaNode {
  row: TocRow;
  /** As printed: "CHAPTER 2. Imposition of Tax [17041. - 17061.]". */
  heading: string;
  /** The heading's words: "Imposition of Tax". */
  title: string;
  sections: CaSection[];
  children: CaNode[];
  /** Sections here and in every level below. */
  sectionCount: number;
}

export interface CaTree {
  roots: CaNode[];
  versioned: Record<string, number>;
}

const RANGE_OPEN = " [";
const RANGE_CLOSE = "]";
const LABEL_END = ". ";

/** "CHAPTER 2. Imposition of Tax [17041. - 17061.]" → "CHAPTER 2. Imposition of Tax". */
export function withoutRange(heading: string): string {
  const open = heading.lastIndexOf(RANGE_OPEN);
  const ranged = heading.trimEnd().endsWith(RANGE_CLOSE) && open > 0;
  return squash(ranged ? heading.slice(0, open) : heading);
}

/** "CHAPTER 2. Imposition of Tax" → "Imposition of Tax"; a heading with no label stays. */
function titleOf(heading: string): string {
  const plain = withoutRange(heading);
  const cut = plain.indexOf(LABEL_END);
  return cut < 0 ? plain : plain.slice(cut + LABEL_END.length).trim();
}

const LEVEL_PREFIX = { division: "div", title: "t", part: "pt", chapter: "ch", article: "art" };

/** "div2", "pt10.2", "ch3", "art6": the level and its number, for the row's id. */
export function caLevelSlug(node: CaNode): string {
  const level = levelOf(node.row);
  const value = node.row[level] ?? "";
  return `${LEVEL_PREFIX[level]}${value.endsWith(".") ? value.slice(0, -1) : value}`;
}

const sectionNumberOf = (raw: string) => (raw.endsWith(".") ? raw.slice(0, -1) : raw);

export function caTree(files: Map<string, string>): CaTree {
  const table = (name: string) => {
    const text = files.get(name);
    if (text === undefined) throw new Error(`California extract: no ${name}`);
    return text;
  };
  const toc = parseTable(table(TOC_TABLE), TOC_COLUMNS);
  const nodes = new Map(toc.map((row) => [row.node_treepath ?? "", newNode(row)]));
  const { byNode, versioned } = sectionsByNode(table(TOC_SECTIONS_TABLE), table(SECTION_TABLE));
  for (const [path, sections] of byNode) {
    const node = nodes.get(path);
    if (!node) throw new Error(`California extract: sections under ${path}, a level it lacks`);
    node.sections = sections;
  }
  const roots: CaNode[] = [];
  const ordered = [...nodes.values()].sort(
    (left, right) => Number(left.row.node_sequence) - Number(right.row.node_sequence),
  );
  for (const node of ordered) {
    const parent = nodes.get(parentPath(node.row.node_treepath ?? "") ?? "");
    (parent ? parent.children : roots).push(node);
  }
  roots.forEach(countSections);
  return { roots, versioned };
}

function newNode(row: TocRow): CaNode {
  const heading = row.heading ?? "";
  return { row, heading, title: titleOf(heading), sections: [], children: [], sectionCount: 0 };
}

function countSections(node: CaNode): number {
  node.sectionCount =
    node.sections.length + node.children.reduce((total, child) => total + countSections(child), 0);
  return node.sectionCount;
}

/* Each level's sections in order, and which numbers have more than one version. */
function sectionsByNode(tocSections: string, sectionTable: string) {
  const rows = new Map(
    parseTable(sectionTable, SECTION_COLUMNS).map((row) => [row.law_section_version_id, row]),
  );
  const listed = parseTable(tocSections, TOC_SECTION_COLUMNS).sort(
    (left, right) => Number(left.seq_num) - Number(right.seq_num),
  );
  const counts = new Map<string, number>();
  for (const entry of listed) {
    const number = sectionNumberOf(entry.section_num ?? "");
    counts.set(number, (counts.get(number) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const byNode = new Map<string, CaSection[]>();
  for (const entry of listed) {
    const row = rows.get(entry.law_section_version_id);
    if (!row) throw new Error(`California extract: no text for ${entry.id}`);
    const number = sectionNumberOf(entry.section_num ?? "");
    const version = (seen.get(number) ?? 0) + 1;
    seen.set(number, version);
    const section = {
      rowId: row.id ?? "",
      number,
      history: squash(row.history ?? ""),
      version,
      versions: counts.get(number) ?? 1,
    };
    const path = entry.node_treepath ?? "";
    byNode.set(path, [...(byNode.get(path) ?? []), section]);
  }
  const versioned = Object.fromEntries([...counts].filter(([, count]) => count > 1));
  return { byNode, versioned };
}
