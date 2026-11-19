/*
 * Form 3921, Exercise of an Incentive Stock Option Under Section 422(b), Copy B.
 * Box numbers and labels follow the official form (Rev. April 2025).
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { IsoExerciseFactValue } from "../../../src/facts/index.js";
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

export interface Form3921Parties {
  employerStreet: string;
  employerCityStateZip: string;
  employeeName: string;
  employeeTin: string;
  employeeStreet: string;
  employeeCityStateZip: string;
}

const X0 = 36;
const LEFT_W = 290;
const BOX_W = 125;
const X_BOXES = X0 + LEFT_W;
const X_END = X_BOXES + BOX_W * 2;
const LINE_H = 12;

/* A labeled cell: the label wraps at the top, the lines of the value sit at the bottom. */
function cell(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  label: string,
  lines: string[] = [],
) {
  drawBox(ctx, xPos, yPos, width, height);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, width - 8, { size: 6.5, bold: true, lineGap: 1 });
  lines.forEach((line, index) => {
    const fromBottom = (lines.length - 1 - index) * LINE_H;
    drawText(ctx, line, xPos + 8, yPos + height - 14 - fromBottom, { size: 9 });
  });
}

function drawFooter(ctx: Ctx) {
  drawTextRight(ctx, "CORRECTED (if checked)", X_BOXES - 8, 40, { size: 7 });
  drawText(ctx, "Form 3921", X0, 290, { size: 11, bold: true });
  drawText(ctx, "(Rev. April 2025)", X0 + 62, 291, { size: 7 });
  drawText(ctx, "(keep for your records)", X0 + 130, 291, { size: 7 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, 291, {
    size: 7,
  });
  drawWrapped(
    ctx,
    "Copy B For Employee. This is important tax information and is being furnished to the " +
      "IRS. If you are required to file a return, a negligence penalty or other sanction may " +
      "be imposed on you if this item is required to be reported and the IRS determines that " +
      "it has not been reported.",
    X0,
    306,
    X_END - X0,
    { size: 7, lineGap: 1 },
  );
}

function drawParties(ctx: Ctx, value: IsoExerciseFactValue, parties: Form3921Parties) {
  cell(
    ctx,
    X0,
    50,
    LEFT_W,
    80,
    "TRANSFEROR’S name, street address, city or town, state or province, country, and ZIP " +
      "or foreign postal code",
    [value.employerName, parties.employerStreet, parties.employerCityStateZip],
  );
  cell(ctx, X0, 130, LEFT_W / 2, 40, "TRANSFEROR’S TIN", [value.employerTin ?? ""]);
  cell(ctx, X0 + LEFT_W / 2, 130, LEFT_W / 2, 40, "EMPLOYEE’S TIN", [parties.employeeTin]);
  cell(ctx, X0, 170, LEFT_W, 36, "EMPLOYEE’S name", [parties.employeeName]);
  cell(ctx, X0, 206, LEFT_W, 36, "Street address (including apt. no.)", [parties.employeeStreet]);
  cell(
    ctx,
    X0,
    242,
    LEFT_W,
    36,
    "City or town, state or province, country, and ZIP or foreign postal code",
    [parties.employeeCityStateZip],
  );
}

/* Boxes 3 and 4 are prices for one share, so they print with cents. */
function drawBoxes(ctx: Ctx, value: IsoExerciseFactValue) {
  cell(ctx, X_BOXES, 50, BOX_W, 40, "1 Date option granted", [value.box1]);
  cell(ctx, X_BOXES + BOX_W, 50, BOX_W, 40, "2 Date option exercised", [value.box2]);
  cell(ctx, X_BOXES, 90, BOX_W, 40, "3 Exercise price per share", [`$${fmtMoney(value.box3)}`]);
  cell(ctx, X_BOXES + BOX_W, 90, BOX_W, 40, "4 Fair market value per share on exercise date", [
    `$${fmtMoney(value.box4)}`,
  ]);
  /* A share count has no cents: 5,000. */
  const [shares] = fmtMoney(value.box5).split(".");
  cell(ctx, X_BOXES, 130, BOX_W, 40, "5 No. of shares transferred", [shares]);
  cell(ctx, X_BOXES + BOX_W, 130, BOX_W, 40, "OMB No. 1545-2129");
  cell(
    ctx,
    X_BOXES,
    170,
    BOX_W * 2,
    108,
    "6 If other than TRANSFEROR, name, address, and TIN of corporation whose stock is being " +
      "transferred",
  );
  drawWrapped(
    ctx,
    "Exercise of an Incentive Stock Option Under Section 422(b)",
    X_BOXES + 8,
    236,
    BOX_W * 2 - 16,
    { size: 9, bold: true, lineGap: 2 },
  );
}

export async function form3921Pdf(
  value: IsoExerciseFactValue,
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
  drawParties(ctx, value, parties);
  drawBoxes(ctx, value);
  drawFooter(ctx);
  return doc.save();
}
