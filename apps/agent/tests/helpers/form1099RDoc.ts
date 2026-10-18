/*
 * Draw a payer-style Form 1099-R statement for a test scenario's input
 * documents. The box values come straight from the scenario's 1099-R
 * fact, so the document and the facts cannot disagree.
 *
 * This is ONE institution's layout, not the canonical 1099-R. Real
 * payers print different shapes, and Luca must read them all. Add other
 * layouts beside this one when a scenario needs them.
 *
 * Layout: page 1 is a mailing header (payer return address, recipient
 * address) plus Copy B and Copy C; page 2 is Copy 2. Each copy has the
 * payer and recipient on the left, boxes 1–9b and 14–19 on the right,
 * a side panel with the copy name, and rows for the plan name, phone,
 * boxes 10–13, IDs, and account number at the bottom left.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { RetirementDistributionFactValue } from "../../src/engine/facts/index.js";

export interface Form1099RMailing {
  taxYear: number;
  /* Payer street and city lines (the name comes from the fact). */
  payerAddress: string[];
  payerPhone: string;
  recipientName: string;
  recipientAddress: string[];
  /* Printed in the RECIPIENT'S ID box, e.g. "XXX-XX-1039". */
  recipientTinMasked: string;
  account: string;
}

interface Ctx {
  page: PDFPage;
  sans: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

/* Column edges (PDF points). Left part, two box columns, side panel. */
const X = { l: 30, g0: 330, g1: 420, g2: 498, r: 582 };
/* Box-grid row heights, top to bottom: 1/2a, 2b, 3/4, 5/6, 7/8, 9a/9b, 14–16, 17–19. */
const ROWS = [27, 19, 26, 38, 35, 37, 31, 27];
const COPY_HEIGHT = ROWS.reduce((a, b) => a + b, 0);

const COPY_TEXT: Record<string, string[]> = {
  B: [
    "Report this income on",
    "your federal tax return.",
    "If this form shows federal",
    "income tax withheld in",
    "box 4, attach this copy",
    "to your return.",
  ],
  C: ["For", "Recipient's", "Records"],
  "2": [
    "File this copy",
    "with your state,",
    "city, or local",
    "income tax return,",
    "when required.",
  ],
};

const money = (n: number | undefined) =>
  `$ ${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function text(ctx: Ctx, s: string, x: number, y: number, size: number, font = ctx.sans) {
  ctx.page.drawText(s, { x, y, size, font });
}

function rightText(ctx: Ctx, s: string, xRight: number, y: number, size: number, font = ctx.bold) {
  text(ctx, s, xRight - font.widthOfTextAtSize(s, size), y, size, font);
}

function rect(ctx: Ctx, x0: number, x1: number, top: number, h: number) {
  ctx.page.drawRectangle({
    x: x0,
    y: top - h,
    width: x1 - x0,
    height: h,
    borderWidth: 0.6,
    borderColor: rgb(0, 0, 0),
  });
}

/* A box with a small label (one or more lines) and an optional value. */
function cell(
  ctx: Ctx,
  x0: number,
  x1: number,
  top: number,
  h: number,
  label: string[],
  value?: string,
) {
  rect(ctx, x0, x1, top, h);
  label.forEach((line, i) => text(ctx, line, x0 + 2, top - 7 - i * 6.5, 6));
  if (value) text(ctx, value, x0 + 8, top - h + 4, 8);
}

function checkMark(ctx: Ctx, x: number, y: number, on: boolean | undefined) {
  if (on) text(ctx, "X", x, y, 10);
}

function dottedLine(ctx: Ctx, y: number) {
  for (let x = 0; x < 612; x += 4) {
    ctx.page.drawLine({ start: { x, y }, end: { x: x + 1.5, y }, thickness: 0.6 });
  }
}

function rowTops(top: number): number[] {
  const tops = [top];
  for (const h of ROWS) tops.push(tops[tops.length - 1] - h);
  return tops;
}

function drawBoxesTop(ctx: Ctx, t: number[], f: RetirementDistributionFactValue) {
  cell(ctx, X.g0, X.g1, t[0], ROWS[0], ["1 Gross distribution"], money(f.box1));
  cell(ctx, X.g1, X.g2, t[0], ROWS[0], ["2a Taxable amount"], money(f.box2a));
  cell(ctx, X.g0, X.g1, t[1], ROWS[1], ["2b Taxable amount", "not determined"]);
  cell(ctx, X.g1, X.g2, t[1], ROWS[1], ["Total", "distribution"]);
  checkMark(ctx, X.g1 - 16, t[2] + 5, f.box2b?.taxableAmountNotDetermined);
  checkMark(ctx, X.g2 - 16, t[2] + 5, f.box2b?.totalDistribution);
  cell(ctx, X.g0, X.g1, t[2], ROWS[2], ["3 Capital gain", "(included in Box 2a)"], money(f.box3));
  cell(ctx, X.g1, X.g2, t[2], ROWS[2], ["4 Federal income tax", "withheld"], money(f.box4));
  const box5 = [
    "5 Employee contributions/",
    "Designated Roth",
    "contributions or insurance",
    "premiums",
  ];
  cell(ctx, X.g0, X.g1, t[3], ROWS[3], box5, money(f.box5));
  const box6 = ["6 Net unrealized", "appreciation in", "employer's securities"];
  cell(ctx, X.g1, X.g2, t[3], ROWS[3], box6, money(f.box6));
}

function drawBoxesBottom(ctx: Ctx, t: number[], f: RetirementDistributionFactValue) {
  cell(ctx, X.g0, X.g1, t[4], ROWS[4], [
    "7 Distribution  IRA/",
    "code(s)        SEP/",
    "                     SIMPLE",
  ]);
  text(ctx, f.box7, X.g0 + 14, t[5] + 6, 9);
  checkMark(ctx, X.g0 + 62, t[5] + 6, f.box7IraSepSimple);
  cell(ctx, X.g1, X.g2, t[4], ROWS[4], ["8 Other"]);
  text(ctx, f.box8 === undefined ? "$" : money(f.box8), X.g1 + 8, t[5] + 6, 8);
  text(ctx, "%", X.g2 - 12, t[5] + 6, 8);
  const pct = f.box9a === undefined ? "" : `${f.box9a} %`;
  cell(ctx, X.g0, X.g1, t[5], ROWS[5], ["9a Your percentage of", "total distribution"], pct);
  cell(ctx, X.g1, X.g2, t[5], ROWS[5], ["9b Total employee", "contributions"], money(f.box9b));
  cell(ctx, X.g0, X.g1, t[6], ROWS[6], ["14 State tax withheld"], money(f.box14));
  cell(ctx, X.g1, X.g2, t[6], ROWS[6], ["15 State/Payer's", "state no."], f.box15);
  cell(ctx, X.g2, X.r, t[6], ROWS[6], ["16 State distribution"], money(f.box16));
  cell(ctx, X.g0, X.g1, t[7], ROWS[7], ["17 Local tax withheld"], money(f.box17));
  cell(ctx, X.g1, X.g2, t[7], ROWS[7], ["18 Name of locality"], f.box18);
  cell(ctx, X.g2, X.r, t[7], ROWS[7], ["19 Local distribution"], money(f.box19));
}

function drawSidePanel(ctx: Ctx, t: number[], copy: string, year: number) {
  rect(ctx, X.g2, X.r, t[0], t[0] - t[6]);
  text(ctx, "OMB No. 1545-0119", X.g2 + 6, t[0] - 7, 5.5);
  rightText(ctx, String(year), X.r - 4, t[0] - 19, 11);
  const title = ["Form 1099-R:", "Distributions", "From Pensions,", "Annuities,", "Retirement or"];
  const title2 = ["Profit-Sharing", "Plans, IRAs,", "Insurance", "Contracts, etc."];
  [...title, ...title2].forEach((s, i) => rightText(ctx, s, X.r - 4, t[0] - 29 - i * 8, 6.5));
  rightText(ctx, `COPY ${copy}`, X.r - 6, t[4] - 14, 10);
  COPY_TEXT[copy].forEach((s, i) => rightText(ctx, s, X.r - 4, t[4] - 26 - i * 7, 6, ctx.sans));
}

function drawLeft(ctx: Ctx, t: number[], f: RetirementDistributionFactValue, m: Form1099RMailing) {
  text(ctx, "PAYER'S Name, Street Address, City, State, and ZIP code", X.l, t[0] - 8, 7);
  [f.payerName.toUpperCase(), ...m.payerAddress].forEach((s, i) =>
    text(ctx, s, X.l, t[0] - 18 - i * 9, 8, ctx.mono),
  );
  text(ctx, "RECIPIENT'S Name and Address", X.l, t[3] - 6, 7);
  [m.recipientName, ...m.recipientAddress].forEach((s, i) =>
    text(ctx, s.toUpperCase(), X.l, t[3] - 16 - i * 9, 8, ctx.mono),
  );
  cell(ctx, X.l, X.g0, t[6] + 22, 22, ["Plan Name"], f.planName);
  cell(ctx, X.l, 120, t[6], ROWS[6], ["Customer service phone number"], m.payerPhone);
  cell(
    ctx,
    120,
    215,
    t[6],
    ROWS[6],
    ["10 Amount allocable to IRR", "within 5 years"],
    money(f.box10),
  );
  const year = f.box11 === undefined ? "" : String(f.box11);
  cell(ctx, 215, 285, t[6], ROWS[6], ["11 1st year of desig.", "Roth contrib."], year);
  cell(ctx, 285, X.g0, t[6], ROWS[6], ["12 FATCA filing", "requirement"]);
  checkMark(ctx, 300, t[7] + 4, f.box12);
  cell(ctx, X.l, 95, t[7], ROWS[7], ["PAYER'S Federal ID #"], f.payerTin);
  cell(ctx, 95, 165, t[7], ROWS[7], ["RECIPIENT'S ID #"], m.recipientTinMasked);
  cell(ctx, 165, 285, t[7], ROWS[7], ["Account Number (see instructions)"], m.account);
  cell(ctx, 285, X.g0, t[7], ROWS[7], ["13 Date of", "payment"], f.box13);
}

/* One full copy of the form, its top edge at `top`. */
function drawCopy(
  ctx: Ctx,
  top: number,
  copy: string,
  f: RetirementDistributionFactValue,
  m: Form1099RMailing,
) {
  const t = rowTops(top);
  drawLeft(ctx, t, f, m);
  drawBoxesTop(ctx, t, f);
  drawBoxesBottom(ctx, t, f);
  drawSidePanel(ctx, t, copy, m.taxYear);
  const foot = top - COPY_HEIGHT - 9;
  text(ctx, "FORM 1099-R", X.l, foot, 7, ctx.bold);
  text(ctx, "www.irs.gov/form1099r", 250, foot, 6);
  rightText(ctx, "Department of the Treasury - Internal Revenue Service", X.r, foot, 6, ctx.sans);
}

function drawHeader(
  ctx: Ctx,
  m: Form1099RMailing,
  f: RetirementDistributionFactValue,
  pageNo: number,
) {
  text(ctx, `${m.taxYear} FORM 1099-R`, 44, 752, 10, ctx.bold);
  text(ctx, "Distributions From Pensions, Annuities, Retirement or", 44, 741, 8);
  text(ctx, "Profit-Sharing plans, IRAs, Insurance Contracts, etc.", 44, 731, 8);
  rightText(ctx, `Page ${pageNo} of 2`, 568, 731, 8, ctx.sans);
  ctx.page.drawLine({ start: { x: 44, y: 725 }, end: { x: 568, y: 725 }, thickness: 0.8 });
  if (pageNo !== 1) return;
  [f.payerName.toUpperCase(), ...m.payerAddress].forEach((s, i) =>
    text(ctx, s, 44, 712 - i * 10, 9, ctx.mono),
  );
  ctx.page.drawRectangle({ x: 44, y: 666, width: 210, height: 15, color: rgb(0, 0, 0) });
  ctx.page.drawText("Important tax return document enclosed", {
    x: 52,
    y: 670,
    size: 9,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  [m.recipientName, ...m.recipientAddress].forEach((s, i) =>
    text(ctx, s.toUpperCase(), 44, 636 - i * 11, 10, ctx.mono),
  );
}

export async function render1099R(
  f: RetirementDistributionFactValue,
  m: Form1099RMailing,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
  const page1: Ctx = { page: doc.addPage([612, 792]), ...fonts };
  drawHeader(page1, m, f, 1);
  dottedLine(page1, 545);
  drawCopy(page1, 532, "B", f, m);
  dottedLine(page1, 270);
  drawCopy(page1, 258, "C", f, m);
  const page2: Ctx = { page: doc.addPage([612, 792]), ...fonts };
  drawHeader(page2, m, f, 2);
  drawCopy(page2, 700, "2", f, m);
  return doc.save();
}
