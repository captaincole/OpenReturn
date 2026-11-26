import { citationOf, citationSegment, QA_STEP, regCitationOf, regSlugOf, slugOf } from "./lawIds";

/*
 * Citations as people write them, and the blocks they name. A Code
 * citation: "469", "§ 469(g)(1)(A)", "26 U.S.C. 1400Z-2(a)". A regulation:
 * "1.469-5T", "26 CFR 1.469-5T(a)(1)", "Treas. Reg. § 1.1031(a)-1(b)",
 * "1.408A-4, Q&A-1(b)". The dot tells them apart: a Code section number
 * never has one. Pure: the database read is in lawRead.ts.
 */

export type LawTarget =
  | { kind: "block"; blockId: string }
  | { kind: "citation"; section: string; path: string[] }
  | { kind: "regulation"; section: string; path: string[] };

/** Which library a law document is: the statute (the Code) or the regulations. */
export type LawSource = "statute" | "regulations";

/** One block of a Code section, as the resolver needs it. */
export interface PathBlock {
  blockId: string;
  path: string[];
  text: string;
}

const BLOCK_ID_MARK = "::";
// Words that may come before the section number; they carry nothing. Longer ones first.
const LEADING_WORDS = [
  "26 u.s.c.",
  "26 usc",
  "irc",
  "i.r.c.",
  "26 c.f.r.",
  "26 cfr",
  "c.f.r.",
  "cfr",
  "treasury regulation",
  "treas. reg.",
  "treas. regs.",
  "reg.",
  "section",
  "sec.",
  "§§",
  "§",
];
const REG_DOT = ".";

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string) => char.toLowerCase() !== char.toUpperCase();
const isSectionChar = (char: string) => isDigit(char) || isLetter(char) || char === "-";

export function parseLawTarget(input: string): LawTarget | null {
  const raw = input.trim();
  if (raw.includes(BLOCK_ID_MARK)) return { kind: "block", blockId: raw };
  const rest = dropLeadingWords(raw.replace(/[–—]/g, "-"));
  const head = takeWhile(rest, isSectionChar);
  if (!head || !isDigit(head[0])) return null;
  if (rest[head.length] === REG_DOT) return regulationTarget(rest);
  const path = parseSegments(rest.slice(head.length));
  return path ? { kind: "citation", section: head, path } : null;
}

/** "1.1031(a)-1(b)": the section number runs through "(a)-1"; the path is "(b)". */
function regulationTarget(text: string): LawTarget | null {
  const section = regSectionNumber(text);
  if (!section || section.endsWith(REG_DOT)) return null;
  const { qa, rest } = qaStep(text.slice(section.length));
  const path = parseSegments(rest);
  return path ? { kind: "regulation", section, path: qa ? [qa, ...path] : path } : null;
}

/*
 * A regulation number is "<part>.<section>": letters, digits and hyphens,
 * and parenthesized groups that a hyphen follows ("1.401(a)(9)-1"). A
 * group with no hyphen after it starts the paragraph path.
 */
function regSectionNumber(text: string): string {
  let end = text.indexOf(REG_DOT) + 1;
  for (;;) {
    end += takeWhile(text.slice(end), isSectionChar).length;
    const groups = groupsLength(text.slice(end));
    if (groups === 0 || text[end + groups] !== "-") return text.slice(0, end);
    end += groups;
  }
}

/** The length of the "(…)(…)" run at the start of the text; 0 when there is none. */
function groupsLength(text: string): number {
  let length = 0;
  while (text[length] === "(") {
    const close = text.indexOf(")", length);
    if (close < 0) return 0;
    length = close + 1;
  }
  return length;
}

/** ", Q&A-1" or " Q&A-1" after the number: the Q&A is the path's first step. */
function qaStep(text: string): { qa: string | null; rest: string } {
  const trimmed = text.replace(/^[\s,]+/, "");
  if (!trimmed.toUpperCase().startsWith(QA_STEP)) return { qa: null, rest: text };
  const digits = takeWhile(trimmed.slice(QA_STEP.length), isDigit);
  if (!digits) return { qa: null, rest: text };
  return { qa: `${QA_STEP}${digits}`, rest: trimmed.slice(QA_STEP.length + digits.length) };
}

export const isRegulationNumber = (section: string): boolean => section.includes(REG_DOT);

export const sourceOfSection = (section: string): LawSource =>
  isRegulationNumber(section) ? "regulations" : "statute";

function dropLeadingWords(text: string): string {
  let rest = text.trim();
  for (let found = true; found;) {
    const word = LEADING_WORDS.find((lead) => rest.toLowerCase().startsWith(lead));
    found = word !== undefined;
    if (word) rest = rest.slice(word.length).trim();
  }
  return rest;
}

const takeWhile = (text: string, keep: (char: string) => boolean): string => {
  let end = 0;
  while (end < text.length && keep(text[end])) end++;
  return text.slice(0, end);
};

/** "(g)(1)(A)" → ["g", "1", "A"]; null when the text is anything else. */
function parseSegments(text: string): string[] | null {
  const segments: string[] = [];
  let rest = text.replace(/\s+/g, "");
  while (rest.startsWith("(")) {
    const close = rest.indexOf(")");
    if (close < 0) return null;
    const segment = citationSegment(rest.slice(1, close));
    if (!segment) return null;
    segments.push(segment);
    rest = rest.slice(close + 1);
  }
  return rest === "" ? segments : null;
}

/** "469" → "usc-26-2025::sec::s469", "1.469-5T" → "cfr-26-2025::sec::s1.469-5t": the section row's id. */
export const sectionIdOf = (docId: string, section: string): string =>
  `${docId}::sec::${isRegulationNumber(section) ? regSlugOf(section) : slugOf(`s${section}`)}`;

export const formatCitation = (section: string, path: string[]): string =>
  isRegulationNumber(section) ? regCitationOf(section, path) : citationOf(section, path);

const startsWith = (path: string[], prefix: string[]) =>
  prefix.every((segment, index) => path[index] === segment);

/*
 * The blocks that are the subdivision or sit inside it. When the
 * subdivision was packed into its parent's block (469(g)(1)(A) is in
 * block g-1), the parent's blocks that print it.
 */
export function resolvePath<T extends PathBlock>(blocks: T[], path: string[]): T[] {
  const inside = blocks.filter((block) => startsWith(block.path, path));
  if (inside.length > 0) return inside;
  const parentPath = longestParentPath(blocks, path);
  if (!parentPath) return [];
  const rest = path.slice(parentPath.length);
  return blocks.filter(
    (block) =>
      block.path.length === parentPath.length &&
      startsWith(block.path, parentPath) &&
      printsPath(block.text, rest),
  );
}

function longestParentPath(blocks: PathBlock[], path: string[]): string[] | null {
  const parents = blocks
    .map((block) => block.path)
    .filter((candidate) => candidate.length < path.length && startsWith(path, candidate));
  if (parents.length === 0) return null;
  return parents.reduce((longest, candidate) =>
    candidate.length > longest.length ? candidate : longest,
  );
}

/*
 * True when the text numbers the segments in order: "(A)" opens a line or
 * follows a parent's number, as in "(12)(A) Benevolent…".
 */
export function printsPath(text: string, segments: string[]): boolean {
  let from = 0;
  for (const segment of segments) {
    const at = numberedAt(text, `(${segment})`, from);
    if (at < 0) return false;
    from = at + segment.length + 2;
  }
  return true;
}

function numberedAt(text: string, label: string, from: number): number {
  for (let at = text.indexOf(label, from); at >= 0; at = text.indexOf(label, at + 1)) {
    const before = at === 0 ? "\n" : text[at - 1];
    if (before === "\n" || before === ")") return at;
  }
  return -1;
}

/** The next level down that the blocks hold: for 401, "401(a)", "401(b)", … */
export function subdivisionsOf(section: string, path: string[], blocks: PathBlock[]): string[] {
  const below = blocks
    .filter((block) => block.path.length > path.length && startsWith(block.path, path))
    .map((block) => block.path.slice(0, path.length + 1));
  const unique = [...new Map(below.map((sub) => [sub.join("/"), sub])).values()];
  return unique.map((sub) => formatCitation(section, sub));
}
