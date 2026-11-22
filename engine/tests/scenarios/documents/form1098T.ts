/*
 * Form 1098-T, Tuition Statement, Copy B for Student. The layout, box numbers
 * and labels follow the official form (Rev. December 2024, for 2025):
 * https://www.irs.gov/pub/irs-pdf/f1098t.pdf
 * It prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Form1098TFactValue } from "../../../src/facts/index.js";
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

export interface Form1098TParties {
  studentStreet: string;
  studentCityStateZip: string;
  /* The service provider/acct. no. the institution prints; optional. */
  accountNumber?: string;
}

const X_LEFT = 40;
const X_MID = 290;
const X_BOX_SPLIT = 400;
const X_RIGHT = 500;
const X_END = 576;

const Y_TOP = 40;
const Y_ROW_2 = 112;
const Y_ROW_3 = 136;
const Y_ROW_4 = 184;
const Y_ROW_5 = 208;
const Y_ROW_6 = 232;
const Y_END = 256;

const LABEL = { size: 6.5, lineGap: 1 };

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, xEnd - xPos - 8, LABEL);
}

const value = (ctx: Ctx, text: string, xPos: number, yPos: number) =>
  drawText(ctx, text, xPos + 8, yPos, { size: 9 });

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);

function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean | undefined) {
  drawBox(ctx, xPos, yPos, 8, 8);
  if (checked === true) drawText(ctx, "X", xPos + 1.5, yPos + 0.5, { size: 8, bold: true });
}

function drawParties(ctx: Ctx, form: Form1098TFactValue, parties: Form1098TParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_MID,
    Y_ROW_2,
    "FILER’S name, street address, city or town, state or province, country, ZIP or foreign " +
      "postal code, and telephone number",
  );
  const address = form.filerAddress;
  const lines = [
    form.filerName,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zip}`,
  ].filter((line): line is string => line !== undefined && line !== "");
  lines.forEach((line, index) => value(ctx, line, X_LEFT, Y_TOP + 26 + index * 11));
  const xTin = X_LEFT + 125;
  cell(ctx, X_LEFT, Y_ROW_2, xTin, Y_ROW_3, "FILER’S employer identification no.");
  value(ctx, form.filerEin, X_LEFT, Y_ROW_2 + 13);
  cell(ctx, xTin, Y_ROW_2, X_MID, Y_ROW_3, "STUDENT’S TIN");
  value(ctx, form.studentTin ?? "", xTin, Y_ROW_2 + 13);
  cell(ctx, X_LEFT, Y_ROW_3, X_MID, Y_ROW_4, "STUDENT’S name");
  value(ctx, form.studentName, X_LEFT, Y_ROW_3 + 13);
  drawText(ctx, "Street address (including apt. no.)", X_LEFT + 4, Y_ROW_3 + 27, LABEL);
  value(ctx, parties.studentStreet, X_LEFT, Y_ROW_3 + 36);
  cell(ctx, X_LEFT, Y_ROW_4, X_MID, Y_ROW_5, "City or town, state or province, country, and ZIP");
  value(ctx, parties.studentCityStateZip, X_LEFT, Y_ROW_4 + 13);
  cell(ctx, X_LEFT, Y_ROW_5, X_MID, Y_ROW_6, "Service Provider/Acct. No. (see instr.)");
  value(ctx, parties.accountNumber ?? "", X_LEFT, Y_ROW_5 + 13);
  cell(ctx, X_LEFT, Y_ROW_6, X_MID, Y_END, "");
}

/* Rows of the amount boxes, top to bottom: boxes 4 and 5, 6 and 7, then 8, 9 and 10. */
const Y_BOX_4 = Y_ROW_3;
const Y_BOX_6 = 166;
const Y_BOX_8 = 210;

function drawAmountBoxes(ctx: Ctx, form: Form1098TFactValue) {
  cell(
    ctx,
    X_MID,
    Y_TOP,
    X_BOX_SPLIT,
    Y_ROW_2 - 36,
    "1 Payments received for qualified tuition and related expenses",
  );
  value(ctx, money(form.box1), X_MID, Y_TOP + 24);
  cell(ctx, X_MID, Y_ROW_2 - 36, X_BOX_SPLIT, Y_ROW_2, "2 Reserved");
  cell(ctx, X_MID, Y_ROW_2, X_BOX_SPLIT, Y_ROW_3, "3 Reserved");
  cell(ctx, X_MID, Y_BOX_4, X_BOX_SPLIT, Y_BOX_6, "4 Adjustments made for a prior year");
  value(ctx, money(form.box4), X_MID, Y_BOX_4 + 18);
  cell(ctx, X_BOX_SPLIT, Y_BOX_4, X_RIGHT, Y_BOX_6, "5 Scholarships or grants");
  value(ctx, money(form.box5), X_BOX_SPLIT, Y_BOX_4 + 18);
  cell(
    ctx,
    X_MID,
    Y_BOX_6,
    X_BOX_SPLIT,
    Y_BOX_8,
    "6 Adjustments to scholarships or grants for a prior year",
  );
  value(ctx, money(form.box6), X_MID, Y_BOX_6 + 28);
  cell(
    ctx,
    X_BOX_SPLIT,
    Y_BOX_6,
    X_RIGHT - 14,
    Y_BOX_8,
    "7 Checked if the amount in box 1 includes amounts for an academic period beginning January–March 2026",
  );
  drawBox(ctx, X_RIGHT - 14, Y_BOX_6, 14, Y_BOX_8 - Y_BOX_6);
  checkbox(ctx, X_RIGHT - 11, Y_BOX_6 + 30, form.box7);
  cell(ctx, X_MID, Y_BOX_8, X_BOX_SPLIT - 40, Y_END, "8 Check if at least half-time student");
  checkbox(ctx, X_BOX_SPLIT - 54, Y_BOX_8 + 26, form.box8);
  cell(ctx, X_BOX_SPLIT - 40, Y_BOX_8, X_BOX_SPLIT + 30, Y_END, "9 Check if a graduate student");
  checkbox(ctx, X_BOX_SPLIT + 16, Y_BOX_8 + 26, form.box9);
  cell(ctx, X_BOX_SPLIT + 30, Y_BOX_8, X_RIGHT, Y_END, "10 Ins. contract reimb./refund");
  value(ctx, money(form.box10), X_BOX_SPLIT + 26, Y_BOX_8 + 30);
}

function drawFormName(ctx: Ctx, taxYear: number) {
  drawBox(ctx, X_BOX_SPLIT, Y_TOP, X_RIGHT - X_BOX_SPLIT, Y_ROW_3 - Y_TOP);
  drawText(ctx, "OMB No. 1545-1574", X_BOX_SPLIT + 8, Y_TOP + 4, { size: 6.5 });
  drawText(ctx, String(taxYear), X_BOX_SPLIT + 30, Y_TOP + 20, { size: 16, bold: true });
  drawText(ctx, "Form 1098-T", X_BOX_SPLIT + 22, Y_TOP + 48, { size: 11, bold: true });
  drawText(ctx, "Tuition", X_RIGHT + 8, Y_TOP + 20, { size: 12, bold: true });
  drawText(ctx, "Statement", X_RIGHT + 8, Y_TOP + 34, { size: 12, bold: true });
  drawTextRight(ctx, "Copy B", X_END, Y_ROW_3 - 20, { size: 10, bold: true });
  drawTextRight(ctx, "For Student", X_END, Y_ROW_3 - 8, { size: 8, bold: true });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. This form must be " +
      "used to complete Form 8863 to claim education credits. Give it to the tax preparer or " +
      "use it to prepare the tax return.",
    X_RIGHT + 4,
    Y_ROW_3 + 2,
    X_END - X_RIGHT - 6,
    { size: 6, lineGap: 1 },
  );
  drawText(ctx, "Form 1098-T (keep for your records)", X_LEFT, Y_END + 6, { size: 7 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, Y_END + 6, {
    size: 6.5,
  });
  drawText(ctx, "www.irs.gov/Form1098T", X_MID, Y_END + 6, { size: 6.5 });
}

export async function form1098TPdf(
  form: Form1098TFactValue,
  parties: Form1098TParties,
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
  drawAmountBoxes(ctx, form);
  drawFormName(ctx, taxYear);
  return doc.save();
}
