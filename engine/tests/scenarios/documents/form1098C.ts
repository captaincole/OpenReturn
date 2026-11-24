/*
 * Form 1098-C, Contributions of Motor Vehicles, Boats, and Airplanes, Copy B
 * For Donor. The layout, box numbers and labels follow the official form
 * (Rev. April 2025): https://www.irs.gov/pub/irs-pdf/f1098c.pdf
 *
 * The noncash gift fact keeps the donee, box 1, box 3, box 4c and whether box
 * 5a or 5b is checked. The other boxes the donee prints (the vehicle's
 * mileage, year, make and model, the sale's date, box 6, box 7) are not in the
 * fact, so they come in `Form1098CBoxes`. Nothing is worked out from another value.
 */

import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import type { NoncashGiftFactValue, NoncashGiftVehicle } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface Form1098CParties {
  doneeTin: string;
  doneePhone: string;
  donorName: string;
  donorTin: string;
  donorStreet: string;
  donorCityStateZip: string;
}

/* The boxes the donee prints that the noncash gift fact does not keep, as printed. */
export interface Form1098CBoxes {
  calendarYear: number;
  box2a?: string;
  box2b: string;
  box2c: string;
  box2d: string;
  box4a: boolean;
  box4b?: string;
  /* The exception box the donee checked. It must agree with the fact's fmvException. */
  exceptionBox?: "5a" | "5b";
  box5c?: string;
  box6a: boolean;
  box6b?: number;
  box6c?: boolean;
  box7?: boolean;
}

/* Column edges, left to right. */
const X_LEFT = 52;
const X_TIN_SPLIT = 173;
const X_MID = 297;
const X_MAKE = 348;
const X_MODEL = 418;
const X_NAME_CELL = 397;
const X_NAME_CELL_END = 469;
const X_GRID_END = 496;
const X_END = 576;

/* Row edges, top to bottom. */
const Y_TOP = 47;
const Y_BOX_2A = 81;
const Y_BOX_2B = 119;
const Y_TIN = 144;
const Y_DONOR = 192;
const Y_STREET = 215;
const Y_CITY = 252;
const Y_BOX_5A = 275;
const Y_BOX_5B = 311;
const Y_BOX_5C = 346;
const Y_BOX_6A = 419;
const Y_BOX_6B = 441;
const Y_BOX_6C = 466;
const Y_BOX_7 = 538;
const Y_END = 563;

const LABEL = { size: 6.5, lineGap: 1 };
const GRAY = rgb(0.75, 0.75, 0.75);

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, xEnd - xPos - 8, LABEL);
}

const value = (ctx: Ctx, text: string, xPos: number, yPos: number) =>
  drawText(ctx, text, xPos + 8, yPos, { size: 9 });

const money = (amount: number | undefined) => (amount === undefined ? "" : fmtMoney(amount));

function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean | undefined) {
  drawBox(ctx, xPos, yPos, 8, 8);
  if (checked === true) drawText(ctx, "X", xPos + 1.5, yPos + 0.5, { size: 8, bold: true });
}

/* A cell whose label follows a checkbox, as boxes 4a, 5a and 5b print. */
function checkboxCell(
  ctx: Ctx,
  box: { x: number; y: number; xEnd: number; yEnd: number },
  number: string,
  label: string,
  checked: boolean | undefined,
) {
  drawBox(ctx, box.x, box.y, box.xEnd - box.x, box.yEnd - box.y);
  drawText(ctx, number, box.x + 4, box.y + 5, { size: 6.5, bold: true });
  checkbox(ctx, box.x + 18, box.y + 4, checked);
  drawWrapped(ctx, label, box.x + 32, box.y + 5, box.xEnd - box.x - 38, LABEL);
}

function drawDonee(ctx: Ctx, gift: NoncashGiftFactValue, parties: Form1098CParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_MID,
    Y_TIN,
    "DONEE’S name, street address, city or town, state or province, country, ZIP or foreign " +
      "postal code, and telephone no.",
  );
  const { name, street, city, state, zip } = gift.donee;
  [name, street, `${city}, ${state} ${zip}`, parties.doneePhone].forEach((line, index) =>
    value(ctx, line, X_LEFT, Y_TOP + 28 + index * 12),
  );
  cell(ctx, X_LEFT, Y_TIN, X_TIN_SPLIT, Y_DONOR, "DONEE’S TIN");
  value(ctx, parties.doneeTin, X_LEFT, Y_TIN + 20);
  cell(ctx, X_TIN_SPLIT, Y_TIN, X_MID, Y_DONOR, "DONOR’S TIN");
  value(ctx, parties.donorTin, X_TIN_SPLIT, Y_TIN + 20);
}

function drawDonor(ctx: Ctx, parties: Form1098CParties) {
  cell(ctx, X_LEFT, Y_DONOR, X_MID, Y_STREET, "DONOR’S name");
  value(ctx, parties.donorName, X_LEFT, Y_DONOR + 12);
  cell(ctx, X_LEFT, Y_STREET, X_MID, Y_CITY, "Street address (including apt. no.)");
  value(ctx, parties.donorStreet, X_LEFT, Y_STREET + 16);
  cell(
    ctx,
    X_LEFT,
    Y_CITY,
    X_MID,
    Y_BOX_5A,
    "City or town, state or province, country, and ZIP or foreign postal code",
  );
  value(ctx, parties.donorCityStateZip, X_LEFT, Y_CITY + 12);
}

/* Boxes 1 to 3: the date of the gift and the vehicle. */
function drawVehicle(
  ctx: Ctx,
  gift: NoncashGiftFactValue,
  vehicle: NoncashGiftVehicle,
  boxes: Form1098CBoxes,
) {
  cell(ctx, X_MID, Y_TOP, X_NAME_CELL, Y_BOX_2A, "1 Date of contribution");
  value(ctx, gift.contributionDate, X_MID, Y_TOP + 18);
  cell(ctx, X_MID, Y_BOX_2A, X_NAME_CELL, Y_BOX_2B, "2a Odometer mileage");
  value(ctx, boxes.box2a ?? "", X_MID, Y_BOX_2A + 20);
  cell(ctx, X_MID, Y_BOX_2B, X_MAKE, Y_TIN, "2b Year");
  value(ctx, boxes.box2b, X_MID - 4, Y_BOX_2B + 12);
  cell(ctx, X_MAKE, Y_BOX_2B, X_MODEL, Y_TIN, "2c Make");
  value(ctx, boxes.box2c, X_MAKE - 4, Y_BOX_2B + 12);
  cell(ctx, X_MODEL, Y_BOX_2B, X_GRID_END, Y_TIN, "2d Model");
  value(ctx, boxes.box2d, X_MODEL - 4, Y_BOX_2B + 12);
  cell(ctx, X_MID, Y_TIN, X_GRID_END, Y_DONOR, "3 Vehicle or other identification number");
  value(ctx, vehicle.vin ?? "", X_MID, Y_TIN + 22);
}

/* Boxes 4a to 4c: the donee's sale. */
function drawSale(ctx: Ctx, vehicle: NoncashGiftVehicle, boxes: Form1098CBoxes) {
  checkboxCell(
    ctx,
    { x: X_MID, y: Y_DONOR, xEnd: X_GRID_END, yEnd: Y_STREET },
    "4a",
    "Donee certifies that vehicle was sold in arm’s length transaction to unrelated party",
    boxes.box4a,
  );
  cell(ctx, X_MID, Y_STREET, X_GRID_END, Y_CITY, "4b Date of sale");
  value(ctx, boxes.box4b ?? "", X_MID, Y_STREET + 18);
  cell(ctx, X_MID, Y_CITY, X_GRID_END, Y_BOX_5A, "4c Gross proceeds from sale (see instructions)");
  drawText(ctx, "$", X_MID + 4, Y_CITY + 13, { size: 8 });
  value(ctx, money(vehicle.grossProceeds), X_MID + 4, Y_CITY + 12);
}

/* Boxes 5a to 5c: the exceptions that let the donor deduct the fair market value. */
function drawExceptions(ctx: Ctx, boxes: Form1098CBoxes) {
  checkboxCell(
    ctx,
    { x: X_LEFT, y: Y_BOX_5A, xEnd: X_GRID_END, yEnd: Y_BOX_5B },
    "5a",
    "Donee certifies that vehicle will not be transferred for money, other property, or " +
      "services before completion of material improvements or significant intervening use",
    boxes.exceptionBox === "5a",
  );
  checkboxCell(
    ctx,
    { x: X_LEFT, y: Y_BOX_5B, xEnd: X_GRID_END, yEnd: Y_BOX_5C },
    "5b",
    "Donee certifies that vehicle is to be transferred to a needy individual for " +
      "significantly below fair market value in furtherance of donee’s charitable purpose",
    boxes.exceptionBox === "5b",
  );
  cell(
    ctx,
    X_LEFT,
    Y_BOX_5C,
    X_GRID_END,
    Y_BOX_6A,
    "5c Donee certifies the following detailed description of material improvements or " +
      "significant intervening use and duration of use",
  );
  drawWrapped(ctx, boxes.box5c ?? "", X_LEFT + 12, Y_BOX_5C + 20, X_GRID_END - X_LEFT - 24, {
    size: 9,
  });
}

/* Boxes 6a to 7: what the donee gave in return, and the $500 limit. */
function drawExchange(ctx: Ctx, boxes: Form1098CBoxes) {
  cell(
    ctx,
    X_LEFT,
    Y_BOX_6A,
    X_GRID_END,
    Y_BOX_6B,
    "6a Did you provide goods or services in exchange for the vehicle?",
  );
  drawText(ctx, "Yes", X_GRID_END - 70, Y_BOX_6A + 6, { size: 6.5, bold: true });
  checkbox(ctx, X_GRID_END - 56, Y_BOX_6A + 5, boxes.box6a);
  drawText(ctx, "No", X_GRID_END - 34, Y_BOX_6A + 6, { size: 6.5, bold: true });
  checkbox(ctx, X_GRID_END - 22, Y_BOX_6A + 5, !boxes.box6a);
  cell(
    ctx,
    X_LEFT,
    Y_BOX_6B,
    X_GRID_END,
    Y_BOX_6C,
    "6b Value of goods and services provided in exchange for the vehicle",
  );
  drawText(ctx, "$", X_LEFT + 4, Y_BOX_6B + 14, { size: 8 });
  value(ctx, money(boxes.box6b), X_LEFT + 4, Y_BOX_6B + 13);
  checkboxAtEnd(
    ctx,
    Y_BOX_6C,
    Y_BOX_7,
    "6c Describe the goods and services, if any, that were provided. If this box is checked, " +
      "donee certifies that the goods and services consisted solely of intangible religious benefits",
    boxes.box6c,
  );
  checkboxAtEnd(
    ctx,
    Y_BOX_7,
    Y_END,
    "7 Under the law, the donor may not claim a deduction of more than $500 for this vehicle " +
      "if this box is checked",
    boxes.box7,
  );
}

/* A full-width cell with its checkbox at the right end, as boxes 6c and 7 print. */
function checkboxAtEnd(
  ctx: Ctx,
  yPos: number,
  yEnd: number,
  label: string,
  checked: boolean | undefined,
) {
  drawBox(ctx, X_LEFT, yPos, X_GRID_END - X_LEFT, yEnd - yPos);
  const yLast = drawWrapped(ctx, label, X_LEFT + 4, yPos + 4, X_GRID_END - X_LEFT - 30, LABEL);
  checkbox(ctx, X_GRID_END - 14, yLast - 8.5, checked);
}

function drawFormName(ctx: Ctx, calendarYear: number) {
  drawBox(ctx, X_NAME_CELL, Y_TOP, X_NAME_CELL_END - X_NAME_CELL, Y_BOX_2B - Y_TOP);
  drawText(ctx, "OMB No. 1545-1959", X_NAME_CELL + 4, Y_TOP + 4, { size: 6.5 });
  drawText(ctx, "Form", X_NAME_CELL + 4, Y_TOP + 20, { size: 6.5 });
  drawText(ctx, "1098-C", X_NAME_CELL + 22, Y_TOP + 15, { size: 13, bold: true });
  drawText(ctx, "(Rev. April 2025)", X_NAME_CELL + 10, Y_TOP + 36, { size: 6.5 });
  drawText(ctx, "For calendar year", X_NAME_CELL + 8, Y_TOP + 48, { size: 6.5 });
  drawText(ctx, String(calendarYear), X_NAME_CELL + 22, Y_TOP + 58, { size: 9, bold: true });
  ["Contributions of", "Motor Vehicles,", "Boats, and", "Airplanes"].forEach((line, index) =>
    drawTextRight(ctx, line, X_END, Y_TOP + 4 + index * 13, { size: 11, bold: true }),
  );
  drawTextRight(ctx, "Attachment Sequence No. 155A", X_END, Y_TOP - 10, { size: 6 });
}

function drawCopyB(ctx: Ctx) {
  drawTextRight(ctx, "Copy B", X_END, Y_STREET + 4, { size: 10, bold: true });
  drawTextRight(ctx, "For Donor", X_END, Y_CITY + 4, { size: 8, bold: true });
  const notice = [
    "In order to take",
    "a deduction of",
    "more than $500",
    "for this",
    "contribution, you",
    "must attach this",
    "copy to your",
    "federal tax",
    "return.",
  ];
  notice.forEach((line, index) =>
    drawTextRight(ctx, line, X_END, Y_BOX_5A + 10 + index * 9.5, { size: 7.5 }),
  );
  const limit = ["Unless box 5a or", "5b is checked,", "your deduction", "cannot exceed"];
  [...limit, "the amount in", "box 4c."].forEach((line, index) =>
    drawTextRight(ctx, line, X_END, Y_BOX_6A - 22 + index * 9.5, { size: 7.5, bold: true }),
  );
}

function drawEdges(ctx: Ctx) {
  drawBox(ctx, 250, Y_TOP - 11, 9, 9);
  drawText(ctx, "CORRECTED (if checked)", 262, Y_TOP - 10, { size: 8.5 });
  const yFooter = Y_END + 5;
  drawText(ctx, "Form", X_LEFT, yFooter + 2, { size: 6.5 });
  drawText(ctx, "1098-C", X_LEFT + 18, yFooter, { size: 9, bold: true });
  drawText(ctx, "(Rev. 4-2025)", X_LEFT + 52, yFooter + 2, { size: 6.5 });
  drawText(ctx, "www.irs.gov/Form1098C", 240, yFooter + 2, { size: 6.5 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, yFooter + 2, {
    size: 6.5,
  });
  drawBox(ctx, X_TIN_SPLIT - 28, Y_TIN, 28, 16, { fill: GRAY, borderColor: GRAY });
}

/* The fact must be a vehicle gift, and its exception must match the box the donee checked. */
function vehicleOf(gift: NoncashGiftFactValue, boxes: Form1098CBoxes): NoncashGiftVehicle {
  const vehicle = gift.vehicle;
  if (gift.propertyType !== "vehicle" || vehicle === undefined) {
    throw new Error("Form 1098-C needs a noncash gift fact with propertyType vehicle.");
  }
  if ((boxes.exceptionBox !== undefined) !== vehicle.fmvException) {
    throw new Error("Box 5a or 5b must be checked exactly when the fact's fmvException is true.");
  }
  return vehicle;
}

export async function form1098CPdf(
  gift: NoncashGiftFactValue,
  parties: Form1098CParties,
  boxes: Form1098CBoxes,
): Promise<Uint8Array> {
  const vehicle = vehicleOf(gift, boxes);
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawEdges(ctx);
  drawDonee(ctx, gift, parties);
  drawDonor(ctx, parties);
  drawVehicle(ctx, gift, vehicle, boxes);
  drawSale(ctx, vehicle, boxes);
  drawExceptions(ctx, boxes);
  drawExchange(ctx, boxes);
  drawFormName(ctx, boxes.calendarYear);
  drawCopyB(ctx);
  return doc.save();
}
