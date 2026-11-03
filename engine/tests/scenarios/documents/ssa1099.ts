/*
 * Form SSA-1099, Social Security Benefit Statement. Box numbers and labels follow the
 * sample in Publication 915 (2025), page 20 (Form SSA-1099-SM (1-2026)).
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { SocialSecurityFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextCenter,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface Ssa1099Beneficiary {
  name: string;
  ssn: string;
  street: string;
  cityStateZip: string;
}

const X0 = 36;
const X_END = 576;
const COL3 = (X_END - X0) / 3;
const HALF = (X_END - X0) / 2;

const money = (amount: number): string => `$${fmtMoney(amount)}`;
/* SSA prints NONE in an optional box with no amount (boxes 4 and 6). */
const moneyOrNone = (amount: number | undefined): string =>
  amount === undefined || amount === 0 ? "NONE" : money(amount);

/* A labeled cell: the label wraps at the top, the value sits at the bottom. */
function cell(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  label: string,
  value = "",
) {
  drawBox(ctx, xPos, yPos, width, height);
  drawWrapped(ctx, label, xPos + 4, yPos + 4, width - 8, { size: 7, bold: true, lineGap: 1 });
  if (value) drawText(ctx, value, xPos + 8, yPos + height - 16, { size: 10 });
}

function drawHeader(ctx: Ctx, year: number) {
  drawText(ctx, "FORM SSA-1099 – SOCIAL SECURITY BENEFIT STATEMENT", X0, 44, {
    size: 11,
    bold: true,
  });
  drawText(
    ctx,
    "•  PART OF YOUR SOCIAL SECURITY BENEFITS SHOWN IN BOX 5 MAY BE TAXABLE INCOME.",
    X0,
    62,
    { size: 7 },
  );
  drawText(ctx, "•  SEE THE REVERSE FOR MORE INFORMATION.", X0, 72, { size: 7 });
  drawTextRight(ctx, String(year), X_END, 40, { size: 22, bold: true });
}

function drawDescription(ctx: Ctx, xPos: number, yPos: number, rows: [string, string][]) {
  rows.forEach(([label, value], i) => {
    drawText(ctx, label, xPos + 8, yPos + 20 + i * 13, { size: 8 });
    drawTextRight(ctx, value, xPos + HALF - 10, yPos + 20 + i * 13, { size: 8 });
  });
}

/* Box 3 is printed even when the fact gives only box 5: box 5 = box 3 − box 4. */
export async function ssa1099Pdf(
  value: SocialSecurityFactValue,
  beneficiary: Ssa1099Beneficiary,
  year: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  drawHeader(ctx, year);

  cell(ctx, X0, 90, COL3 * 2, 40, "Box 1. Name", beneficiary.name.toUpperCase());
  cell(
    ctx,
    X0 + COL3 * 2,
    90,
    COL3,
    40,
    "Box 2. Beneficiary’s Social Security Number",
    beneficiary.ssn,
  );

  cell(ctx, X0, 130, COL3, 40, `Box 3. Benefits Paid in ${year}`, moneyOrNone(value.box3));
  cell(
    ctx,
    X0 + COL3,
    130,
    COL3,
    40,
    `Box 4. Benefits Repaid to SSA in ${year}`,
    moneyOrNone(value.box4),
  );
  cell(
    ctx,
    X0 + COL3 * 2,
    130,
    COL3,
    40,
    `Box 5. Net Benefits for ${year} (Box 3 minus Box 4)`,
    money(value.box5),
  );

  cell(ctx, X0, 170, HALF, 90, "DESCRIPTION OF AMOUNT IN BOX 3");
  drawDescription(ctx, X0, 170, [
    ["Paid by check or direct deposit", moneyOrNone(value.box3)],
    [`Benefits for ${year}`, moneyOrNone(value.box3)],
  ]);
  cell(ctx, X0 + HALF, 170, HALF, 90, "DESCRIPTION OF AMOUNT IN BOX 4");
  drawDescription(ctx, X0 + HALF, 170, [["Benefits repaid to SSA", moneyOrNone(value.box4)]]);

  cell(
    ctx,
    X0,
    260,
    COL3,
    60,
    "Box 6. Voluntary Federal Income Tax Withheld",
    moneyOrNone(value.box6),
  );
  cell(ctx, X0 + COL3, 260, COL3, 60, "Box 7. Address");
  drawText(ctx, beneficiary.name.toUpperCase(), X0 + COL3 + 8, 280, { size: 8 });
  drawText(ctx, beneficiary.street.toUpperCase(), X0 + COL3 + 8, 291, { size: 8 });
  drawText(ctx, beneficiary.cityStateZip.toUpperCase(), X0 + COL3 + 8, 302, { size: 8 });
  /* The claim number for benefits on your own record is your SSN with the letter A. */
  cell(
    ctx,
    X0 + COL3 * 2,
    260,
    COL3,
    60,
    "Box 8. Claim Number (Use this number if you need to contact SSA.)",
    `${beneficiary.ssn}A`,
  );

  drawText(ctx, `Form SSA-1099-SM (1-${year + 1})`, X0, 328, { size: 7 });
  drawTextCenter(ctx, "DO NOT RETURN THIS FORM TO SSA OR IRS", (X0 + X_END) / 2, 328, {
    size: 8,
    bold: true,
  });

  return await doc.save();
}
