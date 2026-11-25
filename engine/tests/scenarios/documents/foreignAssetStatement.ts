/*
 * A foreign institution's year-end statement for one account or holding. No
 * official form exists, so the layout follows a common retail bank statement:
 * page 1 has the institution, the holder's address, a service block, an
 * account summary and, for an account, its month-end balances; page 2 has the
 * income, the tax withheld and the sales of the year. Every amount is in the
 * account's own currency, as a foreign bank prints it: the statement names no
 * U.S. dollar amount and no exchange rate.
 *
 * It prints only what the facts and the statement's own balances hold: the
 * Form 8938 asset fact (currency, dates, the institution or issuer, the value on
 * the last day), the month-end balances whose highest is the fact's maximum
 * value (irs-8938-inst-2025::sec::valuing-financial-accounts::b01: "You may rely
 * on periodic account statements"), and the account's income facts as recorded,
 * in the account's currency. Every institution is made up and the page carries
 * no real bank's name or mark.
 */

import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { currencyLabel } from "../../../src/currency/currencies.js";
import type {
  DatedAmounts,
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

/* The account's income facts as recorded: amounts in the account's currency. */
export interface ForeignAssetIncome {
  interest?: InterestFactValue;
  dividends?: DividendFactValue;
  trades?: TradeFactValue[];
}

/*
 * An account's balance at the end of each month, January first; undefined for
 * a month the account was not open yet, or was closed. The highest must be the fact's maximum
 * value and December's its value on the last day, or the generator throws.
 */
export type MonthEndBalances = ReadonlyArray<number | undefined>;

const X_LEFT = 54;
const X_END = 558;
const X_SERVICE = 356;
const X_SUMMARY_END = 340;
const X_SECOND_COLUMN = 306;

const WORDMARK_BLUE = rgb(0, 0.36, 0.69);
const SECTION_RED = rgb(0.84, 0.08, 0.2);
const TOTAL_BLUE = rgb(0, 0.4, 0.72);

const PRODUCT: Record<ForeignFinancialAssetFactValue["part"], string> = {
  deposit_account: "Deposit Account",
  custodial_account: "Custody Account",
  other_asset: "Holding",
};

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

const SAMPLE_NOTICE = "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.";
const US_DOLLAR = "U.S. dollar (USD)";

function addressLines(address: ForeignAddress): string[] {
  const city = [address.postalCode, address.city, address.stateOrProvince]
    .filter((part) => part !== undefined && part !== "")
    .join(" ");
  return [address.street, city, address.country];
}

/* "Euro (EUR)", or the U.S. dollar for an asset with no foreign currency. */
const currencyOf = (value: ForeignFinancialAssetFactValue) => {
  const code = value.foreignCurrency?.code;
  return code === undefined ? US_DOLLAR : currencyLabel(code);
};

const currencyCodeOf = (value: ForeignFinancialAssetFactValue) =>
  value.foreignCurrency?.code ?? "USD";

/* "05/22/2025" as a European bank prints it: "22 May 2025". Any other text ("VARIOUS") as it is. */
function printedDate(factDate: string): string {
  const [month, day, year, ...rest] = factDate.split("/");
  const monthName = MONTHS[Number(month) - 1];
  if (rest.length > 0 || year?.length !== 4 || monthName === undefined) return factDate;
  return `${Number(day)} ${monthName} ${year}`;
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

function drawNotice(ctx: Ctx, value: ForeignFinancialAssetFactValue, hasSecondPage: boolean) {
  drawBox(ctx, X_LEFT, 250, X_END - X_LEFT, 20, { fill: SHADE });
  const amounts = `All amounts on this statement are in ${currencyOf(value)}.`;
  const text = hasSecondPage
    ? `${amounts} Income, tax withheld and sales are on page 2.`
    : `${amounts} Keep this statement with your records.`;
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
  // Right-aligned: a 27-character IBAN with its spaces is wider than the service column.
  drawTextRight(ctx, `Account number: ${value.accountNumber}`, X_END, 324, { size: 10 });
  drawText(ctx, parties.holderNames.toUpperCase(), X_LEFT, 342, { size: 9, bold: true });
}

function summaryRow(ctx: Ctx, yPos: number, label: string, amount: string): number {
  drawText(ctx, label, X_LEFT, yPos, { size: 9 });
  drawTextRight(ctx, amount, X_SUMMARY_END, yPos, { size: 9 });
  drawLine(ctx, X_LEFT, yPos + 15, X_SUMMARY_END, yPos + 15);
  return yPos + 22;
}

/* The account summary: the facts of the asset, the value on the last day last and in colour. */
function drawSummary(ctx: Ctx, value: ForeignFinancialAssetFactValue, taxYear: number): number {
  drawText(ctx, "Account summary", X_LEFT, 364, { size: 14, color: SECTION_RED });
  let yPos = summaryRow(ctx, 390, "Currency", currencyOf(value));
  if (value.description) yPos = summaryRow(ctx, yPos, "Holding", value.description);
  if (value.openedOrAcquired)
    yPos = summaryRow(ctx, yPos, "Opened or acquired", value.openedOrAcquired);
  if (value.closedOrDisposed)
    yPos = summaryRow(ctx, yPos, "Closed or disposed of", value.closedOrDisposed);
  const ending = { size: 9.5, bold: true, color: TOTAL_BLUE };
  const code = currencyCodeOf(value);
  drawText(ctx, `Value on 31 December ${taxYear} (${code})`, X_LEFT, yPos, ending);
  drawTextRight(ctx, fmtMoney(value.yearEndValue), X_SUMMARY_END, yPos, ending);
  return yPos + 40;
}

/* The balances must agree with the fact: the highest is its maximum, December its last-day value. */
function checkBalances(value: ForeignFinancialAssetFactValue, balances: MonthEndBalances) {
  const held = balances.filter((balance): balance is number => balance !== undefined);
  const december = balances[MONTHS.length - 1] ?? 0;
  if (balances.length !== MONTHS.length || Math.max(...held) !== value.maximumValue) {
    throw new Error(
      `${value.accountNumber}: the highest month-end balance is not the maximum value`,
    );
  }
  if (december !== value.yearEndValue) {
    throw new Error(`${value.accountNumber}: December's balance is not the year-end value`);
  }
}

/* Twelve month-end balances in two columns of six: the reader finds the highest among them. */
function drawMonthEndBalances(
  ctx: Ctx,
  yTop: number,
  value: ForeignFinancialAssetFactValue,
  balances: MonthEndBalances,
) {
  checkBalances(value, balances);
  const code = currencyCodeOf(value);
  drawText(ctx, "Month-end balances", X_LEFT, yTop, { size: 14, color: SECTION_RED });
  const firstHeld = balances.findIndex((balance) => balance !== undefined);
  // A month with no balance before the first is "not open"; after it, the account is closed.
  const noBalance = (index: number) => (index < firstHeld ? "not open" : "closed");
  MONTHS.forEach((month, index) => {
    const xLeft = index < 6 ? X_LEFT : X_SECOND_COLUMN;
    const xRight = index < 6 ? X_SECOND_COLUMN - 24 : X_END;
    const yPos = yTop + 26 + (index % 6) * 18;
    const balance = balances[index];
    drawText(ctx, `${month} (${code})`, xLeft, yPos, { size: 9 });
    const printed = balance === undefined ? noBalance(index) : fmtMoney(balance);
    drawTextRight(ctx, printed, xRight, yPos, { size: 9 });
    drawLine(ctx, xLeft, yPos + 12, xRight, yPos + 12);
  });
}

function drawFooter(ctx: Ctx, pageNumber: number, pageCount: number) {
  drawLine(ctx, X_LEFT, PAGE_H - 58, X_END, PAGE_H - 58);
  drawText(ctx, SAMPLE_NOTICE, X_LEFT, PAGE_H - 52, { size: 6.5, italic: true });
  drawTextRight(ctx, `Page ${pageNumber} of ${pageCount}`, X_END, PAGE_H - 52, { size: 8 });
}

type AmountRow = [label: string, amount: number];

/*
 * One kind of entry: a row for each dated amount the fact lists for the box,
 * with its date, as a statement lists each credit, payment and withholding;
 * one undated row for the total when the fact lists no dates for it.
 */
function entryRows(
  label: string,
  box: string,
  total: number | undefined,
  byDate: ReadonlyArray<DatedAmounts> | undefined,
): AmountRow[] {
  if (total === undefined) return [];
  const dated = (byDate ?? []).flatMap((entry): AmountRow[] => {
    const amount = (entry.amounts as Record<string, number | undefined>)[box];
    return amount === undefined ? [] : [[`${label}, ${printedDate(entry.date)}`, amount]];
  });
  return dated.length > 0 ? dated : [[label, total]];
}

function incomeRows(income: ForeignAssetIncome): AmountRow[] {
  const { interest, dividends } = income;
  return [
    ...entryRows("Interest credited", "box1", interest?.box1, interest?.foreignCurrency?.byDate),
    ...entryRows("Dividend paid", "box1a", dividends?.box1a, dividends?.foreignCurrency?.byDate),
  ];
}

function subtractionRows(income: ForeignAssetIncome): AmountRow[] {
  const { interest, dividends } = income;
  const interestDates = interest?.foreignCurrency?.byDate;
  return [
    ...entryRows(
      "Penalty for early withdrawal of a time deposit",
      "box2",
      interest?.box2,
      interestDates,
    ),
    ...entryRows("Withholding tax on interest", "box6", interest?.box6, interestDates),
    ...entryRows(
      "Withholding tax on dividends",
      "box7",
      dividends?.box7,
      dividends?.foreignCurrency?.byDate,
    ),
  ];
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
  table: { title: string; code: string; rows: AmountRow[]; sign: 1 | -1 },
): number {
  const { title, code, rows, sign } = table;
  if (rows.length === 0) return yTop;
  let yPos = tableHead(ctx, yTop, title, ["Description", `Amount (${code})`]);
  for (const [label, amount] of rows) yPos = tableRow(ctx, yPos, label, fmtMoney(sign * amount));
  const cents = rows.reduce((total, [, amount]) => total + Math.round(amount * 100), 0);
  const total = { size: 9.5, bold: true, color: TOTAL_BLUE };
  drawText(ctx, `Total ${title.toLowerCase()}`, X_LEFT, yPos, total);
  drawTextRight(ctx, fmtMoney((sign * cents) / 100), X_END, yPos, total);
  return yPos + 40;
}

function drawSales(ctx: Ctx, yTop: number, code: string, trades: TradeFactValue[]): number {
  if (trades.length === 0) return yTop;
  let yPos = tableHead(ctx, yTop, "Sales", ["Description", `Amount (${code})`]);
  for (const trade of trades) {
    // Each side with its trade date, and its settlement date when the fact holds it.
    const { saleSettled, purchaseSettled } = trade.foreignCurrency ?? {};
    const when = (traded: string | undefined, settled: string | undefined) =>
      [traded, settled]
        .map((date, index) => (date ? `${index === 0 ? "" : "settled "}${printedDate(date)}` : ""))
        .filter((part) => part !== "")
        .join(", ");
    const sold = `${trade.description}: sold ${when(trade.dateSold, saleSettled)}, proceeds`;
    yPos = tableRow(ctx, yPos, sold, fmtMoney(trade.proceeds));
    const bought = `${trade.description}: bought ${when(trade.dateAcquired, purchaseSettled)}, cost`;
    yPos = tableRow(ctx, yPos, bought, fmtMoney(trade.costBasis ?? 0));
  }
  return yPos + 19;
}

/* Page 2: the strip that names the account, then the year's income, charges and sales. */
function drawActivityPage(
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
  const code = currencyCodeOf(value);
  drawText(ctx, `Activity in the period. All amounts are in ${currencyOf(value)}.`, X_LEFT, 92, {
    size: 8.5,
    italic: true,
  });
  const additions = { title: "Income and other additions", code, sign: 1 as const };
  let yPos = drawAmountTable(ctx, 124, { ...additions, rows: incomeRows(income) });
  const subtractions = { title: "Tax withheld and other subtractions", code, sign: -1 as const };
  yPos = drawAmountTable(ctx, yPos, { ...subtractions, rows: subtractionRows(income) });
  drawSales(ctx, yPos, code, income.trades ?? []);
}

function hasActivity(income: ForeignAssetIncome): boolean {
  const rows = incomeRows(income).length + subtractionRows(income).length;
  return rows + (income.trades ?? []).length > 0;
}

export async function foreignAssetStatementPdf(
  value: ForeignFinancialAssetFactValue,
  income: ForeignAssetIncome,
  parties: ForeignAssetStatementParties,
  balances?: MonthEndBalances,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const withActivity = hasActivity(income);
  const pageCount = withActivity ? 2 : 1;

  const first: Ctx = { page: doc.addPage([PAGE_W, PAGE_H]), ...fonts };
  const issuer = drawWordmark(first, value, 18);
  (issuer ? addressLines(issuer.address) : []).forEach((line, index) =>
    drawText(first, line, X_LEFT, 64 + index * 9, { size: 6.5 }),
  );
  drawHolderBlock(first, parties);
  drawServiceBlock(first, value);
  drawNotice(first, value, withActivity);
  drawTitle(first, value, parties);
  const yBalances = drawSummary(first, value, parties.taxYear);
  if (balances) drawMonthEndBalances(first, yBalances, value, balances);
  drawFooter(first, 1, pageCount);

  if (withActivity) {
    const second: Ctx = { page: doc.addPage([PAGE_W, PAGE_H]), ...fonts };
    drawActivityPage(second, value, income, parties);
    drawFooter(second, 2, pageCount);
  }
  return doc.save();
}
