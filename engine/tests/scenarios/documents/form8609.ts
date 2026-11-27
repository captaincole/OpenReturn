/*
 * Form 8609 (Rev. December 2021), Low-Income Housing Credit Allocation and
 * Certification, as the owner keeps it: Part I completed and signed by the
 * housing credit agency, Part II (the first-year certification) completed and
 * signed by the owner, laid out as the official form
 * (https://www.irs.gov/pub/irs-pdf/f8609.pdf). It prints the amounts the
 * building fact holds (Form8609Amounts: the BIN, lines 1b, 2, 3a, 3b, 7, 8a
 * and the first year of the credit period, and the line 10d election), and the
 * names, addresses, dates and boxes the caller passes. It works nothing out.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { LowIncomeHousingBuildingFactValue } from "../../../src/facts/index.js";
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

/* What the agency and the owner wrote that no fact holds. */
export interface Form8609Issued {
  buildingAddress: string[];
  agencyNameAndAddress: string[];
  agencyEin: string;
  ownerNameAndAddress: string[];
  ownerTin: string;
  /* MM/DD/YYYY. */
  allocationDate: string;
  placedInServiceDate: string;
  /* Line 4, as a percent ("0"). */
  taxExemptBondPercent: string;
  /* Line 6: the boxes the agency checked, "a" to "f". */
  allocationBoxes: string[];
  /* Line 10c: "20-50", "40-60", "Average income" or "25-60". */
  minimumSetAside: string;
  agencyOfficial: string;
  agencySignedOn: string;
  ownerSigner: string;
  ownerSignedOn: string;
}

const X_LEFT = 36;
const X_END = 576;
const X_BOX = 470;
const SMALL = { size: 7 };
const TEXT = { size: 8 };
const BOLD = { size: 8, bold: true };
const FILLED = { size: 9 };
const SIGNED = { size: 10, italic: true };
const CHECK = "X";

function partBar(ctx: Ctx, yPos: number, part: string, title: string) {
  drawBox(ctx, X_LEFT, yPos, X_END - X_LEFT, 12, { fill: SHADE });
  drawText(ctx, part, X_LEFT + 4, yPos + 2, BOLD);
  drawText(ctx, title, X_LEFT + 56, yPos + 2, BOLD);
}

function box(ctx: Ctx, xPos: number, yPos: number, checked: boolean) {
  drawBox(ctx, xPos, yPos, 7, 7);
  if (checked) drawText(ctx, CHECK, xPos + 1.5, yPos, { size: 7, bold: true });
}

/* A numbered line with its amount in the right-hand box. */
function amountLine(ctx: Ctx, yPos: number, num: string, label: string, amount?: string) {
  // Line 1 prints "1a" at the left and "1b" in the amount box, as the form does.
  drawText(ctx, num === "1b" ? "1a" : num, X_LEFT + 4, yPos, TEXT);
  drawText(ctx, label, X_LEFT + 26, yPos, TEXT);
  drawBox(ctx, X_BOX, yPos - 3, X_END - X_BOX, 13);
  drawText(ctx, num, X_BOX + 3, yPos, BOLD);
  if (amount !== undefined) drawTextRight(ctx, amount, X_END - 4, yPos, FILLED);
}

function lines(ctx: Ctx, xPos: number, yPos: number, values: string[]) {
  values.forEach((value, index) => drawText(ctx, value, xPos, yPos + index * 10, FILLED));
}

function header(ctx: Ctx) {
  drawText(ctx, "Form 8609", X_LEFT, 30, { size: 16, bold: true });
  drawText(ctx, "(Rev. December 2021)", X_LEFT, 50, SMALL);
  drawText(ctx, "Department of the Treasury  Internal Revenue Service", X_LEFT, 58, SMALL);
  drawText(ctx, "Low-Income Housing Credit Allocation", 210, 30, { size: 12, bold: true });
  drawText(ctx, "and Certification", 262, 44, { size: 12, bold: true });
  drawText(
    ctx,
    "Go to www.irs.gov/Form8609 for instructions and the latest information.",
    230,
    58,
    SMALL,
  );
  drawText(ctx, "OMB No. 1545-0988", 500, 40, SMALL);
  drawLine(ctx, X_LEFT, 68, X_END, 68);
}

function partOneTop(ctx: Ctx, issued: Form8609Issued, bin: string) {
  partBar(ctx, 72, "Part I", "Allocation of Credit");
  drawText(ctx, "Check if:", X_LEFT, 89, TEXT);
  box(ctx, 80, 89, false);
  drawText(ctx, "Addition to Qualified Basis", 90, 89, TEXT);
  box(ctx, 210, 89, false);
  drawText(ctx, "Amended Form", 220, 89, TEXT);
  drawText(ctx, "A  Address of building (do not use P.O. box)", X_LEFT, 101, SMALL);
  lines(ctx, X_LEFT + 10, 112, issued.buildingAddress);
  drawText(ctx, "B  Name and address of housing credit agency", 310, 101, SMALL);
  lines(ctx, 320, 112, issued.agencyNameAndAddress);
  drawText(
    ctx,
    "C  Name, address, and TIN of building owner receiving allocation",
    X_LEFT,
    145,
    SMALL,
  );
  lines(ctx, X_LEFT + 10, 156, issued.ownerNameAndAddress);
  drawText(ctx, `TIN  ${issued.ownerTin}`, X_LEFT + 10, 188, FILLED);
  drawText(ctx, "D  Employer identification number of agency", 310, 145, SMALL);
  drawText(ctx, issued.agencyEin, 320, 156, FILLED);
  drawText(ctx, "E  Building identification number (BIN)", 310, 172, SMALL);
  drawText(ctx, bin, 320, 183, FILLED);
  drawLine(ctx, X_LEFT, 200, X_END, 200);
}

function partOneLines(ctx: Ctx, value: LowIncomeHousingBuildingFactValue, issued: Form8609Issued) {
  const amounts = value.form8609;
  amountLine(
    ctx,
    210,
    "1b",
    `Date of allocation  ${issued.allocationDate}     b  Maximum housing credit dollar amount allowable`,
    fmtMoney(amounts.maximumCreditAmount),
  );
  amountLine(
    ctx,
    228,
    "2",
    "Maximum applicable credit percentage allowable",
    `${(amounts.creditPercentage * 100).toFixed(2)} %`,
  );
  amountLine(ctx, 246, "3a", "Maximum qualified basis", fmtMoney(amounts.maximumQualifiedBasis));
  const raised = amounts.highCostBasisPercentage;
  box(ctx, X_LEFT + 26, 264, raised !== undefined);
  amountLine(
    ctx,
    264,
    "3b",
    "     Eligible basis increased under the high-cost area provisions of sec. 42(d)(5)(B)",
    raised === undefined ? undefined : `${(raised * 100).toFixed(0)} %`,
  );
  amountLine(
    ctx,
    282,
    "4",
    "Percentage of the aggregate basis financed by tax-exempt bonds",
    `${issued.taxExemptBondPercent} %`,
  );
  drawText(ctx, "5a  Date building placed in service", X_LEFT + 4, 300, TEXT);
  drawText(ctx, issued.placedInServiceDate, 300, 300, FILLED);
  drawText(
    ctx,
    "6   Check the boxes that describe the allocation for the building:",
    X_LEFT + 4,
    316,
    TEXT,
  );
  const labels: Array<[string, string]> = [
    ["a", "Newly constructed and federally subsidized"],
    ["b", "Newly constructed and not federally subsidized"],
    ["c", "Existing building"],
    ["d", "Sec. 42(e) rehabilitation expenditures federally subsidized"],
    ["e", "Sec. 42(e) rehabilitation expenditures not federally subsidized"],
    ["f", "Allocation subject to nonprofit set-aside under sec. 42(h)(5)"],
  ];
  labels.forEach(([letter, label], index) => {
    const yPos = 328 + index * 11;
    box(ctx, X_LEFT + 30, yPos, issued.allocationBoxes.includes(letter));
    drawText(ctx, `${letter}  ${label}`, X_LEFT + 42, yPos, TEXT);
  });
}

function signature(ctx: Ctx, yPos: number, signer: string, signedOn: string, labels: string[]) {
  drawText(ctx, `/s/ ${signer}`, X_LEFT + 10, yPos - 12, SIGNED);
  drawText(ctx, signer, 240, yPos - 11, FILLED);
  drawText(ctx, signedOn, 480, yPos - 11, FILLED);
  drawLine(ctx, X_LEFT, yPos, 220, yPos);
  drawLine(ctx, 235, yPos, 460, yPos);
  drawLine(ctx, 475, yPos, X_END, yPos);
  drawText(ctx, labels[0], X_LEFT + 40, yPos + 3, SMALL);
  drawText(ctx, labels[1], 300, yPos + 3, SMALL);
  drawText(ctx, labels[2], 515, yPos + 3, SMALL);
}

function partTwo(ctx: Ctx, value: LowIncomeHousingBuildingFactValue, issued: Form8609Issued) {
  partBar(ctx, 430, "Part II", "First-Year Certification—Completed by Building Owners");
  amountLine(ctx, 448, "7", "Eligible basis of building", fmtMoney(value.form8609.eligibleBasis));
  amountLine(
    ctx,
    466,
    "8a",
    "Original qualified basis of the building at close of first year of credit period",
    fmtMoney(value.form8609.originalQualifiedBasis),
  );
  drawText(
    ctx,
    "b   Treating this building as part of a multiple building project?  No",
    X_LEFT + 4,
    481,
    TEXT,
  );
  drawText(
    ctx,
    "9a  Elect to reduce eligible basis under section 42(i)(2)(B)?  No     b  Under section 42(d)(3)(B)?  No",
    X_LEFT + 4,
    491,
    TEXT,
  );
  drawText(
    ctx,
    "10  a  Elect to begin credit period the first year after placed in service?  No",
    X_LEFT + 4,
    502,
    TEXT,
  );
  drawText(
    ctx,
    `c  Minimum set-aside requirement (section 42(g)):  ${issued.minimumSetAside}`,
    X_LEFT + 22,
    513,
    TEXT,
  );
  box(ctx, X_LEFT + 22, 524, value.deepRentSkewed !== "not_elected");
  drawText(
    ctx,
    "d  Elect deep rent skewed project (section 142(d)(4)(B))   15-40",
    X_LEFT + 34,
    524,
    TEXT,
  );
  signature(ctx, 566, issued.ownerSigner, issued.ownerSignedOn, [
    "Signature",
    "Name (please type or print)",
    "Date",
  ]);
  drawText(ctx, "Taxpayer identification number", X_LEFT, 582, SMALL);
  drawText(ctx, issued.ownerTin, X_LEFT + 120, 582, FILLED);
  drawText(ctx, "First year of the credit period", 310, 582, SMALL);
  drawText(ctx, String(value.form8609.firstCreditYear), 430, 582, FILLED);
}

export async function form8609Pdf(
  value: LowIncomeHousingBuildingFactValue,
  issued: Form8609Issued,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  header(ctx);
  partOneTop(ctx, issued, value.form8609.buildingIdentificationNumber);
  partOneLines(ctx, value, issued);
  drawText(
    ctx,
    "Signature of Authorized Housing Credit Agency Official—Completed by Housing Credit Agency Only",
    X_LEFT,
    395,
    BOLD,
  );
  signature(ctx, 419, issued.agencyOfficial, issued.agencySignedOn, [
    "Signature of authorized official",
    "Name (please type or print)",
    "Date",
  ]);
  partTwo(ctx, value, issued);
  drawText(
    ctx,
    "For Privacy Act and Paperwork Reduction Act Notice, see separate instructions.",
    X_LEFT,
    760,
    SMALL,
  );
  drawText(ctx, "Form 8609 (Rev. 12-2021)", 490, 760, SMALL);
  return doc.save();
}
