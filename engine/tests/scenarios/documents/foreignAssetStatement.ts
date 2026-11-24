/*
 * A foreign institution's year-end statement for one account or holding, with
 * the U.S. tax annex that some foreign banks and registrars send their U.S.
 * clients. No official form exists. It prints only the values the facts hold:
 * the Form 8938 asset fact (balances in the account's currency, dates, the
 * institution or issuer) and, when the account has them, the income facts
 * (amounts in U.S. dollars, as the annex states them).
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type {
  DividendFactValue,
  ForeignAddress,
  ForeignFinancialAssetFactValue,
  InterestFactValue,
  TradeFactValue,
} from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawLine,
  drawText,
  drawTextRight,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface ForeignAssetStatementParties {
  holderNames: string;
  taxYear: number;
}

export interface ForeignAssetIncome {
  interest?: InterestFactValue;
  dividends?: DividendFactValue;
  trades?: TradeFactValue[];
}

const X_LEFT = 54;
const X_END = 558;

const PART_TITLE: Record<ForeignFinancialAssetFactValue["part"], string> = {
  deposit_account: "Deposit account statement",
  custodial_account: "Custody account statement",
  other_asset: "Holding statement",
};

function addressLines(address: ForeignAddress): string[] {
  const city = [address.postalCode, address.city, address.stateOrProvince]
    .filter((part) => part !== undefined && part !== "")
    .join(" ");
  return [address.street, city, address.country];
}

/* The issuing institution: the bank, the company or the bond's issuer. */
function issuerOf(value: ForeignFinancialAssetFactValue) {
  if (value.institution) return { ...value.institution, label: "Financial institution" };
  if (value.entity) return { ...value.entity, label: "Company (share register)" };
  const first = value.issuers?.[0];
  return first ? { ...first, giin: undefined, label: "Issuer" } : undefined;
}

function drawHeader(
  ctx: Ctx,
  value: ForeignFinancialAssetFactValue,
  parties: ForeignAssetStatementParties,
) {
  const issuer = issuerOf(value);
  drawText(ctx, issuer?.name ?? "", X_LEFT, 40, { size: 15, bold: true });
  (issuer ? addressLines(issuer.address) : []).forEach((line, index) =>
    drawText(ctx, line, X_LEFT, 62 + index * 12, { size: 9 }),
  );
  if (issuer?.giin) drawText(ctx, `GIIN ${issuer.giin}`, X_LEFT, 100, { size: 8.5 });
  drawText(
    ctx,
    `${PART_TITLE[value.part]}, 1 January to 31 December ${parties.taxYear}`,
    X_LEFT,
    124,
    {
      size: 11,
      bold: true,
    },
  );
  drawBox(ctx, X_LEFT, 142, X_END - X_LEFT, 44, { fill: SHADE });
  drawText(ctx, `Holder(s): ${parties.holderNames}`, X_LEFT + 8, 150, { size: 9.5 });
  drawText(ctx, `Account or certificate: ${value.accountNumber}`, X_LEFT + 8, 166, { size: 9.5 });
}

function row(ctx: Ctx, yPos: number, label: string, amount: string): number {
  drawText(ctx, label, X_LEFT + 6, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_END - 6, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 14, X_END, yPos + 14);
  return yPos + 20;
}

function drawBalances(ctx: Ctx, value: ForeignFinancialAssetFactValue, yTop: number): number {
  const currency = value.conversion?.currency ?? "U.S. dollar (USD)";
  let yPos = row(ctx, yTop, "Currency", currency);
  if (value.description) yPos = row(ctx, yPos, "Holding", value.description);
  if (value.openedOrAcquired) yPos = row(ctx, yPos, "Opened or acquired", value.openedOrAcquired);
  if (value.closedOrDisposed)
    yPos = row(ctx, yPos, "Closed or disposed of", value.closedOrDisposed);
  yPos = row(ctx, yPos, "Highest value during the year", fmtMoney(value.maximumValue));
  return row(ctx, yPos, "Value on 31 December", fmtMoney(value.yearEndValue));
}

function drawAnnex(ctx: Ctx, income: ForeignAssetIncome, yTop: number): number {
  const lines: Array<[string, number | undefined]> = [
    ["Interest credited", income.interest?.box1],
    ["Penalty for early withdrawal of a time deposit", income.interest?.box2],
    ["Foreign tax withheld on interest", income.interest?.box6],
    ["Dividends paid", income.dividends?.box1a],
    ["Foreign tax withheld on dividends", income.dividends?.box7],
  ];
  const shown = lines.filter(([, amount]) => amount !== undefined);
  const trades = income.trades ?? [];
  if (shown.length === 0 && trades.length === 0) return yTop;
  drawText(ctx, "U.S. tax annex (amounts in U.S. dollars)", X_LEFT, yTop, { size: 10, bold: true });
  let yPos = yTop + 22;
  for (const [label, amount] of shown) yPos = row(ctx, yPos, label, fmtMoney(amount ?? 0));
  for (const trade of trades) {
    yPos = row(ctx, yPos, `Sale: ${trade.description}`, "");
    yPos = row(
      ctx,
      yPos,
      `  Acquired ${trade.dateAcquired ?? ""}, sold ${trade.dateSold}: proceeds`,
      fmtMoney(trade.proceeds),
    );
    yPos = row(ctx, yPos, "  Cost", fmtMoney(trade.costBasis ?? 0));
  }
  return yPos;
}

export async function foreignAssetStatementPdf(
  value: ForeignFinancialAssetFactValue,
  income: ForeignAssetIncome,
  parties: ForeignAssetStatementParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawHeader(ctx, value, parties);
  const afterBalances = drawBalances(ctx, value, 204);
  drawAnnex(ctx, income, afterBalances + 18);
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
  return doc.save();
}
