/*
 * An installer's invoice for one item of refueling property (an electric
 * vehicle charger with one charging port). The IRS publishes no form for it;
 * the contents follow Publication 6027: keep "receipts verifying your purchase
 * and any associated labor costs for installation". It prints only what the
 * fact holds: the item's description, the date work began (Schedule A (Form
 * 8911) line 4), the date it was finished and working (line 5) and its total
 * cost (line 8). The census tract, the main home and the business use are the
 * taxpayer's answers, not on it.
 *
 * The layout follows a public sample of an EV charger installer's invoice (a
 * utility's rebate guide): the contractor at the top left, the invoice number
 * and date at the top right, the customer and site, a table of quantity,
 * description, unit price and line total, the total, and a paid mark. The
 * sample splits the charger, the permit and the labor into separate lines; the
 * fact holds only the total, so this invoice has one line that names each part.
 * The invoice is dated the day the work was finished. Dates print as MM/DD/YYYY.
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
  installerLicense: string;
  invoiceNumber: string;
  customerName: string;
  customerStreet: string;
  customerCityStateZip: string;
}

const X_LEFT = 50;
const X_RIGHT = 562;
const X_QTY_END = 80;
const X_UNIT_PRICE = 478;
const X_TOTALS = 400;

/* MM/DD/YYYY from the fact's YYYY-MM-DD, as a US invoice prints a date. */
function usDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

function drawHeader(ctx: Ctx, parties: InvoiceParties, property: RefuelingPropertyFactValue) {
  drawText(ctx, parties.installerName, X_LEFT, 40, { size: 15, bold: true });
  drawText(ctx, parties.installerStreet, X_LEFT, 60, { size: 9 });
  drawText(ctx, parties.installerCityStateZip, X_LEFT, 72, { size: 9 });
  drawText(ctx, `Electrical contractor license ${parties.installerLicense}`, X_LEFT, 84, {
    size: 9,
  });
  drawTextRight(ctx, "INVOICE", X_RIGHT, 40, { size: 15, bold: true });
  drawTextRight(ctx, `Invoice # ${parties.invoiceNumber}`, X_RIGHT, 60, { size: 9 });
  drawTextRight(ctx, `Date: ${usDate(property.placedInServiceDate)}`, X_RIGHT, 72, { size: 9 });
}

function drawCustomer(ctx: Ctx, parties: InvoiceParties, property: RefuelingPropertyFactValue) {
  drawText(ctx, "Bill to and site address", X_LEFT, 116, { size: 8, bold: true });
  drawText(ctx, parties.customerName, X_LEFT, 130, { size: 10 });
  drawText(ctx, parties.customerStreet, X_LEFT, 143, { size: 10 });
  drawText(ctx, parties.customerCityStateZip, X_LEFT, 156, { size: 10 });
  if (property.constructionBeganDate !== undefined) {
    drawTextRight(ctx, `Work started: ${usDate(property.constructionBeganDate)}`, X_RIGHT, 130, {
      size: 9,
    });
  }
  drawTextRight(
    ctx,
    `Installed and working: ${usDate(property.placedInServiceDate)}`,
    X_RIGHT,
    143,
    { size: 9 },
  );
}

function drawTableHead(ctx: Ctx, top: number) {
  drawBox(ctx, X_LEFT, top, X_RIGHT - X_LEFT, 18, { fill: SHADE });
  drawText(ctx, "Qty", X_LEFT + 6, top + 5, { size: 8, bold: true });
  drawText(ctx, "Description", X_QTY_END + 6, top + 5, { size: 8, bold: true });
  drawTextRight(ctx, "Unit price", X_UNIT_PRICE, top + 5, { size: 8, bold: true });
  drawTextRight(ctx, "Line total", X_RIGHT - 6, top + 5, { size: 8, bold: true });
}

function drawLines(ctx: Ctx, property: RefuelingPropertyFactValue): number {
  const top = 190;
  drawTableHead(ctx, top);
  const row = top + 18;
  const cost = `$ ${fmtMoney(property.cost)}`;
  drawBox(ctx, X_LEFT, row, X_RIGHT - X_LEFT, 58);
  drawText(ctx, "1", X_LEFT + 6, row + 8, { size: 10 });
  drawText(ctx, property.description, X_QTY_END + 6, row + 8, { size: 10 });
  drawText(ctx, "- Charger with one charging port, and its mounting", X_QTY_END + 6, row + 24, {
    size: 8,
  });
  drawText(ctx, "- Panel breaker and wiring for this charger only", X_QTY_END + 6, row + 35, {
    size: 8,
  });
  drawText(ctx, "- Installation labor", X_QTY_END + 6, row + 46, { size: 8 });
  drawTextRight(ctx, cost, X_UNIT_PRICE, row + 8, { size: 10 });
  drawTextRight(ctx, cost, X_RIGHT - 6, row + 8, { size: 10 });
  const total = row + 58;
  drawBox(ctx, X_TOTALS, total, X_RIGHT - X_TOTALS, 20, { fill: SHADE });
  drawText(ctx, "TOTAL", X_TOTALS + 6, total + 6, { size: 9, bold: true });
  drawTextRight(ctx, cost, X_RIGHT - 6, total + 6, { size: 10, bold: true });
  drawText(ctx, "PAID", X_TOTALS + 6, total + 36, { size: 16, bold: true });
  return total + 70;
}

function drawFooter(ctx: Ctx, yTop: number) {
  const text =
    "Paid in full. Thank you for your business. Keep this invoice with your tax records. The " +
    "installer gives no tax advice and does not certify that the property qualifies for any credit.";
  drawWrapped(ctx, text, X_LEFT, yTop, X_RIGHT - X_LEFT, { size: 8.5, lineGap: 3 });
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function refuelingPropertyInvoicePdf(
  property: RefuelingPropertyFactValue,
  parties: InvoiceParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawHeader(ctx, parties, property);
  drawCustomer(ctx, parties, property);
  drawFooter(ctx, drawLines(ctx, property));
  return doc.save();
}
