/*
 * Form 1099-SA, Distributions From an HSA, Archer MSA, or Medicare Advantage MSA, Copy B.
 * The layout, box numbers and labels follow the official form (Rev. April 2025):
 * https://www.irs.gov/pub/irs-pdf/f1099sa.pdf
 * The cell and checkbox parts here also draw Form 1099-LTC (form1099Ltc.ts).
 */

import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import type { HsaDistributionFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  wrapText,
  type Ctx,
} from "./draw.js";

export interface Form1099SAParties {
  payerStreet: string;
  payerCityStateZip: string;
  payerPhone: string;
  recipientName: string;
  recipientTin: string;
  recipientStreet: string;
  recipientCityStateZip: string;
}

/* Column edges, left to right, shared by the 1099-SA and the 1099-LTC. */
export const X_LEFT = 50;
export const X_TIN_SPLIT = 173;
export const X_BOXES = 295;
export const X_NAME_CELL = 396;
export const X_NAME_CELL_END = 468;
export const X_GRID_END = 497;
export const X_PAGE_END = 576;

/* Row edges, top to bottom. */
export const Y_TOP = 34;
export const Y_ROW_2 = 106;
export const Y_NAME = 131;
const Y_BOX_5 = 167;
export const Y_ACCOUNT = 216;
export const Y_END = 239;

const LABEL = { size: 6.5, lineGap: 1 };
export const GRAY = rgb(0.75, 0.75, 0.75);

/* A cell with its label at the top left. A box number in the label prints as on the form. */
export function cell(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  xEnd: number,
  yEnd: number,
  label: string,
) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, xEnd - xPos - 8, LABEL);
}

export const grayCell = (ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number) =>
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos, { fill: GRAY });

export const value = (ctx: Ctx, text: string, xPos: number, yPos: number) =>
  drawText(ctx, text, xPos + 8, yPos, { size: 9 });

/* A money box: "$" at the bottom left as on the form, then the amount; blank when the fact has none. */
export function moneyValue(ctx: Ctx, amount: number | undefined, xPos: number, yBottom: number) {
  drawText(ctx, "$", xPos + 4, yBottom - 10, { size: 8 });
  if (amount !== undefined) value(ctx, fmtMoney(amount), xPos + 4, yBottom - 11);
}

export function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean) {
  drawBox(ctx, xPos, yPos, 8, 8);
  if (checked) drawText(ctx, "X", xPos + 1.5, yPos + 0.5, { size: 8, bold: true });
}

/* The name, street and city lines of one party, in the cell's two labeled rows. */
export function drawNameAndAddress(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  lines: { name: string; street: string; cityStateZip: string },
) {
  value(ctx, lines.name, xPos, yPos + 14);
  drawText(ctx, "Street address (including apt. no.)", xPos + 4, yPos + 37, LABEL);
  value(ctx, lines.street, xPos, yPos + 46);
  drawText(
    ctx,
    "City or town, state or province, country, and ZIP or foreign postal code",
    xPos + 4,
    yPos + 62,
    LABEL,
  );
  value(ctx, lines.cityStateZip, xPos, yPos + 71);
}

/* Lines of text that end at the page's right edge, as in the form's right column. */
export function drawRightLines(
  ctx: Ctx,
  lines: string[],
  yPos: number,
  opts: { size: number; bold?: boolean },
) {
  lines.forEach((line, index) =>
    drawTextRight(ctx, line, X_PAGE_END, yPos + index * (opts.size + 1.5), opts),
  );
}

export function drawRightNotice(ctx: Ctx, notice: string, yPos: number) {
  const size = 6.5;
  drawRightLines(ctx, wrapText(ctx.reg, notice, X_PAGE_END - X_GRID_END - 6, size), yPos, {
    size,
  });
}

/* The OMB number, form number, revision and calendar year, in the cell left of the title. */
export function drawFormName(ctx: Ctx, form: { omb: string; number: string; year: number }) {
  drawBox(ctx, X_NAME_CELL, Y_TOP, X_NAME_CELL_END - X_NAME_CELL, Y_ROW_2 - Y_TOP);
  drawText(ctx, form.omb, X_NAME_CELL + 4, Y_TOP + 4, { size: 6.5 });
  drawText(ctx, "Form", X_NAME_CELL + 4, Y_TOP + 26, { size: 6.5 });
  drawText(ctx, form.number, X_NAME_CELL + 21, Y_TOP + 21, { size: 11, bold: true });
  drawText(ctx, "(Rev. April 2025)", X_NAME_CELL + 13, Y_TOP + 38, { size: 6.5 });
  const yYear = Y_TOP + 48;
  drawBox(ctx, X_NAME_CELL, yYear, X_NAME_CELL_END - X_NAME_CELL, Y_ROW_2 - yYear);
  drawText(ctx, "For calendar year", X_NAME_CELL + 9, yYear + 3, { size: 6.5 });
  drawText(ctx, String(form.year), X_NAME_CELL + 24, yYear + 12, { size: 10, bold: true });
}

/* The CORRECTED box above the grid and the footer line under it. */
export function drawEdges(ctx: Ctx, form: { number: string; url: string }) {
  drawBox(ctx, 245, Y_TOP - 11, 9, 9);
  drawText(ctx, "CORRECTED (if checked)", 259, Y_TOP - 10, { size: 9 });
  const yFooter = Y_END + 4;
  drawText(ctx, "Form", X_LEFT, yFooter + 2, { size: 6.5 });
  drawText(ctx, form.number, X_LEFT + 18, yFooter, { size: 9, bold: true });
  drawText(
    ctx,
    "(Rev. 4-2025)",
    X_LEFT + 18 + ctx.bold.widthOfTextAtSize(form.number, 9) + 3,
    yFooter + 2,
    {
      size: 6.5,
    },
  );
  drawText(ctx, "(keep for your records)", 183, yFooter + 1, { size: 7.5 });
  drawText(ctx, form.url, 302, yFooter + 2, { size: 6.5 });
  drawTextRight(
    ctx,
    "Department of the Treasury - Internal Revenue Service",
    X_PAGE_END,
    yFooter + 2,
    { size: 6.5 },
  );
}

export async function newFormPage(): Promise<{ doc: PDFDocument; ctx: Ctx }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  return { doc, ctx };
}

function drawParties(ctx: Ctx, sa: HsaDistributionFactValue, parties: Form1099SAParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_BOXES,
    Y_ROW_2,
    "TRUSTEE’S/PAYER’S name, street address, city or town, state or province, country, ZIP " +
      "or foreign postal code, and telephone number",
  );
  [sa.payerName, parties.payerStreet, parties.payerCityStateZip, parties.payerPhone].forEach(
    (line, index) => value(ctx, line, X_LEFT, Y_TOP + 26 + index * 11),
  );
  cell(ctx, X_LEFT, Y_ROW_2, X_TIN_SPLIT, Y_NAME, "PAYER’S TIN");
  value(ctx, sa.payerTin ?? "", X_LEFT, Y_ROW_2 + 13);
  cell(ctx, X_TIN_SPLIT, Y_ROW_2, X_BOXES, Y_NAME, "RECIPIENT’S TIN");
  value(ctx, parties.recipientTin, X_TIN_SPLIT, Y_ROW_2 + 13);
  cell(ctx, X_LEFT, Y_NAME, X_BOXES, Y_ACCOUNT, "RECIPIENT’S name");
  drawNameAndAddress(ctx, X_LEFT, Y_NAME, {
    name: parties.recipientName,
    street: parties.recipientStreet,
    cityStateZip: parties.recipientCityStateZip,
  });
  cell(ctx, X_LEFT, Y_ACCOUNT, X_BOXES, Y_END, "Account number (see instructions)");
}

const ACCOUNT_TYPES: HsaDistributionFactValue["box5"][] = ["HSA", "Archer MSA", "MA MSA"];

function drawBoxes(ctx: Ctx, sa: HsaDistributionFactValue) {
  grayCell(ctx, X_BOXES, Y_TOP, X_NAME_CELL, Y_ROW_2);
  cell(ctx, X_BOXES, Y_ROW_2, X_NAME_CELL, Y_NAME, "1 Gross distribution");
  moneyValue(ctx, sa.box1, X_BOXES, Y_NAME);
  cell(ctx, X_NAME_CELL, Y_ROW_2, X_GRID_END, Y_NAME, "2 Earnings on excess cont.");
  moneyValue(ctx, sa.box2, X_NAME_CELL, Y_NAME);
  cell(ctx, X_BOXES, Y_NAME, X_NAME_CELL, Y_BOX_5, "3 Distribution code");
  value(ctx, sa.box3, X_BOXES, Y_NAME + 20);
  cell(ctx, X_NAME_CELL, Y_NAME, X_GRID_END, Y_BOX_5, "4 FMV on date of death");
  moneyValue(ctx, sa.box4, X_NAME_CELL, Y_BOX_5);
  cell(ctx, X_BOXES, Y_BOX_5, X_NAME_CELL, Y_ACCOUNT, "5");
  ACCOUNT_TYPES.forEach((type, index) => {
    const yRow = Y_BOX_5 + 4 + index * 15;
    drawText(ctx, type, X_BOXES + 14, yRow + 1, { size: 6.5 });
    checkbox(ctx, X_BOXES + 52, yRow, sa.box5 === type);
  });
  grayCell(ctx, X_NAME_CELL, Y_BOX_5, X_GRID_END, Y_ACCOUNT);
  grayCell(ctx, X_BOXES, Y_ACCOUNT, X_GRID_END, Y_END);
}

function drawTitleAndCopy(ctx: Ctx) {
  drawRightLines(
    ctx,
    ["Distributions", "From an HSA,", "Archer MSA, or", "Medicare Advantage", "MSA"],
    Y_TOP + 10,
    { size: 9.5, bold: true },
  );
  drawRightLines(ctx, ["Copy B"], Y_ROW_2 + 2, { size: 9.5, bold: true });
  drawRightLines(ctx, ["For", "Recipient"], Y_ROW_2 + 15, { size: 8, bold: true });
  drawRightLines(ctx, ["This information", "is being furnished", "to the IRS."], Y_BOX_5 + 16, {
    size: 8,
  });
}

/* Prints only what the fact holds: a box the fact leaves out prints blank. */
export async function form1099SAPdf(
  sa: HsaDistributionFactValue,
  parties: Form1099SAParties,
  year: number,
): Promise<Uint8Array> {
  const { doc, ctx } = await newFormPage();
  drawParties(ctx, sa, parties);
  drawBoxes(ctx, sa);
  drawFormName(ctx, { omb: "OMB No. 1545-1517", number: "1099-SA", year });
  drawTitleAndCopy(ctx);
  drawEdges(ctx, { number: "1099-SA", url: "www.irs.gov/Form1099SA" });
  return doc.save();
}
