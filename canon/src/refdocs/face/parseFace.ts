import type { RefBlock, RefSection } from "../../db/corpusStore";
import { MAX_BLOCK_CHARS, splitRange } from "../chunk";
import { PAGE_SEPARATOR, type PageSlice } from "../extract";
import { faceRows } from "./faceRows";

/*
 * The form face is cited by part, not by line: a section is a part as
 * printed ("Part I Gross Profit and Contract Price"), and the rows before
 * Part I are the header. A form with no parts gets one section per page.
 * A part longer than the block cap splits between rows, never inside one.
 */

/** Every face section heading starts with this, so a citation says "printed on the form". */
export const FACE_HEADING_PREFIX = "Form face: ";
/** Face section slugs start with this, so they never take an instruction section's slug. */
export const FACE_SLUG_PREFIX = "face-";

// "Part II Installment Sale Income. Complete…", "Part III—Related…"; not "Part I, line 27".
const PART_ROW_RE = /^Part ([IVXL]+)(?=$|[\s—–]+[A-Z(])/;
const SENTENCE_END_RE = /\.\s/;
const MAX_HEADING_CHARS = 100;

export interface FaceInputPage {
  pageNum: number;
  lines: string[];
}

type Section = Omit<RefSection, "docId">;
type Block = Omit<RefBlock, "docId">;

export interface ParsedFace {
  text: string;
  pages: PageSlice[];
  sections: Section[];
  blocks: Block[];
}

interface SectionName {
  slug: string;
  heading: string;
}

interface PlacedRow {
  text: string;
  pageNum: number;
  start: number;
  end: number;
  /** Set on the row that opens a section. */
  opens?: SectionName;
}

function partName(row: string): SectionName | null {
  const part = row.match(PART_ROW_RE);
  if (!part) return null;
  const sentenceEnd = row.search(SENTENCE_END_RE);
  const title = sentenceEnd > 0 ? row.slice(0, sentenceEnd) : row;
  return { slug: `part-${part[1].toLowerCase()}`, heading: title.slice(0, MAX_HEADING_CHARS) };
}

/* Lays the rows out as the face text: one row per line, pages apart. */
function placeRows(pages: readonly FaceInputPage[]): {
  text: string;
  rows: PlacedRow[];
  slices: PageSlice[];
} {
  const rows: PlacedRow[] = [];
  const slices: PageSlice[] = [];
  let text = "";
  for (const page of pages) {
    if (slices.length > 0) text += PAGE_SEPARATOR;
    const charStart = text.length;
    faceRows(page.lines).forEach((row, i) => {
      if (i > 0) text += "\n";
      rows.push({
        text: row,
        pageNum: page.pageNum,
        start: text.length,
        end: text.length + row.length,
      });
      text += row;
    });
    slices.push({ pageNum: page.pageNum, charStart, charEnd: text.length });
  }
  return { text, rows, slices };
}

function markSections(rows: PlacedRow[]): void {
  const hasParts = rows.some((row) => partName(row.text) !== null);
  rows.forEach((row, i) => {
    const newPage = i === 0 || rows[i - 1].pageNum !== row.pageNum;
    if (!hasParts) {
      if (newPage) row.opens = { slug: `page-${row.pageNum}`, heading: `page ${row.pageNum}` };
      return;
    }
    const part = partName(row.text);
    if (part) row.opens = part;
    else if (i === 0) row.opens = { slug: "header", heading: "header" };
  });
}

/* Rows that share a section and a page, in pieces under the block cap. */
function rowPieces(rows: readonly PlacedRow[]): PlacedRow[][] {
  const pieces: PlacedRow[][] = [];
  for (const row of rows) {
    const piece = pieces.at(-1);
    const joins =
      piece !== undefined &&
      row.opens === undefined &&
      row.pageNum === piece[0].pageNum &&
      row.end - piece[0].start <= MAX_BLOCK_CHARS;
    if (joins) piece.push(row);
    else pieces.push([row]);
  }
  return pieces;
}

function uniqueSlug(slug: string, used: Set<string>): string {
  let unique = slug;
  for (let suffix = 2; used.has(unique); suffix++) unique = `${slug}-${suffix}`;
  used.add(unique);
  return unique;
}

function openSection(
  docId: string,
  row: PlacedRow,
  name: SectionName,
  used: Set<string>,
  ordinal: number,
): Section {
  const slug = uniqueSlug(`${FACE_SLUG_PREFIX}${name.slug}`, used);
  return {
    sectionId: `${docId}::sec::${slug}`,
    heading: `${FACE_HEADING_PREFIX}${name.heading}`,
    headingSlug: slug,
    parentSectionId: null,
    ordinal,
    firstPage: row.pageNum,
    charStart: row.start,
    charEnd: row.start,
  };
}

/*
 * `usedSlugs` holds the instruction sections' slugs of the same document;
 * a face slug that meets one takes a numeric suffix.
 */
export function parseFace(
  pages: readonly FaceInputPage[],
  docId: string,
  usedSlugs: Set<string> = new Set(),
): ParsedFace {
  const { text, rows, slices } = placeRows(pages);
  markSections(rows);
  const sections: Section[] = [];
  const blocks: Block[] = [];
  let inSection = 0;
  for (const piece of rowPieces(rows)) {
    const first = piece[0];
    if (first.opens) {
      if (sections.length > 0) sections[sections.length - 1].charEnd = first.start;
      sections.push(openSection(docId, first, first.opens, usedSlugs, sections.length));
      inSection = 0;
    }
    const section = sections[sections.length - 1];
    for (const [from, to] of splitRange(text, first.start, piece[piece.length - 1].end)) {
      inSection += 1;
      blocks.push({
        blockId: `${section.sectionId}::b${String(inSection).padStart(2, "0")}`,
        sectionId: section.sectionId,
        pageNum: first.pageNum,
        blockType: "form_face",
        ordinal: blocks.length,
        text: text.slice(from, to),
        charStart: from,
        charEnd: to,
      });
    }
  }
  if (sections.length > 0) sections[sections.length - 1].charEnd = text.length;
  return { text, pages: slices, sections, blocks };
}
