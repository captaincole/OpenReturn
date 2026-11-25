/*
 * A form's content stream does not run in reading order (FTB forms print
 * every box number and dot leader after the labels). The face's lines are
 * rebuilt from the text positions instead: top to bottom, then left to right.
 */

export interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
}

// Items closer than this in y (PDF points) sit on one printed line.
const SAME_LINE_POINTS = 2.5;
// A gap wider than this between two items is a word space.
const WORD_GAP_POINTS = 1;

interface PrintedLine {
  y: number;
  items: PositionedText[];
}

/*
 * A wide gap before a line number or a sub-line letter starts a new line:
 * a margin label ("Income") or a second line on the same row ("2a … b …").
 */
const COLUMN_GAP_POINTS = 12;
/*
 * "6 Mortgages…", "2 a Date…", "12a Qualified…", "b Taxable…". A bare "7"
 * or "2a" before the next label is an amount box, not a line start.
 */
const LABELED_LINE_RE = /^(?:\d{1,3} (?:[a-z] )?|\d{1,3}[a-z] |[a-z] )[A-Z(“"]/;
const LOOKAHEAD_ITEMS = 3;

function startsLabeledLine(rest: readonly PositionedText[]): boolean {
  const text = rest
    .slice(0, LOOKAHEAD_ITEMS)
    .map((item) => item.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return LABELED_LINE_RE.test(text);
}

function joinLine(items: PositionedText[]): string[] {
  const lines: string[] = [];
  const sorted = [...items].sort((left, right) => left.x - right.x);
  let text = "";
  let end = -Infinity;
  for (const [i, item] of sorted.entries()) {
    const gap = item.x - end;
    if (text && gap > COLUMN_GAP_POINTS && startsLabeledLine(sorted.slice(i))) {
      lines.push(text);
      text = "";
    }
    text += text && gap > WORD_GAP_POINTS ? ` ${item.str}` : item.str;
    end = item.x + item.width;
  }
  lines.push(text);
  return lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function linesFromPositions(items: readonly PositionedText[]): string[] {
  const lines: PrintedLine[] = [];
  const top = [...items]
    .filter((item) => item.str.trim())
    .sort((upper, lower) => lower.y - upper.y);
  for (const item of top) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= SAME_LINE_POINTS);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  return lines.sort((upper, lower) => lower.y - upper.y).flatMap((line) => joinLine(line.items));
}
