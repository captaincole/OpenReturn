/*
 * The text a form prints, one row per form line. A form wraps a line's
 * label, fills the gap to the amount box with dot leaders, and prints the
 * line number again in the box. A row joins the wrapped label and drops
 * the leaders and the box.
 */

// "14 Subtract…", "2 a Date…", "25a Basis…", "111 AMOUNT…": a line number, then a capital or a sub-letter.
const NUMBERED_ROW_RE = /^(\d{1,3}[a-z]?)\s+(?:([a-z])\s+)?[A-Z(“"$]/;
// "a The second disposition…": a sub-line letter, then a capital. "a qualified…" is a wrap.
const LETTERED_ROW_RE = /^([a-z])\s+[A-Z(“"]/;
/*
 * Rows with no line number that still start on their own line: notes,
 * bullets, parts, sections ("Section A. Donated Property…"), and lettered
 * boxes or columns ("(A) Short-term…"). "Part I, line 27" is a wrap.
 */
const UNNUMBERED_ROW_RE =
  /^(?:Note|Caution|Tip|Important)\b|^•|^\([A-Za-z0-9]{1,2}\)\s|^Section [A-Z][.—–]|^Part [IVXL]+(?=$|[\s—–]+[A-Z(])/;
// Spaced leaders (". . . .") after a word, and packed leaders ("......").
const SPACED_LEADER_RE = /\s+(?:\.\s*){2,}(?=\s|$)/g;
const PACKED_LEADER_RE = /\.{3,}/g;
// What fills an amount box or a date box once the leaders are gone.
const BOX_FILLER_RE = /^(?:[.•$–—\-{}]+|00|MM\/DD\/YYYY)$/;
const YES_NO_END_RE = /\bYes No$/;
const STARTS_LOWERCASE_RE = /^[a-z]/;
const HAS_LETTER_RE = /[A-Za-z]/;

/* "Form 8824 (2025) Page 2", "Schedule D (Form 1040) 2025": the running head and foot. */
const RUNNING_HEAD_RE =
  /^(?:Form|Schedule) [\w-]+(?: \([^)]*\))*?(?: \(\d{4}\)| \d{4}| \(Rev\. [^)]+\))(?: Attachment Sequence No\. \w+)?(?: Page \d+)?$/;
// FTB prints a scan code and the side: "7501253 FTB 3805E 2025 Side 1".
const FTB_SIDE_RE = /\b\d{7}\b.*\bSide \d|\bSide \d\b.*\b\d{7}\b/;
const FOOTER_RE = /Paperwork Reduction Act Notice|Privacy Notice, get FTB/;

export const isNumberedRow = (row: string): boolean => NUMBERED_ROW_RE.test(row);

export function isFaceNoise(line: string): boolean {
  if (!HAS_LETTER_RE.test(line)) return true;
  return RUNNING_HEAD_RE.test(line) || FTB_SIDE_RE.test(line) || FOOTER_RE.test(line);
}

interface RowStart {
  /** The box numbers this row may print at its end ("14", "25a"). */
  boxes: Set<string>;
  /** The line number the row sets, for the sub-lines that follow. */
  number: string | null;
}

function rowStart(text: string, lastNumber: string): RowStart | null {
  const numbered = text.match(NUMBERED_ROW_RE);
  if (numbered) {
    // "5 a Did you…" prints its box as "5a".
    const [, number, subLetter] = numbered;
    const boxes = new Set(subLetter ? [number, `${number}${subLetter}`] : [number]);
    return { boxes, number: number.replace(/[a-z]$/, "") };
  }
  const lettered = text.match(LETTERED_ROW_RE);
  if (lettered) return { boxes: new Set([`${lastNumber}${lettered[1]}`]), number: null };
  if (UNNUMBERED_ROW_RE.test(text)) return { boxes: new Set([lastNumber]), number: null };
  return null;
}

/* Drops the leaders and the box at the end. `closed`: the line reached its amount box. */
export function cleanFaceLine(
  line: string,
  boxes: ReadonlySet<string>,
): { text: string; closed: boolean } {
  const unleadered = line.replace(SPACED_LEADER_RE, " ").replace(PACKED_LEADER_RE, " ");
  const hadLeader = unleadered !== line;
  const tokens = unleadered.split(/\s+/).filter((token) => token.length > 0);
  let hadBox = false;
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    if (BOX_FILLER_RE.test(last)) {
      tokens.pop();
    } else if (boxes.has(last)) {
      tokens.pop();
      hadBox = true;
    } else break;
  }
  const text = tokens.join(" ");
  return { text, closed: hadLeader || hadBox || YES_NO_END_RE.test(text) };
}

interface OpenRow {
  text: string;
  numbered: boolean;
  open: boolean;
  boxes: Set<string>;
}

/*
 * A wrapped line joins the row above while that row is open (it has not
 * reached its box). An unnumbered row takes only a lowercase wrap, so the
 * title lines at the top of a form stay one per row.
 */
export function faceRows(lines: readonly string[]): string[] {
  const rows: string[] = [];
  let current: OpenRow | null = null;
  let lastNumber = "";
  for (const line of lines) {
    const trimmed = line.replace(/\s+/g, " ").trim();
    if (isFaceNoise(trimmed)) continue;
    const start = rowStart(trimmed, lastNumber);
    const wraps =
      !start && current?.open && (current.numbered || STARTS_LOWERCASE_RE.test(trimmed));
    if (wraps && current) {
      const cleaned = cleanFaceLine(trimmed, current.boxes);
      current.text = `${current.text} ${cleaned.text}`;
      current.open = !cleaned.closed;
      continue;
    }
    if (start?.number) lastNumber = start.number;
    const boxes = start?.boxes ?? new Set([lastNumber]);
    const cleaned = cleanFaceLine(trimmed, boxes);
    if (current) rows.push(current.text);
    current = { text: cleaned.text, numbered: start !== null, open: !cleaned.closed, boxes };
  }
  if (current) rows.push(current.text);
  return rows.filter((row) => HAS_LETTER_RE.test(row));
}
