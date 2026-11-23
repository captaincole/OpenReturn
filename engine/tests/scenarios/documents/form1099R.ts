/*
 * Form 1099-R, Distributions From Pensions, Annuities, Retirement or
 * Profit-Sharing Plans, IRAs, Insurance Contracts, etc., Copy B for Recipient.
 * The box numbers and labels follow the official form (2025):
 * https://www.irs.gov/pub/irs-pdf/f1099r.pdf
 * It prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { RetirementDistributionFactValue } from "../../../src/facts/index.js";
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

export interface Form1099RParties {
  payerStreet: string;
  payerCityStateZip: string;
  payerPhone?: string;
  recipientName: string;
  recipientTin: string;
  recipientStreet: string;
  recipientCityStateZip: string;
  accountNumber?: string;
}

/* Column edges, left to right: the parties, two columns of boxes, the form's title. */
const X_LEFT = 36;
const X_BOXES = 290;
const X_SPLIT = 395;
const X_TITLE = 500;
const X_END = 576;

/* Row edges, top to bottom. */
const Y_TOP = 40;
const ROW = 30;
const rowY = (index: number) => Y_TOP + index * ROW;

const LABEL = { size: 6, lineGap: 1 };
const VALUE = { size: 8.5 };

type Box = RetirementDistributionFactValue;

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

const moneyText = (amount: number | undefined) =>
  amount === undefined ? "" : `$ ${fmtMoney(amount)}`;

/* A box of one row with its value at the right edge. */
function valueCell(ctx: Ctx, xPos: number, row: number, xEnd: number, label: string, text = "") {
  cell(ctx, xPos, rowY(row), xEnd, rowY(row + 1), label);
  drawTextRight(ctx, text, xEnd - 5, rowY(row) + 19, VALUE);
}

/* A checkbox, with an X when checked. */
function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean | undefined) {
  drawBox(ctx, xPos, yPos, 8, 8);
  if (checked === true) drawText(ctx, "X", xPos + 1.5, yPos + 0.5, { size: 7.5, bold: true });
}

/* A percentage as printed, 40 for 40%; blank when the form shows none. */
const percentText = (percent: number | undefined) => (percent === undefined ? "" : String(percent));

function drawPayer(ctx: Ctx, form: Box, parties: Form1099RParties) {
  cell(
    ctx,
    X_LEFT,
    rowY(0),
    X_BOXES,
    rowY(3),
    "PAYER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.",
  );
  const lines = [form.payerName, parties.payerStreet, parties.payerCityStateZip];
  if (parties.payerPhone !== undefined) lines.push(parties.payerPhone);
  if (form.planName !== undefined) lines.push(`Plan name: ${form.planName}`);
  lines.forEach((line, index) => drawText(ctx, line, X_LEFT + 6, rowY(0) + 20 + index * 11, VALUE));
  const xTinSplit = X_LEFT + 127;
  cell(ctx, X_LEFT, rowY(3), xTinSplit, rowY(4), "PAYER’S TIN");
  drawText(ctx, form.payerTin ?? "", X_LEFT + 6, rowY(3) + 17, VALUE);
  cell(ctx, xTinSplit, rowY(3), X_BOXES, rowY(4), "RECIPIENT’S TIN");
  drawText(ctx, parties.recipientTin, xTinSplit + 6, rowY(3) + 17, VALUE);
}

function drawRecipient(ctx: Ctx, form: Box, parties: Form1099RParties) {
  const rows: Array<[string, string]> = [
    ["RECIPIENT’S name", parties.recipientName],
    ["Street address (including apt. no.)", parties.recipientStreet],
    [
      "City or town, state or province, country, and ZIP or foreign postal code",
      parties.recipientCityStateZip,
    ],
  ];
  rows.forEach(([label, text], index) => {
    cell(ctx, X_LEFT, rowY(4 + index), X_BOXES, rowY(5 + index), label);
    drawText(ctx, text, X_LEFT + 6, rowY(4 + index) + 17, VALUE);
  });
  const xBox11 = X_LEFT + 96;
  const xBox12 = X_LEFT + 180;
  valueCell(
    ctx,
    X_LEFT,
    7,
    xBox11,
    "10 Amount allocable to IRR within 5 years",
    moneyText(form.box10),
  );
  valueCell(
    ctx,
    xBox11,
    7,
    xBox12,
    "11 1st year of desig. Roth contrib.",
    form.box11 === undefined ? "" : String(form.box11),
  );
  cell(ctx, xBox12, rowY(7), X_BOXES, rowY(8), "12 FATCA filing requirement");
  checkbox(ctx, X_BOXES - 16, rowY(7) + 19, form.box12);
  cell(ctx, X_LEFT, rowY(8), xBox12, rowY(9), "Account number (see instructions)");
  drawText(ctx, parties.accountNumber ?? "", X_LEFT + 6, rowY(8) + 17, VALUE);
  valueCell(ctx, xBox12, 8, X_BOXES, "13 Date of payment", form.box13 ?? "");
}

/* Boxes 1 to 6 and 9b: a label and an amount. */
function drawAmounts(ctx: Ctx, form: Box) {
  valueCell(ctx, X_BOXES, 0, X_SPLIT, "1 Gross distribution", moneyText(form.box1));
  valueCell(ctx, X_BOXES, 1, X_SPLIT, "2a Taxable amount", moneyText(form.box2a));
  const pairs: Array<[number, string, number | undefined, string, number | undefined]> = [
    [
      3,
      "3 Capital gain (included in box 2a)",
      form.box3,
      "4 Federal income tax withheld",
      form.box4,
    ],
    [
      4,
      "5 Employee contributions/ Designated Roth contributions or insurance premiums",
      form.box5,
      "6 Net unrealized appreciation in employer’s securities",
      form.box6,
    ],
  ];
  pairs.forEach(([row, leftLabel, left, rightLabel, right]) => {
    valueCell(ctx, X_BOXES, row, X_SPLIT, leftLabel, moneyText(left));
    valueCell(ctx, X_SPLIT, row, X_TITLE, rightLabel, moneyText(right));
  });
  valueCell(ctx, X_SPLIT, 6, X_TITLE, "9b Total employee contributions", moneyText(form.box9b));
}

/* Box 2b's two checkboxes, box 7 with its IRA/SEP/SIMPLE box, box 8 with its percentage, box 9a. */
function drawCodesAndChecks(ctx: Ctx, form: Box) {
  cell(ctx, X_BOXES, rowY(2), X_SPLIT, rowY(3), "2b Taxable amount not determined");
  checkbox(ctx, X_SPLIT - 16, rowY(2) + 19, form.box2b?.taxableAmountNotDetermined);
  cell(ctx, X_SPLIT, rowY(2), X_TITLE, rowY(3), "Total distribution");
  checkbox(ctx, X_TITLE - 16, rowY(2) + 19, form.box2b?.totalDistribution);
  const xIra = X_BOXES + 52;
  cell(ctx, X_BOXES, rowY(5), xIra, rowY(6), "7 Distribution code(s)");
  drawText(ctx, form.box7, X_BOXES + 8, rowY(5) + 19, { size: 9, bold: true });
  cell(ctx, xIra, rowY(5), X_SPLIT, rowY(6), "IRA/ SEP/ SIMPLE");
  checkbox(ctx, X_SPLIT - 16, rowY(5) + 19, form.box7IraSepSimple);
  cell(ctx, X_SPLIT, rowY(5), X_TITLE, rowY(6), "8 Other");
  drawText(ctx, moneyText(form.box8) || "$", X_SPLIT + 5, rowY(5) + 19, VALUE);
  drawTextRight(ctx, `${percentText(form.box8Percent)} %`, X_TITLE - 5, rowY(5) + 19, VALUE);
  valueCell(
    ctx,
    X_BOXES,
    6,
    X_SPLIT,
    "9a Your percentage of total distribution",
    `${percentText(form.box9a)} %`,
  );
}

/* Boxes 14 to 19: the state row and the local row, three boxes each. */
function drawStateAndLocal(ctx: Ctx, form: Box) {
  const width = (X_TITLE - X_BOXES) / 3;
  const columns = [X_BOXES, X_BOXES + width, X_BOXES + 2 * width, X_TITLE];
  const rows: Array<[number, Array<[string, string]>]> = [
    [
      7,
      [
        ["14 State tax withheld", moneyText(form.box14)],
        ["15 State/Payer’s state no.", form.box15 ?? ""],
        ["16 State distribution", moneyText(form.box16)],
      ],
    ],
    [
      8,
      [
        ["17 Local tax withheld", moneyText(form.box17)],
        ["18 Name of locality", form.box18 ?? ""],
        ["19 Local distribution", moneyText(form.box19)],
      ],
    ],
  ];
  rows.forEach(([row, boxes]) =>
    boxes.forEach(([label, text], index) =>
      valueCell(ctx, columns[index], row, columns[index + 1], label, text),
    ),
  );
}

/* The form's name in the cell beside boxes 1 to 2a, and its title and Copy B in the right column. */
function drawTitle(ctx: Ctx, taxYear: number) {
  drawBox(ctx, X_SPLIT, rowY(0), X_TITLE - X_SPLIT, rowY(2) - rowY(0));
  drawText(ctx, "OMB No. 1545-0119", X_SPLIT + 5, rowY(0) + 4, { size: 6 });
  drawText(ctx, String(taxYear), X_SPLIT + 35, rowY(0) + 16, { size: 14, bold: true });
  drawText(ctx, "Form 1099-R", X_SPLIT + 26, rowY(0) + 38, { size: 9, bold: true });
  drawBox(ctx, X_TITLE, rowY(0), X_END - X_TITLE, rowY(9) - rowY(0));
  const title =
    "Distributions From Pensions, Annuities, Retirement or Profit-Sharing Plans, IRAs, Insurance Contracts, etc.";
  drawWrapped(ctx, title, X_TITLE + 5, rowY(0) + 5, X_END - X_TITLE - 10, { size: 7, bold: true });
  drawText(ctx, "Copy B", X_TITLE + 5, rowY(3) + 6, { size: 10, bold: true });
  const notice =
    "Report this income on your federal tax return. If this form shows federal income tax withheld in box 4, attach this copy to your return. This information is being furnished to the IRS.";
  drawWrapped(ctx, notice, X_TITLE + 5, rowY(3) + 22, X_END - X_TITLE - 10, { size: 6 });
}

function drawEdges(ctx: Ctx) {
  checkbox(ctx, X_BOXES - 60, Y_TOP - 12, false);
  drawText(ctx, "CORRECTED (if checked)", X_BOXES - 48, Y_TOP - 11, { size: 8 });
  const yFooter = rowY(9) + 4;
  drawText(ctx, "Form 1099-R", X_LEFT, yFooter, { size: 8, bold: true });
  drawText(ctx, "www.irs.gov/Form1099R", X_BOXES - 40, yFooter, { size: 6.5 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, yFooter, {
    size: 6.5,
  });
}

export async function form1099RPdf(
  form: RetirementDistributionFactValue,
  parties: Form1099RParties,
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
  drawPayer(ctx, form, parties);
  drawRecipient(ctx, form, parties);
  drawAmounts(ctx, form);
  drawCodesAndChecks(ctx, form);
  drawStateAndLocal(ctx, form);
  drawTitle(ctx, taxYear);
  drawEdges(ctx);
  return doc.save();
}
