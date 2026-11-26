import { type Designator, isDesignatorToken, opensLevel } from "./ecfrDesignators";
import type { Run } from "./ecfrText";
import { squash } from "./uslmText";

/*
 * Reads the numbers a regulation paragraph opens with. One <P> can open
 * several levels: "(b) Facts and circumstances—(1) In general. …" and
 * "(2)(i) For taxable years …". Each level becomes its own piece. A number
 * runs in when it sits right against the one before ("(g)(2)"), or when it
 * opens a level right after a number, an italic heading, or a "—" before
 * an italic heading; anywhere else "(1)" is part of the sentence. A range
 * ("(a)-(g)(1)(ii) [Reserved]") names the last number it covers.
 */

export interface Piece {
  /** null for a paragraph that opens with words. */
  designator: Designator | null;
  /** "(b)" as printed; empty for no designator. */
  numText: string;
  /** The italic heading after the number, without its closing mark: "In general". */
  heading: string;
  /** The text after the number and heading. */
  body: string;
  /** The whole piece as one line; empty for a bare number that runs into its first child. */
  text: string;
  /** "(1) through (3)", "(a)-(g)(1)(ii)": the numbers of the last paragraph the piece covers. */
  rangeEnd?: Designator[];
}

/** Characters with their italic flags, so positions line up with marks. */
interface Chars {
  text: string;
  italic: boolean[];
}

const EM_DASH = "—";
const HEADING_ENDS = [".", ":"];
const MAX_TOKEN = 8;
const RANGE_MARKS = ["-", "–", "through "];

function charsOf(runs: Run[]): Chars {
  let text = "";
  const italic: boolean[] = [];
  for (const run of runs) {
    const squashed = run.text.replace(/\s+/g, " ");
    text += squashed;
    for (let i = 0; i < squashed.length; i++) italic.push(run.italic);
  }
  const lead = text.length - text.trimStart().length;
  return { text: text.slice(lead), italic: italic.slice(lead) };
}

interface Found extends Designator {
  start: number;
  end: number;
}

function readDesignator(chars: Chars, at: number): Found | null {
  if (chars.text[at] !== "(") return null;
  const close = chars.text.indexOf(")", at + 1);
  if (close < 0 || close - at - 1 > MAX_TOKEN) return null;
  const token = chars.text.slice(at + 1, close);
  if (!isDesignatorToken(token)) return null;
  // An italic number has upright parentheses; one inside an italic heading run is upright.
  const italic = !chars.italic[at] && chars.italic.slice(at + 1, close).every(Boolean);
  return { token, italic, start: at, end: close + 1 };
}

const skipSpaces = (chars: Chars, at: number) => {
  let pos = at;
  while (chars.text[pos] === " ") pos++;
  return pos;
};

/** A run-in number at `at`: any number right against the last one, else one that opens a level. */
function runInAt(chars: Chars, at: number, adjacent = false): Found | null {
  const touching = adjacent ? readDesignator(chars, at) : null;
  if (touching) return touching;
  const found = readDesignator(chars, skipSpaces(chars, at));
  return found && opensLevel(found) ? found : null;
}

/** The italic heading at `at`, with its "." when the period sits outside the italics. */
function headingAt(chars: Chars, at: number): { text: string; end: number } | null {
  if (!chars.italic[at]) return null;
  let end = at;
  while (end < chars.text.length && chars.italic[end] && !dashRunIn(chars, end)) end++;
  if (chars.text[end] === ".") end++;
  const text = chars.text.slice(at, end).trim();
  const closed = HEADING_ENDS.some((mark) => text.endsWith(mark));
  const dashed = chars.text[end] === EM_DASH || text.endsWith(EM_DASH);
  return text && (closed || dashed) ? { text, end } : null;
}

/** "In general." → "In general"; "Exceptions—" → "Exceptions". */
const cleanHeading = (text: string) => text.replace(/[.:—\s]+$/, "").trim();

// "Refund of expenses—(1) Payment …" can sit inside one italic run: the "—(1)" ends the heading.
function dashRunIn(chars: Chars, at: number): boolean {
  if (chars.text[at] !== EM_DASH) return false;
  const found = readDesignator(chars, at + 1);
  return found !== null && opensLevel(found);
}

/* A body that runs on into a list: "… apply for purposes of this section—(1) Magnetic media." */
function bodyRunIn(chars: Chars, from: number): Found | null {
  for (
    let at = chars.text.indexOf(EM_DASH, from);
    at >= 0;
    at = chars.text.indexOf(EM_DASH, at + 1)
  ) {
    const found = readDesignator(chars, at + 1);
    if (found && opensLevel(found) && headingAt(chars, skipSpaces(chars, found.end))) return found;
  }
  return null;
}

/** The numbers after "-" or "through" right after the piece's own: "(a)-(g)(1)(ii)". */
function rangeEndAt(chars: Chars, at: number): Designator[] | undefined {
  const start = skipSpaces(chars, at);
  const mark = RANGE_MARKS.find((candidate) => chars.text.startsWith(candidate, start));
  if (!mark) return undefined;
  const end: Designator[] = [];
  for (
    let found = readDesignator(chars, start + mark.length);
    found;
    found = readDesignator(chars, found.end)
  )
    end.push({ token: found.token, italic: found.italic });
  return end.length > 0 ? end : undefined;
}

function piece(chars: Chars, found: Found, start: number, end: number, headingText = ""): Piece {
  const headEnd = headingText
    ? chars.text.indexOf(headingText, found.end) + headingText.length
    : found.end;
  const body = squash(chars.text.slice(headEnd, end)).replace(/^[—]\s*/, "");
  return {
    designator: { token: found.token, italic: found.italic },
    numText: `(${found.token})`,
    heading: cleanHeading(headingText),
    body,
    text: squash(chars.text.slice(start, end)),
    rangeEnd: headingText ? undefined : rangeEndAt(chars, found.end),
  };
}

/** The pieces of one paragraph, in order. A paragraph with no number is one piece. */
export function splitParagraph(runs: Run[]): Piece[] {
  return splitChars(charsOf(runs));
}

/** A question or answer of a section written as questions and answers: "Q-1. Can …", "A-1. (a) Yes. …". */
export interface QaParagraph {
  question: boolean;
  number: string;
  /** "A-1." as printed. */
  mark: string;
  /** The text after the mark, split as any paragraph is. */
  pieces: Piece[];
}

const QA_LETTERS = new Set(["Q", "A"]);
const QA_ENDS = new Set([".", ":"]);

export function qaParagraph(runs: Run[]): QaParagraph | null {
  const chars = charsOf(runs);
  const { text } = chars;
  if (!QA_LETTERS.has(text[0]) || text[1] !== "-") return null;
  let end = 2;
  while (isDigitChar(text[end])) end++;
  if (end === 2 || !QA_ENDS.has(text[end])) return null;
  const rest = skipSpaces(chars, end + 1);
  return {
    question: text[0] === "Q",
    number: text.slice(2, end),
    mark: text.slice(0, end + 1),
    pieces: splitChars({ text: text.slice(rest), italic: chars.italic.slice(rest) }),
  };
}

const isDigitChar = (char: string | undefined) => char !== undefined && char >= "0" && char <= "9";

function splitChars(chars: Chars): Piece[] {
  const first = readDesignator(chars, 0);
  if (!first) return [plainPiece(chars.text)];
  const pieces: Piece[] = [];
  let found: Found | null = first;
  let start = 0;
  while (found) {
    const next = nextLevel(chars, found);
    const end = next ? next.split : chars.text.length;
    const made = piece(chars, found, start, end, next?.heading ?? fullHeading(chars, found));
    if (next?.bare) pieces.push({ ...made, text: "" });
    else pieces.push(made);
    start = next?.bare ? start : (next?.found.start ?? end);
    found = next?.found ?? null;
  }
  return pieces;
}

const plainPiece = (text: string): Piece => ({
  designator: null,
  numText: "",
  heading: "",
  body: squash(text),
  text: squash(text),
});

function fullHeading(chars: Chars, found: Found): string {
  return headingAt(chars, skipSpaces(chars, found.end))?.text ?? "";
}

interface NextLevel {
  found: Found;
  /** Where this piece's text ends. */
  split: number;
  heading?: string;
  /** "(2)(i)": the number has no text of its own and runs into its child. */
  bare: boolean;
}

function nextLevel(chars: Chars, found: Found): NextLevel | null {
  const direct = runInAt(chars, found.end, true);
  if (direct) return { found: direct, split: direct.start, bare: true };
  const heading = headingAt(chars, skipSpaces(chars, found.end));
  if (heading) {
    const afterDash = chars.text[heading.end] === EM_DASH ? heading.end + 1 : heading.end;
    const runIn = runInAt(chars, afterDash);
    if (runIn) return { found: runIn, split: runIn.start, heading: heading.text, bare: false };
  }
  const inBody = bodyRunIn(chars, heading?.end ?? found.end);
  return inBody
    ? { found: inBody, split: inBody.start, heading: heading?.text, bare: false }
    : null;
}
