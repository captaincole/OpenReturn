/*
 * Form 8874-A (Rev. December 2011), Notice of Qualified Equity Investment for
 * New Markets Credit, as the CDE gives it to the investor, signed. The layout,
 * box numbers and labels follow the official form
 * (https://www.irs.gov/pub/irs-pdf/f8874a.pdf). It prints the boxes the
 * investment fact holds (Form8874ABoxes) and the signer the caller passes. It
 * works nothing out.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Form8874ABoxes } from "../../../src/facts/index.js";
import { ISODate, isoDate } from "../../../src/values.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawLine,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

/* What the CDE's official wrote that no fact holds. */
export interface Form8874ASigned {
  official: string;
  /* MM/DD/YYYY. */
  signedOn: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_END = 576;
const Y_TOP = 70;
const ROW_H = 36;
const CREDIT_ROW_H = 24;
const LABEL = { size: 7.5 };
const BOLD = { size: 7.5, bold: true };
const FILLED = { size: 9.5 };
const YEARS = ["a", "b", "c", "d", "e", "f", "g"];

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);

/* A numbered cell with its label at the top and its value below. */
function cell(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  xEnd: number,
  num: string,
  label: string,
  text = "",
) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, ROW_H);
  drawText(ctx, num, xPos + 4, yPos + 4, BOLD);
  drawWrapped(ctx, label, xPos + 18, yPos + 4, xEnd - xPos - 24, LABEL);
  drawText(ctx, text, xPos + 18, yPos + 22, FILLED);
}

function header(ctx: Ctx) {
  drawText(ctx, "Form", X_LEFT, 40, { size: 7 });
  drawText(ctx, "8874-A", X_LEFT + 18, 32, { size: 16, bold: true });
  drawText(ctx, "(Rev. December 2011)", X_LEFT, 50, { size: 6.5 });
  drawText(ctx, "Department of the Treasury", X_LEFT, 57, { size: 6 });
  drawText(ctx, "Internal Revenue Service", X_LEFT, 63, { size: 6 });
  drawText(ctx, "Notice of Qualified Equity Investment for", 200, 34, { size: 11, bold: true });
  drawText(ctx, "New Markets Credit", 250, 48, { size: 11, bold: true });
  drawText(ctx, "OMB No. 1545-2065", 495, 45, { size: 6.5 });
  drawLine(ctx, X_LEFT, Y_TOP, X_END, Y_TOP);
}

function partiesRows(ctx: Ctx, boxes: Form8874ABoxes) {
  const rows: Array<[string, string, string, string, string, string]> = [
    [
      "1",
      "Name of qualified community development entity (CDE)",
      boxes.box1CdeName,
      "2",
      "EIN of qualified CDE",
      boxes.box2CdeEin,
    ],
    [
      "3",
      "If applicable, name of parent taxpayer with whom CDE files a consolidated tax return",
      boxes.box3ParentName ?? "",
      "4",
      "If applicable, EIN of parent taxpayer with whom CDE files a consolidated tax return",
      boxes.box4ParentEin ?? "",
    ],
    [
      "5",
      "Name of taxpayer making qualified equity investment",
      boxes.box5InvestorName,
      "6",
      "TIN of taxpayer making qualified equity investment",
      boxes.box6InvestorTin,
    ],
    [
      "7",
      "Date of qualified equity investment (mm/dd/yyyy)",
      ISODate.usSlash(isoDate(boxes.box7InvestmentDate)),
      "8",
      "Amount of qualified equity investment",
      money(boxes.box8Amount),
    ],
  ];
  rows.forEach(([num1, label1, text1, num2, label2, text2], index) => {
    const yPos = Y_TOP + index * ROW_H;
    cell(ctx, X_LEFT, yPos, X_MID, num1, label1, text1);
    cell(ctx, X_MID, yPos, X_END, num2, label2, text2);
  });
}

/* Boxes 9 and 10a to 10g: one row each, the amount at the right of the left column. */
function creditRows(ctx: Ctx, boxes: Form8874ABoxes) {
  const top = Y_TOP + 4 * ROW_H;
  const rows: Array<[string, string, number | undefined]> = [
    ["9", "Total allowable credit", boxes.box9TotalAllowableCredit],
    ...YEARS.map((letter, index): [string, string, number | undefined] => [
      index === 0 ? "10a" : letter,
      `Allowable credit: Year ${index + 1}`,
      boxes.box10AllowableCredits?.[index],
    ]),
  ];
  rows.forEach(([num, label, amount], index) => {
    const yPos = top + index * CREDIT_ROW_H;
    drawBox(ctx, X_LEFT, yPos, X_MID - X_LEFT, CREDIT_ROW_H);
    drawTextRight(ctx, num, X_LEFT + 18, yPos + 8, BOLD);
    drawText(ctx, label, X_LEFT + 24, yPos + 8, LABEL);
    drawTextRight(ctx, money(amount), X_MID - 6, yPos + 8, FILLED);
  });
  drawBox(ctx, X_MID, top, X_END - X_MID, rows.length * CREDIT_ROW_H);
  return top + rows.length * CREDIT_ROW_H;
}

function signature(ctx: Ctx, yPos: number, signed: Form8874ASigned) {
  drawText(ctx, "Please", X_LEFT, yPos + 14, { size: 9, bold: true });
  drawText(ctx, "Sign", X_LEFT, yPos + 25, { size: 9, bold: true });
  drawText(ctx, "Here", X_LEFT, yPos + 36, { size: 9, bold: true });
  drawText(
    ctx,
    "Under penalties of perjury, I declare that the qualified equity investment identified above was received by the CDE identified above.",
    X_LEFT + 50,
    yPos + 4,
    { size: 6.5 },
  );
  drawText(ctx, signed.official, X_LEFT + 60, yPos + 20, { size: 11, italic: true });
  drawText(ctx, signed.signedOn, 470, yPos + 22, FILLED);
  drawLine(ctx, X_LEFT + 50, yPos + 34, X_END, yPos + 34);
  drawText(ctx, "Signature of authorized official of CDE", X_LEFT + 50, yPos + 37, { size: 6.5 });
  drawText(ctx, "Date", 470, yPos + 37, { size: 6.5 });
  drawText(ctx, signed.official, X_LEFT + 60, yPos + 50, FILLED);
  drawLine(ctx, X_LEFT + 50, yPos + 62, X_END, yPos + 62);
  drawText(ctx, "Type or print name", X_LEFT + 50, yPos + 65, { size: 6.5 });
  drawText(ctx, "For Paperwork Reduction Act Notice, see instructions.", X_LEFT, yPos + 82, BOLD);
  drawText(ctx, "Cat. No. 49311G", 300, yPos + 82, { size: 6.5 });
  drawTextRight(ctx, "Form 8874-A (Rev. 12-2011)", X_END, yPos + 82, BOLD);
}

export async function form8874APdf(
  boxes: Form8874ABoxes,
  signed: Form8874ASigned,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  header(ctx);
  partiesRows(ctx, boxes);
  const bottom = creditRows(ctx, boxes);
  signature(ctx, bottom + 6, signed);
  return doc.save();
}
