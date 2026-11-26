/*
 * A notice to mortgagor of the federal recapture tax: the paper a bond issuer
 * or lender gives a home buyer at the closing of a federally subsidized loan
 * (irs-8828-inst-2025::sec::specific-instructions::b01: "you should have
 * received notification in writing from the bond issuer or the lender"). The
 * IRS publishes no form for it, and each issuer draws its own. Like the real
 * notices (scenario README, "Compared with real examples"), this one names the
 * subsidy, the issuer and the lender, the closing date, the federally subsidized
 * amount (Form 8828 line 19) and a table of the 9 years with the holding period
 * percentage (line 20) and the adjusted qualifying income by household size
 * (line 16). It prints only the values the notice fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type {
  MortgageSubsidyNoticeFactValue,
  MortgageSubsidyTableRow,
} from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawLine,
  drawText,
  drawTextCenter,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface NoticeParties {
  issuerStreet: string;
  issuerCityStateZip: string;
  borrowerName: string;
  loanNumber: string;
}

const X_LEFT = 50;
const X_SPLIT = 306;
const X_RIGHT = 562;
const X_CENTER = PAGE_W / 2;
const ROW = 30;
const LABEL = { size: 7 };
const BODY = { size: 8, lineGap: 2.5 };
const TABLE_ROW = 15;

const SUBSIDY_NAMES: Record<MortgageSubsidyNoticeFactValue["subsidyType"], string> = {
  qualified_mortgage_bond:
    "Mortgage loan from the proceeds of a tax-exempt qualified mortgage bond",
  mortgage_credit_certificate: "Mortgage credit certificate",
};

const printedDate = (date: string): string => {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
};

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, ROW);
  drawText(ctx, label, xPos + 4, yPos + 4, LABEL);
  drawText(ctx, value, xPos + 8, yPos + 15, { size: 9 });
}

function band(ctx: Ctx, title: string, yTop: number): number {
  drawBox(ctx, X_LEFT, yTop, X_RIGHT - X_LEFT, 15, { fill: SHADE });
  drawText(ctx, title, X_LEFT + 4, yTop + 4, { size: 8, bold: true });
  return yTop + 15;
}

function drawHeader(ctx: Ctx, notice: MortgageSubsidyNoticeFactValue, parties: NoticeParties) {
  const agency = notice.issuerAgency ?? notice.issuerPoliticalSubdivision ?? notice.issuerState;
  drawTextCenter(ctx, agency, X_CENTER, 36, { size: 13, bold: true });
  drawTextCenter(ctx, `${parties.issuerStreet}, ${parties.issuerCityStateZip}`, X_CENTER, 54, {
    size: 8.5,
  });
  drawLine(ctx, X_LEFT, 68, X_RIGHT, 68, { thickness: 1.2 });
  drawTextCenter(ctx, "NOTICE TO MORTGAGOR OF MAXIMUM RECAPTURE TAX AND", X_CENTER, 78, {
    size: 11,
    bold: true,
  });
  drawTextCenter(ctx, "METHOD TO COMPUTE RECAPTURE TAX ON SALE OF HOME", X_CENTER, 93, {
    size: 11,
    bold: true,
  });
  drawTextCenter(
    ctx,
    "This notice applies only to mortgage loans closed on or after January 1, 1991.",
    X_CENTER,
    110,
    {
      size: 8,
      italic: true,
    },
  );
  return 126;
}

function drawLoan(
  ctx: Ctx,
  notice: MortgageSubsidyNoticeFactValue,
  parties: NoticeParties,
  yTop: number,
): number {
  const y1 = band(ctx, "Loan", yTop);
  cell(ctx, X_LEFT, y1, X_SPLIT, "Borrower(s)", parties.borrowerName);
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Loan number", parties.loanNumber);
  const y2 = y1 + ROW;
  cell(
    ctx,
    X_LEFT,
    y2,
    X_SPLIT,
    "Date of closing of the loan",
    printedDate(notice.loanClosingDate),
  );
  const amount = `$ ${fmtMoney(notice.federallySubsidizedAmount)}`;
  cell(ctx, X_SPLIT, y2, X_RIGHT, "Federally subsidized amount (maximum recapture tax)", amount);
  const y3 = y2 + ROW;
  cell(ctx, X_LEFT, y3, X_RIGHT, "Type of federal subsidy", SUBSIDY_NAMES[notice.subsidyType]);
  const y4 = y3 + ROW;
  const issuer = [notice.issuerState, notice.issuerPoliticalSubdivision, notice.issuerAgency];
  const issuerText = issuer.filter(Boolean).join(" / ");
  cell(ctx, X_LEFT, y4, X_RIGHT, "Issuer (state, political subdivision, agency)", issuerText);
  const y5 = y4 + ROW;
  const lender = `${notice.originalLenderName}, ${notice.originalLenderAddress}`;
  cell(ctx, X_LEFT, y5, X_RIGHT, "Original lending institution", lender);
  return y5 + ROW + 10;
}

function drawMethod(ctx: Ctx, notice: MortgageSubsidyNoticeFactValue, yTop: number): number {
  const amount = `$${fmtMoney(notice.federallySubsidizedAmount)}`;
  const paragraphs = [
    `A. Maximum recapture tax. If you sell or otherwise dispose of your home within nine years of the closing of your loan, you may have to pay a recapture tax with your federal income tax. The maximum recapture tax is ${amount}. This amount is 6.25% of the highest principal amount of your mortgage loan and is your federally subsidized amount.`,
    "B. Actual recapture tax. The actual recapture tax is the lesser of (1) 50% of your gain on the sale, whether or not you must include that gain in your income, or (2) the maximum recapture tax multiplied by the holding period percentage (column 1 of the table) and by the income percentage (paragraph C).",
    "C. Income percentage. Subtract the adjusted qualifying income (column 2 or 3 of the table, for the number of family members living with you at the time of the sale) from your modified adjusted gross income for the year of the sale: your adjusted gross income, plus tax-exempt interest, less any gain from the sale included in your income. If the result is zero or less, you owe no recapture tax. If it is $5,000 or more, the income percentage is 100%. Otherwise divide it by $5,000.",
    "D. Repayment. If you repay the loan in full within the first four years and sell the home later during the nine-year period, your holding period percentage may be reduced. Report the recapture tax on IRS Form 8828, Recapture of Federal Mortgage Subsidy.",
  ];
  return paragraphs.reduce(
    (yPos, text) => drawWrapped(ctx, text, X_LEFT, yPos, X_RIGHT - X_LEFT, BODY) + 5,
    yTop,
  );
}

const COLUMNS = [X_LEFT, 250, 340, 452, X_RIGHT] as const;

function tableHeader(ctx: Ctx, yTop: number): number {
  const y1 = band(ctx, "Table", yTop);
  const heads = [
    "How long you owned the home",
    "(1) Holding period %",
    "(2) AQI, household of 2 or less",
    "(3) AQI, household of 3 or more",
  ];
  heads.forEach((head, index) => {
    drawBox(ctx, COLUMNS[index], y1, COLUMNS[index + 1] - COLUMNS[index], TABLE_ROW + 4);
    drawText(ctx, head, COLUMNS[index] + 3, y1 + 6, { size: 7, bold: true });
  });
  return y1 + TABLE_ROW + 4;
}

const yearsText = (years: number): string =>
  years === 1 ? "Less than 1 year" : `More than ${years - 1}, not more than ${years} years`;

function tableRow(ctx: Ctx, row: MortgageSubsidyTableRow, yPos: number) {
  const values = [
    yearsText(row.yearsHeld),
    `${row.holdingPeriodPercentage}%`,
    `$${fmtMoney(row.adjustedQualifyingIncomeTwoOrFewer)}`,
    `$${fmtMoney(row.adjustedQualifyingIncomeThreeOrMore)}`,
  ];
  values.forEach((value, index) => {
    drawBox(ctx, COLUMNS[index], yPos, COLUMNS[index + 1] - COLUMNS[index], TABLE_ROW);
    if (index === 0) drawText(ctx, value, COLUMNS[0] + 3, yPos + 4, { size: 8 });
    else drawTextRight(ctx, value, COLUMNS[index + 1] - 6, yPos + 4, { size: 8 });
  });
}

function drawTable(ctx: Ctx, notice: MortgageSubsidyNoticeFactValue, yTop: number): number {
  const yRows = tableHeader(ctx, yTop);
  notice.table.forEach((row, index) => tableRow(ctx, row, yRows + index * TABLE_ROW));
  return yRows + notice.table.length * TABLE_ROW + 10;
}

function drawFooter(ctx: Ctx, yTop: number) {
  drawWrapped(
    ctx,
    "Keep this notice with your records. It holds the federally subsidized amount and the income figures for each of the nine years the recapture tax may apply.",
    X_LEFT,
    yTop,
    X_RIGHT - X_LEFT,
    { size: 7.5, italic: true },
  );
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 40, {
    size: 7,
    italic: true,
  });
}

export async function recaptureTaxNoticePdf(
  notice: MortgageSubsidyNoticeFactValue,
  parties: NoticeParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const afterHeader = drawHeader(ctx, notice, parties);
  const afterLoan = drawLoan(ctx, notice, parties, afterHeader);
  const afterMethod = drawMethod(ctx, notice, afterLoan);
  const afterTable = drawTable(ctx, notice, afterMethod + 4);
  drawFooter(ctx, afterTable);
  return doc.save();
}
