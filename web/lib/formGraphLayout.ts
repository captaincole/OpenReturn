/*
 * Where the form graph draws each form. The main form of the return (Form 1040,
 * Form 540) is at the top. Below it is one lane for each part of the return, in
 * the order of the main form's lines. The place of a form does not depend on its
 * state, or on whether the engine has it. Pure.
 */

export const CARD = { width: 104, height: 40 };

const PAD = 14;
const GAP = 12;
const LANE = { pad: 12, head: 30, gap: 24, minRows: 4 };
/* The line from the main form to the lanes. */
const TRUNK = 22;
/* The lanes get more rows, not more width, when the forms do not fit in this width. */
export const MAX_WIDTH = 1240;
const OUTSIDE_GAP = 64;

export const LANE_SECTIONS = ["income", "deductions", "tax", "credits", "payments", "other"];

export const SECTION_LABELS: Record<string, string> = {
  income: "Income",
  deductions: "Deductions",
  tax: "Tax",
  credits: "Credits",
  payments: "Payments",
  other: "Other",
};

export interface LaneForm {
  formId: string;
  section: string;
  /* The place in the lane. A form the engine lacks has none: it goes after the others. */
  rank?: number;
}

export interface Lane {
  section: string;
  formIds: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Slot extends Point {
  formId: string;
}

export interface LaneBox {
  section: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Drawing {
  slots: Slot[];
  lanes: LaneBox[];
  /* The SVG paths of the lines from the main form to each lane. */
  trunk: string[];
  width: number;
  height: number;
}

const laneOf = (form: LaneForm): string =>
  LANE_SECTIONS.includes(form.section) ? form.section : "other";

/* The main form, and the other forms by lane. A lane with no form is left out. */
export function lanesOf(forms: LaneForm[]): { main?: string; lanes: Lane[] } {
  const rest = forms.filter((form) => form.section !== "main");
  const byRank = (one: LaneForm, two: LaneForm): number =>
    (one.rank ?? Infinity) - (two.rank ?? Infinity);
  const lanes = LANE_SECTIONS.map((section) => ({
    section,
    formIds: rest
      .filter((form) => laneOf(form) === section)
      .sort(byRank)
      .map((form) => form.formId),
  }));
  return {
    main: forms.find((form) => form.section === "main")?.formId,
    lanes: lanes.filter((lane) => lane.formIds.length > 0),
  };
}

const span = (count: number, size: number): number => count * size + (count - 1) * GAP;

const columnsOf = (lane: Lane, rows: number): number => Math.ceil(lane.formIds.length / rows);

const laneWidth = (lane: Lane, rows: number): number =>
  span(columnsOf(lane, rows), CARD.width) + LANE.pad * 2;

const lanesWidth = (lanes: Lane[], rows: number): number =>
  lanes.reduce((sum, lane) => sum + laneWidth(lane, rows) + LANE.gap, -LANE.gap);

/*
 * The count of rows that every lane may use. A lane with more forms than rows
 * gets more columns. The count grows until the lanes fit in the width, so the
 * drawing gets taller, not wider, as the engine gets more forms.
 */
export function rowsFor(lanes: Lane[], maxWidth: number): number {
  const most = Math.max(LANE.minRows, ...lanes.map((lane) => lane.formIds.length));
  const counts = Array.from(
    { length: most - LANE.minRows + 1 },
    (_, index) => LANE.minRows + index,
  );
  return counts.find((rows) => lanesWidth(lanes, rows) + PAD * 2 <= maxWidth) ?? most;
}

/* The forms of a lane fill each row from the left, then the next row. */
function laneSlots(lane: Lane, box: LaneBox, rows: number): Slot[] {
  const columns = columnsOf(lane, rows);
  return lane.formIds.map((formId, index) => ({
    formId,
    x: box.x + LANE.pad + (index % columns) * (CARD.width + GAP),
    y: box.y + LANE.head + Math.floor(index / columns) * (CARD.height + GAP),
  }));
}

function laneBoxes(lanes: Lane[], rows: number, top: number, left: number): LaneBox[] {
  const widths = lanes.map((lane) => laneWidth(lane, rows));
  return lanes.map((lane, index) => ({
    section: lane.section,
    x: widths.slice(0, index).reduce((at, width) => at + width + LANE.gap, left),
    y: top,
    width: widths[index],
    height:
      LANE.head +
      span(Math.ceil(lane.formIds.length / columnsOf(lane, rows)), CARD.height) +
      LANE.pad,
  }));
}

const middleOf = (box: LaneBox): number => box.x + box.width / 2;

function trunkPaths(center: number, top: number, boxes: LaneBox[]): string[] {
  if (boxes.length === 0) return [];
  const bus = top + TRUNK;
  const middles = boxes.map(middleOf);
  const [first, last] = [Math.min(center, ...middles), Math.max(center, ...middles)];
  return [
    `M ${center} ${top} V ${bus}`,
    `M ${first} ${bus} H ${last}`,
    ...middles.map((middle) => `M ${middle} ${bus} V ${bus + TRUNK}`),
  ];
}

/*
 * `outside` is the box for the forms of another return. It goes at the side of
 * the main form: at the left when the main form reads it, at the right when it
 * reads the main form.
 */
export function drawLanes(
  main: string | undefined,
  lanes: Lane[],
  outside?: { formId: string; side: "left" | "right" },
  maxWidth: number = MAX_WIDTH,
): Drawing {
  const rows = rowsFor(lanes, maxWidth);
  const hasTop = main !== undefined || outside !== undefined;
  const topRoom = CARD.width / 2 + (outside ? OUTSIDE_GAP + CARD.width : 0);
  const lanesSpan = lanesWidth(lanes, rows);
  const inner = Math.max(lanesSpan, topRoom * 2);
  const center = PAD + inner / 2;
  const laneTop = PAD + (hasTop ? CARD.height + TRUNK * 2 : 0);
  const boxes = laneBoxes(lanes, rows, laneTop, PAD + (inner - lanesSpan) / 2);
  const mainX = center - CARD.width / 2;
  const shift = (CARD.width + OUTSIDE_GAP) * (outside?.side === "left" ? -1 : 1);
  return {
    slots: [
      ...(main !== undefined ? [{ formId: main, x: mainX, y: PAD }] : []),
      ...(outside ? [{ formId: outside.formId, x: mainX + shift, y: PAD }] : []),
      ...lanes.flatMap((lane, index) => laneSlots(lane, boxes[index], rows)),
    ],
    lanes: boxes,
    trunk: main !== undefined ? trunkPaths(center, PAD + CARD.height, boxes) : [],
    width: inner + PAD * 2,
    height: Math.max(laneTop, ...boxes.map((box) => box.y + box.height)) + PAD,
  };
}

/*
 * The arrow from a form to a form that reads it. Two forms in one row join at
 * their sides. Other forms join at the top and the bottom.
 */
export function linkPath(source: Point, reader: Point): string {
  const sameRow = Math.abs(reader.y - source.y) < CARD.height;
  if (sameRow) {
    const forward = reader.x > source.x;
    const startX = forward ? source.x + CARD.width : source.x;
    const endX = forward ? reader.x : reader.x + CARD.width;
    const [startY, endY] = [source.y + CARD.height / 2, reader.y + CARD.height / 2];
    const bend = Math.abs(endX - startX) / 2;
    const pull = forward ? bend : -bend;
    return `M ${startX} ${startY} C ${startX + pull} ${startY - 14}, ${endX - pull} ${endY - 14}, ${endX} ${endY}`;
  }
  const up = reader.y < source.y;
  const [startX, endX] = [source.x + CARD.width / 2, reader.x + CARD.width / 2];
  const startY = up ? source.y : source.y + CARD.height;
  const endY = up ? reader.y + CARD.height : reader.y;
  const bend = Math.max(Math.abs(endY - startY) / 2, 14) * (up ? -1 : 1);
  return `M ${startX} ${startY} C ${startX} ${startY + bend}, ${endX} ${endY - bend}, ${endX} ${endY}`;
}
