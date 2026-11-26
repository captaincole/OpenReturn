import { MAX_BLOCK_CHARS } from "../refdocs/chunk";

/*
 * chunk.ts's rule, for statute text: cut after a sentence, else at a line
 * end, as splitRange does. Statute sentences run past the cap more often
 * than prose, so before a hard cut it tries a semicolon, a comma, then a
 * space. Pieces stay verbatim.
 */

const MIN_PIECE_CHARS = 400;
const SENTENCE_ENDS = new Set([".", "?", "!", ":"]);
const CLAUSE_ENDS = [";", ","];

const isSpace = (char: string | undefined) => char === " " || char === "\n";

/** The last cut in (lo, hi] that comes right after one of the marks and before a space. */
function lastCutAfter(text: string, lo: number, hi: number, marks: (char: string) => boolean) {
  for (let cut = hi; cut > lo; cut--) if (marks(text[cut - 1]) && isSpace(text[cut])) return cut;
  return -1;
}

function lastLineEnd(text: string, lo: number, hi: number): number {
  const newline = text.lastIndexOf("\n", hi - 1);
  return newline > lo ? newline + 1 : -1;
}

function bestCut(text: string, lo: number, hi: number): number {
  const finders = [
    () => lastCutAfter(text, lo, hi, (char) => SENTENCE_ENDS.has(char)),
    () => lastLineEnd(text, lo, hi),
    ...CLAUSE_ENDS.map((mark) => () => lastCutAfter(text, lo, hi, (char) => char === mark)),
    () => lastCutAfter(text, lo, hi, (char) => !isSpace(char)),
  ];
  for (const find of finders) {
    const cut = find();
    if (cut > 0) return cut;
  }
  return hi;
}

export function splitStatute(text: string, start: number, end: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let cursor = start;
  while (end - cursor > MAX_BLOCK_CHARS) {
    const cut = bestCut(text, cursor + MIN_PIECE_CHARS, cursor + MAX_BLOCK_CHARS);
    out.push([cursor, cut]);
    cursor = cut;
    while (cursor < end && isSpace(text[cursor])) cursor++;
  }
  if (end > cursor) out.push([cursor, end]);
  return out;
}
