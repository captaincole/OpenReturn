import type { RefBlock, RefSection } from "../db/corpusStore";
import { splitRange } from "./chunk";
import type { PageSlice } from "./extract";

/*
 * Keep heading rules conservative. A miss attaches content to the previous
 * section; a false positive fragments the doc. `inlineBodyOffset` marks where
 * the body starts on the heading's own line.
 */
type HeadingMatch = {
  heading: string;
  slug: string;
  inlineBodyOffset?: number;
};

/** "ftb" keeps every IRS rule and adds the FTB en-dash and prose-heading rules. */
export type ParserStyle = "irs" | "ftb";

/*
 * Prose headings with no structural pattern, matched by name. Add entries
 * conservatively: a false positive fragments the section tree.
 */
const KNOWN_PROSE_HEADINGS = new Set<string>([
  "Single",
  "Married Filing Jointly",
  "Married Filing Separately",
  "Head of Household",
  "Qualifying Surviving Spouse",
  // The heading wraps after "Surviving"; the continuation rule adds "Spouse".
  "Qualifying Surviving",
]);

const LINE_HEADING_RE = /^Line \d+[a-z]?$/;
const LINE_DASH_HEADING_RE = /^Line \d+[a-z]?—.+$/;
// The em-dash is optional: some lists put the title on the next line.
const LINES_LIST_HEADING_RE = /^Lines \d+[a-z]?(?:, \d+[a-z]?)*(?:,? and \d+[a-z]?)?\s*—?$/;
const LINES_RANGE_HEADING_RE = /^Lines \d+[a-z]? through \d+[a-z]?$/;
// Alone on the line: body prose also starts "Part III, line 6".
const PART_HEADING_RE = /^Part [IVXLCDM]+$/;
const SCHEDULE_HEADING_RE = /^Schedule \d+[A-Z]?$/;

/*
 * FTB uses en-dash where IRS uses em-dash. The inline pattern is a Title Case
 * prefix, " – ", then body; a later Title Case check rejects lowercase echoes
 * of the heading in body prose.
 */
const FTB_LINE_EN_DASH_RE = /^Line \d+[a-z]? – .+$/;
const FTB_INLINE_DASH_RE = /^([A-Z][^\n]{0,79}?)\s–\s(\S.*)$/;
const FTB_KNOWN_PROSE_HEADINGS = new Set<string>([
  "What's New",
  // The extractor keeps the curly apostrophe; match both.
  "What’s New",
  "General Information",
  "Conformity",
]);

// Run-in headings: "Line 4. If any of your…", "Part I. Use a separate…".
const LINE_REF = String.raw`\d+[a-z]?(?:\([a-z0-9]\))?`;
const RUN_IN_HEADING_RE = new RegExp(
  String.raw`^((?:Lines? ${LINE_REF}(?:(?:,|,? and| through) ${LINE_REF})*)|Part [IVXLC]+)\.\s+(\S.*)$`,
);

function detectRunInHeading(line: string): HeadingMatch | null {
  const lead = line.length - line.trimStart().length;
  const match = line.trimStart().match(RUN_IN_HEADING_RE);
  if (!match) return null;
  const bodyOffset = lead + line.trimStart().indexOf(match[2], match[1].length);
  return { heading: match[1], slug: slugifyHeading(match[1]), inlineBodyOffset: bodyOffset };
}

/*
 * The previous line must end a sentence. That rejects wrapped body text,
 * such as the second line of a Title Case bullet.
 */
export function isProseHeading(line: string, prevLine: string | null): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 60) return false;
  if (
    /[.,;:]$/.test(trimmed) ||
    trimmed.startsWith("•") ||
    /^\d/.test(trimmed) ||
    /^See /.test(trimmed)
  )
    return false;
  if (!/^[A-Z]/.test(trimmed) || !isTitleCaseLine(trimmed)) return false;
  // Rejects one-word worksheet cells and flowchart answers ("Yes No").
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.every((word) => word === "Yes" || word === "No")) return false;
  // Table rows and dates are mostly numbers.
  if (words.filter((word) => /\d/.test(word)).length * 2 > words.length) return false;
  if (prevLine === null) return true;
  return /[.:?!)]$/.test(prevLine.trim());
}

// Worksheet and table cells fail this: their neighbors are Title Case cells too.
export function hasBodyAfter(lines: ReadonlyArray<{ text: string }>, i: number): boolean {
  for (
    let next = i + 1;
    next < lines.length && next <= i + 1 + MAX_HEADING_CONTINUATION_LINES;
    next++
  ) {
    const trimmed = lines[next].text.trim();
    if (trimmed.length === 0) continue;
    if (!isTitleCaseLine(trimmed) || /[.:]$/.test(trimmed)) return /[a-z]/.test(trimmed);
  }
  return false;
}

function detectFtbHeading(line: string, trimmed: string): HeadingMatch | null {
  if (FTB_KNOWN_PROSE_HEADINGS.has(trimmed)) {
    return { heading: trimmed, slug: slugifyHeading(trimmed) };
  }
  if (FTB_LINE_EN_DASH_RE.test(trimmed)) {
    // "Line 2a – Alimony Received" is a title; "Line 1 – Enter your…" starts the body.
    const dash = line.indexOf("–");
    const rest = line.slice(dash + 1).trim();
    if (isTitleCaseLine(rest) && !/[.:]$/.test(rest)) {
      return { heading: trimmed, slug: slugifyHeading(trimmed) };
    }
    const label = line.slice(0, dash).trim();
    let bodyOffset = dash + 1;
    while (bodyOffset < line.length && /\s/.test(line[bodyOffset])) bodyOffset += 1;
    return { heading: label, slug: slugifyHeading(label), inlineBodyOffset: bodyOffset };
  }
  const match = trimmed.match(FTB_INLINE_DASH_RE);
  if (match) {
    const prefix = match[1].trim();
    const prefixWords = prefix.split(/\s+/);
    const mostlyNumbers =
      prefixWords.filter((word) => /\d/.test(word)).length * 2 > prefixWords.length;
    if (isTitleCaseLine(prefix) && !mostlyNumbers) {
      // Search the untrimmed line: the offset is relative to line.charStart.
      const dashIdx = line.indexOf("–");
      if (dashIdx >= 0) {
        let bodyOffset = dashIdx + 1;
        while (bodyOffset < line.length && /\s/.test(line[bodyOffset])) {
          bodyOffset += 1;
        }
        return {
          heading: prefix,
          slug: slugifyHeading(prefix),
          inlineBodyOffset: bodyOffset,
        };
      }
    }
  }
  return null;
}

/*
 * A bare "…Worksheet" can end a body line, so require a mark: a "—Line N"
 * suffix, a year prefix, or the "Keep for Your Records" / "CAUTION" box text.
 * The heading drops the box text.
 */
const WORKSHEET_TITLE_RE =
  /^((\d{4} )?[A-Z][^.]{0,90}?(?:Worksheet|Tax Rate Schedules|Tax Table)(—Lines? \d+[a-z]?(?:,? (?:and|through) \d+[a-z]?)?)?)((?:\s*(?:Keep for Your Records|CAUTION))*)\s*!?$/;

function detectWorksheetTitle(text: string): HeadingMatch | null {
  const match = text.match(WORKSHEET_TITLE_RE);
  if (!match || !(match[2] || match[3] || match[4])) return null;
  return { heading: match[1], slug: slugifyHeading(match[1]) };
}

function detectHeading(line: string, style: ParserStyle = "irs"): HeadingMatch | null {
  const trimmed = line.trim();
  const runIn = detectRunInHeading(line) ?? detectWorksheetTitle(trimmed);
  if (runIn) return runIn;
  if (
    LINE_HEADING_RE.test(trimmed) ||
    LINE_DASH_HEADING_RE.test(trimmed) ||
    LINES_LIST_HEADING_RE.test(trimmed) ||
    LINES_RANGE_HEADING_RE.test(trimmed) ||
    PART_HEADING_RE.test(trimmed) ||
    SCHEDULE_HEADING_RE.test(trimmed) ||
    KNOWN_PROSE_HEADINGS.has(trimmed)
  ) {
    return { heading: trimmed, slug: slugifyHeading(trimmed) };
  }
  if (style === "ftb") return detectFtbHeading(line, trimmed);
  return null;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * Headings wrap across lines. Unconsumed wrap lines look like new headings
 * and create phantom sections. IRS headings are Title Case and body prose is
 * not, so the case test finds the wrap.
 */
const TITLE_CASE_SMALL_WORDS = new Set([
  "of",
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "in",
  "on",
  "at",
  "to",
  "from",
  "by",
  "with",
  "as",
  "nor",
  "but",
  "vs",
]);

function isTitleCaseLine(text: string): boolean {
  const words = text.split(/\s+/);
  for (const word of words) {
    const bare = word.replace(/[^A-Za-z]/g, "");
    if (bare.length === 0) continue;
    if (TITLE_CASE_SMALL_WORDS.has(bare.toLowerCase())) continue;
    if (!/^[A-Z]/.test(bare)) return false;
  }
  return true;
}

function isHeadingContinuation(lineText: string): boolean {
  const trimmed = lineText.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (/^[a-z]/.test(trimmed)) return false;
  if (!isTitleCaseLine(trimmed)) return false;
  return true;
}

const MAX_HEADING_CONTINUATION_LINES = 5;

// Page artifacts stay in canonical.txt but no block's char range includes them.
const PAGE_NUM_RE = /^\d{1,3}$/;
const FOOTER_RE = /^\d{1,3} Need more information or forms\? Visit IRS\.gov\.$/;
const HEADER_CONTINUED_RE = /^\(Continued\)$/;
const FTB_RUNNING_RE =
  /^(?:Page \d{1,3} )?[\w ().-]*(?:Instructions|Booklet) \d{4}(?: \(REV [\d-]+\))?(?: Page \d{1,3})?$/;
const IRS_FOOTER_RE =
  /^(?:\d{1,3} )?Instructions for (?:Form|Schedule) .*\(\d{4}\)(?: \d{1,3}| Catalog Number \w+)?$/;

function isStructuralNoise(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (PAGE_NUM_RE.test(trimmed)) return true;
  if (FOOTER_RE.test(trimmed)) return true;
  if (HEADER_CONTINUED_RE.test(trimmed)) return true;
  if (IRS_FOOTER_RE.test(trimmed)) return true;
  if (FTB_RUNNING_RE.test(trimmed)) return true;
  if (/^This Page Intentionally Left Blank$/i.test(trimmed)) return true;
  return false;
}

interface LineSpan {
  text: string;
  charStart: number;
  charEnd: number; // exclusive
}

function splitLinesWithOffsets(pageText: string, baseOffset: number): LineSpan[] {
  const out: LineSpan[] = [];
  let i = 0;
  while (i <= pageText.length) {
    const nl = pageText.indexOf("\n", i);
    const end = nl === -1 ? pageText.length : nl;
    out.push({
      text: pageText.slice(i, end),
      charStart: baseOffset + i,
      charEnd: baseOffset + end,
    });
    if (nl === -1) break;
    i = nl + 1;
  }
  return out;
}

export interface ParsedDoc {
  sections: Omit<RefSection, "docId">[];
  blocks: Omit<RefBlock, "docId">[];
}

export interface ParseOpts {
  docId: string;
  style?: ParserStyle;
}

/*
 * Block text is a verbatim slice of canonicalText, with no cleanup, so char
 * offsets always point back to canonical.txt.
 */
export function parseDoc(canonicalText: string, pages: PageSlice[], opts: ParseOpts): ParsedDoc {
  return new DocParser(canonicalText, opts, pages[0]?.pageNum ?? 1).parse(pages);
}

interface PendingBlock {
  pageNum: number;
  firstLineStart: number;
  lastLineEnd: number;
}

class DocParser {
  private readonly sections: Omit<RefSection, "docId">[] = [];
  private readonly blocks: Omit<RefBlock, "docId">[] = [];
  private readonly usedSlugs: Set<string>;
  private currentSection: Omit<RefSection, "docId">;
  private sectionOrdinal = 1;
  private blockOrdinal = 0;
  private blockInSection = 0;
  private prevLine: string | null = null;
  private pendingBlock: PendingBlock | null = null;

  constructor(
    private readonly canonicalText: string,
    private readonly opts: ParseOpts,
    firstPageNum: number,
  ) {
    this.currentSection = {
      sectionId: `${opts.docId}::sec::preamble`,
      heading: "(Preamble)",
      headingSlug: "preamble",
      parentSectionId: null,
      ordinal: 0,
      firstPage: firstPageNum,
      charStart: 0,
      charEnd: 0,
    };
    this.usedSlugs = new Set<string>([this.currentSection.headingSlug]);
  }

  parse(pages: PageSlice[]): ParsedDoc {
    for (const page of pages) {
      this.processPage(page);
    }
    this.currentSection.charEnd = this.canonicalText.length;
    this.sections.push(this.currentSection);
    return { sections: this.sections, blocks: this.blocks };
  }

  private processPage(page: PageSlice): void {
    const pageText = this.canonicalText.slice(page.charStart, page.charEnd);
    const lines = splitLinesWithOffsets(pageText, page.charStart);

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isStructuralNoise(line.text)) {
        i += 1;
        continue;
      }

      const heading =
        detectHeading(line.text, this.opts.style) ??
        (isProseHeading(line.text, this.prevLine) && hasBodyAfter(lines, i)
          ? { heading: line.text.trim(), slug: slugifyHeading(line.text.trim()) }
          : null);
      if (heading) {
        const next = this.processHeading(heading, lines, i, page.pageNum);
        this.prevLine = lines[next - 1].text;
        i = next;
        continue;
      }
      this.prevLine = line.text;

      if (!this.pendingBlock || this.pendingBlock.pageNum !== page.pageNum) {
        this.flushPendingBlock();
        this.pendingBlock = {
          pageNum: page.pageNum,
          firstLineStart: line.charStart,
          lastLineEnd: line.charEnd,
        };
      } else {
        this.pendingBlock.lastLineEnd = line.charEnd;
      }
      i += 1;
    }

    this.flushPendingBlock();
  }

  /* Returns the index of the next unconsumed line. */
  private processHeading(
    heading: NonNullable<ReturnType<typeof detectHeading>>,
    lines: ReturnType<typeof splitLinesWithOffsets>,
    i: number,
    pageNum: number,
  ): number {
    const line = lines[i];
    if (heading.inlineBodyOffset !== undefined) {
      this.startSection(heading.heading, heading.slug, line.charStart, pageNum);
      this.pendingBlock = {
        pageNum,
        firstLineStart: line.charStart + heading.inlineBodyOffset,
        lastLineEnd: line.charEnd,
      };
      return i + 1;
    }

    const continuationTexts: string[] = [];
    let next = i + 1;
    let consumed = 0;
    let lastConsumedEnd = line.charEnd;
    while (
      next < lines.length &&
      consumed < MAX_HEADING_CONTINUATION_LINES &&
      !isStructuralNoise(lines[next].text) &&
      isHeadingContinuation(lines[next].text)
    ) {
      continuationTexts.push(lines[next].text.trim());
      lastConsumedEnd = lines[next].charEnd;
      next += 1;
      consumed += 1;
    }
    const fullHeading =
      continuationTexts.length === 0
        ? heading.heading
        : `${heading.heading} ${continuationTexts.join(" ")}`;

    this.startSection(fullHeading, heading.slug, line.charStart, pageNum);

    this.pendingBlock = {
      pageNum,
      firstLineStart: lastConsumedEnd,
      lastLineEnd: lastConsumedEnd,
    };
    return next;
  }

  private flushPendingBlock(): void {
    if (!this.pendingBlock) return;
    const start = this.pendingBlock.firstLineStart;
    const end = this.pendingBlock.lastLineEnd;
    // Section-anchored ids: a parser change elsewhere in the doc does not renumber them.
    for (const [from, to] of end > start ? splitRange(this.canonicalText, start, end) : []) {
      this.blockInSection += 1;
      this.blocks.push({
        blockId: `${this.currentSection.sectionId}::b${String(this.blockInSection).padStart(2, "0")}`,
        sectionId: this.currentSection.sectionId,
        pageNum: this.pendingBlock.pageNum,
        blockType: "paragraph",
        ordinal: this.blockOrdinal,
        text: this.canonicalText.slice(from, to),
        charStart: from,
        charEnd: to,
      });
      this.blockOrdinal += 1;
    }
    this.pendingBlock = null;
  }

  private startSection(heading: string, slug: string, charStart: number, firstPage: number): void {
    this.flushPendingBlock();
    this.currentSection.charEnd = charStart;
    this.sections.push(this.currentSection);
    // Docs reuse headings like "Line 1a", so duplicate slugs get a numeric suffix.
    let uniqueSlug = slug;
    let dupe = 2;
    while (this.usedSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${dupe++}`;
    }
    this.usedSlugs.add(uniqueSlug);
    this.currentSection = {
      sectionId: `${this.opts.docId}::sec::${uniqueSlug}`,
      heading,
      headingSlug: uniqueSlug,
      parentSectionId: null,
      ordinal: this.sectionOrdinal,
      firstPage,
      charStart,
      charEnd: charStart,
    };
    this.sectionOrdinal += 1;
    this.blockInSection = 0;
  }
}
