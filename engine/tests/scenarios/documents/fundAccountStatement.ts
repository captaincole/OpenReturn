/*
 * A foreign fund's year-end account statement to its holder: the
 * transactions of the year and the holding on December 31, in the fund's
 * currency. Every fund sends one, PFIC or not; a fund with no QEF election
 * sends nothing else, so the statement says nothing about U.S. tax. Form
 * 8621 lets the holder rely on "periodic account statements provided at
 * least annually" for the value of the shares (irs-8621-inst-2025::sec::line-4::b01).
 * It prints only what the fund fact holds; the basis, the exchange rates and
 * the elections are the holder's own records.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { PficFundFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawLine,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface AccountStatementParties {
  holderName: string;
  accountNumber: string;
}

const X_LEFT = 54;
const X_END = 558;
const X_DESCRIPTION = 130;
const X_UNITS = 420;
const ROW = 18;
const TEXT = { size: 9 };
const HEAD = { size: 8, bold: true };

interface Transaction {
  date: string;
  description: string;
  units?: number;
  amount: number;
}

/* "2025-06-20" as 20 Jun 2025, as a European fund prints a date. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayMonthYear(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

const units = (count: number) => count.toLocaleString("en-US");

/* The year's transactions: distributions with their tax, a QEF's distributions, a sale. */
function transactionsOf(fund: PficFundFactValue): Transaction[] {
  const rows: Transaction[] = [];
  for (const each of fund.section1291?.distributions ?? []) {
    rows.push({ date: each.date, description: "Income distribution", amount: each.amount });
    if (each.foreignTaxWithheld !== undefined)
      rows.push({
        date: each.date,
        description: "Tax withheld at source",
        amount: -each.foreignTaxWithheld,
      });
  }
  for (const each of fund.qef?.distributionsPerUnit ?? [])
    rows.push({
      date: each.date,
      description: `Income distribution, ${each.amountPerUnit.toFixed(4)} per unit`,
      units: each.units,
      amount: each.amountPerUnit * each.units,
    });
  const sale = fund.disposition;
  if (sale !== undefined)
    rows.push({ date: sale.date, description: "Redemption proceeds", amount: sale.amountRealized });
  return rows.sort((first, second) => first.date.localeCompare(second.date));
}

function header(
  ctx: Ctx,
  fund: PficFundFactValue,
  parties: AccountStatementParties,
  taxYear: number,
) {
  drawText(ctx, fund.fundName, X_LEFT, 54, { size: 13, bold: true });
  drawText(ctx, fund.fundAddress, X_LEFT, 72, TEXT);
  drawText(ctx, "Shareholder account statement", X_LEFT, 104, { size: 12, bold: true });
  drawText(ctx, `Period: 01 Jan ${taxYear} to 31 Dec ${taxYear}`, X_LEFT, 122, TEXT);
  drawText(ctx, `Account holder: ${parties.holderName}`, X_LEFT, 136, TEXT);
  drawText(ctx, `Account number: ${parties.accountNumber}`, X_LEFT, 150, TEXT);
  drawText(ctx, `Share class: ${fund.shareClass}`, X_LEFT, 164, TEXT);
  drawText(ctx, `Account currency: ${fund.currencyCode ?? "USD"}`, X_LEFT, 178, TEXT);
}

function transactionRows(ctx: Ctx, rows: Transaction[], currency: string, yStart: number) {
  drawText(ctx, "Transactions", X_LEFT, yStart, { size: 10, bold: true });
  let yPos = yStart + ROW;
  drawText(ctx, "Date", X_LEFT, yPos, HEAD);
  drawText(ctx, "Description", X_DESCRIPTION, yPos, HEAD);
  drawTextRight(ctx, "Units", X_UNITS, yPos, HEAD);
  drawTextRight(ctx, `Amount (${currency})`, X_END, yPos, HEAD);
  drawLine(ctx, X_LEFT, yPos + 12, X_END, yPos + 12);
  if (rows.length === 0) {
    drawText(ctx, "No transactions in the period.", X_LEFT, yPos + ROW, TEXT);
    return yPos + 2 * ROW;
  }
  for (const each of rows) {
    yPos += ROW;
    drawText(ctx, dayMonthYear(each.date), X_LEFT, yPos, TEXT);
    drawText(ctx, each.description, X_DESCRIPTION, yPos, TEXT);
    if (each.units !== undefined) drawTextRight(ctx, units(each.units), X_UNITS, yPos, TEXT);
    drawTextRight(ctx, fmtMoney(each.amount), X_END, yPos, TEXT);
  }
  return yPos + ROW;
}

function holdingRows(
  ctx: Ctx,
  fund: PficFundFactValue,
  currency: string,
  taxYear: number,
  yStart: number,
) {
  drawText(ctx, `Holding at 31 Dec ${taxYear}`, X_LEFT, yStart, { size: 10, bold: true });
  const yPos = yStart + ROW;
  drawText(ctx, "Units held", X_LEFT, yPos, TEXT);
  drawTextRight(ctx, units(fund.sharesAtYearEnd), X_UNITS, yPos, TEXT);
  drawText(ctx, `Market value (${currency})`, X_LEFT, yPos + ROW, TEXT);
  drawTextRight(ctx, fmtMoney(fund.valueAtYearEnd), X_END, yPos + ROW, TEXT);
  drawLine(ctx, X_LEFT, yPos + ROW + 12, X_END, yPos + ROW + 12);
  return yPos + 2 * ROW;
}

export async function fundAccountStatementPdf(
  fund: PficFundFactValue,
  parties: AccountStatementParties,
  taxYear: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const ctx: Ctx = {
    page: doc.addPage([PAGE_W, PAGE_H]),
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const currency = fund.currencyCode ?? "USD";
  header(ctx, fund, parties, taxYear);
  const yPos = transactionRows(ctx, transactionsOf(fund), currency, 210);
  const yEnd = holdingRows(ctx, fund, currency, taxYear, yPos + 12);
  const note = `All amounts are in ${currency}. Market value is the units held times the net asset value per unit on the last valuation day of the period. Please keep this statement with your records.`;
  drawWrapped(ctx, note, X_LEFT, yEnd + 16, X_END - X_LEFT, { size: 8, italic: true });
  return doc.save();
}
