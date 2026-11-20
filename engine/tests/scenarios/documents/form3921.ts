/*
 * Form 3921, Exercise of an Incentive Stock Option Under Section 422(b), Copy B.
 * The layout, box numbers and labels follow the official form (Rev. April 2025):
 * https://www.irs.gov/pub/irs-pdf/f3921.pdf
 */

import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import type { IsoExerciseFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  wrapText,
  type Ctx,
} from "./draw.js";

export interface Form3921Parties {
  employerStreet: string;
  employerCityStateZip: string;
  employeeName: string;
  employeeTin: string;
  employeeStreet: string;
  employeeCityStateZip: string;
}

/* Column edges, left to right. Box 4 is wider than the form-name cell above it. */
const X_LEFT = 50;
const X_BOXES = 295;
const X_NAME_CELL = 396;
const X_NAME_CELL_END = 482;
const X_GRID_END = 497;
const X_PAGE_END = 576;

/* Row edges, top to bottom. */
const Y_TOP = 36;
const Y_BOX_2 = 72;
const Y_ROW_2 = 108;
const Y_EMPLOYEE = 132;
const Y_BOX_5 = 144;
const Y_BOX_6 = 168;
const Y_ACCOUNT = 216;
const Y_END = 240;

const LABEL = { size: 6.5, lineGap: 1 };
const GRAY = rgb(0.75, 0.75, 0.75);

/* A cell with its label at the top left. A box number in the label prints as on the form. */
function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, xEnd - xPos - 8, LABEL);
}

const value = (ctx: Ctx, text: string, xPos: number, yPos: number) =>
  drawText(ctx, text, xPos + 8, yPos, { size: 9 });

function drawParties(ctx: Ctx, iso: IsoExerciseFactValue, parties: Form3921Parties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_BOXES,
    Y_ROW_2,
    "TRANSFEROR’S name, street address, city or town, state or province, country, and ZIP " +
      "or foreign postal code",
  );
  [iso.employerName, parties.employerStreet, parties.employerCityStateZip].forEach((line, index) =>
    value(ctx, line, X_LEFT, Y_TOP + 26 + index * 12),
  );
  const xTinSplit = X_LEFT + 122;
  cell(ctx, X_LEFT, Y_ROW_2, xTinSplit, Y_EMPLOYEE, "TRANSFEROR’S TIN");
  value(ctx, iso.employerTin ?? "", X_LEFT, Y_ROW_2 + 13);
  cell(ctx, xTinSplit, Y_ROW_2, X_BOXES, Y_EMPLOYEE, "EMPLOYEE’S TIN");
  value(ctx, parties.employeeTin, xTinSplit, Y_ROW_2 + 13);

  /* The name and the address share one cell on the form. */
  cell(ctx, X_LEFT, Y_EMPLOYEE, X_BOXES, Y_ACCOUNT, "EMPLOYEE’S name");
  value(ctx, parties.employeeName, X_LEFT, Y_EMPLOYEE + 14);
  drawText(ctx, "Street address (including apt. no.)", X_LEFT + 4, Y_EMPLOYEE + 36, LABEL);
  value(ctx, parties.employeeStreet, X_LEFT, Y_EMPLOYEE + 45);
  drawText(
    ctx,
    "City or town, state or province, country, and ZIP or foreign postal code",
    X_LEFT + 4,
    Y_EMPLOYEE + 60,
    LABEL,
  );
  value(ctx, parties.employeeCityStateZip, X_LEFT, Y_EMPLOYEE + 69);
  cell(ctx, X_LEFT, Y_ACCOUNT, X_BOXES, Y_END, "Account number (see instructions)");
}

/* Boxes 3 and 4 are prices for one share, so they print with cents. */
function drawBoxes(ctx: Ctx, iso: IsoExerciseFactValue) {
  cell(ctx, X_BOXES, Y_TOP, X_NAME_CELL, Y_BOX_2, "1 Date option granted");
  value(ctx, iso.box1, X_BOXES, Y_TOP + 20);
  cell(ctx, X_BOXES, Y_BOX_2, X_NAME_CELL, Y_ROW_2, "2 Date option exercised");
  value(ctx, iso.box2, X_BOXES, Y_BOX_2 + 20);
  cell(ctx, X_BOXES, Y_ROW_2, X_NAME_CELL, Y_BOX_5, "3 Exercise price per share");
  value(ctx, `$ ${fmtMoney(iso.box3)}`, X_BOXES - 6, Y_ROW_2 + 24);
  cell(
    ctx,
    X_NAME_CELL,
    Y_ROW_2,
    X_GRID_END,
    Y_BOX_5,
    "4 Fair market value per share on exercise date",
  );
  value(ctx, `$ ${fmtMoney(iso.box4)}`, X_NAME_CELL - 6, Y_ROW_2 + 24);
  /* A share count has no cents: 5,000. */
  const [shares] = fmtMoney(iso.box5).split(".");
  cell(ctx, X_BOXES, Y_BOX_5, X_NAME_CELL, Y_BOX_6, "5 No. of shares transferred");
  value(ctx, shares, X_BOXES, Y_BOX_5 + 13);
  drawBox(ctx, X_NAME_CELL, Y_BOX_5, X_GRID_END - X_NAME_CELL, Y_BOX_6 - Y_BOX_5, { fill: GRAY });
  cell(
    ctx,
    X_BOXES,
    Y_BOX_6,
    X_GRID_END,
    Y_END,
    "6 If other than TRANSFEROR, name, address, and TIN of corporation whose stock is being " +
      "transferred",
  );
}

/* Lines of text that end at the page's right edge, as in the form's right column. */
function drawRightLines(
  ctx: Ctx,
  lines: string[],
  yPos: number,
  opts: { size: number; bold?: boolean },
) {
  lines.forEach((line, index) =>
    drawTextRight(ctx, line, X_PAGE_END, yPos + index * (opts.size + 1.5), opts),
  );
}

function drawFormName(ctx: Ctx) {
  drawBox(ctx, X_NAME_CELL, Y_TOP, X_NAME_CELL_END - X_NAME_CELL, Y_ROW_2 - Y_TOP);
  drawText(ctx, "OMB No. 1545-2129", X_NAME_CELL + 12, Y_TOP + 4, { size: 6.5 });
  drawText(ctx, "Form 3921", X_NAME_CELL + 9, Y_TOP + 22, { size: 14, bold: true });
  drawText(ctx, "(Rev. April 2025)", X_NAME_CELL + 14, Y_TOP + 56, { size: 7 });
  drawRightLines(
    ctx,
    ["Exercise of an", "Incentive Stock", "Option Under", "Section 422(b)"],
    Y_TOP + 12,
    { size: 10.5, bold: true },
  );
}

function drawCopyB(ctx: Ctx) {
  drawRightLines(ctx, ["Copy B"], Y_ROW_2 + 2, { size: 10, bold: true });
  drawRightLines(ctx, ["For Employee"], Y_ROW_2 + 15, { size: 8, bold: true });
  const notice =
    "This is important tax information and is being furnished to the IRS. If you are required " +
    "to file a return, a negligence penalty or other sanction may be imposed on you if this " +
    "item is required to be reported and the IRS determines that it has not been reported.";
  const size = 6.5;
  drawRightLines(ctx, wrapText(ctx.reg, notice, X_PAGE_END - X_GRID_END - 6, size), Y_ROW_2 + 29, {
    size,
  });
}

function drawEdges(ctx: Ctx) {
  drawBox(ctx, 245, Y_TOP - 11, 9, 9);
  drawText(ctx, "CORRECTED (if checked)", 259, Y_TOP - 10, { size: 9 });
  const yFooter = Y_END + 4;
  drawText(ctx, "Form", X_LEFT, yFooter + 2, { size: 6.5 });
  drawText(ctx, "3921", X_LEFT + 18, yFooter, { size: 9, bold: true });
  drawText(ctx, "(Rev. 4-2025)", X_LEFT + 42, yFooter + 2, { size: 6.5 });
  drawText(ctx, "(keep for your records)", 183, yFooter + 1, { size: 7.5 });
  drawText(ctx, "www.irs.gov/Form3921", 302, yFooter + 2, { size: 6.5 });
  drawTextRight(
    ctx,
    "Department of the Treasury - Internal Revenue Service",
    X_PAGE_END,
    yFooter + 2,
    {
      size: 6.5,
    },
  );
}

export async function form3921Pdf(
  iso: IsoExerciseFactValue,
  parties: Form3921Parties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawParties(ctx, iso, parties);
  drawBoxes(ctx, iso);
  drawFormName(ctx);
  drawCopyB(ctx);
  drawEdges(ctx);
  return doc.save();
}
