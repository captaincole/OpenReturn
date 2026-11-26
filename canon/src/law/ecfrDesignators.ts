/*
 * Paragraph numbers in the Code of Federal Regulations. The levels run
 * (a) → (1) → (i) → (A) → italic (1) → italic (i); older rules put an
 * italic (a) where newer ones put (A). A number can fit two levels: "i"
 * is a letter after (h) and the first roman numeral. Pure: no XML here.
 */

export type Kind =
  | "lowerLetter"
  | "number"
  | "lowerRoman"
  | "upperLetter"
  | "italicLetter"
  | "italicNumber"
  | "italicRoman";

export interface Designator {
  /** In citation form, as the text prints it: "a", "1", "ii", "A". */
  token: string;
  italic: boolean;
}

/** The standard order; an italic letter (older rules) sits where an upper-case letter does. */
const RANK: Record<Kind, number> = {
  lowerLetter: 0,
  number: 1,
  lowerRoman: 2,
  upperLetter: 3,
  italicLetter: 3,
  italicNumber: 4,
  italicRoman: 5,
};

const FIRST: Record<Kind, string> = {
  lowerLetter: "a",
  number: "1",
  lowerRoman: "i",
  upperLetter: "A",
  italicLetter: "a",
  italicNumber: "1",
  italicRoman: "i",
};

const MAX_DIGITS = 3;
const MAX_ROMAN = 8;
const ROMAN_VALUES: Array<[string, number]> = [
  ["m", 1000],
  ["cm", 900],
  ["d", 500],
  ["cd", 400],
  ["c", 100],
  ["xc", 90],
  ["l", 50],
  ["xl", 40],
  ["x", 10],
  ["ix", 9],
  ["v", 5],
  ["iv", 4],
  ["i", 1],
];

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLower = (char: string) => char >= "a" && char <= "z";
const isUpper = (char: string) => char >= "A" && char <= "Z";
const allOf = (text: string, test: (char: string) => boolean) =>
  text.length > 0 && [...text].every(test);

export const rankOf = (kind: Kind): number => RANK[kind];

/** "a", "z", "aa", "bb": one letter, or one letter repeated (the list goes on past z). */
const isLetterRun = (text: string) => [...text].every((char) => char === text[0]);

function toRoman(value: number): string {
  let rest = value;
  let out = "";
  for (const [numeral, worth] of ROMAN_VALUES)
    while (rest >= worth) {
      out += numeral;
      rest -= worth;
    }
  return out;
}

/** The value of a lower-case roman numeral; 0 when the text is not one written the usual way. */
export function romanValue(text: string): number {
  if (text.length > MAX_ROMAN || !allOf(text, (char) => "ivxlcdm".includes(char))) return 0;
  let value = 0;
  let rest = text;
  for (const [numeral, worth] of ROMAN_VALUES)
    while (rest.startsWith(numeral)) {
      value += worth;
      rest = rest.slice(numeral.length);
    }
  return rest === "" && toRoman(value) === text ? value : 0;
}

/** True when the text has the shape of a paragraph number at all. */
export function isDesignatorToken(token: string): boolean {
  if (allOf(token, isDigit)) return token.length <= MAX_DIGITS;
  if (allOf(token, isLower)) return isLetterRun(token) || romanValue(token) > 0;
  if (allOf(token, isUpper)) return isLetterRun(token);
  return false;
}

/** The levels a number can be at; "i" can be two. */
export function kindsOf({ token, italic }: Designator): Kind[] {
  if (allOf(token, isDigit)) return [italic ? "italicNumber" : "number"];
  if (allOf(token, isUpper)) return isLetterRun(token) ? ["upperLetter"] : [];
  const kinds: Kind[] = [];
  if (isLetterRun(token)) kinds.push(italic ? "italicLetter" : "lowerLetter");
  if (romanValue(token) > 0) kinds.push(italic ? "italicRoman" : "lowerRoman");
  return kinds;
}

export const isFirstOf = (kind: Kind, token: string): boolean => FIRST[kind] === token;

/** A number that opens a level: (1), (i), (A), or an italic (1), (i), (a). */
export const opensLevel = (designator: Designator): boolean =>
  kindsOf(designator).some((kind) => isFirstOf(kind, designator.token));

/** "h" → "i", "z" → "aa", "aa" → "bb". */
function nextLetterRun(last: string): string {
  const char = last[0];
  if (char === "z" || char === "Z") return (char === "z" ? "a" : "A").repeat(last.length + 1);
  return String.fromCharCode(char.charCodeAt(0) + 1).repeat(last.length);
}

/** True when `token` is the number after `last` in a list of that kind: (h) then (i). */
export function follows(kind: Kind, last: string, token: string): boolean {
  if (kind === "number" || kind === "italicNumber")
    return allOf(token, isDigit) && Number(token) === Number(last) + 1;
  if (kind === "lowerRoman" || kind === "italicRoman")
    return romanValue(token) > 0 && romanValue(token) === romanValue(last) + 1;
  return nextLetterRun(last) === token;
}
