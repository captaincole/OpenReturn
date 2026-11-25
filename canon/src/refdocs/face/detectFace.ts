import { getDocumentProxy } from "unpdf";
import { faceRows, isNumberedRow } from "./faceRows";
import { linesFromPositions, type PositionedText } from "./pageLines";

/*
 * Which pages are the form itself. A form's face comes first and has fill-in
 * widgets; its instructions follow. The face is the leading run of pages with
 * widgets, and it ends at the first page with none or at the first line that
 * starts the instructions (Form 4137 prints them at the bottom of page 1).
 * On a page where the instructions start, the part above them is face only
 * when it has a numbered line, so a page whose instructions come first
 * (Form 4868 prints its voucher below them) is not face. A worksheet with
 * widgets later in the instructions is not face either.
 */

const INSTRUCTIONS_START = [
  /^General Instructions$/,
  // FTB's first instruction heading.
  /^General Information$/,
  /^Specific Instructions$/,
  /^Purpose of Form$/,
  /^Future Developments$/,
  /^What[’']s New$/,
  /^Section references are to the Internal Revenue Code/,
];

export interface FacePage {
  pageNum: number;
  /** How much of the page's extracted text is face; the rest is instructions. */
  faceChars: number;
  wholePage: boolean;
  /** The face's printed lines, in reading order. */
  lines: string[];
}

interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
}

/* Where the instructions start in a page's extracted text, or null. */
export function instructionsOffset(pageText: string): number | null {
  let offset = 0;
  for (const line of pageText.split("\n")) {
    if (INSTRUCTIONS_START.some((start) => start.test(line.trim()))) return offset;
    offset += line.length + 1;
  }
  return null;
}

/*
 * unpdf's extractText joins each item's text plus a newline at hasEOL; the
 * same walk gives each item's offset into the page text. Rotated items (the
 * margin notes) are left out.
 */
function faceItems(items: PdfTextItem[], faceChars: number): PositionedText[] {
  const out: PositionedText[] = [];
  let offset = 0;
  for (const item of items) {
    if (item.str == null) continue;
    const [, skew = 0, , , left = 0, baseline = 0] = item.transform ?? [];
    if (offset < faceChars && Math.abs(skew) < 0.01) {
      out.push({ str: item.str, x: left, y: baseline, width: item.width ?? 0 });
    }
    offset += item.str.length + (item.hasEOL ? 1 : 0);
  }
  return out;
}

async function widgetCount(page: { getAnnotations(): Promise<unknown[]> }): Promise<number> {
  const annotations = (await page.getAnnotations()) as { subtype?: string }[];
  return annotations.filter((annotation) => annotation.subtype === "Widget").length;
}

/* `pageTexts` is extractPdf's text for each page. */
export async function readFacePages(
  bytes: Uint8Array,
  pageTexts: readonly string[],
): Promise<FacePage[]> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const faces: FacePage[] = [];
  for (let pageNum = 1; pageNum <= pageTexts.length; pageNum++) {
    const page = await pdf.getPage(pageNum);
    if ((await widgetCount(page)) === 0) break;
    const pageText = pageTexts[pageNum - 1];
    const split = instructionsOffset(pageText);
    const faceChars = split ?? pageText.length;
    const content = await page.getTextContent();
    const lines = linesFromPositions(faceItems(content.items as PdfTextItem[], faceChars));
    if (split !== null && !faceRows(lines).some(isNumberedRow)) break;
    faces.push({ pageNum, faceChars, wholePage: split === null, lines });
    if (split !== null) break;
  }
  return faces;
}
