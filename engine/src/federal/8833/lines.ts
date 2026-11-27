/*
 * What Form 8833 prints where. The form has no arithmetic: every content line
 * is a stated answer (facts/kinds/treatyPosition.ts). This file lays the text
 * out: the two address boxes and the 25 rows of line 6. No money is involved.
 */

/* Line 6 has 25 one-line rows (irs-8833-form-2025::sec::face-page-1::b03). */
export const LINE_6_ROWS = 25;

/*
 * Characters that fit on a row at the form's 8-point font: row 1 starts after
 * the line's printed text (a 252-point box), rows 2 to 25 run the full width (a
 * 511-point box). The counts leave room for capitals; the renderer shrinks a
 * row that is still too wide.
 */
export const ROW_1_CHARACTERS = 55;
export const FULL_ROW_CHARACTERS = 115;

/* The country name, written out: "Please do not abbreviate the country name" (address-in-country-of-residence::b01). */
export const UNITED_STATES = "United States";

const rowWidth = (rowIndex: number): number =>
  rowIndex === 0 ? ROW_1_CHARACTERS : FULL_ROW_CHARACTERS;

/* A paragraph's words: tabs count as spaces, and a run of spaces is one break. */
const wordsOf = (paragraph: string): string[] =>
  paragraph
    .replaceAll("\t", " ")
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word !== "");

/*
 * Adds one word to the row being filled: a word that does not fit starts the
 * next row, and a word longer than a whole row is cut at the row's width.
 * Returns the row still being filled; full rows go into `rows`.
 */
function placeWord(rows: string[], current: string, word: string): string {
  let line = current;
  let rest = word;
  while (rest !== "") {
    const width = rowWidth(rows.length);
    const joined = line === "" ? rest : `${line} ${rest}`;
    if (joined.length <= width) return joined;
    if (line !== "") {
      rows.push(line);
      line = "";
    } else {
      rows.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
  }
  return line;
}

/*
 * The explanation in rows, as many as it needs: the words of each paragraph
 * fill a row, then the next. A line break in the text starts a new row; an
 * empty paragraph takes no row.
 */
export function explanationRows(text: string): string[] {
  const rows: string[] = [];
  for (const paragraph of text.split("\n")) {
    const last = wordsOf(paragraph).reduce((line, word) => placeWord(rows, line, word), "");
    if (last !== "") rows.push(last);
  }
  return rows;
}

/* Line 6: the rows, or how many rows the text needs when the form's 25 do not hold it. */
export type Line6 = { kind: "rows"; rows: string[] } | { kind: "overflow"; rowsNeeded: number };

export function line6Of(text: string): Line6 {
  const rows = explanationRows(text);
  return rows.length <= LINE_6_ROWS
    ? { kind: "rows", rows }
    : { kind: "overflow", rowsNeeded: rows.length };
}

/* The home address of Form 1040, as the engine holds it. */
export interface HomeAddress {
  street?: string;
  apt?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/* "Address in the United States": street, then city, state and ZIP code; undefined while a part is missing. */
export function unitedStatesAddress(address: HomeAddress): string | undefined {
  const { street, apt, city, state, zip } = address;
  if (!street || !city || !state || !zip) return undefined;
  const firstLine = apt ? `${street} ${apt}` : street;
  return `${firstLine}\n${city}, ${state} ${zip}`;
}

/*
 * "Address in country of residence": "city, province or state, and country",
 * the country not abbreviated (address-in-country-of-residence::b01). A Form
 * 1040 filer with a home in a U.S. state resides in the United States (own
 * reading, QUESTIONS.md item 3).
 */
export function countryOfResidenceAddress(address: HomeAddress): string | undefined {
  const home = unitedStatesAddress(address);
  return home === undefined ? undefined : `${home}\n${UNITED_STATES}`;
}
