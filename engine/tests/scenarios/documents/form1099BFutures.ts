/*
 * Form 1099-B, Proceeds From Broker and Barter Exchange Transactions, Copy B
 * for Recipient, as a broker sends it for regulated futures, foreign currency
 * and section 1256 option contracts: boxes 8 to 11 only. The box numbers and
 * labels follow the official form for 2025: https://www.irs.gov/pub/irs-pdf/f1099b.pdf
 * It prints only the values the fact holds. A loss prints in parentheses, as
 * the box labels write it: "Profit or (loss)".
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Section1256StatementFactValue } from "../../../src/facts/index.js";
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

export interface Form1099BFuturesParties {
  payerStreet: string;
  payerCityStateZip: string;
  payerTin: string;
  recipientName: string;
  recipientTin: string;
  recipientStreet: string;
  recipientCityStateZip: string;
}

/* Column edges, left to right: the parties, two columns of boxes, the form name. */
const X_LEFT = 36;
const X_MID = 284;
const X_SPLIT = 391;
const X_GRID_END = 498;
const X_END = 576;

const Y_TOP = 40;
const ROW = 28;
const ROWS = 11;
const Y_END = Y_TOP + ROWS * ROW;

const LABEL = { size: 6.5, lineGap: 1 };

const yRow = (row: number) => Y_TOP + row * ROW;

function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, yEnd: number, label: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, yEnd - yPos);
  drawWrapped(ctx, label, xPos + 3, yPos + 3, xEnd - xPos - 6, LABEL);
}

/* "(1,250.00)" for a loss, "9,840.00" for a profit, blank for a box the fact leaves out. */
function profitOrLoss(amount: number | undefined): string {
  if (amount === undefined) return "";
  const printed = fmtMoney(Math.abs(amount));
  return amount < 0 ? `$ (${printed})` : `$ ${printed}`;
}

type BoxCell = { label: string; text: string };

/* The boxes on the right, two to a row, in the official order. Only 8 to 11 print a value. */
function boxRows(form: Section1256StatementFactValue, taxYear: number): BoxCell[][] {
  const empty = (label: string): BoxCell => ({ label, text: "" });
  return [
    [empty("1b Date acquired"), empty("1c Date sold or disposed")],
    [empty("1d Proceeds"), empty("1e Cost or other basis")],
    [empty("1f Accrued market discount"), empty("1g Wash sale loss disallowed")],
    [
      empty("2 Short-term gain or loss / Long-term gain or loss / Ordinary"),
      empty("3 If checked, proceeds from: Collectibles / QOF"),
    ],
    [empty("4 Federal income tax withheld"), empty("5 If checked, noncovered security")],
    [
      empty("6 Reported to IRS: Gross proceeds / Net proceeds"),
      empty("7 If checked, loss is not allowed based on amount in 1d"),
    ],
    [
      {
        label: `8 Profit or (loss) realized in ${taxYear} on closed contracts`,
        text: profitOrLoss(form.box8),
      },
      {
        label: `9 Unrealized profit or (loss) on open contracts—12/31/${taxYear - 1}`,
        text: profitOrLoss(form.box9),
      },
    ],
    [
      {
        label: `10 Unrealized profit or (loss) on open contracts—12/31/${taxYear}`,
        text: profitOrLoss(form.box10),
      },
      { label: "11 Aggregate profit or (loss) on contracts", text: profitOrLoss(form.box11) },
    ],
    [empty("12 If checked, basis reported to IRS"), empty("13 Bartering")],
  ];
}

function drawBoxes(ctx: Ctx, form: Section1256StatementFactValue, taxYear: number) {
  cell(ctx, X_MID, yRow(0), X_SPLIT, yRow(1), "Applicable checkbox on Form 8949");
  cell(
    ctx,
    X_MID,
    yRow(1),
    X_GRID_END,
    yRow(2),
    "1a Description of property (Example: 100 sh. XYZ Co.)",
  );
  boxRows(form, taxYear).forEach((row, index) => {
    const yPos = yRow(index + 2);
    row.forEach(({ label, text }, column) => {
      const xPos = column === 0 ? X_MID : X_SPLIT;
      const xEnd = column === 0 ? X_SPLIT : X_GRID_END;
      cell(ctx, xPos, yPos, xEnd, yPos + ROW, label);
      drawTextRight(ctx, text, xEnd - 5, yPos + 17, { size: 9 });
    });
  });
}

const value = (ctx: Ctx, text: string, xPos: number, yPos: number) =>
  drawText(ctx, text, xPos + 6, yPos, { size: 9 });

function drawParties(
  ctx: Ctx,
  form: Section1256StatementFactValue,
  parties: Form1099BFuturesParties,
) {
  cell(
    ctx,
    X_LEFT,
    yRow(0),
    X_MID,
    yRow(3),
    "PAYER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.",
  );
  [form.brokerName, parties.payerStreet, parties.payerCityStateZip].forEach((line, index) =>
    value(ctx, line, X_LEFT, yRow(0) + 28 + index * 12),
  );
  const xTinSplit = X_LEFT + 124;
  cell(ctx, X_LEFT, yRow(3), xTinSplit, yRow(4), "PAYER’S TIN");
  value(ctx, parties.payerTin, X_LEFT, yRow(3) + 15);
  cell(ctx, xTinSplit, yRow(3), X_MID, yRow(4), "RECIPIENT’S TIN");
  value(ctx, parties.recipientTin, xTinSplit, yRow(3) + 15);
  cell(
    ctx,
    X_LEFT,
    yRow(4),
    X_MID,
    yRow(7),
    "RECIPIENT’S name, street address (including apt. no.), city or town, state or province, country, and ZIP or foreign postal code",
  );
  [parties.recipientName, parties.recipientStreet, parties.recipientCityStateZip].forEach(
    (line, index) => value(ctx, line, X_LEFT, yRow(4) + 28 + index * 12),
  );
  cell(ctx, X_LEFT, yRow(7), X_MID, yRow(8), "Account number (see instructions)");
  value(ctx, form.accountNumber ?? "", X_LEFT, yRow(7) + 15);
  cell(ctx, X_LEFT, yRow(8), X_LEFT + 160, yRow(9), "CUSIP number");
  cell(ctx, X_LEFT + 160, yRow(8), X_MID, yRow(9), "FATCA filing requirement");
  drawStateRow(ctx);
}

/* Boxes 14 to 16 span the last two rows on the left. */
function drawStateRow(ctx: Ctx) {
  const xState = X_LEFT + 74;
  const xStateId = X_LEFT + 170;
  cell(ctx, X_LEFT, yRow(9), xState, Y_END, "14 State name");
  cell(ctx, xState, yRow(9), xStateId, Y_END, "15 State identification no.");
  cell(ctx, xStateId, yRow(9), X_MID, Y_END, "16 State tax withheld");
}

function drawFormName(ctx: Ctx, taxYear: number) {
  drawBox(ctx, X_SPLIT, yRow(0), X_GRID_END - X_SPLIT, ROW);
  drawText(ctx, "OMB No. 1545-0715", X_SPLIT + 4, yRow(0) + 3, { size: 6.5 });
  drawText(ctx, String(taxYear), X_SPLIT + 36, yRow(0) + 12, { size: 12, bold: true });
  ["Proceeds From", "Broker and", "Barter Exchange", "Transactions"].forEach((line, index) =>
    drawTextRight(ctx, line, X_END, yRow(0) + 2 + index * 10.5, { size: 9, bold: true }),
  );
  drawTextRight(ctx, "Copy B", X_END, yRow(2) + 4, { size: 10, bold: true });
  drawTextRight(ctx, "For Recipient", X_END, yRow(2) + 17, { size: 8, bold: true });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. If you are required " +
      "to file a return, a negligence penalty or other sanction may be imposed on you if this " +
      "income is taxable and the IRS determines that it has not been reported.",
    X_GRID_END + 4,
    yRow(3) + 6,
    X_END - X_GRID_END - 4,
    { size: 6.5, lineGap: 1.5 },
  );
}

function drawEdges(ctx: Ctx) {
  drawBox(ctx, 230, Y_TOP - 12, 9, 9);
  drawText(ctx, "CORRECTED (if checked)", 244, Y_TOP - 11, { size: 9 });
  const yFooter = Y_END + 5;
  drawText(ctx, "Form", X_LEFT, yFooter + 2, { size: 6.5 });
  drawText(ctx, "1099-B", X_LEFT + 18, yFooter, { size: 9, bold: true });
  drawText(ctx, "(keep for your records)", 150, yFooter + 1, { size: 7.5 });
  drawText(ctx, "www.irs.gov/Form1099B", 290, yFooter + 2, { size: 6.5 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, yFooter + 2, {
    size: 6.5,
  });
}

export async function form1099BFuturesPdf(
  form: Section1256StatementFactValue,
  parties: Form1099BFuturesParties,
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
  drawParties(ctx, form, parties);
  drawBoxes(ctx, form, taxYear);
  drawFormName(ctx, taxYear);
  drawEdges(ctx);
  return doc.save();
}
