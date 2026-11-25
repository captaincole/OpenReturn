/*
 * An installer's invoice for one item of refueling property (an electric
 * vehicle charger with one charging port). The IRS publishes no form for it;
 * the contents follow Publication 6027: keep "receipts verifying your purchase
 * and any associated labor costs for installation". It prints only what the
 * fact holds: the item's description, the date it was finished and working
 * (Schedule A (Form 8911) line 5) and its total cost (line 8). The census tract,
 * the main home and the business use are the taxpayer's answers, not on it.
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
const X_AMOUNT = 480;

function drawHeader(ctx: Ctx, parties: InvoiceParties) {
  drawText(ctx, parties.installerName, X_LEFT, 40, { size: 15, bold: true });
  drawText(ctx, parties.installerStreet, X_LEFT, 60, { size: 9 });
  drawText(ctx, parties.installerCityStateZip, X_LEFT, 72, { size: 9 });
  drawText(ctx, `Electrical contractor license ${parties.installerLicense}`, X_LEFT, 84, {
    size: 9,
  });
  drawTextRight(ctx, "INVOICE", X_RIGHT, 40, { size: 15, bold: true });
  drawTextRight(ctx, `Invoice number ${parties.invoiceNumber}`, X_RIGHT, 60, { size: 9 });
}

function drawCustomer(ctx: Ctx, parties: InvoiceParties, property: RefuelingPropertyFactValue) {
  drawText(ctx, "Bill to and installed at", X_LEFT, 116, { size: 8, bold: true });
  drawText(ctx, parties.customerName, X_LEFT, 130, { size: 10 });
  drawText(ctx, parties.customerStreet, X_LEFT, 143, { size: 10 });
  drawText(ctx, parties.customerCityStateZip, X_LEFT, 156, { size: 10 });
  drawTextRight(ctx, "Installed and working on", X_RIGHT, 116, { size: 8, bold: true });
  drawTextRight(ctx, property.placedInServiceDate, X_RIGHT, 130, { size: 10 });
}

function drawLines(ctx: Ctx, property: RefuelingPropertyFactValue): number {
  const top = 190;
  drawBox(ctx, X_LEFT, top, X_RIGHT - X_LEFT, 18, { fill: SHADE });
  drawText(ctx, "Description", X_LEFT + 6, top + 5, { size: 8, bold: true });
  drawTextRight(ctx, "Amount", X_RIGHT - 6, top + 5, { size: 8, bold: true });
  const row = top + 18;
  drawBox(ctx, X_LEFT, row, X_RIGHT - X_LEFT, 46);
  drawText(ctx, property.description, X_LEFT + 6, row + 8, { size: 10 });
  drawText(
    ctx,
    "Charger with one charging port, mounting, panel and wiring for this charger only, and labor",
    X_LEFT + 6,
    row + 24,
    { size: 8 },
  );
  drawTextRight(ctx, `$ ${fmtMoney(property.cost)}`, X_RIGHT - 6, row + 8, { size: 10 });
  const total = row + 46;
  drawBox(ctx, X_AMOUNT - 90, total, X_RIGHT - X_AMOUNT + 90, 20, { fill: SHADE });
  drawText(ctx, "Total paid", X_AMOUNT - 84, total + 6, { size: 9, bold: true });
  drawTextRight(ctx, `$ ${fmtMoney(property.cost)}`, X_RIGHT - 6, total + 6, {
    size: 10,
    bold: true,
  });
  return total + 40;
}

function drawFooter(ctx: Ctx, yTop: number) {
  const text =
    "Paid in full. Keep this invoice with your tax records. The installer gives no tax advice " +
    "and does not certify that the property qualifies for any credit.";
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
  drawHeader(ctx, parties);
  drawCustomer(ctx, parties, property);
  drawFooter(ctx, drawLines(ctx, property));
  return doc.save();
}
