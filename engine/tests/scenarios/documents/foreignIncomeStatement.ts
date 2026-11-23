/*
 * A fund's or broker's year-end foreign income statement: the supplement to a
 * Form 1099-DIV that says how much of the dividends is from foreign sources
 * (Form 1116 line 1a). No official form exists; this follows the layout funds
 * commonly use. It prints only the values the fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { ForeignIncomeStatementValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawLine,
  drawText,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface ForeignIncomeStatementParties {
  payerName: string;
  payerStreet: string;
  payerCityStateZip: string;
  recipientName: string;
  accountNumber: string;
  /* The 1099-DIV boxes the statement refers to. */
  box1a: number;
  box1b?: number;
  box7?: number;
}

const X_LEFT = 54;
const X_END = 558;

function row(ctx: Ctx, yPos: number, label: string, amount: string) {
  drawText(ctx, label, X_LEFT + 6, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_END - 6, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 14, X_END, yPos + 14);
}

function drawRows(
  ctx: Ctx,
  value: ForeignIncomeStatementValue,
  parties: ForeignIncomeStatementParties,
) {
  const rows: Array<[string, number | undefined]> = [
    ["Total ordinary dividends (Form 1099-DIV, box 1a)", parties.box1a],
    ["Qualified dividends (Form 1099-DIV, box 1b)", parties.box1b],
    ["Foreign tax paid (Form 1099-DIV, box 7)", parties.box7],
    ["Foreign-source income included in box 1a", value.grossIncome],
    ["Foreign-source qualified dividends included in box 1b", value.qualifiedDividends],
    [
      "Foreign-source capital gain distributions included in box 2a",
      value.capitalGainDistributions,
    ],
  ];
  let yPos = 236;
  for (const [label, amount] of rows) {
    if (amount === undefined) continue;
    row(ctx, yPos, label, `$ ${fmtMoney(amount)}`);
    yPos += 22;
  }
  if (value.country !== undefined) row(ctx, yPos, "Country", value.country);
}

export async function foreignIncomeStatementPdf(
  value: ForeignIncomeStatementValue,
  parties: ForeignIncomeStatementParties,
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
  drawText(ctx, parties.payerName, X_LEFT, 54, { size: 13, bold: true });
  drawText(ctx, `${parties.payerStreet}, ${parties.payerCityStateZip}`, X_LEFT, 72, { size: 9 });
  drawText(ctx, `${taxYear} Foreign Income and Foreign Tax Statement`, X_LEFT, 110, {
    size: 12,
    bold: true,
  });
  drawText(ctx, `Shareholder: ${parties.recipientName}`, X_LEFT, 134, { size: 9 });
  drawText(ctx, `Account: ${parties.accountNumber}`, X_LEFT, 148, { size: 9 });
  drawWrapped(
    ctx,
    "The fund elected under section 853 to pass foreign taxes through to its shareholders. Use the foreign-source amounts below for Form 1116, line 1a. This statement supplements your Form 1099-DIV; keep it with your tax records.",
    X_LEFT,
    172,
    X_END - X_LEFT,
    { size: 8 },
  );
  drawBox(ctx, X_LEFT, 222, X_END - X_LEFT, 0.5);
  drawRows(ctx, value, parties);
  return doc.save();
}
