import { type Designator, type OutlineScheme, romanValue } from "./ecfrDesignators";

/*
 * Paragraph numbers in California's codes. The levels run subdivision (a),
 * paragraph (1), subparagraph (A), clause (i), subclause (I), item (ia).
 * A long list goes on past (Z) as (AA), (AB), …. A number can fit two
 * levels: "i" is a letter after (h) and the first clause, "I" a letter
 * after (H) and the first subclause; the outline step decides. Pure.
 */

type CaKind = "lowerLetter" | "number" | "upperLetter" | "lowerRoman" | "upperRoman" | "item";

const RANK: Record<CaKind, number> = {
  lowerLetter: 0,
  number: 1,
  upperLetter: 2,
  lowerRoman: 3,
  upperRoman: 4,
  item: 5,
};

const FIRST: Record<CaKind, string> = {
  lowerLetter: "a",
  number: "1",
  upperLetter: "A",
  lowerRoman: "i",
  upperRoman: "I",
  item: "ia",
};

const MAX_DIGITS = 3;
const MAX_LETTERS = 2;
const ITEM_HEAD = "i";

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLower = (char: string) => char >= "a" && char <= "z";
const isUpper = (char: string) => char >= "A" && char <= "Z";
const allOf = (text: string, test: (char: string) => boolean) =>
  text.length > 0 && [...text].every(test);

const isLetters = (token: string, test: (char: string) => boolean) =>
  token.length <= MAX_LETTERS && allOf(token, test);

/** "ia", "ib": an item is "i" and one letter, unless the two make a numeral ("iv"). */
const isItem = (token: string) =>
  token.length === 2 && token[0] === ITEM_HEAD && isLower(token[1]) && romanValue(token) === 0;

function caKindsOf({ token }: Designator): CaKind[] {
  if (allOf(token, isDigit)) return token.length <= MAX_DIGITS ? ["number"] : [];
  const kinds: CaKind[] = [];
  if (isLetters(token, isLower)) kinds.push("lowerLetter");
  if (isLetters(token, isUpper)) kinds.push("upperLetter");
  if (romanValue(token) > 0) kinds.push("lowerRoman");
  if (romanValue(token.toLowerCase()) > 0 && allOf(token, isUpper)) kinds.push("upperRoman");
  if (isItem(token)) kinds.push("item");
  return kinds;
}

/** True when the text has the shape of a paragraph number of California's codes. */
export const isCaDesignatorToken = (token: string): boolean =>
  caKindsOf({ token, italic: false }).length > 0;

/** "A" → "B", "Z" → "AA", "AB" → "AC", "AZ" → "BA": the letters count like a spreadsheet's columns. */
export function nextLetters(last: string): string {
  const base = last === last.toUpperCase() ? "A" : "a";
  const top = String.fromCharCode(base.charCodeAt(0) + 25);
  const chars = [...last];
  for (let at = chars.length - 1; at >= 0; at--) {
    if (chars[at] !== top) {
      chars[at] = String.fromCharCode(chars[at].charCodeAt(0) + 1);
      return chars.join("");
    }
    chars[at] = base;
  }
  return base + chars.join("");
}

function caFollows(kind: string, last: string, token: string): boolean {
  if (kind === "number") return allOf(token, isDigit) && Number(token) === Number(last) + 1;
  if (kind === "lowerRoman") return romanValue(token) === romanValue(last) + 1;
  if (kind === "upperRoman")
    return romanValue(token.toLowerCase()) === romanValue(last.toLowerCase()) + 1;
  if (kind === "item") return token.length === 2 && token === ITEM_HEAD + nextLetters(last[1]);
  return nextLetters(last) === token;
}

export const CA_SCHEME: OutlineScheme = {
  kindsOf: caKindsOf,
  rankOf: (kind) => RANK[kind as CaKind],
  isFirstOf: (kind, token) => FIRST[kind as CaKind] === token,
  follows: caFollows,
};
