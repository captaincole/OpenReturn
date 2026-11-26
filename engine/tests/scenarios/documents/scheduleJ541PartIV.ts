/*
 * Schedule J (541), Part IV, Allocation to Beneficiary: the California copy
 * the trustee gives a beneficiary of an accumulation distribution ("If you
 * were a noncontingent beneficiary and you received Schedule J (541) ...
 * Complete Part I of form FTB 5870A", ca-5870a-inst-2025::sec::purpose::b01).
 * It follows the FTB form's Part IV: the trust's name and FEIN, the
 * beneficiary's name, number and address, lines 26 to 29 with a throwback year
 * each and columns (a) Part II line 13, (b) line 14 and (c) line 16 allocated
 * to this beneficiary, line 30 the column totals ("Add amounts from line 26
 * through line 29"), and line 31, whether the beneficiary is a nonresident.
 * More than four throwback years print on attached rows. The beneficiary's own
 * answers (the other trusts) are not on it.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type {
  ThrowbackYearRow,
  TrustAccumulationDistributionFactValue,
} from "../../../src/facts/index.js";
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

export interface PartIV541Parties {
  beneficiaryName: string;
  beneficiaryTin: string;
  beneficiaryStreet: string;
  beneficiaryCityStateZip: string;
  beneficiaryNonresident: boolean;
  taxYear: number;
}

const X_LEFT = 40;
const X_RIGHT = 572;
const X_COLUMNS = [332, 412, 492];
const COLUMN_W = 80;
const ROW = 20;
const CELL = 28;
const LABEL = { size: 7 };
const FIRST_LINE = 26;
const PRINTED_ROWS = 4;

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, CELL);
  drawText(ctx, label, xPos + 3, yPos + 3, LABEL);
  drawText(ctx, value, xPos + 6, yPos + 14, { size: 10 });
}

function drawHeader(ctx: Ctx, trust: TrustAccumulationDistributionFactValue, year: number) {
  drawText(ctx, `TAXABLE YEAR ${year}`, X_LEFT, 36, { size: 8 });
  drawText(ctx, "Trust Allocation of an Accumulation Distribution", 150, 38, {
    size: 12,
    bold: true,
  });
  drawText(ctx, "Beneficiary's copy of Part IV", 150, 56, { size: 9 });
  drawTextRight(ctx, "CALIFORNIA SCHEDULE J (541)", X_RIGHT, 36, { size: 8, bold: true });
  cell(ctx, X_LEFT, 74, 410, "Name of trust", trust.trustName);
  cell(ctx, 410, 74, X_RIGHT, "FEIN", trust.trustEin);
  const ca = trust.california;
  const address = ca ? `${ca.trustStreet}, ${ca.trustCity}, ${ca.trustState} ${ca.trustZip}` : "";
  drawText(ctx, address, X_LEFT + 6, 106, { size: 8 });
}

function drawBeneficiary(ctx: Ctx, parties: PartIV541Parties): number {
  drawBox(ctx, X_LEFT, 124, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(
    ctx,
    "Part IV   Allocation to Beneficiary. Complete Part IV for each beneficiary.",
    X_LEFT + 4,
    128,
    {
      size: 9,
      bold: true,
    },
  );
  cell(ctx, X_LEFT, 150, 410, "Beneficiary's name", parties.beneficiaryName);
  cell(ctx, 410, 150, X_RIGHT, "Identifying number", parties.beneficiaryTin);
  cell(
    ctx,
    X_LEFT,
    178,
    X_RIGHT,
    "Beneficiary's address (number and street, PO box, or PMB no.)",
    parties.beneficiaryStreet,
  );
  cell(ctx, X_LEFT, 206, X_RIGHT, "City, State, and ZIP code", parties.beneficiaryCityStateZip);
  return 242;
}

function drawColumnHeads(ctx: Ctx, yTop: number): number {
  const lines = ["Part II, line 13", "Part II, line 14", "Part II, line 16"];
  X_COLUMNS.forEach((xPos, index) => {
    drawBox(ctx, xPos, yTop, COLUMN_W, 40);
    drawText(ctx, `(${"abc"[index]}) Enter amount from`, xPos + 4, yTop + 5, LABEL);
    drawText(ctx, lines[index], xPos + 4, yTop + 15, LABEL);
    drawText(ctx, "allocated to this beneficiary", xPos + 4, yTop + 25, { size: 6 });
  });
  return yTop + 40;
}

function drawRow(ctx: Ctx, yPos: number, label: string, amounts: number[]) {
  drawText(ctx, label, X_LEFT, yPos + 6, { size: 8.5 });
  X_COLUMNS.forEach((xPos, index) => {
    drawBox(ctx, xPos, yPos, COLUMN_W, ROW);
    drawTextRight(ctx, fmtMoney(amounts[index]), xPos + COLUMN_W - 4, yPos + 6, { size: 9 });
  });
}

const columnsOf = (row: ThrowbackYearRow) => [row.amount, row.taxes, row.taxExemptInterest ?? 0];

function drawLines(ctx: Ctx, rows: ThrowbackYearRow[], parties: PartIV541Parties, yTop: number) {
  let yPos = drawColumnHeads(ctx, yTop);
  rows.forEach((row, index) => {
    const lineName = index < PRINTED_ROWS ? `${FIRST_LINE + index}` : "Attached";
    drawRow(ctx, yPos, `${lineName}   Throwback year ending ${row.year}`, columnsOf(row));
    yPos += ROW;
  });
  const totals = [0, 1, 2].map((column) =>
    rows.reduce((acc, row) => acc + columnsOf(row)[column], 0),
  );
  drawRow(ctx, yPos, "30   Total. Add amounts from line 26 through line 29", totals);
  yPos += ROW + 8;
  const answer = parties.beneficiaryNonresident ? "[X] Yes   [ ] No" : "[ ] Yes   [X] No";
  drawText(ctx, `31   Is this beneficiary a nonresident of California?   ${answer}`, X_LEFT, yPos, {
    size: 8.5,
  });
}

export async function scheduleJ541PartIVPdf(
  trust: TrustAccumulationDistributionFactValue,
  parties: PartIV541Parties,
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
  drawLines(ctx, trust.california?.throwbackYears ?? [], parties, afterBeneficiary);
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
  return doc.save();
}
