/*
 * Form 1099-INT, Interest Income, Copy B for Recipient. The box numbers and
 * labels follow the official form (Rev. January 2024, for 2025):
 * https://www.irs.gov/pub/irs-pdf/f1099int.pdf
 * It prints only the values the fact holds. The layout follows form1099Div.ts.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { InterestFactValue } from "../../../src/facts/index.js";
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

export interface Form1099IntParties {
  payerStreet: string;
  payerCityStateZip: string;
  recipientName: string;
  recipientTin: string;
  recipientStreet: string;
  recipientCityStateZip: string;
  accountNumber?: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_SPLIT = 438;
const X_END = 576;
const Y_TOP = 40;
const ROW = 30;
const LABEL = { size: 6.5, lineGap: 1 };

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, height: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, height);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);

/* The boxes, two to a row, in the official order. Box 14 (CUSIP) has no field: it prints blank. */
function boxRows(form: InterestFactValue): Array<Array<[string, string]>> {
  return [
    [
      ["1 Interest income", money(form.box1)],
      ["2 Early withdrawal penalty", money(form.box2)],
    ],
    [
      ["3 Interest on U.S. Savings Bonds and Treasury obligations", money(form.box3)],
      ["4 Federal income tax withheld", money(form.box4)],
    ],
    [
      ["5 Investment expenses", money(form.box5)],
      ["6 Foreign tax paid", money(form.box6)],
    ],
    [
      ["7 Foreign country or U.S. territory", form.box7 ?? ""],
      ["8 Tax-exempt interest", money(form.box8)],
    ],
    [
      ["9 Specified private activity bond interest", money(form.box9)],
      ["10 Market discount", money(form.box10)],
    ],
    [
      ["11 Bond premium", money(form.box11)],
      ["12 Bond premium on Treasury obligations", money(form.box12)],
    ],
    [
      ["13 Bond premium on tax-exempt bond", money(form.box13)],
      ["14 Tax-exempt and tax credit bond CUSIP no.", ""],
    ],
    [
      ["15 State", form.box15 ?? ""],
      ["16 State identification no.", form.box16 ?? ""],
    ],
    [["17 State tax withheld", money(form.box17)]],
  ];
}

function drawBoxes(ctx: Ctx, form: InterestFactValue) {
  boxRows(form).forEach((row, index) => {
    const yPos = Y_TOP + index * ROW;
    row.forEach(([label, text], column) => {
      const xPos = column === 0 ? X_MID : X_SPLIT;
      const xEnd = column === 0 ? X_SPLIT : X_END;
      cell(ctx, xPos, yPos, xEnd, ROW, label);
      drawTextRight(ctx, text, xEnd - 6, yPos + 17, { size: 9 });
    });
  });
}

function drawParties(ctx: Ctx, form: InterestFactValue, parties: Form1099IntParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_MID,
    90,
    "PAYER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.",
  );
  [form.payerName, parties.payerStreet, parties.payerCityStateZip].forEach((line, index) =>
    drawText(ctx, line, X_LEFT + 6, Y_TOP + 28 + index * 12, { size: 9 }),
  );
  const yTin = Y_TOP + 90;
  cell(ctx, X_LEFT, yTin, 168, ROW, "PAYER’S TIN");
  drawText(ctx, form.payerTin ?? "", X_LEFT + 6, yTin + 15, { size: 9 });
  cell(ctx, 168, yTin, X_MID, ROW, "RECIPIENT’S TIN");
  drawText(ctx, parties.recipientTin, 174, yTin + 15, { size: 9 });
  const yName = yTin + ROW;
  cell(
    ctx,
    X_LEFT,
    yName,
    X_MID,
    60,
    "RECIPIENT’S name, street address (including apt. no.), city or town, state, and ZIP",
  );
  [parties.recipientName, parties.recipientStreet, parties.recipientCityStateZip].forEach(
    (line, index) => drawText(ctx, line, X_LEFT + 6, yName + 20 + index * 12, { size: 9 }),
  );
  const yAccount = yName + 60;
  cell(ctx, X_LEFT, yAccount, X_MID, ROW, "Account number (see instructions)");
  drawText(ctx, parties.accountNumber ?? "", X_LEFT + 6, yAccount + 15, { size: 9 });
}

function drawTitle(ctx: Ctx, taxYear: number) {
  const yBottom = Y_TOP + 9 * ROW + 8;
  drawText(
    ctx,
    `Form 1099-INT (Rev. January 2024)   For calendar year ${taxYear}`,
    X_LEFT,
    yBottom,
    { size: 8, bold: true },
  );
  drawText(ctx, "Interest Income — Copy B For Recipient", X_LEFT, yBottom + 12, {
    size: 10,
    bold: true,
  });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. Department of the Treasury - Internal Revenue Service. www.irs.gov/Form1099INT",
    X_LEFT,
    yBottom + 28,
    X_END - X_LEFT,
    { size: 7 },
  );
}

export async function form1099IntPdf(
  form: InterestFactValue,
  parties: Form1099IntParties,
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
