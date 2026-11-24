/*
 * A foreign fund's year-end statement to a U.S. shareholder. For a QEF it is
 * the PFIC Annual Information Statement: the pro rata share of the ordinary
 * earnings and net capital gain (irs-8621-inst-2025::sec::annual-election-requirements-of-the-pfic-or::b01).
 * For any fund it shows the shares and their value at the end of the year
 * ("periodic account statements", irs-8621-inst-2025::sec::line-4::b01), the
 * distributions with the tax withheld, and the proceeds of a sale. No official
 * form exists. It prints only the values the fund fact holds; the basis, the
 * exchange rates and the elections are the shareholder's own records.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { PficFundFactValue } from "../../../src/facts/index.js";
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

export interface PficStatementParties {
  shareholderName: string;
  accountNumber: string;
}

const X_LEFT = 54;
const X_END = 558;
const ROW_HEIGHT = 20;

function row(ctx: Ctx, yPos: number, label: string, amount: string): number {
  drawText(ctx, label, X_LEFT + 6, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_END - 6, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 13, X_END, yPos + 13);
  return yPos + ROW_HEIGHT;
}

function heading(ctx: Ctx, yPos: number, text: string): number {
  drawText(ctx, text, X_LEFT, yPos, { size: 10, bold: true });
  return yPos + ROW_HEIGHT;
}

function holdingRows(ctx: Ctx, fund: PficFundFactValue, yStart: number): number {
  let yPos = heading(ctx, yStart, "Your holding at December 31");
  yPos = row(ctx, yPos, "Share class", fund.shareClass);
  yPos = row(ctx, yPos, "Shares held", String(fund.sharesAtYearEnd));
  const currency = fund.currencyCode ?? "USD";
  return row(
    ctx,
    yPos,
    `Market value (${currency})`,
    `${currency} ${fmtMoney(fund.valueAtYearEnd)}`,
  );
}

function distributionRows(ctx: Ctx, fund: PficFundFactValue, yStart: number): number {
  const distributions = fund.section1291?.distributions ?? [];
  if (distributions.length === 0) return yStart;
  const currency = fund.currencyCode ?? "USD";
  let yPos = heading(ctx, yStart, `Distributions paid (${currency})`);
  for (const each of distributions) {
    yPos = row(ctx, yPos, `Paid ${each.date}`, `${currency} ${fmtMoney(each.amount)}`);
    if (each.foreignTaxWithheld !== undefined)
      yPos = row(
        ctx,
        yPos,
        `   Tax withheld at source`,
        `${currency} ${fmtMoney(each.foreignTaxWithheld)}`,
      );
  }
  return yPos;
}

function qefRows(ctx: Ctx, fund: PficFundFactValue, yStart: number): number {
  const qef = fund.qef;
  if (qef === undefined) return yStart;
  let yPos = heading(ctx, yStart, "PFIC Annual Information Statement (USD)");
  yPos = row(
    ctx,
    yPos,
    "Your pro rata share of ordinary earnings",
    `$ ${fmtMoney(qef.ordinaryEarnings)}`,
  );
  yPos = row(
    ctx,
    yPos,
    "Your pro rata share of net capital gain",
    `$ ${fmtMoney(qef.netCapitalGain)}`,
  );
  if (qef.ordinaryEarningsExcluded !== undefined)
    yPos = row(
      ctx,
      yPos,
      "Ordinary earnings excluded under section 1293(g)",
      `$ ${fmtMoney(qef.ordinaryEarningsExcluded)}`,
    );
  if (qef.netCapitalGainExcluded !== undefined)
    yPos = row(
      ctx,
      yPos,
      "Net capital gain excluded under section 1293(g)",
      `$ ${fmtMoney(qef.netCapitalGainExcluded)}`,
    );
  if (qef.distributions !== undefined)
    yPos = row(ctx, yPos, "Cash and property distributed", `$ ${fmtMoney(qef.distributions)}`);
  return yPos;
}

function saleRows(ctx: Ctx, fund: PficFundFactValue, yStart: number): number {
  const sale = fund.disposition;
  if (sale === undefined) return yStart;
  const currency = fund.currencyCode ?? "USD";
  const yPos = heading(ctx, yStart, `Shares redeemed or sold (${currency})`);
  return row(
    ctx,
    yPos,
    `Proceeds, trade date ${sale.date}`,
    `${currency} ${fmtMoney(sale.amountRealized)}`,
  );
}

export async function pficFundStatementPdf(
  fund: PficFundFactValue,
  parties: PficStatementParties,
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
  drawText(ctx, fund.fundName, X_LEFT, 54, { size: 13, bold: true });
  drawText(ctx, fund.fundAddress, X_LEFT, 72, { size: 9 });
  if (fund.fundEin !== undefined) drawText(ctx, `EIN ${fund.fundEin}`, X_LEFT, 86, { size: 9 });
  const title = fund.qef ? "PFIC Annual Information Statement" : "Annual Shareholder Statement";
  drawText(ctx, `${taxYear} ${title}`, X_LEFT, 112, { size: 12, bold: true });
  drawText(ctx, `Shareholder: ${parties.shareholderName}`, X_LEFT, 136, { size: 9 });
  drawText(ctx, `Account: ${parties.accountNumber}`, X_LEFT, 150, { size: 9 });
  drawWrapped(
    ctx,
    "This statement reports your holding and the fund's payments to you for the calendar year. The fund is a foreign corporation; keep this statement with your tax records.",
    X_LEFT,
    174,
    X_END - X_LEFT,
    { size: 8 },
  );
  drawBox(ctx, X_LEFT, 204, X_END - X_LEFT, 0.5);
  let yPos = holdingRows(ctx, fund, 216);
  yPos = distributionRows(ctx, fund, yPos + 8);
  yPos = qefRows(ctx, fund, yPos + 8);
  saleRows(ctx, fund, yPos + 8);
  return doc.save();
}
