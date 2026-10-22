import type { RefBlock, RefSection } from "../mastra/db/corpusStore";
import { splitRange } from "./chunk";
import type { PageSlice } from "./extract";

/*
 * A heading detector returns the heading text when a line (given its
 * neighbors) starts a new section. Keep the rules conservative. A miss
 * degrades gracefully: content attaches to the previous section. A false
 * positive fragments the doc.
 *
 * `inlineBodyOffset`, when set, marks where body content starts within the
 * source line: the heading consumes only the prefix, not the whole line.
 * FTB-style inline-dash headings use this ("Wildfire Disaster Settlement
 * Exclusion – For taxable years…"). Without it, consuming the heading line
 * would lose the body.
 */
type HeadingMatch = {
  heading: string;
  slug: string;
  inlineBodyOffset?: number;
};

/**
 * Which publication style governs heading detection.
 *  - "irs" (default): em-dash conventions (`Line 25a—Form(s) W-2`),
 *    Part/Schedule headings, plus the 5-entry filing-status prose set.
 *  - "ftb": additive. Keeps every IRS rule, then layers en-dash inline-body
 *    headings (`Wildfire Disaster Settlement Exclusion – For taxable
 *    years…`), en-dash line headings (`Line 2a – Alimony Received`), and an
 *    FTB-specific prose set ("What's New", "General Information",
 *    "Conformity").
 *
 * Threaded in from `ingestRefDoc({ parserStyle })` → CLI `--parser-style`.
 */
export type ParserStyle = "irs" | "ftb";

/*
 * Known prose subject-headings that appear standalone on a line. Without
 * this set they would merge into the preceding section as body text. They
 * follow no structural pattern (plain Title Case noun phrases), so we
 * match them by name. Add entries conservatively: a false positive
 * fragments the section tree.
 */
const KNOWN_PROSE_HEADINGS = new Set<string>([
  // Filing status sub-sections (p.13–14 of 1040 instructions)
  "Single",
  "Married Filing Jointly",
  "Married Filing Separately",
  "Head of Household",
  "Qualifying Surviving Spouse",
  /*
   * "Qualifying Surviving Spouse" wraps to two lines in the extracted text
   * ("Qualifying Surviving\nSpouse"). Match the first line; the
   * continuation logic absorbs "Spouse" into the full heading.
   */
  "Qualifying Surviving",
]);

const LINE_HEADING_RE = /^Line \d+[a-z]?$/;
// Line headings with an inline dash-delimited title, e.g. "Line 25a—Form(s) W-2".
const LINE_DASH_HEADING_RE = /^Line \d+[a-z]?—.+$/;
/*
 * Line-list headings, e.g. "Lines 27a, 27b, and 27c—" or "Lines 2a and 2b".
 * The em-dash is optional; some lists put the title on the next line.
 */
const LINES_LIST_HEADING_RE = /^Lines \d+[a-z]?(?:, \d+[a-z]?)*(?:,? and \d+[a-z]?)?\s*—?$/;
// Line-range headings, e.g. "Lines 5a through 5c".
const LINES_RANGE_HEADING_RE = /^Lines \d+[a-z]? through \d+[a-z]?$/;
/*
 * Part/Schedule headings must appear alone on their line. Body prose that
 * references a part (e.g. "Part I of Form 4797;", "Part III, line 6") also
 * starts with "Part <roman>" but has trailing text on the same line, which
 * we reject here.
 */
const PART_HEADING_RE = /^Part [IVXLCDM]+$/;
const SCHEDULE_HEADING_RE = /^Schedule \d+[A-Z]?$/;

/*
 * FTB conventions: en-dash where IRS uses em-dash, plus a small standalone
 * section-header set ("What's New" etc.). The inline-body pattern captures
 * a Title Case prefix (up to 80 chars) followed by " – <body>". The prefix
 * becomes the heading; the body stays as block content. A post-match Title
 * Case check rejects lowercase echoes of headings in body prose (e.g.
 * "wildfire mitigation payment – California law allows…" on a later page).
 */
const FTB_LINE_EN_DASH_RE = /^Line \d+[a-z]? – .+$/;
const FTB_INLINE_DASH_RE = /^([A-Z][^\n]{0,79}?)\s–\s(\S.*)$/;
const FTB_KNOWN_PROSE_HEADINGS = new Set<string>([
  "What's New",
  /*
   * The PDF extractor preserves the curly apostrophe (U+2019). Match both
   * variants so the detector survives a future extractor revision.
   */
  "What’s New",
  "General Information",
  "Conformity",
]);

/*
 * IRS run-in headings: a line or part reference, a period, then body text
 * on the same line ("Line 4. If any of your…", "Lines 2 and 16. Enter…",
 * "Line 3(c). Enter…", "Part I. Use a separate…"). The prefix becomes
 * the heading; the body stays as block content (inlineBodyOffset).
 */
const LINE_REF = String.raw`\d+[a-z]?(?:\([a-z0-9]\))?`;
const RUN_IN_HEADING_RE = new RegExp(
  String.raw`^((?:Lines? ${LINE_REF}(?:(?:,|,? and| through) ${LINE_REF})*)|Part [IVXLC]+)\.\s+(\S.*)$`,
);

function detectRunInHeading(line: string): HeadingMatch | null {
  const lead = line.length - line.trimStart().length;
  const m = line.trimStart().match(RUN_IN_HEADING_RE);
  if (!m) return null;
  const bodyOffset = lead + line.trimStart().indexOf(m[2], m[1].length);
  return { heading: m[1], slug: slugifyHeading(m[1]), inlineBodyOffset: bodyOffset };
}

/*
 * Standalone prose heading ("Purpose of Form", "Who Can Take the
 * Deduction"): a short Title Case line with no closing punctuation, whose
 * previous line ended a sentence (or that opens the doc). The previous-
 * line test rejects wrapped body text, such as the second line of a
 * bullet ("…Special Rules for Patrons of" / "Agricultural or Horticultural
 * Cooperatives"). Wrapped headings are completed by the continuation rule.
 */
export function isProseHeading(line: string, prevLine: string | null): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 60) return false;
  if (/[.,;:]$/.test(t) || t.startsWith("•") || /^\d/.test(t) || /^See /.test(t)) return false;
  if (!/^[A-Z]/.test(t) || !isTitleCaseLine(t)) return false;
  /*
   * At least two words, not all Yes/No: one-word worksheet cells
   * ("Suspended", "Utilized") and flowchart answers ("Yes No") are not
   * headings. Rare one-word headings ("Exceptions") fold into the parent.
   */
  const words = t.split(/\s+/);
  if (words.length < 2 || words.every((w) => w === "Yes" || w === "No")) return false;
  // Table rows and dates ("April 15, 2025", "Period 1 Period 2 1 76") are mostly numbers.
  if (words.filter((w) => /\d/.test(w)).length * 2 > words.length) return false;
  if (prevLine === null) return true;
  return /[.:?!)]$/.test(prevLine.trim());
}

/*
 * A real prose heading is followed by body text: after any wrapped
 * heading lines, the next line is not Title Case. Worksheet and table
 * cells ("Suspended" / "Utilized 2018" / "Remaining") fail this test
 * because their neighbors are Title Case cells too.
 */
export function hasBodyAfter(lines: ReadonlyArray<{ text: string }>, i: number): boolean {
  for (let j = i + 1; j < lines.length && j <= i + 1 + MAX_HEADING_CONTINUATION_LINES; j++) {
    const t = lines[j].text.trim();
    if (t.length === 0) continue;
    if (!isTitleCaseLine(t) || /[.:]$/.test(t)) return /[a-z]/.test(t);
  }
  return false;
}

/* FTB layers: prose set, en-dash line headings, inline-dash headings. */
function detectFtbHeading(line: string, t: string): HeadingMatch | null {
  if (FTB_KNOWN_PROSE_HEADINGS.has(t)) {
    return { heading: t, slug: slugifyHeading(t) };
  }
  if (FTB_LINE_EN_DASH_RE.test(t)) {
    /*
     * "Line 2a – Alimony Received" is a title: keep the whole line.
     * "Line 1 – Enter your 2025 tax liability from" starts the body:
     * the heading is "Line 1" and the rest stays as block content.
     */
    const dash = line.indexOf("–");
    const rest = line.slice(dash + 1).trim();
    if (isTitleCaseLine(rest) && !/[.:]$/.test(rest)) {
      return { heading: t, slug: slugifyHeading(t) };
    }
    const label = line.slice(0, dash).trim();
    let bodyOffset = dash + 1;
    while (bodyOffset < line.length && /\s/.test(line[bodyOffset])) bodyOffset += 1;
    return { heading: label, slug: slugifyHeading(label), inlineBodyOffset: bodyOffset };
  }
  const m = t.match(FTB_INLINE_DASH_RE);
  if (m) {
    const prefix = m[1].trim();
    const prefixWords = prefix.split(/\s+/);
    const mostlyNumbers = prefixWords.filter((w) => /\d/.test(w)).length * 2 > prefixWords.length;
    if (isTitleCaseLine(prefix) && !mostlyNumbers) {
      /*
       * Locate the en-dash in the un-trimmed line so the offset is
       * correct relative to line.charStart in parseDoc. The regex anchors
       * to the trimmed string; the offset must point into the raw source.
       */
      const dashIdx = line.indexOf("–");
      if (dashIdx >= 0) {
        // Body begins after the dash and any following whitespace.
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
 * Worksheet and rate-schedule titles — the blocks engine code cites most
 * ("Qualified Dividends and Capital Gain Tax Worksheet—Line 16 Keep for
 * Your Records", "2025 Tax Computation Worksheet—Line 16CAUTION", "2025
 * California Tax Rate Schedules"). A bare "…Worksheet" can end a body
 * line ("Use the Tax Computation Worksheet"), so require a mark: a
 * "—Line N" suffix, a year prefix, or the "Keep for Your Records" /
 * "CAUTION" box text the PDF appends. The heading drops that box text.
 */
const WORKSHEET_TITLE_RE =
  /^((\d{4} )?[A-Z][^.]{0,90}?(?:Worksheet|Tax Rate Schedules|Tax Table)(—Lines? \d+[a-z]?(?:,? (?:and|through) \d+[a-z]?)?)?)((?:\s*(?:Keep for Your Records|CAUTION))*)\s*!?$/;

function detectWorksheetTitle(t: string): HeadingMatch | null {
  const m = t.match(WORKSHEET_TITLE_RE);
  if (!m || !(m[2] || m[3] || m[4])) return null;
  return { heading: m[1], slug: slugifyHeading(m[1]) };
}

function detectHeading(line: string, style: ParserStyle = "irs"): HeadingMatch | null {
  const t = line.trim();
  const runIn = detectRunInHeading(line) ?? detectWorksheetTitle(t);
  if (runIn) return runIn;
  if (
    LINE_HEADING_RE.test(t) ||
    LINE_DASH_HEADING_RE.test(t) ||
    LINES_LIST_HEADING_RE.test(t) ||
    LINES_RANGE_HEADING_RE.test(t) ||
    PART_HEADING_RE.test(t) ||
    SCHEDULE_HEADING_RE.test(t) ||
    KNOWN_PROSE_HEADINGS.has(t)
  ) {
    return { heading: t, slug: slugifyHeading(t) };
  }
  if (style === "ftb") return detectFtbHeading(line, t);
  return null;
}

export function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
 * IRS headings often wrap across multiple lines ("Line 1e" / "Taxable
 * Dependent Care" / "Benefits From Form 2441," / "Line 26"). Without
 * consuming the wrap, the last line ("Line 26") looks like a new heading
 * and creates a phantom section. A continuation line is a short Title Case
 * fragment that does not end a sentence. IRS headings are consistently
 * Title Case; body prose is not, so the case test rejects lines like
 * "Each payer should send you…".
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

function isTitleCaseLine(t: string): boolean {
  const words = t.split(/\s+/);
  for (const w of words) {
    const bare = w.replace(/[^A-Za-z]/g, "");
    if (bare.length === 0) continue;
    if (TITLE_CASE_SMALL_WORDS.has(bare.toLowerCase())) continue;
    if (!/^[A-Z]/.test(bare)) return false;
  }
  return true;
}

function isHeadingContinuation(lineText: string): boolean {
  const t = lineText.trim();
  if (t.length === 0 || t.length > 60) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  if (/^[a-z]/.test(t)) return false;
  if (!isTitleCaseLine(t)) return false;
  return true;
}

const MAX_HEADING_CONTINUATION_LINES = 5;

/*
 * Lines we never emit into a block. These are structural PDF artifacts
 * (page numbers, footer boilerplate) that appear verbatim in the canonical
 * text but carry no citable content. They stay in canonical.txt; no
 * block's char range includes them.
 */
const PAGE_NUM_RE = /^\d{1,3}$/;
const FOOTER_RE = /^\d{1,3} Need more information or forms\? Visit IRS\.gov\.$/;
const HEADER_CONTINUED_RE = /^\(Continued\)$/;
/*
 * FTB running headers/footers: "FTB 5805 Instructions 2025 Page 1",
 * "Page 4 FTB 5805 Instructions 2025", "Personal Income Tax Booklet 2025
 * Page 75".
 */
const FTB_RUNNING_RE =
  /^(?:Page \d{1,3} )?[\w ().-]*(?:Instructions|Booklet) \d{4}(?: \(REV [\d-]+\))?(?: Page \d{1,3})?$/;
/* IRS running footer, e.g. "Instructions for Form 8995-A (2025) 5". */
const IRS_FOOTER_RE =
  /^(?:\d{1,3} )?Instructions for (?:Form|Schedule) .*\(\d{4}\)(?: \d{1,3}| Catalog Number \w+)?$/;

function isStructuralNoise(line: string): boolean {
  const t = line.trim();
  if (t.length === 0) return true;
  if (PAGE_NUM_RE.test(t)) return true;
  if (FOOTER_RE.test(t)) return true;
  if (HEADER_CONTINUED_RE.test(t)) return true;
  if (IRS_FOOTER_RE.test(t)) return true;
  if (FTB_RUNNING_RE.test(t)) return true;
  if (/^This Page Intentionally Left Blank$/i.test(t)) return true;
  return false;
}

interface LineSpan {
  text: string;
  charStart: number;
  charEnd: number; // exclusive (points at the \n or end-of-page)
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
  docId: string; // used only to build ids; not returned in section/block
  /** See `ParserStyle`. Defaults to "irs" — additive layers ride on top. */
  style?: ParserStyle;
}

/**
 * Parse canonical text into sections and blocks.
 *
 * Headings delimit sections: regex lines (`Line 1a`, `Part I`), run-in
 * headings (`Line 4. If…`), worksheet titles, known and Title Case prose
 * headings, plus the FTB layers for style "ftb". Within a section, a
 * block is the text on one page, capped at MAX_BLOCK_CHARS (chunk.ts).
 * Block ids are `<sectionId>::bNN`. Content before the first heading
 * falls into a synthetic "preamble" section.
 *
 * All block `text` values are verbatim slices of `canonicalText`; we do
 * not clean extraction artifacts here. Char offsets always point back to
 * canonical.txt.
 */
export function parseDoc(canonicalText: string, pages: PageSlice[], opts: ParseOpts): ParsedDoc {
  return new DocParser(canonicalText, opts, pages[0]?.pageNum ?? 1).parse(pages);
}

/* Accumulator for the block in progress on the current section + page. */
interface PendingBlock {
  pageNum: number;
  firstLineStart: number;
  lastLineEnd: number;
}

/*
 * The line-walk state machine behind parseDoc. One instance per parse;
 * the mutable state (current section, pending block, ordinals) lives on
 * the instance instead of a nest of closures. If no real sections are
 * found, the preamble covers the whole doc — a single-section parse is
 * valid.
 */
class DocParser {
  private readonly sections: Omit<RefSection, "docId">[] = [];
  private readonly blocks: Omit<RefBlock, "docId">[] = [];
  private readonly usedSlugs: Set<string>;
  private currentSection: Omit<RefSection, "docId">;
  private sectionOrdinal = 1; // next ordinal for a new section
  private blockOrdinal = 0; // doc-wide order (ref_blocks.ordinal)
  private blockInSection = 0; // per-section counter for the block id
  /* Last non-noise line seen (any page); null before the first line. */
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
      charEnd: 0, // filled when we close it
    };
    this.usedSlugs = new Set<string>([this.currentSection.headingSlug]);
  }

  parse(pages: PageSlice[]): ParsedDoc {
    for (const page of pages) {
      this.processPage(page);
    }
    // Close the final section.
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

      // Regular content line. Extend the pending block, or open one.
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

    // End of page: flush so the next page gets its own block.
    this.flushPendingBlock();
  }

  /*
   * Handle a detected heading at lines[i]. Starts the new section, seeds
   * the pending body block, and returns the index of the next unconsumed
   * line.
   */
  private processHeading(
    heading: NonNullable<ReturnType<typeof detectHeading>>,
    lines: ReturnType<typeof splitLinesWithOffsets>,
    i: number,
    pageNum: number,
  ): number {
    const line = lines[i];
    /*
     * Inline-body headings (FTB "Title – body" pattern) consume only
     * the line's prefix. Skip the multi-line continuation logic and
     * start the body block mid-line at the dash boundary.
     */
    if (heading.inlineBodyOffset !== undefined) {
      this.startSection(heading.heading, heading.slug, line.charStart, pageNum);
      this.pendingBlock = {
        pageNum,
        firstLineStart: line.charStart + heading.inlineBodyOffset,
        lastLineEnd: line.charEnd,
      };
      return i + 1;
    }

    // Whole-line heading. Consume continuation lines that complete it.
    const continuationTexts: string[] = [];
    let j = i + 1;
    let consumed = 0;
    let lastConsumedEnd = line.charEnd;
    while (
      j < lines.length &&
      consumed < MAX_HEADING_CONTINUATION_LINES &&
      !isStructuralNoise(lines[j].text) &&
      isHeadingContinuation(lines[j].text)
    ) {
      continuationTexts.push(lines[j].text.trim());
      lastConsumedEnd = lines[j].charEnd;
      j += 1;
      consumed += 1;
    }
    const fullHeading =
      continuationTexts.length === 0
        ? heading.heading
        : `${heading.heading} ${continuationTexts.join(" ")}`;

    this.startSection(fullHeading, heading.slug, line.charStart, pageNum);

    // Body starts after the heading (including any continuation).
    this.pendingBlock = {
      pageNum,
      firstLineStart: lastConsumedEnd,
      lastLineEnd: lastConsumedEnd,
    };
    return j;
  }

  private flushPendingBlock(): void {
    if (!this.pendingBlock) return;
    const start = this.pendingBlock.firstLineStart;
    const end = this.pendingBlock.lastLineEnd;
    /*
     * Block ids are section-anchored and human readable:
     * `<sectionId>::b01` is the first block under that heading. A parser
     * change elsewhere in the doc does not renumber them. Long ranges are
     * capped (chunk.ts); each piece gets its own id.
     */
    for (const [s, e] of end > start ? splitRange(this.canonicalText, start, end) : []) {
      this.blockInSection += 1;
      this.blocks.push({
        blockId: `${this.currentSection.sectionId}::b${String(this.blockInSection).padStart(2, "0")}`,
        sectionId: this.currentSection.sectionId,
        pageNum: this.pendingBlock.pageNum,
        blockType: "paragraph",
        ordinal: this.blockOrdinal,
        text: this.canonicalText.slice(s, e),
        charStart: s,
        charEnd: e,
      });
      this.blockOrdinal += 1;
    }
    this.pendingBlock = null;
  }

  private startSection(heading: string, slug: string, charStart: number, firstPage: number): void {
    // Close out preamble or prior section.
    this.flushPendingBlock();
    this.currentSection.charEnd = charStart;
    this.sections.push(this.currentSection);
    /*
     * Disambiguate duplicate slugs with a numeric suffix. The IRS doc
     * reuses headings like "Line 1a" across sections (e.g. a line
     * instruction vs. a table caption), so we keep incrementing.
     */
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
