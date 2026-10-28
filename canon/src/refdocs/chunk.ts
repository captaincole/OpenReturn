// A long block makes a blunt citation and a weak embedding. Pieces stay verbatim.

export const MAX_BLOCK_CHARS = 1200;
const MIN_PIECE_CHARS = 400;

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
