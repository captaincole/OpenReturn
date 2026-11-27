import { SCOPE_FILE, scopeFileText, type CaPartScope, type CaScope } from "./caScope";
import {
  CODES_TABLE,
  isUnder,
  parseRow,
  SECTION_COLUMNS,
  SECTION_TABLE,
  tableLines,
  TOC_COLUMNS,
  TOC_SECTION_COLUMNS,
  TOC_SECTIONS_TABLE,
  TOC_TABLE,
  withField,
  type TocRow,
} from "./caTables";
import type { ZipEntry } from "./unzip";
import type { ZipFile } from "./zipFile";
import { writeZip } from "./zipWrite";

/*
 * Cuts the part of California's session archive that the library uses: one
 * code, one division, some parts, each whole or by chapters (caScope.ts).
 * The archive is a rolling file of about 1.3 GB, so ca.db stores this
 * extract instead. It keeps each table row as printed, each section's XML
 * file, and the scope it was cut with. One change makes it repeatable:
 * a section's XML file is named by the row's id ("lob/RTC17041.20252212.xml"),
 * not by its place in the archive, and the row's file field names it so.
 * Rows and files are in a fixed order, and the zip has fixed dates, so the
 * same law makes the same bytes.
 */

export interface CaExtract {
  zip: Uint8Array;
  /** The date the archive gives its section table: "2026-11-22". */
  archiveDate: string;
  stats: { tocRows: number; sections: number; files: number; bytes: number };
}

export const LOB_DIR = "lob/";
export const lobFileOf = (rowId: string): string => `${LOB_DIR}${rowId}.xml`;

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const bytesOf = (value: string) => new TextEncoder().encode(value);

export function extractCalifornia(archive: ZipFile, scope: CaScope): CaExtract {
  const toc = keptTocLines(text(archive.read(TOC_TABLE)), scope);
  const nodes = new Set(toc.map((line) => parseRow(line, TOC_COLUMNS).node_treepath));
  const tocSections = tableLines(text(archive.read(TOC_SECTIONS_TABLE)))
    .map((line) => ({ line, row: parseRow(line, TOC_SECTION_COLUMNS) }))
    .filter(({ row }) => row.law_code === scope.code && nodes.has(row.node_treepath))
    .sort((left, right) => Number(left.row.seq_num) - Number(right.row.seq_num));
  const versions = new Set(tocSections.map(({ row }) => row.law_section_version_id));
  const sections = tableLines(text(archive.read(SECTION_TABLE)))
    .map((line) => ({ line, row: parseRow(line, SECTION_COLUMNS) }))
    .filter(({ row }) => row.law_code === scope.code && versions.has(row.law_section_version_id))
    .sort((left, right) => compareText(left.row.id ?? "", right.row.id ?? ""));
  if (sections.length !== versions.size)
    throw new Error(
      `pubinfo: ${versions.size} sections in the table of contents, ${sections.length} with text`,
    );
  const lobs = sections.map(({ row }) => ({
    name: lobFileOf(row.id ?? ""),
    data: archive.read(row.content_xml ?? ""),
  }));
  const tables: ZipEntry[] = [
    { name: CODES_TABLE, data: bytesOf(codeLines(text(archive.read(CODES_TABLE)), scope.code)) },
    { name: TOC_TABLE, data: bytesOf(joinLines(toc)) },
    { name: TOC_SECTIONS_TABLE, data: bytesOf(joinLines(tocSections.map(({ line }) => line))) },
    {
      name: SECTION_TABLE,
      data: bytesOf(joinLines(sections.map(({ line, row }) => renamedLob(line, row.id ?? "")))),
    },
    { name: SCOPE_FILE, data: bytesOf(scopeFileText(scope)) },
  ];
  const entries = [...tables, ...lobs.sort((left, right) => compareText(left.name, right.name))];
  const zip = writeZip(entries);
  return {
    zip,
    archiveDate: archive.dateOf(SECTION_TABLE),
    stats: {
      tocRows: toc.length,
      sections: sections.length,
      files: entries.length,
      bytes: zip.length,
    },
  };
}

// A plain code-unit order, the same on every machine (localeCompare is not).
const compareText = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);

const joinLines = (lines: string[]) => lines.map((line) => `${line}\n`).join("");

const renamedLob = (line: string, rowId: string) =>
  withField(line, SECTION_COLUMNS, "content_xml", lobFileOf(rowId));

function codeLines(table: string, code: string): string {
  const lines = tableLines(table).filter((line) => line.startsWith(`\`${code}\``));
  return joinLines(lines);
}

/** The division's row, each kept part's row, and every row in the kept parts or chapters, in the code's order. */
function keptTocLines(table: string, scope: CaScope): string[] {
  const rows = tableLines(table)
    .map((line) => ({ line, row: parseRow(line, TOC_COLUMNS) }))
    .filter(({ row }) => row.law_code === scope.code && row.division === scope.division);
  const division = rows.find(({ row }) => isLevel(row, "division"));
  if (!division) throw new Error(`pubinfo: ${scope.code} has no division ${scope.division}`);
  const kept = scope.parts.map((part) => keptPaths(rows, scope.code, part));
  const levels = new Set(kept.map(({ level }) => level));
  const trees = kept.flatMap(({ trees }) => trees);
  return rows
    .filter(
      ({ row }) =>
        row === division.row ||
        levels.has(row.node_treepath ?? "") ||
        trees.some((tree) => isUnder(row.node_treepath ?? "", tree)),
    )
    .sort((left, right) => Number(left.row.node_sequence) - Number(right.row.node_sequence))
    .map(({ line }) => line);
}

type ScopedRow = { line: string; row: TocRow };

/** A part's own row, and the trees to keep under it: the whole part, or each chapter named. */
function keptPaths(rows: ScopedRow[], code: string, scope: CaPartScope) {
  const pathOf = (level: Level, matches: (row: TocRow) => boolean, name: string) => {
    const found = rows.find(({ row }) => isLevel(row, level) && matches(row));
    if (!found) throw new Error(`pubinfo: ${code} has no ${name} in its contents`);
    return found.row.node_treepath ?? "";
  };
  const level = pathOf("part", (row) => row.part === scope.part, `part ${scope.part}`);
  const chapters = scope.chapters ?? [];
  if (chapters.length === 0) return { level, trees: [level] };
  const trees = chapters.map((chapter) =>
    pathOf(
      "chapter",
      (row) => row.part === scope.part && row.chapter === chapter,
      `chapter ${chapter} in part ${scope.part}`,
    ),
  );
  return { level, trees };
}

const LEVELS = ["division", "title", "part", "chapter", "article"] as const;
type Level = (typeof LEVELS)[number];

/** The deepest level a contents row names: a part row has a part and no chapter or article. */
export function levelOf(row: TocRow): Level {
  const named = LEVELS.filter((level) => row[level] !== null);
  return named[named.length - 1] ?? "division";
}

const isLevel = (row: TocRow, level: Level) => levelOf(row) === level;
