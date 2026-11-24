/*
 * Form 1099-S, Proceeds From Real Estate Transactions, Copy B for Transferor.
 * The box numbers and labels follow the official form (Rev. January 2022, for
 * 2025): https://www.irs.gov/pub/irs-pdf/f1099s.pdf
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
  fileNumber?: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_END = 576;
const Y_TOP = 40;
const ROW = 30;
const LABEL = { size: 6.5, lineGap: 1 };

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

/* The boxes on the right, one to a row, in the official order. */
function boxRows(form: Form1099SFactValue): Array<[string, string]> {
  return [
    ["1 Date of closing", closingDate(form.box1)],
    ["2 Gross proceeds", money(form.box2)],
    [
      "4 Check here if the transferor received or will receive property or services as part of the consideration",
      checked(form.box4),
    ],
    [
      "5 Check here if the transferor is a foreign person (nonresident alien, foreign partnership, foreign estate, or foreign trust)",
      checked(form.box5),
    ],
    ["6 Buyer’s part of real estate tax", money(form.box6)],
  ];
}

function drawBoxes(ctx: Ctx, form: Form1099SFactValue) {
  boxRows(form).forEach(([label, text], index) => {
    const yPos = Y_TOP + index * ROW;
    cell(ctx, X_MID, yPos, X_END, ROW, label);
    drawTextRight(ctx, text, X_END - 6, yPos + 19, { size: 9 });
  });
  const yAddress = Y_TOP + 5 * ROW;
  cell(
    ctx,
    X_MID,
    yAddress,
    X_END,
    60,
    "3 Address (including city, state, and ZIP code) or legal description",
  );
  drawWrapped(ctx, form.box3 ?? "", X_MID + 6, yAddress + 20, X_END - X_MID - 12, { size: 9 });
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
    drawText(ctx, line, X_LEFT + 6, Y_TOP + 28 + index * 12, { size: 9 }),
  );
  const yTin = Y_TOP + 90;
  cell(ctx, X_LEFT, yTin, 168, ROW, "FILER’S TIN");
  drawText(ctx, form.filerTin ?? "", X_LEFT + 6, yTin + 15, { size: 9 });
  cell(ctx, 168, yTin, X_MID, ROW, "TRANSFEROR’S TIN");
  drawText(ctx, parties.transferorTin, 174, yTin + 15, { size: 9 });
  const yName = yTin + ROW;
  cell(
    ctx,
    X_LEFT,
    yName,
    X_MID,
    60,
    "TRANSFEROR’S name, street address (including apt. no.), city or town, state, and ZIP",
  );
  [parties.transferorName, parties.transferorStreet, parties.transferorCityStateZip].forEach(
    (line, index) => drawText(ctx, line, X_LEFT + 6, yName + 20 + index * 12, { size: 9 }),
  );
  const yFile = yName + 60;
  cell(ctx, X_LEFT, yFile, X_MID, ROW, "Account or escrow number (see instructions)");
  drawText(ctx, parties.fileNumber ?? "", X_LEFT + 6, yFile + 15, { size: 9 });
}

function drawTitle(ctx: Ctx, taxYear: number) {
  const yBottom = Y_TOP + 7 * ROW + 8;
  drawText(ctx, `Form 1099-S (Rev. January 2022)   For calendar year ${taxYear}`, X_LEFT, yBottom, {
    size: 8,
    bold: true,
  });
  drawText(
    ctx,
    "Proceeds From Real Estate Transactions — Copy B For Transferor",
    X_LEFT,
    yBottom + 12,
    {
      size: 10,
      bold: true,
    },
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
