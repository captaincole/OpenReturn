import type { PageSlice } from "../extract";
import type { ParsedDoc } from "../parse";
import type { FacePage } from "./detectFace";
import { parseFace } from "./parseFace";

/*
 * A PDF that holds a form and its instructions. The prose parser still reads
 * every page, as it did before the face parser existed, so each instruction
 * block keeps its id and text. Its blocks on the face are replaced by the
 * face parser's. The face is a leading run of pages, so the document's text
 * becomes the face text, then the extracted text from where the face ends.
 */

export interface MergedDoc extends ParsedDoc {
  canonicalText: string;
  pages: PageSlice[];
}

type Block = ParsedDoc["blocks"][number];
type Section = ParsedDoc["sections"][number];

const LEADING_SPACE_RE = /^\s*/;

/* Instruction blocks, trimmed to start where the face ends. */
function instructionBlocks(prose: ParsedDoc, faceEnd: number, raw: string): Block[] {
  const kept: Block[] = [];
  for (const block of prose.blocks) {
    if (block.charEnd <= faceEnd) continue;
    if (block.charStart >= faceEnd) {
      kept.push(block);
      continue;
    }
    const tail = raw.slice(faceEnd, block.charEnd);
    const start = faceEnd + (tail.match(LEADING_SPACE_RE)?.[0].length ?? 0);
    if (start < block.charEnd) {
      kept.push({ ...block, charStart: start, text: raw.slice(start, block.charEnd) });
    }
  }
  return kept;
}

/* Sections that keep a block, or that start after the face. */
function instructionSections(prose: ParsedDoc, blocks: Block[], faceEnd: number): Section[] {
  const firstBlock = new Map<string, Block>();
  for (const block of blocks) {
    if (block.sectionId && !firstBlock.has(block.sectionId)) firstBlock.set(block.sectionId, block);
  }
  return prose.sections.flatMap((section) => {
    const first = firstBlock.get(section.sectionId);
    if (section.charStart >= faceEnd) return [section];
    if (!first) return [];
    return [{ ...section, charStart: first.charStart, firstPage: first.pageNum }];
  });
}

function shiftedPages(
  raw: PageSlice[],
  face: PageSlice[],
  last: FacePage,
  delta: number,
): PageSlice[] {
  return raw.flatMap((page) => {
    if (page.pageNum > last.pageNum) {
      return [{ ...page, charStart: page.charStart + delta, charEnd: page.charEnd + delta }];
    }
    const facePage = face.find((slice) => slice.pageNum === page.pageNum);
    if (!facePage) return [];
    const end =
      page.pageNum === last.pageNum && !last.wholePage ? page.charEnd + delta : facePage.charEnd;
    return [{ ...facePage, charEnd: end }];
  });
}

export function mergeFace(
  raw: { canonicalText: string; pages: PageSlice[] },
  prose: ParsedDoc,
  facePages: readonly FacePage[],
  docId: string,
): MergedDoc {
  const last = facePages[facePages.length - 1];
  const lastRaw = raw.pages.find((page) => page.pageNum === last.pageNum)!;
  const faceEnd = lastRaw.charStart + last.faceChars;
  const blocks = instructionBlocks(prose, faceEnd, raw.canonicalText);
  const sections = instructionSections(prose, blocks, faceEnd);
  const face = parseFace(facePages, docId, new Set(sections.map((section) => section.headingSlug)));

  const joiner = last.wholePage ? "" : "\n\n";
  const canonicalText = face.text + joiner + raw.canonicalText.slice(faceEnd);
  const delta = face.text.length + joiner.length - faceEnd;
  const shift = <T extends { charStart: number; charEnd: number; ordinal: number }>(
    row: T,
    i: number,
    offset: number,
  ): T => ({
    ...row,
    charStart: row.charStart + delta,
    charEnd: row.charEnd + delta,
    ordinal: offset + i,
  });

  return {
    canonicalText,
    pages: shiftedPages(raw.pages, face.pages, last, delta),
    sections: [
      ...face.sections,
      ...sections.map((section, i) => shift(section, i, face.sections.length)),
    ],
    blocks: [...face.blocks, ...blocks.map((block, i) => shift(block, i, face.blocks.length))],
  };
}
