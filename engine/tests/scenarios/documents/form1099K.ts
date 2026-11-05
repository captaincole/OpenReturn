/*
 * Form 1099-K, Payment Card and Third Party Network Transactions, Copy B (For
 * Payee). Box numbers, labels and layout follow the IRS form, Rev. March 2024,
 * the revision for calendar year 2025 (irs.gov/pub/irs-prior/f1099k--2024.pdf).
 * It prints only the values the fact holds: the monthly boxes 5a–5l have no fact
 * fields, so they stay empty.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { PaymentTransactionsFactValue } from "../../../src/facts/index.js";
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

export interface Form1099KFiler {
  name: string;
  street: string;
  cityStateZip: string;
  phone?: string;
}

export interface Form1099KPayee {
  name: string;
  tin: string;
  street: string;
  cityStateZip: string;
}

const X0 = 36;
const X_MID1 = 276; // the left block ends here
const X_MID2 = 396;
const X_TITLE = 506;
const X_END = 576;
const TOP = 64;
const MONTH_TOP = 240;
const MONTH_ROW = 26;
const STATE_TOP = MONTH_TOP + MONTH_ROW * 6;
const BOTTOM = STATE_TOP + 34;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_LETTERS = "abcdefghijkl";

/* A labeled cell: the label at the top, the value at the bottom. */
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
  drawWrapped(ctx, label, xPos + 3, yPos + 3, width - 6, { size: 6.5, lineGap: 1 });
  if (value) drawText(ctx, value, xPos + 6, yPos + height - 13, { size: 9.5 });
}

/* A money cell: a "$" at the bottom left, the amount (when the fact has one) after it. */
function moneyCell(
  ctx: Ctx,
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  label: string,
  amount: number | undefined,
) {
  cell(ctx, xPos, yPos, width, height, label);
  drawText(ctx, "$", xPos + 3, yPos + height - 13, { size: 9.5 });
  if (amount !== undefined) {
    drawText(ctx, fmtMoney(amount), xPos + 12, yPos + height - 13, { size: 9.5 });
  }
}

function checkbox(ctx: Ctx, xPos: number, yPos: number, label: string, checked: boolean) {
  drawWrapped(ctx, label, xPos, yPos, 92, { size: 6.5, lineGap: 1 });
  drawBox(ctx, xPos + 98, yPos, 8, 8);
  if (checked) drawText(ctx, "X", xPos + 99.5, yPos + 0.5, { size: 8, bold: true });
}

function drawLeftBlock(
  ctx: Ctx,
  value: PaymentTransactionsFactValue,
  filer: Form1099KFiler,
  payee: Form1099KPayee,
) {
  const width = X_MID1 - X0;
  const half = width / 2;
  cell(
    ctx,
    X0,
    TOP,
    width,
    126,
    "FILER’S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.",
  );
  [filer.name, filer.street, filer.cityStateZip, filer.phone ?? ""].forEach((line, index) =>
    drawText(ctx, line, X0 + 6, TOP + 26 + index * 12, { size: 9.5 }),
  );

  drawBox(ctx, X0, 190, half, 50);
  drawWrapped(ctx, "Check to indicate if FILER is a (an):", X0 + 3, 193, half - 6, { size: 6.5 });
  checkbox(
    ctx,
    X0 + 6,
    207,
    "Payment settlement entity (PSE)",
    value.filerType === "payment_settlement_entity",
  );
  checkbox(
    ctx,
    X0 + 6,
    222,
    "Electronic Payment Facilitator (EPF)/Other third party",
    value.filerType === "electronic_payment_facilitator",
  );
  drawBox(ctx, X0 + half, 190, half, 50);
  drawWrapped(ctx, "Check to indicate transactions reported are:", X0 + half + 3, 193, half - 6, {
    size: 6.5,
  });
  checkbox(ctx, X0 + half + 6, 207, "Payment card", value.transactionType === "payment_card");
  checkbox(
    ctx,
    X0 + half + 6,
    222,
    "Third party network",
    value.transactionType === "third_party_network",
  );

  cell(ctx, X0, 240, width, 32, "PAYEE’S name", payee.name);
  cell(ctx, X0, 272, width, 32, "Street address (including apt. no.)", payee.street);
  cell(
    ctx,
    X0,
    304,
    width,
    32,
    "City or town, state or province, country, and ZIP or foreign postal code",
    payee.cityStateZip,
  );
  cell(ctx, X0, 336, width, 30, "PSE’S name and telephone number");
  cell(
    ctx,
    X0,
    366,
    width,
    STATE_TOP + 34 - 366,
    "Account number (see instructions)",
    value.accountNumber,
  );
}

function drawMiddleBlock(
  ctx: Ctx,
  value: PaymentTransactionsFactValue,
  payee: Form1099KPayee,
  year: number,
) {
  const wide = X_MID2 - X_MID1;
  const narrow = X_TITLE - X_MID2;
  cell(ctx, X_MID1, TOP, wide, 28, "FILER’S TIN", value.filerTin);
  cell(ctx, X_MID1, TOP + 28, wide, 28, "PAYEE’S TIN", payee.tin);
  moneyCell(
    ctx,
    X_MID1,
    TOP + 56,
    wide,
    56,
    "1a  Gross amount of payment card/third party network transactions",
    value.box1a,
  );

  drawBox(ctx, X_MID2, TOP, narrow, 78);
  drawText(ctx, "OMB No. 1545-2205", X_MID2 + 4, TOP + 4, { size: 6.5 });
  drawText(ctx, "Form", X_MID2 + 4, TOP + 26, { size: 7 });
  drawText(ctx, "1099-K", X_MID2 + 22, TOP + 20, { size: 16, bold: true });
  drawText(ctx, "(Rev. March 2024)", X_MID2 + 18, TOP + 46, { size: 7 });
  drawBox(ctx, X_MID2, TOP + 78, narrow, 34);
  drawText(ctx, "For calendar year", X_MID2 + 18, TOP + 82, { size: 7 });
  drawText(ctx, String(year), X_MID2 + 38, TOP + 96, { size: 10, bold: true });

  moneyCell(ctx, X_MID1, 176, wide, 36, "1b  Card Not Present transactions", value.box1b);
  cell(ctx, X_MID2, 176, narrow, 36, "2  Merchant category code", value.box2);
  cell(
    ctx,
    X_MID1,
    212,
    wide,
    28,
    "3  Number of payment transactions",
    value.box3 === undefined ? "" : String(value.box3),
  );
  moneyCell(ctx, X_MID2, 212, narrow, 28, "4  Federal income tax withheld", value.box4);

  MONTHS.forEach((month, index) => {
    const column = index % 2;
    const row = (index - column) / 2;
    moneyCell(
      ctx,
      column === 0 ? X_MID1 : X_MID2,
      MONTH_TOP + row * MONTH_ROW,
      column === 0 ? wide : narrow,
      MONTH_ROW,
      `5${MONTH_LETTERS[index]}  ${month}`,
      undefined,
    );
  });

  cell(ctx, X_MID1, STATE_TOP, wide, 34, "6  State", value.box6);
  cell(ctx, X_MID2, STATE_TOP, narrow, 34, "7  State identification no.", value.box7);
  moneyCell(
    ctx,
    X_TITLE,
    STATE_TOP,
    X_END - X_TITLE,
    34,
    "8  State income tax withheld",
    value.box8,
  );
}

function drawTitleColumn(ctx: Ctx) {
  const width = X_END - X_TITLE;
  ["Payment Card", "and Third", "Party Network", "Transactions"].forEach((line, index) =>
    drawTextRight(ctx, line, X_END - 2, TOP + 6 + index * 12, { size: 9, bold: true }),
  );
  drawTextRight(ctx, "Copy B", X_END - 2, 186, { size: 10, bold: true });
  drawTextRight(ctx, "For Payee", X_END - 2, 199, { size: 8, bold: true });
  drawWrapped(
    ctx,
    "This is important tax information and is being furnished to the IRS. If you are required to file a return, a negligence penalty or other sanction may be imposed on you if taxable income results from this transaction and the IRS determines that it has not been reported.",
    X_TITLE + 4,
    218,
    width - 6,
    { size: 5.5, lineGap: 1 },
  );
}

export async function form1099KPdf(
  value: PaymentTransactionsFactValue,
  filer: Form1099KFiler,
  payee: Form1099KPayee,
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

  drawBox(ctx, X0 + 150, 44, 9, 9);
  drawText(ctx, "VOID", X0 + 163, 45, { size: 9 });
  drawBox(ctx, X0 + 210, 44, 9, 9);
  drawText(ctx, "CORRECTED", X0 + 223, 45, { size: 9 });

  drawLeftBlock(ctx, value, filer, payee);
  drawMiddleBlock(ctx, value, payee, year);
  drawTitleColumn(ctx);

  drawText(ctx, "Form 1099-K (Rev. 3-2024)", X0, BOTTOM + 6, { size: 7 });
  drawText(ctx, "www.irs.gov/Form1099K", X_MID1, BOTTOM + 6, { size: 7 });
  drawTextRight(ctx, "Department of the Treasury - Internal Revenue Service", X_END, BOTTOM + 6, {
    size: 7,
  });

  return await doc.save();
}
