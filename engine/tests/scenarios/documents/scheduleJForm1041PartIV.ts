/*
 * Schedule J (Form 1041), Part IV, Allocation to Beneficiary: the copy the
 * trustee gives a beneficiary of an accumulation distribution ("The trustee
 * must give you a completed Part IV of Schedule J (Form 1041) so you can
 * complete this form", irs-4970-form-2025::sec::purpose-of-form::b01). It
 * follows the official form's Part IV: the trust's name and EIN, the
 * beneficiary's name, number and address, and lines 32 to 37 with columns (a)
 * this beneficiary's share of line 13, (b) of line 14 and (c) of line 16.
 * More than five throwback years print on attached rows, as the form's note
 * says ("attach additional schedules"). Line 37 is the column totals the form
 * defines ("Add lines 32 through 36"). The beneficiary's own answers (the
 * trust's date, the other trusts) are not on it.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { TrustAccumulationDistributionFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawText,
  drawTextRight,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface PartIVParties {
  beneficiaryName: string;
  beneficiaryTin: string;
  beneficiaryStreet: string;
  beneficiaryCityStateZip: string;
  taxYear: number;
}

const X_LEFT = 40;
const X_RIGHT = 572;
const X_COLUMNS = [332, 412, 492];
const COLUMN_W = 80;
const ROW = 20;
const CELL = 28;
const LABEL = { size: 7 };
const FIRST_LINE = 32;
const PRINTED_ROWS = 5;

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, CELL);
  drawText(ctx, label, xPos + 3, yPos + 3, LABEL);
  drawText(ctx, value, xPos + 6, yPos + 14, { size: 10 });
}

function drawHeader(ctx: Ctx, trust: TrustAccumulationDistributionFactValue, year: number) {
  drawText(ctx, "SCHEDULE J", X_LEFT, 36, { size: 11, bold: true });
  drawText(ctx, "(Form 1041)", X_LEFT, 50, { size: 8 });
  drawText(ctx, "Accumulation Distribution for Certain Complex Trusts", 150, 38, {
    size: 12,
    bold: true,
  });
  drawText(ctx, `Beneficiary's copy of Part IV — ${year}`, 150, 56, { size: 9 });
  drawTextRight(ctx, "OMB No. 1545-0092", X_RIGHT, 36, { size: 7 });
  cell(ctx, X_LEFT, 74, 410, "Name of trust", trust.trustName);
  cell(ctx, 410, 74, X_RIGHT, "Employer identification number", trust.trustEin);
  drawText(ctx, trust.trustAddress, X_LEFT + 6, 106, { size: 8 });
}

function drawBeneficiary(ctx: Ctx, parties: PartIVParties): number {
  drawBox(ctx, X_LEFT, 124, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(ctx, "Part IV   Allocation to Beneficiary", X_LEFT + 4, 128, { size: 9, bold: true });
  drawText(
    ctx,
    "Note: Be sure to complete Form 4970, Tax on Accumulation Distribution of Trusts.",
    X_LEFT,
    146,
    LABEL,
  );
  cell(ctx, X_LEFT, 158, 410, "Beneficiary's name", parties.beneficiaryName);
  cell(ctx, 410, 158, X_RIGHT, "Identifying number", parties.beneficiaryTin);
  cell(
    ctx,
    X_LEFT,
    186,
    X_RIGHT,
    "Beneficiary's address (number and street)",
    parties.beneficiaryStreet,
  );
  cell(ctx, X_LEFT, 214, X_RIGHT, "City, state, and ZIP code", parties.beneficiaryCityStateZip);
  return 250;
}

function drawColumnHeads(ctx: Ctx, yTop: number): number {
  const heads = ["(a) This beneficiary's", "(b) This beneficiary's", "(c) This beneficiary's"];
  const shares = ["share of line 13", "share of line 14", "share of line 16"];
  X_COLUMNS.forEach((xPos, index) => {
    drawBox(ctx, xPos, yTop, COLUMN_W, 30);
    drawText(ctx, heads[index], xPos + 4, yTop + 6, LABEL);
    drawText(ctx, shares[index], xPos + 4, yTop + 16, LABEL);
  });
  return yTop + 30;
}

function drawRow(ctx: Ctx, yPos: number, label: string, amounts: number[]) {
  drawText(ctx, label, X_LEFT, yPos + 6, { size: 8.5 });
  X_COLUMNS.forEach((xPos, index) => {
    drawBox(ctx, xPos, yPos, COLUMN_W, ROW);
    drawTextRight(ctx, fmtMoney(amounts[index]), xPos + COLUMN_W - 4, yPos + 6, { size: 9 });
  });
}

function drawLines(ctx: Ctx, trust: TrustAccumulationDistributionFactValue, yTop: number): number {
  let yPos = drawColumnHeads(ctx, yTop);
  const rows = trust.throwbackYears;
  rows.forEach((row, index) => {
    const lineName = index < PRINTED_ROWS ? `${FIRST_LINE + index}` : "Attached";
    const amounts = [row.amount, row.taxes, row.taxExemptInterest ?? 0];
    drawRow(ctx, yPos, `${lineName}   Throwback year ${row.year}`, amounts);
    yPos += ROW;
  });
  const total = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((acc, row) => acc + pick(row), 0);
  const totals = [
    total((row) => row.amount),
    total((row) => row.taxes),
    total((row) => row.taxExemptInterest ?? 0),
  ];
  drawRow(ctx, yPos, "37   Total. Add lines 32 through 36. Enter on Form 4970", totals);
  return yPos + ROW;
}

export async function scheduleJForm1041PartIVPdf(
  trust: TrustAccumulationDistributionFactValue,
  parties: PartIVParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawHeader(ctx, trust, parties.taxYear);
  const afterBeneficiary = drawBeneficiary(ctx, parties);
  drawLines(ctx, trust, afterBeneficiary);
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
  return doc.save();
}
