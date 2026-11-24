/*
 * Form 1099-S, Proceeds From Real Estate Transactions, Copy B for Transferor.
 * The box numbers, labels and places follow the official form for 2025, Rev.
 * January 2022: https://www.irs.gov/pub/irs-prior/f1099s--2022.pdf
 * (The current https://www.irs.gov/pub/irs-pdf/f1099s.pdf is Rev. December
 * 2026, for 2026 and later: it numbers gross proceeds 2a and moves the
 * buyer's real estate tax to box 4.)
 * Left column: the filer, the two TINs, the transferor, the account number.
 * Right column, top to bottom: boxes 1 and 2, box 3, boxes 4 and 5, box 6.
 * It prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Form1099SFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface Form1099SParties {
  filerStreet: string;
  filerCityStateZip: string;
  transferorName: string;
  transferorTin: string;
  transferorStreet: string;
  transferorCityStateZip: string;
  /* "Account number (see instructions)": the filer's number for the closing. */
  fileNumber?: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_END = 576;
const Y_TOP = 40;
const ROW = 30;
const LABEL = { size: 6.5, lineGap: 1 };
const VALUE = { size: 9 };

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, height: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, height);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);
const checked = (box: boolean | undefined) => (box ? "X" : "");

/* MM/DD/YYYY from the fact's YYYY-MM-DD. */
function closingDate(date: string | undefined): string {
  if (date === undefined) return "";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

/* The boxes on the right, in the official order, with each box's height. */
function boxRows(form: Form1099SFactValue): Array<[string, string, number]> {
  return [
    ["1 Date of closing", closingDate(form.box1), 45],
    ["2 Gross proceeds", money(form.box2), 45],
    ["3 Address (including city, state, and ZIP code) or legal description", "", 50],
    [
      "4 Transferor received or will receive property or services as part of the consideration (if checked)",
      checked(form.box4),
      30,
    ],
    [
      "5 If checked, transferor is a foreign person (nonresident alien, foreign partnership, foreign estate, or foreign trust)",
      checked(form.box5),
      40,
    ],
    ["6 Buyer’s part of real estate tax", money(form.box6), 30],
  ];
}

function drawBoxes(ctx: Ctx, form: Form1099SFactValue) {
  let yPos = Y_TOP;
  for (const [label, text, height] of boxRows(form)) {
    cell(ctx, X_MID, yPos, X_END, height, label);
    drawTextRight(ctx, text, X_END - 6, yPos + height - 11, VALUE);
    if (label.startsWith("3 ")) {
      drawWrapped(ctx, form.box3 ?? "", X_MID + 6, yPos + 20, X_END - X_MID - 12, VALUE);
    }
    yPos += height;
  }
}

/* The transferor's box: three labels, each with its line, as on the official form. */
function drawTransferor(ctx: Ctx, yPos: number, parties: Form1099SParties) {
  drawBox(ctx, X_LEFT, yPos, X_MID - X_LEFT, 90);
  const parts: Array<[string, string]> = [
    ["TRANSFEROR’S name", parties.transferorName],
    ["Street address (including apt. no.)", parties.transferorStreet],
    [
      "City or town, state or province, country, and ZIP or foreign postal code",
      parties.transferorCityStateZip,
    ],
  ];
  parts.forEach(([label, line], index) => {
    const yLabel = yPos + 3 + index * 29;
    drawWrapped(ctx, label, X_LEFT + 3, yLabel, X_MID - X_LEFT - 6, LABEL);
    drawText(ctx, line, X_LEFT + 6, yLabel + 14, VALUE);
  });
}

function drawParties(ctx: Ctx, form: Form1099SFactValue, parties: Form1099SParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_MID,
    90,
    "FILER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone number",
  );
  [form.filerName, parties.filerStreet, parties.filerCityStateZip].forEach((line, index) =>
    drawText(ctx, line, X_LEFT + 6, Y_TOP + 28 + index * 12, VALUE),
  );
  const yTin = Y_TOP + 90;
  cell(ctx, X_LEFT, yTin, 168, ROW, "FILER’S TIN");
  drawText(ctx, form.filerTin ?? "", X_LEFT + 6, yTin + 15, VALUE);
  cell(ctx, 168, yTin, X_MID, ROW, "TRANSFEROR’S TIN");
  drawText(ctx, parties.transferorTin, 174, yTin + 15, VALUE);
  const yName = yTin + ROW;
  drawTransferor(ctx, yName, parties);
  const yAccount = yName + 90;
  cell(ctx, X_LEFT, yAccount, X_MID, ROW, "Account number (see instructions)");
  drawText(ctx, parties.fileNumber ?? "", X_LEFT + 6, yAccount + 15, VALUE);
}

function drawTitle(ctx: Ctx, taxYear: number) {
  const yBottom = Y_TOP + 240 + 8;
  drawText(ctx, `Form 1099-S (Rev. January 2022)   For calendar year ${taxYear}`, X_LEFT, yBottom, {
    size: 8,
    bold: true,
  });
  drawText(
    ctx,
    "Proceeds From Real Estate Transactions — Copy B For Transferor",
    X_LEFT,
    yBottom + 12,
    { size: 10, bold: true },
  );
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. Department of the Treasury - Internal Revenue Service. www.irs.gov/Form1099S",
    X_LEFT,
    yBottom + 28,
    X_END - X_LEFT,
    { size: 7 },
  );
}

export async function form1099SPdf(
  form: Form1099SFactValue,
  parties: Form1099SParties,
  taxYear: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawParties(ctx, form, parties);
  drawBoxes(ctx, form);
  drawTitle(ctx, taxYear);
  return doc.save();
}
