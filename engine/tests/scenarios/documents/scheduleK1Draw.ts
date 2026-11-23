/*
 * Drawing helpers the three Schedule K-1 generators share (Forms 1120-S, 1065
 * and 1041). Each 2025 K-1 has the same shape: the header across the top,
 * Part I (the entity) and Part II (the owner) as a stack of lettered cells on
 * the left, Part III (the boxes) as a grid of numbered boxes on the right, and
 * attached statements on pages of their own. The layouts follow the IRS forms
 * (irs.gov/pub/irs-pdf/f1120ssk.pdf, f1065sk1.pdf, f1041sk1.pdf).
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { K1Box, Section199AStatement } from "../../../src/facts/index.js";
import { PAGE_H, PAGE_W, drawBox, drawText, drawTextRight, drawWrapped, type Ctx } from "./draw.js";

export const X0 = 36;
export const X_END = 576;
/* The left half holds Parts I and II; Part III starts at PART_III_X. */
export const LEFT_W = 272;
export const PART_III_X = X0 + LEFT_W + 4;
const PART_III_W = X_END - PART_III_X;
const SUB_W = PART_III_W / 2;
const STRIP = 18; // the box-number strip of each Part III column
export const BOX_ROW = 24;
export const PART_III_TOP = 52;
export const GRID_TOP = PART_III_TOP + 22;

/* A name and an address as Part I or Part II prints them. */
export interface K1Party {
  name: string;
  street: string;
  cityStateZip: string;
}

/* The owner of the K-1 (shareholder, partner or beneficiary), as Part II prints it. */
export interface K1Owner extends K1Party {
  /* The identifying number as printed, often masked ("XXX-XX-2072"). */
  tin: string;
  /* "Individual" for a person. */
  entityType?: string;
  /* The domestic box; a foreign owner is not modeled. */
  domestic?: boolean;
}

const WHOLE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

/* An amount as a K-1 prints it: whole dollars, a loss in parentheses. */
export const k1Amount = (amount: number): string =>
  amount < 0 ? `(${WHOLE.format(-amount)})` : WHOLE.format(amount);

export const optionalAmount = (amount: number | undefined): string =>
  amount === undefined ? "" : k1Amount(amount);

export const optionalPercent = (percent: number | undefined): string =>
  percent === undefined ? "" : PERCENT.format(percent);

export const partyLines = (party: K1Party): string[] => [
  party.name,
  party.street,
  party.cityStateZip,
];

export async function newK1Doc(): Promise<{ doc: PDFDocument; fonts: Omit<Ctx, "page"> }> {
  const doc = await PDFDocument.create();
  const fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  return { doc, fonts };
}

export const addPage = (doc: PDFDocument, fonts: Omit<Ctx, "page">): Ctx => ({
  ...fonts,
  page: doc.addPage([PAGE_W, PAGE_H]),
});

/* A small square box, with an X when checked. */
export function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean | undefined) {
  drawBox(ctx, xPos, yPos, 7, 7);
  if (checked) drawText(ctx, "X", xPos + 1.3, yPos + 0.2, { size: 7, bold: true });
}

/* The black "Part I" tab and its title. */
export function partBanner(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  width: number,
  part: string,
  title: string,
) {
  drawBox(ctx, xPos, yPos, width, 16, { borderWidth: 0.8 });
  drawBox(ctx, xPos, yPos, 36, 16, { borderWidth: 0.8 });
  drawText(ctx, part, xPos + 4, yPos + 4, { size: 8.5, bold: true });
  drawText(ctx, title, xPos + 42, yPos + 4, { size: 9, bold: true });
}

export interface K1Header {
  form: string; // "1120-S"
  year: number;
  omb: string;
  title: [string, string]; // "Shareholder's Share of Income, Deductions," / "Credits, etc."
  partIIITitle: [string, string];
  finalK1?: boolean;
  amendedK1?: boolean;
}

export function drawK1Header(ctx: Ctx, header: K1Header) {
  drawText(ctx, "Schedule K-1", X0, 46, { size: 10, bold: true });
  drawText(ctx, `(Form ${header.form})`, X0, 58, { size: 10, bold: true });
  drawText(ctx, "Department of the Treasury", X0, 72, { size: 6.5 });
  drawText(ctx, "Internal Revenue Service", X0, 80, { size: 6.5 });
  drawTextRight(ctx, String(header.year), X0 + LEFT_W, 46, { size: 18, bold: true });
  drawTextRight(ctx, `For calendar year ${header.year}, or tax year`, X0 + LEFT_W, 80, {
    size: 6.5,
  });
  drawText(ctx, "beginning", X0 + 30, 98, { size: 6.5 });
  drawBox(ctx, X0 + 70, 94, 70, 12);
  drawText(ctx, "ending", X0 + 160, 98, { size: 6.5 });
  drawBox(ctx, X0 + 190, 94, 70, 12);
  drawText(ctx, header.title[0], X0, 112, { size: 11, bold: true });
  drawText(ctx, header.title[1], X0, 126, { size: 11, bold: true });
  drawTextRight(ctx, "See separate instructions.", X0 + LEFT_W, 130, { size: 6.5, bold: true });
  checkbox(ctx, PART_III_X + 2, 38, header.finalK1);
  drawText(ctx, "Final K-1", PART_III_X + 12, 38, { size: 7 });
  checkbox(ctx, PART_III_X + 82, 38, header.amendedK1);
  drawText(ctx, "Amended K-1", PART_III_X + 92, 38, { size: 7 });
  drawTextRight(ctx, `OMB No. ${header.omb}`, X_END, 38, { size: 6.5 });
  drawBox(ctx, PART_III_X, PART_III_TOP, PART_III_W, 22, { borderWidth: 0.8 });
  drawBox(ctx, PART_III_X, PART_III_TOP, 40, 22, { borderWidth: 0.8 });
  drawText(ctx, "Part III", PART_III_X + 4, PART_III_TOP + 7, { size: 8.5, bold: true });
  drawText(ctx, header.partIIITitle[0], PART_III_X + 46, PART_III_TOP + 3, {
    size: 8.5,
    bold: true,
  });
  drawText(ctx, header.partIIITitle[1], PART_III_X + 46, PART_III_TOP + 12, {
    size: 8.5,
    bold: true,
  });
}

/* A lettered Part I or Part II cell. */
export interface K1Cell {
  letter: string;
  /* The printed label; it wraps. An empty label puts the content at the top. */
  label: string;
  height: number;
  /* A value on the label's line, at the right ("Ogden, UT"). */
  inlineValue?: string;
  /* A check box at the right of the label ("Check if this is a publicly traded partnership"). */
  rightCheck?: { checked?: boolean };
  /* Text lines under the label: a number, a name and an address. */
  lines?: string[];
  /* Check boxes in one row under the label. */
  checks?: Array<{ label: string; checked?: boolean }>;
  /* Rows with a label and values in columns (beginning, ending), right-aligned. */
  rows?: Array<{ label: string; values: string[] }>;
  columns?: string[];
}

export type K1LeftItem = K1Cell | { part: string; title: string };

const isBanner = (item: K1LeftItem): item is { part: string; title: string } => "part" in item;

const COLUMN_W = 82;
const CELL_RIGHT = X0 + LEFT_W - 6;
const columnRight = (count: number, index: number) => CELL_RIGHT - (count - 1 - index) * COLUMN_W;

function drawCellRows(ctx: Ctx, cell: K1Cell, yStart: number) {
  let yPos = yStart;
  const columns = cell.columns ?? [];
  columns.forEach((heading, i) =>
    drawTextRight(ctx, heading, columnRight(columns.length, i), yPos, { size: 6.5, bold: true }),
  );
  if (columns.length > 0) yPos += 10;
  for (const row of cell.rows ?? []) {
    drawText(ctx, row.label, X0 + 22, yPos, { size: 6.5 });
    row.values.forEach((value, i) => {
      if (value)
        drawTextRight(ctx, value, columnRight(row.values.length, i), yPos - 1, { size: 8.5 });
    });
    yPos += 11;
  }
}

/* Check boxes side by side; a long label wraps under itself. */
function drawCellChecks(ctx: Ctx, cell: K1Cell, yPos: number): number {
  const bottoms = (cell.checks ?? []).map((check, i) => {
    const xPos = X0 + 22 + i * 124;
    checkbox(ctx, xPos, yPos, check.checked);
    return drawWrapped(ctx, check.label, xPos + 10, yPos, 110, { size: 6.5, lineGap: 1.5 });
  });
  return bottoms.length > 0 ? Math.max(...bottoms) + 2 : yPos;
}

function drawCell(ctx: Ctx, cell: K1Cell, yTop: number) {
  drawBox(ctx, X0, yTop, LEFT_W, cell.height);
  drawText(ctx, cell.letter, X0 + 3, yTop + 3, { size: 7, bold: true });
  const labelWidth = LEFT_W - 26 - (cell.inlineValue !== undefined ? 60 : cell.rightCheck ? 16 : 0);
  let yPos = cell.label
    ? drawWrapped(ctx, cell.label, X0 + 22, yTop + 3, labelWidth, { size: 6.5, lineGap: 1.5 }) + 2
    : yTop + 3;
  if (cell.rightCheck) checkbox(ctx, X0 + LEFT_W - 12, yTop + 3, cell.rightCheck.checked);
  if (cell.inlineValue) drawTextRight(ctx, cell.inlineValue, CELL_RIGHT, yTop + 2, { size: 8.5 });
  for (const line of cell.lines ?? []) {
    drawText(ctx, line, X0 + 26, yPos, { size: 9 });
    yPos += 11;
  }
  drawCellRows(ctx, cell, drawCellChecks(ctx, cell, yPos));
}

/* Parts I and II on the left, top to bottom; returns the bottom edge. */
export function drawLeftStack(ctx: Ctx, items: K1LeftItem[], yTop: number): number {
  let yPos = yTop;
  for (const item of items) {
    if (isBanner(item)) {
      partBanner(ctx, X0, yPos, LEFT_W, item.part, item.title);
      yPos += 16;
    } else {
      drawCell(ctx, item, yPos);
      yPos += item.height;
    }
  }
  return yPos;
}

/* One box of Part III: its number, label and how many rows of amounts it holds. */
export interface K1BoxSlot {
  box: string;
  label: string;
  rows: number;
  /* The box takes codes: each amount prints with its code in the number strip. */
  coded?: boolean;
  /* A check box (box 14 "Schedule K-3 is attached"), not an amount. */
  check?: boolean;
}

/* Part III: two columns of boxes, each column top to bottom. */
export type K1Grid = [K1BoxSlot[], K1BoxSlot[]];

const boxValue = (entry: K1Box): string =>
  entry.amount === undefined ? "* STMT" : k1Amount(entry.amount);

function drawSlot(
  ctx: Ctx,
  slot: K1BoxSlot,
  entries: K1Box[],
  xPos: number,
  yTop: number,
  checked?: boolean,
) {
  for (let row = 0; row < slot.rows; row += 1) {
    drawBox(ctx, xPos, yTop + row * BOX_ROW, STRIP, BOX_ROW);
    drawBox(ctx, xPos + STRIP, yTop + row * BOX_ROW, SUB_W - STRIP, BOX_ROW);
  }
  drawText(ctx, slot.box, xPos + 3, yTop + 3, { size: 7, bold: true });
  drawWrapped(ctx, slot.label, xPos + STRIP + 3, yTop + 3, SUB_W - STRIP - 6, {
    size: 6.3,
    lineGap: 1,
  });
  if (slot.check) checkbox(ctx, xPos + SUB_W - 12, yTop + 13, checked);
  entries.forEach((entry, row) => {
    const yPos = yTop + row * BOX_ROW + 12;
    if (entry.code) drawText(ctx, entry.code, xPos + 3, yPos, { size: 8.5, bold: true });
    drawTextRight(ctx, boxValue(entry), xPos + SUB_W - 5, yPos, { size: 9 });
  });
}

/* The fact's entries for one box, in the order printed; an entry with no slot or no room throws. */
function entriesFor(slot: K1BoxSlot, boxes: K1Box[]): K1Box[] {
  const entries = boxes.filter((entry) => entry.box === slot.box);
  if (entries.length > slot.rows) throw new Error(`Box ${slot.box} has more amounts than rows.`);
  if (!slot.coded && entries.some((entry) => entry.code)) {
    throw new Error(`Box ${slot.box} takes no code.`);
  }
  return entries;
}

/* Draws Part III with the fact's boxes; `checks` holds the check-box slots' values by box. */
export function drawPartIIIGrid(
  ctx: Ctx,
  grid: K1Grid,
  boxes: K1Box[],
  checks: Record<string, boolean | undefined> = {},
): number {
  const known = new Set(grid.flat().map((slot) => slot.box));
  const unknown = boxes.find((entry) => !known.has(entry.box));
  if (unknown) throw new Error(`Box ${unknown.box} is not on this K-1.`);
  const bottoms = grid.map((column, col) => {
    let yPos = GRID_TOP;
    for (const slot of column) {
      const xPos = PART_III_X + col * SUB_W;
      drawSlot(ctx, slot, entriesFor(slot, boxes), xPos, yPos, checks[slot.box]);
      yPos += slot.rows * BOX_ROW;
    }
    return yPos;
  });
  return Math.max(...bottoms);
}

/* The "more than one activity" check boxes under the grid (boxes 18 and 19, or 22 and 23). */
export function drawActivityChecks(
  ctx: Ctx,
  yTop: number,
  rows: Array<{ box: string; label: string; checked?: boolean }>,
): number {
  let yPos = yTop;
  for (const row of rows) {
    drawBox(ctx, PART_III_X, yPos, PART_III_W, 14);
    drawText(ctx, row.box, PART_III_X + 3, yPos + 4, { size: 7, bold: true });
    checkbox(ctx, PART_III_X + 22, yPos + 3.5, row.checked);
    drawText(ctx, row.label, PART_III_X + 34, yPos + 4, { size: 7 });
    yPos += 14;
  }
  drawText(ctx, "* See attached statement for additional information.", PART_III_X + 22, yPos + 5, {
    size: 7.5,
  });
  return yPos + 16;
}

export function drawK1Footer(ctx: Ctx, form: string, year: number, catalog: string) {
  const text = `For Paperwork Reduction Act Notice, see the Instructions for Form ${form}.`;
  drawText(ctx, text, X0, 760, { size: 6.5, bold: true });
  drawText(ctx, `Cat. No. ${catalog}`, 360, 760, { size: 6.5 });
  drawTextRight(ctx, `Schedule K-1 (Form ${form}) ${year}`, X_END, 760, { size: 6.5, bold: true });
}

/* The rows a section 199A statement prints: only the values the statement holds. */
export function section199ARows(statement: Section199AStatement): Array<[string, string]> {
  const rows: Array<[string, string | undefined]> = [
    ["Trade or business", statement.businessName],
    [
      "Specified service trade or business (SSTB)",
      statement.specifiedService === undefined
        ? undefined
        : statement.specifiedService
          ? "Yes"
          : "No",
    ],
    ["Qualified business income (loss)", amountOrUndefined(statement.qualifiedBusinessIncome)],
    ["W-2 wages", amountOrUndefined(statement.w2Wages)],
    [
      "Unadjusted basis immediately after acquisition (UBIA) of qualified property",
      amountOrUndefined(statement.qualifiedPropertyUbia),
    ],
    ["Section 199A dividends", amountOrUndefined(statement.section199ADividends)],
    [
      "Qualified publicly traded partnership (PTP) income",
      amountOrUndefined(statement.qualifiedPtpIncome),
    ],
  ];
  return rows.filter((row): row is [string, string] => row[1] !== undefined);
}

function amountOrUndefined(amount: number | undefined): string | undefined {
  return amount === undefined ? undefined : k1Amount(amount);
}

export interface K1Statement {
  heading: string; // "Schedule K-1 (Form 1120-S), Box 17, Code V"
  title: string; // "Statement A—QBI Pass-Through Entity Reporting"
  entity: { name: string; ein: string };
  owner: { name: string; tin: string };
  rows: Array<[string, string]>;
}

function statementParties(ctx: Ctx, statement: K1Statement, yTop: number): number {
  const pairs: Array<[string, string]> = [
    ["Name of entity", statement.entity.name],
    ["Employer identification number", statement.entity.ein],
    ["Name of owner", statement.owner.name],
    ["Identifying number of owner", statement.owner.tin],
  ];
  pairs.forEach(([label, value], i) => {
    drawText(ctx, label, X0, yTop + i * 14, { size: 8 });
    drawText(ctx, value, X0 + 170, yTop + i * 14, { size: 8.5, bold: true });
  });
  return yTop + pairs.length * 14 + 10;
}

/* An attached statement on a page of its own. */
export function drawStatementPage(ctx: Ctx, statement: K1Statement, year: number) {
  drawText(ctx, `${year} ${statement.heading}`, X0, 40, { size: 11, bold: true });
  drawText(ctx, statement.title, X0, 56, { size: 10, bold: true });
  let yPos = statementParties(ctx, statement, 80);
  drawBox(ctx, X0, yPos, X_END - X0, 16, { borderWidth: 0.8 });
  drawText(ctx, "Description", X0 + 6, yPos + 4, { size: 8, bold: true });
  drawTextRight(ctx, "Amount", X_END - 6, yPos + 4, { size: 8, bold: true });
  yPos += 16;
  for (const [label, value] of statement.rows) {
    drawBox(ctx, X0, yPos, X_END - X0, 18);
    drawText(ctx, label, X0 + 6, yPos + 5, { size: 8.5 });
    drawTextRight(ctx, value, X_END - 6, yPos + 5, { size: 9 });
    yPos += 18;
  }
}
