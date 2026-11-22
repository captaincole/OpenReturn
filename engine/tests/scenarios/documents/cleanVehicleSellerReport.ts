/*
 * The clean vehicle seller report: the copy of the time-of-sale report a
 * registered dealer files through IRS Energy Credits Online and gives the buyer.
 * The IRS publishes no paper form for it; the contents follow the Instructions
 * for Form 8936 (2025), "New Clean Vehicle Certification and Other
 * Requirements" and "Previously Owned Clean Vehicle Certification and Other
 * Requirements": the buyer's name and TIN, the VIN, the sales price (previously
 * owned), the maximum credit, and the credit transferred to the dealer. The
 * report also prints the battery capacity; the fact does not hold it, so this
 * document leaves it out.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { CleanVehicleFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawText,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface SellerReportParties {
  dealerName: string;
  dealerTin: string;
  dealerStreet: string;
  dealerCityStateZip: string;
  buyerName: string;
  buyerTin: string;
  buyerStreet: string;
  buyerCityStateZip: string;
  /* The confirmation number Energy Credits Online gave the report. */
  confirmationNumber: string;
}

const X_LEFT = 50;
const X_SPLIT = 306;
const X_RIGHT = 562;
const ROW = 34;
const LABEL = { size: 7 };

/* A cell with its label at the top left and the value under it. */
function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, ROW);
  drawText(ctx, label, xPos + 4, yPos + 4, LABEL);
  drawText(ctx, value, xPos + 8, yPos + 17, { size: 10 });
}

function drawTitle(ctx: Ctx, vehicle: CleanVehicleFactValue, parties: SellerReportParties) {
  drawText(ctx, "Clean Vehicle Seller Report", X_LEFT, 40, { size: 16, bold: true });
  const credit =
    vehicle.kind === "new"
      ? "New clean vehicle credit (section 30D)"
      : "Previously owned clean vehicle credit (section 25E)";
  drawText(ctx, `${credit}: time-of-sale report, buyer copy`, X_LEFT, 62, { size: 10 });
  drawText(
    ctx,
    `IRS Energy Credits Online confirmation number: ${parties.confirmationNumber}`,
    X_LEFT,
    78,
    {
      size: 9,
    },
  );
}

function drawParties(ctx: Ctx, parties: SellerReportParties, yTop: number): number {
  drawBox(ctx, X_LEFT, yTop, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(ctx, "Seller (registered dealer) and buyer", X_LEFT + 4, yTop + 4, {
    size: 8,
    bold: true,
  });
  const y1 = yTop + 16;
  cell(ctx, X_LEFT, y1, X_SPLIT, "Seller's name", parties.dealerName);
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Seller's TIN", parties.dealerTin);
  const y2 = y1 + ROW;
  cell(
    ctx,
    X_LEFT,
    y2,
    X_RIGHT,
    "Seller's address",
    `${parties.dealerStreet}, ${parties.dealerCityStateZip}`,
  );
  const y3 = y2 + ROW;
  cell(ctx, X_LEFT, y3, X_SPLIT, "Buyer's name", parties.buyerName);
  cell(ctx, X_SPLIT, y3, X_RIGHT, "Buyer's TIN", parties.buyerTin);
  const y4 = y3 + ROW;
  cell(
    ctx,
    X_LEFT,
    y4,
    X_RIGHT,
    "Buyer's address",
    `${parties.buyerStreet}, ${parties.buyerCityStateZip}`,
  );
  return y4 + ROW + 12;
}

const money = (amount: number | undefined) => (amount === undefined ? "" : `$ ${fmtMoney(amount)}`);

function drawSale(ctx: Ctx, vehicle: CleanVehicleFactValue, yTop: number): number {
  drawBox(ctx, X_LEFT, yTop, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(ctx, "Vehicle and sale", X_LEFT + 4, yTop + 4, { size: 8, bold: true });
  const y1 = yTop + 16;
  cell(ctx, X_LEFT, y1, X_SPLIT, "Vehicle identification number (VIN)", vehicle.vin);
  cell(
    ctx,
    X_SPLIT,
    y1,
    X_RIGHT,
    "Year, make and model",
    `${vehicle.modelYear} ${vehicle.make} ${vehicle.model}`,
  );
  const y2 = y1 + ROW;
  cell(ctx, X_LEFT, y2, X_SPLIT, "Date of sale", vehicle.acquiredDate);
  cell(ctx, X_SPLIT, y2, X_RIGHT, "Placed in service date", vehicle.placedInServiceDate);
  const y3 = y2 + ROW;
  const maximum = vehicle.kind === "new" ? vehicle.tentativeCredit : undefined;
  cell(
    ctx,
    X_LEFT,
    y3,
    X_SPLIT,
    "Sales price (previously owned vehicle)",
    money(vehicle.salesPrice),
  );
  cell(ctx, X_SPLIT, y3, X_RIGHT, "Maximum credit allowable (new vehicle)", money(maximum));
  const y4 = y3 + ROW;
  const transfer = vehicle.creditTransferredToDealer;
  cell(
    ctx,
    X_LEFT,
    y4,
    X_SPLIT,
    "Credit transferred to the dealer",
    transfer === undefined ? "No" : "Yes",
  );
  cell(ctx, X_SPLIT, y4, X_RIGHT, "Amount of credit transferred", money(transfer));
  return y4 + ROW + 14;
}

function drawNotice(ctx: Ctx, vehicle: CleanVehicleFactValue, yTop: number) {
  const use =
    vehicle.kind === "new"
      ? "The seller certifies that the original use of this vehicle begins with the buyer."
      : "The seller certifies that this is the first transfer of this vehicle since August 16, 2022, to a person eligible for the credit.";
  const text =
    `${use} The seller filed this report with the IRS. A buyer who transferred the credit ` +
    "must file Form 8936 and Schedule A (Form 8936) with the return for the year the vehicle " +
    "was placed in service. Keep this report with your tax records.";
  drawWrapped(ctx, text, X_LEFT, yTop, X_RIGHT - X_LEFT, { size: 8.5, lineGap: 3 });
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function cleanVehicleSellerReportPdf(
  vehicle: CleanVehicleFactValue,
  parties: SellerReportParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawTitle(ctx, vehicle, parties);
  const afterParties = drawParties(ctx, parties, 100);
  const afterSale = drawSale(ctx, vehicle, afterParties);
  drawNotice(ctx, vehicle, afterSale);
  return doc.save();
}
