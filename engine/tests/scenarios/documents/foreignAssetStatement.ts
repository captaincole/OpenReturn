/*
 * A foreign institution's year-end statement for one account or holding. No
 * official form exists, so the layout follows a common retail bank statement:
 * page 1 has the institution, the holder's address, a service block and an
 * account summary; page 2 has the amounts for the U.S. return, which some
 * foreign banks and registrars send their U.S. clients. It prints only the
 * values the facts hold: the Form 8938 asset fact (balances in the account's
 * currency, dates, the institution or issuer) and, when the account has them,
 * the income facts (amounts in U.S. dollars). Every institution is made up
 * and the page carries no real bank's name or mark.
 */

import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
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
  /* The holder's mailing address, one printed line each. */
  holderAddress?: string[];
  taxYear: number;
}

export interface ForeignAssetIncome {
  interest?: InterestFactValue;
  dividends?: DividendFactValue;
  trades?: TradeFactValue[];
}

const X_LEFT = 54;
const X_END = 558;
const X_SERVICE = 356;
const X_SUMMARY_END = 340;

const WORDMARK_BLUE = rgb(0, 0.36, 0.69);
const SECTION_RED = rgb(0.84, 0.08, 0.2);
const TOTAL_BLUE = rgb(0, 0.4, 0.72);

const PRODUCT: Record<ForeignFinancialAssetFactValue["part"], string> = {
  deposit_account: "Deposit Account",
  custodial_account: "Custody Account",
  other_asset: "Holding",
};

const SAMPLE_NOTICE = "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.";

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

const periodOf = (taxYear: number) => `1 January ${taxYear} to 31 December ${taxYear}`;

/* The institution's name as a coloured wordmark, with its address in small print. */
function drawWordmark(ctx: Ctx, value: ForeignFinancialAssetFactValue, size: number) {
  const issuer = issuerOf(value);
  drawText(ctx, issuer?.name ?? "", X_LEFT, 40, { size, bold: true, color: WORDMARK_BLUE });
  return issuer;
}

function drawHolderBlock(ctx: Ctx, parties: ForeignAssetStatementParties) {
  const lines = [parties.holderNames, ...(parties.holderAddress ?? [])];
  lines.forEach((line, index) =>
    drawText(ctx, line.toUpperCase(), X_LEFT + 8, 150 + index * 12, { size: 9 }),
  );
}

function drawServiceBlock(ctx: Ctx, value: ForeignFinancialAssetFactValue) {
  const issuer = issuerOf(value);
  drawText(ctx, "Customer service information", X_SERVICE, 96, { size: 9.5, bold: true });
  if (!issuer) return;
  const lines = [
    `${issuer.label}:`,
    issuer.name,
    ...addressLines(issuer.address),
    ...(issuer.giin ? [`GIIN ${issuer.giin}`] : []),
  ];
  lines.forEach((line, index) => drawText(ctx, line, X_SERVICE, 124 + index * 13, { size: 8.5 }));
}

function drawNotice(ctx: Ctx, hasTaxPage: boolean) {
  drawBox(ctx, X_LEFT, 250, X_END - X_LEFT, 20, { fill: SHADE });
  const text = hasTaxPage
    ? "Please see the U.S. tax information section of your statement for the amounts in U.S. dollars."
    : "This statement covers the calendar year. Keep it with your tax records.";
  drawText(ctx, text, X_LEFT + 6, 256, { size: 8.5 });
}

function drawTitle(
  ctx: Ctx,
  value: ForeignFinancialAssetFactValue,
  parties: ForeignAssetStatementParties,
) {
  const title = `Your ${PRODUCT[value.part]}`;
  drawText(ctx, title, X_LEFT, 300, { size: 17, bold: true });
  drawText(ctx, "for", X_LEFT + ctx.bold.widthOfTextAtSize(title, 17) + 6, 306, { size: 10 });
  drawText(ctx, periodOf(parties.taxYear), X_LEFT, 324, { size: 10 });
  drawText(ctx, `Account number: ${value.accountNumber}`, X_SERVICE, 324, { size: 10 });
  drawText(ctx, parties.holderNames.toUpperCase(), X_LEFT, 342, { size: 9, bold: true });
}

function summaryRow(ctx: Ctx, yPos: number, label: string, amount: string): number {
  drawText(ctx, label, X_LEFT, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_SUMMARY_END, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 15, X_SUMMARY_END, yPos + 15);
  return yPos + 22;
}

/* The account summary: the facts of the asset, the year-end value last and in colour. */
function drawSummary(ctx: Ctx, value: ForeignFinancialAssetFactValue, taxYear: number) {
  drawText(ctx, "Account summary", X_LEFT, 364, { size: 14, color: SECTION_RED });
  const currency = value.conversion?.currency ?? "U.S. dollar (USD)";
  let yPos = summaryRow(ctx, 390, "Currency", currency);
  if (value.description) yPos = summaryRow(ctx, yPos, "Holding", value.description);
  if (value.openedOrAcquired)
    yPos = summaryRow(ctx, yPos, "Opened or acquired", value.openedOrAcquired);
  if (value.closedOrDisposed)
    yPos = summaryRow(ctx, yPos, "Closed or disposed of", value.closedOrDisposed);
  yPos = summaryRow(ctx, yPos, "Highest value during the year", fmtMoney(value.maximumValue));
  const ending = { size: 9.5, bold: true, color: TOTAL_BLUE };
  drawText(ctx, `Value on 31 December ${taxYear}`, X_LEFT, yPos, ending);
  drawTextRight(ctx, fmtMoney(value.yearEndValue), X_SUMMARY_END, yPos, ending);
}

function drawFooter(ctx: Ctx, pageNumber: number, pageCount: number) {
  drawLine(ctx, X_LEFT, PAGE_H - 58, X_END, PAGE_H - 58);
  drawText(ctx, SAMPLE_NOTICE, X_LEFT, PAGE_H - 52, { size: 6.5, italic: true });
  drawTextRight(ctx, `Page ${pageNumber} of ${pageCount}`, X_END, PAGE_H - 52, { size: 8 });
}

type AmountRow = [label: string, amount: number];

function incomeRows(income: ForeignAssetIncome): AmountRow[] {
  const rows: Array<[string, number | undefined]> = [
    ["Interest credited", income.interest?.box1],
    ["Dividends paid", income.dividends?.box1a],
  ];
  return rows.filter((row): row is AmountRow => row[1] !== undefined);
}

function subtractionRows(income: ForeignAssetIncome): AmountRow[] {
  const rows: Array<[string, number | undefined]> = [
    ["Penalty for early withdrawal of a time deposit", income.interest?.box2],
    ["Foreign tax withheld on interest", income.interest?.box6],
    ["Foreign tax withheld on dividends", income.dividends?.box7],
  ];
  return rows.filter((row): row is AmountRow => row[1] !== undefined);
}

function tableHead(ctx: Ctx, yPos: number, title: string, columns: string[]): number {
  drawText(ctx, title, X_LEFT, yPos, { size: 14, color: SECTION_RED });
  drawText(ctx, columns[0] ?? "", X_LEFT, yPos + 20, { size: 7.5 });
  drawTextRight(ctx, columns[1] ?? "", X_END, yPos + 20, { size: 7.5 });
  drawLine(ctx, X_LEFT, yPos + 31, X_END, yPos + 31);
  return yPos + 37;
}

function tableRow(ctx: Ctx, yPos: number, label: string, amount: string): number {
  drawText(ctx, label, X_LEFT, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_END, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 15, X_END, yPos + 15);
  return yPos + 21;
}

/* One section of page 2: its rows, then the total in colour. Subtractions print with a minus. */
function drawAmountTable(
  ctx: Ctx,
  yTop: number,
  title: string,
  rows: AmountRow[],
  sign: 1 | -1,
): number {
  if (rows.length === 0) return yTop;
  let yPos = tableHead(ctx, yTop, title, ["Description", "Amount (USD)"]);
  for (const [label, amount] of rows) yPos = tableRow(ctx, yPos, label, fmtMoney(sign * amount));
  const cents = rows.reduce((total, [, amount]) => total + Math.round(amount * 100), 0);
  const total = { size: 9.5, bold: true, color: TOTAL_BLUE };
  drawText(ctx, `Total ${title.toLowerCase()}`, X_LEFT, yPos, total);
  drawTextRight(ctx, fmtMoney((sign * cents) / 100), X_END, yPos, total);
  return yPos + 40;
}

function drawSales(ctx: Ctx, yTop: number, trades: TradeFactValue[]): number {
  if (trades.length === 0) return yTop;
  let yPos = tableHead(ctx, yTop, "Sales", ["Description", "Amount (USD)"]);
  for (const trade of trades) {
    const dates = `acquired ${trade.dateAcquired ?? ""}, sold ${trade.dateSold}`;
    yPos = tableRow(
      ctx,
      yPos,
      `${trade.description}: ${dates}, proceeds`,
      fmtMoney(trade.proceeds),
    );
    yPos = tableRow(ctx, yPos, `${trade.description}: cost`, fmtMoney(trade.costBasis ?? 0));
  }
  return yPos + 19;
}

/* Page 2: the strip that names the account, then the amounts for the U.S. return. */
function drawTaxPage(
  ctx: Ctx,
  value: ForeignFinancialAssetFactValue,
  income: ForeignAssetIncome,
  parties: ForeignAssetStatementParties,
) {
  drawWordmark(ctx, value, 13);
  const strip = [
    parties.holderNames.toUpperCase(),
    `Account # ${value.accountNumber}`,
    periodOf(parties.taxYear),
  ].join("   |   ");
  drawText(ctx, strip, X_LEFT, 64, { size: 8 });
  drawLine(ctx, X_LEFT, 78, X_END, 78);
  drawText(ctx, "U.S. tax information: all amounts on this page are in U.S. dollars.", X_LEFT, 92, {
    size: 8.5,
    italic: true,
  });
  let yPos = drawAmountTable(ctx, 124, "Income and other additions", incomeRows(income), 1);
  yPos = drawAmountTable(
    ctx,
    yPos,
    "Tax withheld and other subtractions",
    subtractionRows(income),
    -1,
  );
  drawSales(ctx, yPos, income.trades ?? []);
}

function hasTaxAmounts(income: ForeignAssetIncome): boolean {
  const rows = incomeRows(income).length + subtractionRows(income).length;
  return rows + (income.trades ?? []).length > 0;
}

export async function foreignAssetStatementPdf(
  value: ForeignFinancialAssetFactValue,
  income: ForeignAssetIncome,
  parties: ForeignAssetStatementParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const withTaxPage = hasTaxAmounts(income);
  const pageCount = withTaxPage ? 2 : 1;

  const first: Ctx = { page: doc.addPage([PAGE_W, PAGE_H]), ...fonts };
  const issuer = drawWordmark(first, value, 18);
  (issuer ? addressLines(issuer.address) : []).forEach((line, index) =>
    drawText(first, line, X_LEFT, 64 + index * 9, { size: 6.5 }),
  );
  drawHolderBlock(first, parties);
  drawServiceBlock(first, value);
  drawNotice(first, withTaxPage);
  drawTitle(first, value, parties);
  drawSummary(first, value, parties.taxYear);
  drawFooter(first, 1, pageCount);

  if (withTaxPage) {
    const second: Ctx = { page: doc.addPage([PAGE_W, PAGE_H]), ...fonts };
    drawTaxPage(second, value, income, parties);
    drawFooter(second, 2, pageCount);
  }
  return doc.save();
}
