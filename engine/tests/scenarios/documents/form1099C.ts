/*
 * Form 1099-C, Cancellation of Debt, Copy B For Debtor. The box numbers,
 * labels and places follow the official form, Rev. April 2025:
 * https://www.irs.gov/pub/irs-pdf/f1099c.pdf
 * Left column: the creditor, the two TINs, the debtor, the account number.
 * Right column, top to bottom: boxes 1, 2 and 3, box 4, box 5, then boxes 6
 * and 7 side by side. It prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Form1099CFactValue } from "../../../src/facts/index.js";
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

export interface Form1099CParties {
  creditorStreet: string;
  creditorCityStateZip: string;
  creditorPhone: string;
  debtorName: string;
  debtorTin: string;
  debtorStreet: string;
  debtorCityStateZip: string;
  /* "Account number (see instructions)": the creditor's number for the debt. */
  accountNumber?: string;
}

const X_LEFT = 36;
const X_MID = 300;
const X_END = 576;
const Y_TOP = 40;
const LABEL = { size: 6.5, lineGap: 1 };
const VALUE = { size: 9 };

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, height: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, height);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);

/* MM/DD/YYYY from the fact's YYYY-MM-DD. */
function eventDate(date: string | undefined): string {
  if (date === undefined) return "";
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

/* Boxes 1–3, box 4 and box 5, then boxes 6 and 7. */
function drawBoxes(ctx: Ctx, form: Form1099CFactValue) {
  const rows: Array<[string, string, number]> = [
    ["1 Date of identifiable event", eventDate(form.box1), 30],
    ["2 Amount of debt discharged", money(form.box2), 30],
    ["3 Interest, if included in box 2", money(form.box3), 30],
  ];
  let yPos = Y_TOP;
  for (const [label, text, height] of rows) {
    cell(ctx, X_MID, yPos, X_END, height, label);
    drawTextRight(ctx, text, X_END - 6, yPos + height - 10, VALUE);
    yPos += height;
  }
  cell(ctx, X_MID, yPos, X_END, 60, "4 Debt description");
  drawWrapped(ctx, form.box4 ?? "", X_MID + 6, yPos + 16, X_END - X_MID - 12, VALUE);
  yPos += 60;
  cell(
    ctx,
    X_MID,
    yPos,
    X_END,
    30,
    "5 If checked, the debtor was personally liable for repayment of the debt",
  );
  drawTextRight(ctx, form.box5 ? "X" : "", X_END - 6, yPos + 20, VALUE);
  yPos += 30;
  const xSplit = 440;
  cell(ctx, X_MID, yPos, xSplit, 30, "6 Identifiable event code");
  drawText(ctx, form.box6 ?? "", X_MID + 6, yPos + 18, VALUE);
  cell(ctx, xSplit, yPos, X_END, 30, "7 Fair market value of property");
  drawTextRight(ctx, money(form.box7), X_END - 6, yPos + 20, VALUE);
}

/* The left column: creditor, TINs, debtor, account number. */
function drawParties(ctx: Ctx, form: Form1099CFactValue, parties: Form1099CParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_MID,
    90,
    "CREDITOR’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.",
  );
  [
    form.creditorName,
    parties.creditorStreet,
    parties.creditorCityStateZip,
    parties.creditorPhone,
  ].forEach((line, index) => drawText(ctx, line, X_LEFT + 6, Y_TOP + 26 + index * 12, VALUE));
  const yTin = Y_TOP + 90;
  cell(ctx, X_LEFT, yTin, 168, 30, "CREDITOR’S TIN");
  drawText(ctx, form.creditorTin ?? "", X_LEFT + 6, yTin + 16, VALUE);
  cell(ctx, 168, yTin, X_MID, 30, "DEBTOR’S TIN");
  drawText(ctx, parties.debtorTin, 174, yTin + 16, VALUE);
  const parts: Array<[string, string]> = [
    ["DEBTOR’S name", parties.debtorName],
    ["Street address (including apt. no.)", parties.debtorStreet],
    [
      "City or town, state or province, country, and ZIP or foreign postal code",
      parties.debtorCityStateZip,
    ],
    ["Account number (see instructions)", parties.accountNumber ?? ""],
  ];
  parts.forEach(([label, line], index) => {
    const yPos = yTin + 30 + index * 30;
    cell(ctx, X_LEFT, yPos, X_MID, 30, label);
    drawText(ctx, line, X_LEFT + 6, yPos + 17, VALUE);
  });
}

function drawTitle(ctx: Ctx, taxYear: number) {
  const yBottom = Y_TOP + 240 + 10;
  drawText(
    ctx,
    `Form 1099-C (Rev. April 2025)   For calendar year ${taxYear}   OMB No. 1545-1424`,
    X_LEFT,
    yBottom,
    {
      size: 8,
      bold: true,
    },
  );
  drawText(ctx, "Cancellation of Debt — Copy B For Debtor", X_LEFT, yBottom + 12, {
    size: 10,
    bold: true,
  });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. If you are required to file a return, a negligence penalty or other sanction may be imposed on you if taxable income results from this transaction and the IRS determines that it has not been reported. Department of the Treasury - Internal Revenue Service. www.irs.gov/Form1099C",
    X_LEFT,
    yBottom + 28,
    X_END - X_LEFT,
    { size: 7 },
  );
}

export async function form1099CPdf(
  form: Form1099CFactValue,
  parties: Form1099CParties,
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
