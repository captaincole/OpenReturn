/*
 * Form 1097-BTC, Bond Tax Credit, Copy B For Recipient. The box numbers,
 * labels and places follow the official form, Rev. April 2025:
 * https://www.irs.gov/pub/irs-pdf/f1097btc.pdf
 * Left column: the Form 1097-BTC issuer, the two TINs, the recipient, and the
 * "Form 1097-BTC issuer is" checkboxes. Right column: box 1, boxes 2a and 2b,
 * box 3 (box 4 is shaded, reserved), boxes 5a to 5l two by two, box 6. It
 * prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { BondTaxCreditStatementBoxes } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface Form1097BtcParties {
  filerStreet: string;
  filerCityStateZip: string;
  filerPhone: string;
  recipientName: string;
  /* The recipient's TIN as the statement prints it (the last four digits may show). */
  recipientTin: string;
  recipientStreet: string;
  recipientCityStateZip: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_SPLIT = 400;
const X_END = 500;
const Y_TOP = 40;
const ROW = 24;
const LABEL = { size: 6.5, lineGap: 1 };
const VALUE = { size: 9 };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_LETTERS = "abcdefghijkl";

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, height: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, height);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

const money = (amount: number | undefined) =>
  amount === undefined ? "$" : `$ ${fmtMoney(amount)}`;

/* Box 1, boxes 2a and 2b, box 3 and the shaded box 4. Returns the y below them. */
function drawTopBoxes(ctx: Ctx, form: BondTaxCreditStatementBoxes): number {
  cell(ctx, X_MID, Y_TOP, X_SPLIT, ROW, "1 Total");
  drawTextRight(ctx, money(form.box1Total), X_SPLIT - 6, Y_TOP + 14, VALUE);
  cell(ctx, X_MID, Y_TOP + ROW, X_SPLIT, ROW, "2a Code");
  drawText(ctx, form.box2aCode ?? "", X_MID + 6, Y_TOP + ROW + 13, VALUE);
  cell(ctx, X_SPLIT, Y_TOP, X_END, ROW * 2, "OMB No. 1545-2197");
  drawText(ctx, "Form 1097-BTC", X_SPLIT + 4, Y_TOP + 14, { size: 8, bold: true });
  drawText(ctx, "(Rev. April 2025)", X_SPLIT + 4, Y_TOP + 25, { size: 6.5 });
  drawText(ctx, "For calendar year 2025", X_SPLIT + 4, Y_TOP + 36, { size: 6.5 });
  const y2b = Y_TOP + ROW * 2;
  cell(ctx, X_MID, y2b, X_END, ROW, "2b Unique identifier");
  drawText(ctx, form.box2bUniqueIdentifier ?? "", X_MID + 6, y2b + 13, VALUE);
  const y3 = y2b + ROW;
  cell(ctx, X_MID, y3, X_SPLIT, ROW, "3 Bond type");
  drawText(ctx, form.box3BondType, X_MID + 6, y3 + 13, VALUE);
  drawBox(ctx, X_SPLIT, y3, X_END - X_SPLIT, ROW, { fill: SHADE });
  drawText(ctx, "4", X_SPLIT + 3, y3 + 3, LABEL);
  return y3 + ROW;
}

/* Boxes 5a to 5l, two months on each row, then box 6. */
function drawMonths(ctx: Ctx, form: BondTaxCreditStatementBoxes, yStart: number) {
  MONTHS.forEach((month, index) => {
    const xPos = index % 2 === 0 ? X_MID : X_SPLIT;
    const xEnd = index % 2 === 0 ? X_SPLIT : X_END;
    const yPos = yStart + ((index - (index % 2)) / 2) * ROW;
    cell(ctx, xPos, yPos, xEnd, ROW, `5${MONTH_LETTERS[index]} ${month}`);
    drawTextRight(ctx, money(form.box5Monthly?.[index]), xEnd - 6, yPos + 14, VALUE);
  });
  const y6 = yStart + 6 * ROW;
  cell(ctx, X_MID, y6, X_END, ROW * 2, "6 Comments");
  drawWrapped(ctx, form.box6Comments ?? "", X_MID + 6, y6 + 12, X_END - X_MID - 12, { size: 7 });
}

/* The left column: the issuer, the TINs, the recipient and the issuer checkboxes. */
function drawParties(ctx: Ctx, form: BondTaxCreditStatementBoxes, parties: Form1097BtcParties) {
  const label =
    "FORM 1097-BTC ISSUER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.";
  cell(ctx, X_LEFT, Y_TOP, X_MID, 96, label);
  [form.filerName, parties.filerStreet, parties.filerCityStateZip, parties.filerPhone].forEach(
    (line, index) => drawText(ctx, line, X_LEFT + 6, Y_TOP + 26 + index * 12, VALUE),
  );
  const yTin = Y_TOP + 96;
  cell(ctx, X_LEFT, yTin, 168, ROW, "FORM 1097-BTC ISSUER’S TIN");
  drawText(ctx, form.filerTin ?? "", X_LEFT + 6, yTin + 13, VALUE);
  cell(ctx, 168, yTin, X_MID, ROW, "RECIPIENT’S TIN");
  drawText(ctx, parties.recipientTin, 174, yTin + 13, VALUE);
  const lines: Array<[string, string]> = [
    ["RECIPIENT’S name", parties.recipientName],
    ["Street address (including apt. no.)", parties.recipientStreet],
    [
      "City or town, state or province, country, and ZIP or foreign postal code",
      parties.recipientCityStateZip,
    ],
  ];
  lines.forEach(([text, value], index) => {
    const yPos = yTin + ROW + index * ROW;
    cell(ctx, X_LEFT, yPos, X_MID, ROW, text);
    drawText(ctx, value, X_LEFT + 6, yPos + 13, VALUE);
  });
  const yIssuer = yTin + ROW * 4;
  cell(ctx, X_LEFT, yIssuer, X_MID, 72, "Form 1097-BTC issuer is:");
  const mark = (checked: boolean) => (checked ? "[X]" : "[  ]");
  drawWrapped(
    ctx,
    `${mark(form.filerIsBondIssuer === true)} Issuer of bond or its agent filing current year Form 1097-BTC for credit being reported`,
    X_LEFT + 8,
    yIssuer + 16,
    X_MID - X_LEFT - 16,
    { size: 7 },
  );
  drawWrapped(
    ctx,
    `${mark(form.filerIsBondIssuer === false)} An entity or a person that received or should have received a current year Form 1097-BTC and is distributing part or all of that credit to others`,
    X_LEFT + 8,
    yIssuer + 40,
    X_MID - X_LEFT - 16,
    { size: 7 },
  );
}

function drawTitle(ctx: Ctx, yBottom: number) {
  drawText(ctx, "Bond Tax Credit — Copy B For Recipient", X_LEFT, yBottom + 12, {
    size: 10,
    bold: true,
  });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. If you are required to file a return, a negligence penalty or other sanction may be imposed on you if an amount of tax credit exceeding the amount reported on this form is claimed on your income tax return. (keep for your records) www.irs.gov/Form1097BTC. Department of the Treasury - Internal Revenue Service",
    X_LEFT,
    yBottom + 28,
    X_END - X_LEFT,
    { size: 7 },
  );
}

export async function form1097BtcPdf(
  form: BondTaxCreditStatementBoxes,
  parties: Form1097BtcParties,
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
  const yMonths = drawTopBoxes(ctx, form);
  drawMonths(ctx, form, yMonths);
  drawTitle(ctx, yMonths + 8 * ROW);
  return doc.save();
}
