/*
 * A QEF's PFIC Annual Information Statement, the statement a fund gives its
 * U.S. holders so they can make or keep a QEF election
 * (irs-8621-inst-2025::sec::annual-election-requirements-of-the-pfic-or::b01).
 * Its parts and their order follow the statements fund companies publish,
 * which number the items of Treasury Regulations section 1.1295-1(g)(1): a
 * notice to U.S. holders; (1) the first and last day of the fund's tax year;
 * (2) the ordinary earnings and net capital gain per unit per day, in U.S.
 * dollars, which the holder multiplies by the units held and the days held;
 * (3) the distributions per unit; (4) the fund's promise to let the holder
 * inspect its books; then an officer's signature. The statement names no
 * holder: the units come from the account statement (fundAccountStatement.ts).
 * A fund with no QEF election sends no such statement. It prints only what
 * the fund fact holds.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { PficFundFactValue, PficQefAmounts } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawLine,
  drawText,
  drawTextRight,
  drawWrapped,
  type Ctx,
} from "./draw.js";

export interface PficStatementSigner {
  name: string;
  title: string;
  /* The date the officer signed, as printed. */
  signed: string;
}

const X_LEFT = 54;
const X_END = 558;
const X_FIRST_AMOUNT = 420;
const WIDTH = X_END - X_LEFT;
const ROW = 18;
const FACTOR_DECIMALS = 10;
const TEXT = { size: 9 };
const SMALL = { size: 8.5 };

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
const longDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
};

const NOTICE = [
  'This statement is provided to unitholders of the Fund who are United States persons for purposes of the U.S. Internal Revenue Code of 1986, as amended (the "Code"). It is not relevant to other unitholders.',
  'The Fund may be a passive foreign investment company ("PFIC") as defined in Code section 1297(a) for the tax year named below. This statement is provided under Treasury Regulations section 1.1295-1(g)(1). It contains the information a U.S. unitholder needs to treat the Fund as a qualified electing fund ("QEF"), should the unitholder so choose.',
  "A U.S. unitholder who makes a QEF election includes in income each year a pro rata share of the Fund's ordinary earnings and net capital gain, whether or not the Fund distributes them. The election is generally made on IRS Form 8621. This statement is not tax advice; please consult a U.S. tax adviser.",
];

const HOW_TO =
  "To determine your pro rata share, multiply each amount by the number of units you held and by the number of days you held them in the year (unit days). For example, 1,000 units held for all 365 days are 365,000 unit days. If your units changed during the year, add the unit days of each period.";

const INSPECTION =
  "4. The Fund will, upon receipt of a request, permit you to inspect and copy its permanent books of account, records, and such other documents as may be maintained by the Fund that are necessary to establish that its ordinary earnings and net capital gain are computed in accordance with U.S. income tax principles, and to verify these amounts and your pro rata shares thereof.";

function header(ctx: Ctx, fund: PficFundFactValue, yearEnd: string): number {
  drawText(ctx, fund.fundName, X_LEFT, 54, { size: 13, bold: true });
  drawText(ctx, '(the "Fund")', X_LEFT, 72, TEXT);
  drawText(ctx, fund.fundAddress, X_LEFT, 86, TEXT);
  drawText(ctx, "PFIC Annual Information Statement", X_LEFT, 114, { size: 12, bold: true });
  drawText(ctx, `For the year ended ${longDate(yearEnd)}`, X_LEFT, 132, { size: 10 });
  const notice = "Important tax notice to U.S. unitholders of the Fund";
  drawText(ctx, notice, X_LEFT, 156, { size: 10, bold: true });
  let yPos = 174;
  for (const paragraph of NOTICE)
    yPos = drawWrapped(ctx, paragraph, X_LEFT, yPos, WIDTH, SMALL) + 6;
  return yPos;
}

/* A two-amount row: a label and the ordinary earnings and net capital gain columns. */
function amountRow(ctx: Ctx, yPos: number, label: string, first: string, second: string) {
  drawText(ctx, label, X_LEFT, yPos, TEXT);
  drawTextRight(ctx, first, X_FIRST_AMOUNT, yPos, TEXT);
  drawTextRight(ctx, second, X_END, yPos, TEXT);
}

/* Item 2: per unit per day, or the holder's own shares when the fund states totals. */
function earningsItem(ctx: Ctx, fund: PficFundFactValue, qef: PficQefAmounts, yStart: number) {
  const perDay = qef.perUnitPerDay;
  const intro = perDay
    ? "2. The Fund's ordinary earnings and net capital gain per unit per day for that year, in U.S. dollars:"
    : "2. Your pro rata share of the Fund's ordinary earnings and net capital gain for that year, in U.S. dollars:";
  let yPos = drawWrapped(ctx, intro, X_LEFT, yStart, WIDTH, TEXT) + 4;
  drawText(ctx, "Share class", X_LEFT, yPos, { size: 8, bold: true });
  drawTextRight(ctx, "Ordinary earnings (US$)", X_FIRST_AMOUNT, yPos, { size: 8, bold: true });
  drawTextRight(ctx, "Net capital gain (US$)", X_END, yPos, { size: 8, bold: true });
  drawLine(ctx, X_LEFT, yPos + 12, X_END, yPos + 12);
  const amount = (value: number | undefined) =>
    value === undefined ? "-" : perDay ? value.toFixed(FACTOR_DECIMALS) : `$${value.toFixed(2)}`;
  const amounts = perDay ?? qef;
  yPos += ROW;
  amountRow(
    ctx,
    yPos,
    fund.shareClass,
    amount(amounts.ordinaryEarnings),
    amount(amounts.netCapitalGain),
  );
  const excluded = [amounts.ordinaryEarningsExcluded, amounts.netCapitalGainExcluded];
  if (excluded.some((value) => value !== undefined)) {
    yPos += ROW;
    const label = "Of which excludable under Code section 1293(g)";
    amountRow(ctx, yPos, label, amount(excluded[0]), amount(excluded[1]));
  }
  if (!perDay) return yPos + ROW;
  return drawWrapped(ctx, HOW_TO, X_LEFT, yPos + ROW, WIDTH, SMALL) + 6;
}

/* Item 3: the cash and property distributed per unit, in U.S. dollars. */
function distributionItem(ctx: Ctx, fund: PficFundFactValue, qef: PficQefAmounts, yStart: number) {
  const rows = qef.distributionsPerUnit ?? [];
  if (rows.length === 0) {
    const none = "3. The Fund made no cash or property distributions in that year.";
    return drawWrapped(ctx, none, X_LEFT, yStart, WIDTH, TEXT) + 6;
  }
  const intro = `3. The Fund made the following distributions per unit of ${fund.shareClass} in that year, converted into U.S. dollars at the spot rate on the date each was paid:`;
  let yPos = drawWrapped(ctx, intro, X_LEFT, yStart, WIDTH, TEXT) + 4;
  drawText(ctx, "Date paid", X_LEFT, yPos, { size: 8, bold: true });
  const column = "Cash/property distribution per unit (US$)";
  drawTextRight(ctx, column, X_END, yPos, { size: 8, bold: true });
  drawLine(ctx, X_LEFT, yPos + 12, X_END, yPos + 12);
  for (const each of rows) {
    yPos += ROW;
    drawText(ctx, longDate(each.date), X_LEFT, yPos, TEXT);
    drawTextRight(ctx, `$${each.amountPerUnit.toFixed(4)}`, X_END, yPos, TEXT);
  }
  return yPos + ROW + 6;
}

function signature(ctx: Ctx, fund: PficFundFactValue, signer: PficStatementSigner, yStart: number) {
  drawText(ctx, fund.fundName, X_LEFT, yStart, TEXT);
  drawText(ctx, `/s/ ${signer.name}`, X_LEFT, yStart + 26, { size: 11, italic: true });
  drawText(ctx, signer.name, X_LEFT, yStart + 46, TEXT);
  drawText(ctx, signer.title, X_LEFT, yStart + 60, TEXT);
  drawText(ctx, signer.signed, X_LEFT, yStart + 74, TEXT);
}

export async function pficAnnualInformationStatementPdf(
  fund: PficFundFactValue,
  signer: PficStatementSigner,
  taxYear: number,
): Promise<Uint8Array> {
  const qef = fund.qef;
  if (qef === undefined)
    throw new Error(`${fund.fundName} is not a QEF: no information statement.`);
  const doc = await PDFDocument.create();
  const ctx: Ctx = {
    page: doc.addPage([PAGE_W, PAGE_H]),
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const begin = fund.fundTaxYearBegin ?? `${taxYear}-01-01`;
  const end = fund.fundTaxYearEnd ?? `${taxYear}-12-31`;
  const year = `1. This statement applies to the taxable year of the Fund beginning on ${longDate(begin)} and ending on ${longDate(end)}.`;
  let yPos = header(ctx, fund, end) + 8;
  yPos = drawWrapped(ctx, year, X_LEFT, yPos, WIDTH, TEXT) + 8;
  yPos = earningsItem(ctx, fund, qef, yPos) + 4;
  yPos = distributionItem(ctx, fund, qef, yPos);
  yPos = drawWrapped(ctx, INSPECTION, X_LEFT, yPos, WIDTH, TEXT) + 16;
  signature(ctx, fund, signer, yPos);
  return doc.save();
}
