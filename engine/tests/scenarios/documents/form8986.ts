/*
 * Form 8986, Partner's Share of Adjustment(s) to Partnership-Related Item(s)
 * (Rev. December 2024), as a BBA partnership or its pass-through partner
 * sends it after an audit or an administrative adjustment request. The parts,
 * items and Part V columns follow the official form:
 * https://www.irs.gov/pub/irs-access/f8986_accessible.pdf
 * It prints only the values the fact holds, plus the partner's name, address
 * and the Part IV boxes, which the caller passes. Part IV items F and G
 * (liabilities, capital account) and the Part VI statements are left blank:
 * no fact holds them.
 */

import { PDFDocument, StandardFonts, type PDFPage } from "@cantoo/pdf-lib";
import type {
  Form8986Adjustment,
  Form8986FactValue,
  Form8986Penalty,
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

export interface Form8986Partner {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  /* Part IV item B, masked as the payee copy prints it. */
  tin: string;
  /* Part IV item C: box 1 general partner or LLC member manager, else box 2. */
  generalPartner: boolean;
}

const X_LEFT = 36;
const X_END = 576;
const TEXT = { size: 8 };
const SMALL = { size: 7 };
const BOLD = { size: 8, bold: true };

const SUBMITTERS: ReadonlyArray<[Form8986FactValue["submitter"], string]> = [
  ["audited_partnership", "1. Audited BBA partnership"],
  [
    "pass_through_of_audited",
    "2. Pass-through partner (direct or indirect) of an audited BBA partnership",
  ],
  ["aar_partnership", "3. BBA partnership that filed an administrative adjustment request (AAR)"],
  [
    "pass_through_of_aar",
    "4. Pass-through partner (direct or indirect) of a BBA partnership that filed an AAR",
  ],
];

const RETURN_TYPES: ReadonlyArray<[Form8986FactValue["returnType"], string]> = [
  ["1065", "1. Form 1065"],
  ["1120-S", "2. Form 1120-S"],
  ["1041", "3. Form 1041"],
  ["other", "4. Other (enter form number)"],
];

/* MM/DD/YYYY, as the form asks for each date. */
const printedDate = (iso: string | undefined) => {
  if (iso === undefined) return "";
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
};

const money = (amount: number | undefined) =>
  amount === undefined ? "" : amount < 0 ? `(${fmtMoney(-amount)})` : fmtMoney(amount);

function checkbox(ctx: Ctx, xPos: number, yPos: number, checked: boolean, label: string) {
  drawBox(ctx, xPos, yPos, 7, 7);
  if (checked) drawText(ctx, "X", xPos + 1.2, yPos + 0.2, { size: 7, bold: true });
  drawText(ctx, label, xPos + 11, yPos, SMALL);
}

function partBar(ctx: Ctx, yPos: number, part: string, title: string) {
  drawBox(ctx, X_LEFT, yPos, X_END - X_LEFT, 12, { fill: SHADE });
  drawText(ctx, part, X_LEFT + 3, yPos + 2, BOLD);
  drawText(ctx, title, X_LEFT + 48, yPos + 2, BOLD);
}

/* A label over a value, the way the form's entry boxes read. */
function entry(ctx: Ctx, xPos: number, yPos: number, label: string, value: string) {
  drawText(ctx, label, xPos, yPos, SMALL);
  drawText(ctx, value, xPos + 4, yPos + 10, TEXT);
}

function header(ctx: Ctx, fact: Form8986FactValue): number {
  drawText(ctx, "Form 8986", X_LEFT, 36, { size: 14, bold: true });
  drawText(ctx, "(Rev. December 2024)", X_LEFT, 54, SMALL);
  drawText(ctx, "Partner's Share of Adjustment(s)", 210, 36, { size: 11, bold: true });
  drawText(ctx, "to Partnership-Related Item(s)", 216, 50, { size: 11, bold: true });
  drawText(ctx, "(Required Under Sections 6226 and 6227)", 222, 64, BOLD);
  drawText(ctx, "OMB No. 1545-0123", 490, 40, SMALL);
  drawLine(ctx, X_LEFT, 78, X_END, 78);
  drawText(ctx, "Check if this form is:", X_LEFT, 82, SMALL);
  checkbox(ctx, X_LEFT, 92, fact.corrected !== true, "1. Original");
  checkbox(ctx, X_LEFT + 70, 92, fact.corrected === true, "2. Corrected");
  entry(ctx, 230, 82, "Tracking Number", fact.trackingNumber ?? "");
  entry(ctx, 400, 82, "Audit Control Number (if applicable)", fact.auditControlNumber ?? "");
  return 108;
}

function partI(ctx: Ctx, fact: Form8986FactValue, yStart: number): number {
  partBar(ctx, yStart, "Part I", "Information About Entity Submitting This Form");
  let yPos = yStart + 16;
  drawText(
    ctx,
    "A  Check the box to indicate which entity is submitting this form.",
    X_LEFT,
    yPos,
    SMALL,
  );
  for (const [value, label] of SUBMITTERS) {
    yPos += 10;
    checkbox(ctx, X_LEFT + 8, yPos, fact.submitter === value, label);
  }
  drawText(
    ctx,
    "B  Type of return filed by the entity that submitted this form:",
    360,
    yStart + 16,
    SMALL,
  );
  RETURN_TYPES.forEach(([value, label], index) => {
    const other = value === "other" && fact.returnTypeOther ? ` ${fact.returnTypeOther}` : "";
    checkbox(ctx, 368, yStart + 26 + index * 10, fact.returnType === value, `${label}${other}`);
  });
  return yPos + 14;
}

function partII(ctx: Ctx, fact: Form8986FactValue, yStart: number): number {
  const title = "Information About the Audited Partnership or Partnership That Filed an AAR";
  partBar(ctx, yStart, "Part II", title);
  const yPos = yStart + 16;
  entry(ctx, X_LEFT, yPos, "A  1. Partnership's name", fact.partnershipName);
  entry(ctx, X_LEFT, yPos + 24, "2.–6. Address", fact.partnershipAddress ?? "");
  entry(
    ctx,
    X_LEFT,
    yPos + 48,
    "B  Partnership representative (PR) or designated individual (DI)",
    "",
  );
  const right = 380;
  entry(ctx, right, yPos, "C  Partnership's TIN", fact.partnershipTin);
  entry(
    ctx,
    right,
    yPos + 24,
    "D  Review year is for tax year ended",
    printedDate(fact.reviewYearEnded),
  );
  entry(
    ctx,
    right,
    yPos + 48,
    "E  Adjustment year is for tax year ended",
    printedDate(fact.adjustmentYearEnded),
  );
  entry(
    ctx,
    right,
    yPos + 72,
    "F  Extended due date of adjustment year return",
    printedDate(fact.extendedDueDate),
  );
  entry(
    ctx,
    right,
    yPos + 96,
    "G  Date the partnership furnished the Forms 8986",
    printedDate(fact.dateFurnished),
  );
  return yPos + 124;
}

function partIII(ctx: Ctx, fact: Form8986FactValue, yStart: number): number {
  partBar(
    ctx,
    yStart,
    "Part III",
    "Information About the Pass-Through Partner (only if a pass-through partner submits it)",
  );
  const pass = fact.passThroughPartner;
  const yPos = yStart + 16;
  entry(ctx, X_LEFT, yPos, "A  1. Pass-through entity's name", pass?.name ?? "");
  entry(ctx, X_LEFT, yPos + 24, "2.–6. Address", pass?.address ?? "");
  entry(ctx, 380, yPos, "B  Pass-through partner's TIN", pass?.tin ?? "");
  entry(
    ctx,
    380,
    yPos + 24,
    "C  Tax year end to which the adjustments relate",
    printedDate(pass?.taxYearEnded),
  );
  return yPos + 52;
}

function partIV(
  ctx: Ctx,
  fact: Form8986FactValue,
  partner: Form8986Partner,
  yStart: number,
): number {
  partBar(ctx, yStart, "Part IV", "Information About the Partner Receiving This Statement");
  let yPos = yStart + 16;
  entry(
    ctx,
    X_LEFT,
    yPos,
    "A  2. Partner's first name / 3. last name",
    `${partner.firstName} ${partner.lastName}`,
  );
  entry(
    ctx,
    X_LEFT,
    yPos + 24,
    "4.–8. Address",
    `${partner.street}, ${partner.city}, ${partner.state} ${partner.zip}`,
  );
  entry(ctx, 380, yPos, "B  Partner's TIN", partner.tin);
  drawText(ctx, "C  Check if:", 380, yPos + 24, SMALL);
  checkbox(ctx, 388, yPos + 34, partner.generalPartner, "1. General partner or LLC member manager");
  checkbox(ctx, 388, yPos + 44, !partner.generalPartner, "2. Limited partner or other LLC member");
  checkbox(ctx, 388, yPos + 54, true, "3. Domestic partner");
  checkbox(ctx, 388, yPos + 64, false, "4. Foreign partner");
  yPos += 80;
  drawText(ctx, "D  What type of entity is this partner?", X_LEFT, yPos, SMALL);
  // The official form's five boxes, in its order; the partner is always an individual.
  const ENTITY_TYPES = ["1. Individual", "2. S Corporation", "3. Corporation", "4. Partnership"];
  ENTITY_TYPES.forEach((label, index) =>
    checkbox(ctx, X_LEFT + 150 + index * 75, yPos, index === 0, label),
  );
  checkbox(ctx, X_LEFT + 450, yPos, false, "5. Other");
  yPos += 16;
  return shares(ctx, fact, yPos);
}

function shares(ctx: Ctx, fact: Form8986FactValue, yStart: number): number {
  drawText(ctx, "E  Partner's share of profit, loss, and capital:", X_LEFT, yStart, SMALL);
  ["As Reported", "Change", "Corrected"].forEach((label, index) =>
    drawTextRight(ctx, label, 400 + index * 80, yStart, SMALL),
  );
  const rows = fact.partnerShare;
  const names: ReadonlyArray<[keyof NonNullable<typeof rows>, string]> = [
    ["profit", "Profit"],
    ["loss", "Loss"],
    ["capital", "Capital"],
  ];
  let yPos = yStart;
  for (const [name, label] of names) {
    yPos += 11;
    drawText(ctx, label, X_LEFT + 12, yPos, SMALL);
    const row = rows?.[name];
    const values = row ? [row.asReported, row.change, row.corrected] : [];
    values.forEach((value, index) =>
      drawTextRight(ctx, `${value}%`, 400 + index * 80, yPos, SMALL),
    );
  }
  return yPos + 16;
}

/* Part V column edges: (a) to (h), right edges of the amount columns. */
const PART_V = { a: 40, b: 70, c: 210, d: 300, e: 330, f: 400, g: 480, h: 572 };

function partVHead(page: Ctx, yStart: number): number {
  partBar(
    page,
    yStart,
    "Part V",
    "Partner's Total Reviewed Year Income, Gain, Loss, Deduction, Credits, and Other Items",
  );
  const yPos = yStart + 16;
  drawText(page, "(a) Line", PART_V.a - 4, yPos, { size: 6 });
  drawText(page, "(b) Line title", PART_V.b, yPos, SMALL);
  drawText(page, "(c) Code", PART_V.c - 26, yPos, SMALL);
  drawTextRight(page, "(d) As reported", PART_V.d, yPos, SMALL);
  drawTextRight(page, "(e) Stmt", PART_V.e, yPos, SMALL);
  drawTextRight(page, "(f) Approved mods", PART_V.f, yPos, SMALL);
  drawTextRight(page, "(g) Adj. net of mods", PART_V.g, yPos, SMALL);
  drawTextRight(page, "(h) As corrected", PART_V.h, yPos, SMALL);
  drawLine(page, X_LEFT, yPos + 10, X_END, yPos + 10);
  return yPos + 14;
}

function partVRow(page: Ctx, row: Form8986Adjustment, yPos: number) {
  drawText(page, row.lineNumber, PART_V.a + 4, yPos, TEXT);
  drawText(page, row.lineTitle, PART_V.b, yPos, TEXT);
  drawText(page, row.code ?? "NA", PART_V.c - 20, yPos, TEXT);
  drawTextRight(page, money(row.asReported), PART_V.d, yPos, TEXT);
  if (row.hasStatement === true) drawTextRight(page, "X", PART_V.e - 8, yPos, TEXT);
  drawTextRight(page, money(row.approvedModifications), PART_V.f, yPos, TEXT);
  drawTextRight(page, money(row.netAdjustment), PART_V.g, yPos, TEXT);
  drawTextRight(page, money(row.asCorrected), PART_V.h, yPos, TEXT);
}

const totalOf = (
  rows: ReadonlyArray<Form8986Adjustment>,
  pick: (row: Form8986Adjustment) => number | undefined,
) => rows.reduce((total, row) => total + (pick(row) ?? 0), 0);

function partV(page: Ctx, fact: Form8986FactValue, yStart: number): number {
  let yPos = partVHead(page, yStart);
  for (const row of fact.adjustments) {
    partVRow(page, row, yPos);
    yPos += 16;
  }
  drawLine(page, X_LEFT, yPos, X_END, yPos);
  drawTextRight(page, "Totals:", PART_V.d, yPos + 4, BOLD);
  drawTextRight(
    page,
    money(totalOf(fact.adjustments, (row) => row.approvedModifications)),
    PART_V.f,
    yPos + 4,
    TEXT,
  );
  drawTextRight(
    page,
    money(totalOf(fact.adjustments, (row) => row.netAdjustment)),
    PART_V.g,
    yPos + 4,
    TEXT,
  );
  drawTextRight(
    page,
    money(totalOf(fact.adjustments, (row) => row.asCorrected)),
    PART_V.h,
    yPos + 4,
    TEXT,
  );
  return yPos + 22;
}

function penaltyRow(page: Ctx, index: number, penalty: Form8986Penalty | undefined, yPos: number) {
  drawText(page, String(index + 1), X_LEFT + 4, yPos, TEXT);
  if (penalty === undefined) return;
  drawText(page, penalty.codeSection, 70, yPos, TEXT);
  drawText(page, penalty.description, 140, yPos, TEXT);
  drawTextRight(page, `${penalty.ratePercent}%`, 420, yPos, TEXT);
  drawText(page, penalty.lineNumbers, 440, yPos, TEXT);
  drawTextRight(page, money(penalty.totalAdjustments), X_END - 4, yPos, TEXT);
}

function penalties(page: Ctx, fact: Form8986FactValue, yStart: number) {
  drawText(page, "Applicable Penalties", 250, yStart, BOLD);
  const yHead = yStart + 14;
  drawText(page, "Penalty", X_LEFT, yHead, SMALL);
  drawText(page, "(a) IRC section", 70, yHead, SMALL);
  drawText(page, "(b) Penalty description", 140, yHead, SMALL);
  drawTextRight(page, "(c) Penalty rate", 420, yHead, SMALL);
  drawText(page, "(d) Applicable line numbers above", 440, yHead - 1, { size: 6 });
  drawTextRight(page, "(e) Total applicable adjustments", X_END - 4, yHead + 8, { size: 6 });
  drawLine(page, X_LEFT, yHead + 16, X_END, yHead + 16);
  for (let index = 0; index < 5; index += 1) {
    penaltyRow(page, index, fact.penalties?.[index], yHead + 20 + index * 14);
  }
}

const newPage = (doc: PDFDocument, base: Omit<Ctx, "page">): Ctx => ({
  ...base,
  page: doc.addPage([PAGE_W, PAGE_H]) as PDFPage,
});

export async function form8986Pdf(
  fact: Form8986FactValue,
  partner: Form8986Partner,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const first = newPage(doc, fonts);
  let yPos = header(first, fact);
  yPos = partI(first, fact, yPos);
  yPos = partII(first, fact, yPos);
  yPos = partIII(first, fact, yPos);
  partIV(first, fact, partner, yPos);
  drawText(first, "Form 8986 (Rev. 12-2024)", 470, 770, SMALL);
  const second = newPage(doc, fonts);
  drawText(second, "Form 8986 (Rev. 12-2024)", X_LEFT, 30, SMALL);
  drawText(second, "Page 2", 545, 30, SMALL);
  penalties(second, fact, partV(second, fact, 44));
  return doc.save();
}
