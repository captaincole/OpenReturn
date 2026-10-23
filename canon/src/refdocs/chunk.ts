/*
 * Size cap for corpus blocks. A block is a verbatim [start, end) slice of
 * canonical text; a long one makes a blunt citation and a weak embedding.
 * splitRange cuts a long range into pieces of at most MAX_BLOCK_CHARS,
 * preferring a sentence end, then a line end, then a hard cut. Pieces stay
 * verbatim: only the offsets change, never the text.
 */

export const MAX_BLOCK_CHARS = 1200;
/* Don't cut a piece shorter than this just to land on a sentence end. */
const MIN_PIECE_CHARS = 400;

/* Offset just after the last sentence end (". " / ".\n" / "?" / "!") in (lo, hi]. */
function lastSentenceEnd(text: string, lo: number, hi: number): number {
  for (let i = hi - 1; i > lo; i--) {
    const c = text[i - 1];
    if ((c === "." || c === "?" || c === "!" || c === ":") && /\s/.test(text[i] ?? " ")) return i;
  }
  return -1;
}

function lastLineEnd(text: string, lo: number, hi: number): number {
  const nl = text.lastIndexOf("\n", hi - 1);
  return nl > lo ? nl + 1 : -1;
}

/*
 * Split [start, end) of `text` into ranges no longer than maxChars. Leading
 * whitespace of each later piece is skipped so no piece starts with a
 * newline.
 */
export function splitRange(
  text: string,
  start: number,
  end: number,
  maxChars = MAX_BLOCK_CHARS,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let s = start;
  while (end - s > maxChars) {
    const hi = s + maxChars;
    const lo = s + Math.min(MIN_PIECE_CHARS, maxChars - 1);
    let cut = lastSentenceEnd(text, lo, hi);
    if (cut < 0) cut = lastLineEnd(text, lo, hi);
    if (cut < 0) cut = hi;
    out.push([s, cut]);
    s = cut;
    while (s < end && /\s/.test(text[s])) s++;
  }
  if (end > s) out.push([s, end]);
  return out;
}
