/*
 * An installer's invoice for one item of refueling property (an electric
 * vehicle charger with one charging port). The IRS publishes no form for it;
 * the contents follow Publication 6027: keep "receipts verifying your purchase
 * and any associated labor costs for installation". From the fact it prints the
 * item's description, the date work began (Schedule A (Form 8911) line 4), the
 * date it was finished and working (line 5) and its total cost (line 8). The
 * census tract, the main home and the business use are the taxpayer's answers,
 * not on it.
 *
 * The layout follows three public samples of an installer's invoice for a home
 * charger (utility rebate guides; links in the pevara README): the contractor
 * with phone and licence at the top left, the invoice number and date at the
 * top right, the customer and site, one table line each for the charger (make,
 * model, "new"), the materials, the permit and the labor, then the subtotal, the
 * sales tax, the total, the payment and a zero balance with a paid mark.
 *
 * The lines and the tax come from the scenario, not from the fact. The
 * generator refuses lines whose sum with the tax is not the fact's cost, so the
 * invoice total and the fact cannot disagree. Amounts are whole cents.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { RefuelingPropertyFactValue } from "../../../src/facts/index.js";
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

export interface InvoiceParties {
  installerName: string;
  installerStreet: string;
  installerCityStateZip: string;
  installerPhone: string;
  installerEmail: string;
  installerLicense: string;
  customerName: string;
  customerStreet: string;
  customerCityStateZip: string;
}

/* One table line: quantity 1, so the unit price is the line total. */
export interface InvoiceLine {
  description: string;
  detail?: string;
  amountCents: number;
}

export interface InvoiceWork {
  invoiceNumber: string;
  lines: InvoiceLine[];
  salesTaxLabel: string;
  salesTaxCents: number;
  /* How it was paid, for example "Visa ending 0000". */
  paymentMethod: string;
}

const X_LEFT = 50;
const X_RIGHT = 562;
const X_QTY_END = 80;
const X_UNIT_PRICE = 478;
const X_TOTALS = 290;
const DESCRIPTION_WIDTH = 300;

const dollars = (cents: number) => `$ ${fmtMoney(cents / 100)}`;

/* MM/DD/YYYY from the fact's YYYY-MM-DD, as a US invoice prints a date. */
function usDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

function subtotalCents(work: InvoiceWork): number {
  return work.lines.reduce((total, line) => total + line.amountCents, 0);
}

function checkTotal(property: RefuelingPropertyFactValue, work: InvoiceWork) {
  const invoiceTotal = subtotalCents(work) + work.salesTaxCents;
  if (invoiceTotal !== property.cost * 100) {
    throw new Error(
      `Invoice ${work.invoiceNumber}: lines and tax add to ${invoiceTotal} cents, the fact's cost is ${property.cost}.`,
    );
  }
}

function drawHeader(
  ctx: Ctx,
  parties: InvoiceParties,
  work: InvoiceWork,
  property: RefuelingPropertyFactValue,
) {
  drawText(ctx, parties.installerName, X_LEFT, 40, { size: 15, bold: true });
  drawText(ctx, parties.installerStreet, X_LEFT, 60, { size: 9 });
  drawText(ctx, parties.installerCityStateZip, X_LEFT, 72, { size: 9 });
  drawText(ctx, `Phone ${parties.installerPhone}   ${parties.installerEmail}`, X_LEFT, 84, {
    size: 9,
  });
  drawText(ctx, `Electrical contractor license ${parties.installerLicense}`, X_LEFT, 96, {
    size: 9,
  });
  drawTextRight(ctx, "INVOICE", X_RIGHT, 40, { size: 15, bold: true });
  drawTextRight(ctx, `Invoice # ${work.invoiceNumber}`, X_RIGHT, 60, { size: 9 });
  drawTextRight(ctx, `Date: ${usDate(property.placedInServiceDate)}`, X_RIGHT, 72, { size: 9 });
}

function drawCustomer(ctx: Ctx, parties: InvoiceParties, property: RefuelingPropertyFactValue) {
  drawText(ctx, "Bill to and site address", X_LEFT, 126, { size: 8, bold: true });
  drawText(ctx, parties.customerName, X_LEFT, 140, { size: 10 });
  drawText(ctx, parties.customerStreet, X_LEFT, 153, { size: 10 });
  drawText(ctx, parties.customerCityStateZip, X_LEFT, 166, { size: 10 });
  if (property.constructionBeganDate !== undefined) {
    drawTextRight(ctx, `Work started: ${usDate(property.constructionBeganDate)}`, X_RIGHT, 140, {
      size: 9,
    });
  }
  drawTextRight(
    ctx,
    `Installed and working: ${usDate(property.placedInServiceDate)}`,
    X_RIGHT,
    153,
    { size: 9 },
  );
  drawText(ctx, `Job: ${property.description}`, X_LEFT, 194, { size: 10, bold: true });
}

function drawTableHead(ctx: Ctx, top: number) {
  drawBox(ctx, X_LEFT, top, X_RIGHT - X_LEFT, 18, { fill: SHADE });
  drawText(ctx, "Qty", X_LEFT + 6, top + 5, { size: 8, bold: true });
  drawText(ctx, "Description", X_QTY_END + 6, top + 5, { size: 8, bold: true });
  drawTextRight(ctx, "Unit price", X_UNIT_PRICE, top + 5, { size: 8, bold: true });
  drawTextRight(ctx, "Line total", X_RIGHT - 6, top + 5, { size: 8, bold: true });
}

/* Draws one line of the table at `top` and returns the top of the next one. */
function drawRow(ctx: Ctx, line: InvoiceLine, top: number): number {
  drawText(ctx, "1", X_LEFT + 6, top + 7, { size: 10 });
  drawText(ctx, line.description, X_QTY_END + 6, top + 7, { size: 10 });
  const bottom =
    line.detail === undefined
      ? top + 24
      : drawWrapped(ctx, line.detail, X_QTY_END + 6, top + 22, DESCRIPTION_WIDTH, {
          size: 8,
          lineGap: 3,
        }) + 4;
  drawTextRight(ctx, dollars(line.amountCents), X_UNIT_PRICE, top + 7, { size: 10 });
  drawTextRight(ctx, dollars(line.amountCents), X_RIGHT - 6, top + 7, { size: 10 });
  drawBox(ctx, X_LEFT, top, X_RIGHT - X_LEFT, bottom - top);
  return bottom;
}

function drawTotalRow(ctx: Ctx, label: string, amount: string, top: number, strong = false) {
  const opts = strong ? { fill: SHADE } : {};
  drawBox(ctx, X_TOTALS, top, X_RIGHT - X_TOTALS, 18, opts);
  drawText(ctx, label, X_TOTALS + 6, top + 5, { size: 9, bold: strong });
  drawTextRight(ctx, amount, X_RIGHT - 6, top + 5, { size: 10, bold: strong });
}

function drawTotals(
  ctx: Ctx,
  work: InvoiceWork,
  property: RefuelingPropertyFactValue,
  top: number,
): number {
  const total = dollars(subtotalCents(work) + work.salesTaxCents);
  const paid = `Payment ${usDate(property.placedInServiceDate)}, ${work.paymentMethod}`;
  drawTotalRow(ctx, "Subtotal", dollars(subtotalCents(work)), top);
  drawTotalRow(ctx, work.salesTaxLabel, dollars(work.salesTaxCents), top + 18);
  drawTotalRow(ctx, "TOTAL", total, top + 36, true);
  drawTotalRow(ctx, paid, total, top + 54);
  drawTotalRow(ctx, "BALANCE DUE", dollars(0), top + 72, true);
  drawText(ctx, "PAID IN FULL", X_LEFT + 20, top + 40, { size: 20, bold: true });
  return top + 110;
}

function drawLines(ctx: Ctx, work: InvoiceWork, property: RefuelingPropertyFactValue): number {
  const top = 210;
  drawTableHead(ctx, top);
  const tableBottom = work.lines.reduce((rowTop, line) => drawRow(ctx, line, rowTop), top + 18);
  return drawTotals(ctx, work, property, tableBottom);
}

function drawFooter(ctx: Ctx, parties: InvoiceParties, yTop: number) {
  const text = `Thank you for your business! Questions about this invoice: call ${parties.installerPhone}.`;
  drawText(ctx, text, X_LEFT, yTop, { size: 8.5 });
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function refuelingPropertyInvoicePdf(
  property: RefuelingPropertyFactValue,
  parties: InvoiceParties,
  work: InvoiceWork,
): Promise<Uint8Array> {
  checkTotal(property, work);
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawHeader(ctx, parties, work, property);
  drawCustomer(ctx, parties, property);
  drawFooter(ctx, parties, drawLines(ctx, work, property));
  return doc.save();
}
