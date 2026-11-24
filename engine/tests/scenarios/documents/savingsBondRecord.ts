/*
 * The written record of savings bonds cashed that the Form 8815 instructions
 * require (irs-8815-form-2025::sec::recordkeeping-requirements::b01): for each
 * series EE or I bond cashed, the serial number, issue date, face value and
 * total redemption proceeds (principal and interest). The layout follows
 * Form 8818 (Rev. December 2007), the optional form the IRS offers for it, with
 * one row for each bond. Form 8818 sorts the bonds into Part I (paper series
 * EE) and Part II (series I and electronic series EE) and prints the proceeds
 * only as one total (line 6); this record keeps one row per bond with its own
 * proceeds, and a column for the series and the format instead of the two
 * parts. It prints no totals: each one would be worked out from the rows.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { SavingsBondCashedFactValue, SavingsBondFormat } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawText,
  drawTextCenter,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface SavingsBondRecordParties {
  /* The bond owner's name, as on Form 8818's "Name" line. */
  ownerName: string;
  taxYear: number;
}

const X_LEFT = 50;
const X_RIGHT = 562;
const HEADER_H = 28;
const ROW_H = 22;

/* Each column: its heading, its left edge, and how its value prints. */
interface Column {
  heading: string;
  xPos: number;
  align: "left" | "center" | "right";
  valueOf: (bond: SavingsBondCashedFactValue) => string;
}

const FORMAT_LABEL: Record<SavingsBondFormat, string> = {
  paper: "Paper",
  electronic: "Electronic",
};

/* "2004-03-01" → "03/2004": a bond prints the month and year it was issued. */
function monthAndYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${month}/${year}`;
}

const dollars = (amount: number) => `$ ${fmtMoney(amount)}`;

const COLUMNS: Column[] = [
  {
    heading: "(a) Serial number",
    xPos: X_LEFT,
    align: "left",
    valueOf: (bond) => bond.serialNumber ?? "",
  },
  { heading: "(b) Series", xPos: 166, align: "center", valueOf: (bond) => bond.series },
  {
    heading: "(c) Paper or electronic",
    xPos: 216,
    align: "center",
    valueOf: (bond) => FORMAT_LABEL[bond.format],
  },
  {
    heading: "(d) Issue date",
    xPos: 306,
    align: "center",
    valueOf: (bond) => monthAndYear(bond.issueDate),
  },
  {
    heading: "(e) Face value",
    xPos: 370,
    align: "right",
    valueOf: (bond) => dollars(bond.faceValue),
  },
  {
    heading: "(f) Total redemption proceeds (principal and interest)",
    xPos: 452,
    align: "right",
    valueOf: (bond) => dollars(bond.proceeds),
  },
];

const columnEnd = (index: number) => COLUMNS[index + 1]?.xPos ?? X_RIGHT;

function drawTitle(ctx: Ctx, parties: SavingsBondRecordParties) {
  drawText(ctx, "Record of Series EE and I U.S. Savings Bonds Cashed", X_LEFT, 40, {
    size: 15,
    bold: true,
  });
  drawText(
    ctx,
    `Tax year ${parties.taxYear}: written record for Form 8815 (laid out after Form 8818)`,
    X_LEFT,
    62,
    { size: 9.5 },
  );
  drawText(ctx, "Keep for your records. Do not send to the IRS.", X_LEFT, 76, {
    size: 9,
    bold: true,
  });
  drawBox(ctx, X_LEFT, 96, X_RIGHT - X_LEFT, 30);
  drawText(ctx, "Name of bond owner", X_LEFT + 4, 100, { size: 7 });
  drawText(ctx, parties.ownerName, X_LEFT + 8, 112, { size: 10 });
}

function drawHeadings(ctx: Ctx, yTop: number) {
  COLUMNS.forEach((column, index) => {
    const width = columnEnd(index) - column.xPos;
    drawBox(ctx, column.xPos, yTop, width, HEADER_H, { fill: SHADE });
    drawWrapped(ctx, column.heading, column.xPos + 4, yTop + 4, width - 8, {
      size: 7,
      bold: true,
      lineGap: 1.5,
    });
  });
}

function drawCell(ctx: Ctx, index: number, yTop: number, text: string) {
  const column = COLUMNS[index];
  const xEnd = columnEnd(index);
  drawBox(ctx, column.xPos, yTop, xEnd - column.xPos, ROW_H);
  const yText = yTop + 7;
  if (column.align === "right") drawTextRight(ctx, text, xEnd - 6, yText, { size: 9.5 });
  else if (column.align === "center")
    drawTextCenter(ctx, text, (column.xPos + xEnd) / 2, yText, { size: 9.5 });
  else drawText(ctx, text, column.xPos + 6, yText, { size: 9.5 });
}

function drawRows(ctx: Ctx, bonds: SavingsBondCashedFactValue[], yTop: number): number {
  bonds.forEach((bond, row) => {
    COLUMNS.forEach((column, index) =>
      drawCell(ctx, index, yTop + row * ROW_H, column.valueOf(bond)),
    );
  });
  return yTop + bonds.length * ROW_H;
}

function drawNotes(ctx: Ctx, yTop: number) {
  const text =
    "Get the total redemption proceeds of each bond from the paying bank's receipt or from " +
    "your TreasuryDirect redemption history. A paper series EE bond was bought for half of its " +
    "face value; a series I bond and an electronic series EE bond at face value. Only a bond " +
    "issued after 1989 can qualify for the exclusion on Form 8815.";
  drawWrapped(ctx, text, X_LEFT, yTop, X_RIGHT - X_LEFT, { size: 8.5, lineGap: 3 });
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function savingsBondRecordPdf(
  bonds: SavingsBondCashedFactValue[],
  parties: SavingsBondRecordParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawTitle(ctx, parties);
  const yTable = 142;
  drawHeadings(ctx, yTable);
  const afterRows = drawRows(ctx, bonds, yTable + HEADER_H);
  drawNotes(ctx, afterRows + 18);
  return doc.save();
}
