/*
 * A care provider's year-end statement: the letter a daycare, preschool or
 * sitter gives a family in January for its tax records. The IRS publishes no
 * form for it. It carries what Form 2441 line 1 and FTB 3506 line 1 ask of the
 * provider: the name and address, the taxpayer identification number (or
 * that the provider is tax-exempt), the phone number, where the care was
 * given when that is not the provider's address, and the total paid in the
 * year. Form W-10 carries the same identity but no amount.
 *
 * Printed only from the provider fact. The fact does not hold the children
 * cared for, so the statement names none. Whether the provider was a
 * household employee, a person or an organization (FTB 3506 line 1d), and
 * whether the employer furnished the care, are the taxpayer's answers and
 * are not printed.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { DependentCareProviderFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawLine,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

/* Who paid, and the letter's own details: none of them are in the fact. */
export interface CareStatementFamily {
  /* The parents the statement is addressed to, as one line. */
  payerName: string;
  payerStreet: string;
  payerCityStateZip: string;
  /* The date the provider signed the statement, as printed. */
  statementDate: string;
  /* The provider's account number for the family, when the provider uses one. */
  accountNumber?: string;
  /* The person who signs for the provider, and their title. */
  signedBy: string;
}

type Address = DependentCareProviderFactValue["address"];

const X_LEFT = 54;
const X_SPLIT = 306;
const X_RIGHT = 558;
const ROW = 34;
const LABEL = { size: 7 };

const cityLine = (address: Address) => `${address.city}, ${address.state} ${address.zip}`;
const oneLine = (address: Address) => `${address.line1}, ${cityLine(address)}`;

/* A cell with its label at the top left and the value under it. */
function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, ROW);
  drawText(ctx, label, xPos + 4, yPos + 4, LABEL);
  drawText(ctx, value, xPos + 8, yPos + 17, { size: 10 });
}

function sectionBar(ctx: Ctx, title: string, yTop: number): number {
  drawBox(ctx, X_LEFT, yTop, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(ctx, title, X_LEFT + 4, yTop + 4, { size: 8, bold: true });
  return yTop + 16;
}

/* The provider's name and address at the top, with the phone on the right. */
function drawLetterhead(ctx: Ctx, provider: DependentCareProviderFactValue): number {
  drawText(ctx, provider.name, X_LEFT, 44, { size: 18, bold: true });
  drawText(ctx, provider.address.line1, X_LEFT, 68, { size: 10 });
  drawText(ctx, cityLine(provider.address), X_LEFT, 82, { size: 10 });
  if (provider.phone !== undefined) {
    drawTextRight(ctx, `Phone ${provider.phone}`, X_RIGHT, 68, { size: 10 });
  }
  drawLine(ctx, X_LEFT, 102, X_RIGHT, 102, { thickness: 1 });
  return 118;
}

function drawAddressee(ctx: Ctx, family: CareStatementFamily, yTop: number): number {
  drawText(ctx, family.statementDate, X_LEFT, yTop, { size: 10 });
  drawText(ctx, family.payerName, X_LEFT, yTop + 22, { size: 10 });
  drawText(ctx, family.payerStreet, X_LEFT, yTop + 36, { size: 10 });
  drawText(ctx, family.payerCityStateZip, X_LEFT, yTop + 50, { size: 10 });
  return yTop + 76;
}

function drawTitle(ctx: Ctx, taxYear: number, yTop: number): number {
  drawText(ctx, `${taxYear} Year-End Statement of Child Care Payments`, X_LEFT, yTop, {
    size: 14,
    bold: true,
  });
  drawText(ctx, "For your tax records: Form 2441 and California form FTB 3506", X_LEFT, yTop + 20, {
    size: 9,
    italic: true,
  });
  return yTop + 42;
}

/* The TIN cell: the number as printed, or the tax-exempt notice the instructions ask for. */
const tinText = (provider: DependentCareProviderFactValue) =>
  provider.taxExempt === true ? "Tax-exempt organization" : (provider.tin ?? "");

function drawProvider(ctx: Ctx, provider: DependentCareProviderFactValue, yTop: number): number {
  const y1 = sectionBar(ctx, "Care provider", yTop);
  cell(ctx, X_LEFT, y1, X_SPLIT, "Provider's name", provider.name);
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Taxpayer identification number (SSN or EIN)", tinText(provider));
  const y2 = y1 + ROW;
  cell(ctx, X_LEFT, y2, X_SPLIT, "Provider's address", oneLine(provider.address));
  cell(ctx, X_SPLIT, y2, X_RIGHT, "Telephone number", provider.phone ?? "");
  const y3 = y2 + ROW;
  if (provider.careAddress === undefined) return y3 + 12;
  cell(ctx, X_LEFT, y3, X_RIGHT, "Care given at", oneLine(provider.careAddress));
  return y3 + ROW + 12;
}

function drawPayments(
  ctx: Ctx,
  provider: DependentCareProviderFactValue,
  family: CareStatementFamily,
  taxYear: number,
  yTop: number,
): number {
  const y1 = sectionBar(ctx, "Payments received", yTop);
  cell(ctx, X_LEFT, y1, X_SPLIT, "Family account", family.accountNumber ?? "");
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Period", `January 1 to December 31, ${taxYear}`);
  const y2 = y1 + ROW;
  drawBox(ctx, X_LEFT, y2, X_RIGHT - X_LEFT, ROW);
  drawText(ctx, `Total paid for care in ${taxYear}`, X_LEFT + 4, y2 + 12, {
    size: 10,
    bold: true,
  });
  drawTextRight(ctx, `$ ${fmtMoney(provider.amountPaid)}`, X_RIGHT - 8, y2 + 11, {
    size: 12,
    bold: true,
  });
  return y2 + ROW + 18;
}

function drawSignature(
  ctx: Ctx,
  provider: DependentCareProviderFactValue,
  family: CareStatementFamily,
  yTop: number,
) {
  const text =
    `${provider.name} received the payments above for care given during the year. ` +
    "The provider's name, address and taxpayer identification number are the same as on " +
    "Form W-10. Keep this statement with your tax records.";
  const yAfter = drawWrapped(ctx, text, X_LEFT, yTop, X_RIGHT - X_LEFT, { size: 9, lineGap: 3 });
  drawLine(ctx, X_LEFT, yAfter + 40, X_SPLIT, yAfter + 40);
  drawText(ctx, family.signedBy, X_LEFT, yAfter + 46, { size: 9 });
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function careProviderStatementPdf(
  provider: DependentCareProviderFactValue,
  family: CareStatementFamily,
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
  const afterHead = drawLetterhead(ctx, provider);
  const afterTo = drawAddressee(ctx, family, afterHead);
  const afterTitle = drawTitle(ctx, taxYear, afterTo);
  const afterProvider = drawProvider(ctx, provider, afterTitle);
  const afterPayments = drawPayments(ctx, provider, family, taxYear, afterProvider);
  drawSignature(ctx, provider, family, afterPayments);
  return doc.save();
}
