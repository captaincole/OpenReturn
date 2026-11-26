import type { Extracted, RefMark } from "./uslmText";

/*
 * Builds the canonical text one piece at a time, one piece per line, and
 * keeps every ref's offset into it. A block is any range of whole pieces.
 */

export interface Span {
  start: number;
  end: number;
}

export interface TextSink {
  /** Appends a piece on its own line; null when the piece has no text. */
  write(piece: Extracted | string): Span | null;
  length(): number;
  text(): string;
  /** The hrefs of the refs that start inside the range, in order, once each. */
  refsIn(span: Span): string[];
}

const SEP = "\n";

export function createSink(): TextSink {
  const parts: string[] = [];
  const refs: RefMark[] = [];
  let length = 0;
  return {
    write(piece) {
      const { text, refs: pieceRefs } =
        typeof piece === "string" ? { text: piece, refs: [] } : piece;
      if (!text) return null;
      const start = parts.length === 0 ? 0 : length + SEP.length;
      parts.push(text);
      length = start + text.length;
      refs.push(...pieceRefs.map((ref) => ({ offset: start + ref.offset, href: ref.href })));
      return { start, end: length };
    },
    length: () => length,
    text: () => parts.join(SEP),
    refsIn: (span) => {
      const inRange = refs.slice(firstAtOrAfter(refs, span.start), firstAtOrAfter(refs, span.end));
      return [...new Set(inRange.map((ref) => ref.href))];
    },
  };
}

// Refs arrive in text order, so a binary search finds the first one in range.
function firstAtOrAfter(refs: RefMark[], offset: number): number {
  let lo = 0;
  let hi = refs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (refs[mid].offset < offset) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
