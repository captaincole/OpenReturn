/*
 * Form 8332 (Rev. December 2025), as the custodial parent signs it and gives
 * it to the noncustodial parent: the header, Part I, Part II and Part III as
 * on the official form (https://www.irs.gov/pub/irs-pdf/f8332.pdf). It prints
 * only the values the release fact holds (the custodial parent's SSN, the
 * Part I year, the Part II years), the names the caller passes, and the
 * signature and date. Part III stays blank: a release copy has no revocation.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { Form8332ReleaseFactValue, Form8332Years } from "../../../src/facts/index.js";
import { PAGE_H, PAGE_W, SHADE, drawBox, drawLine, drawText, type Ctx } from "./draw.js";

export interface Form8332Signed {
  noncustodialParentName: string;
  noncustodialParentSsn: string;
  childName: string;
  /* The custodial parent's name as signed, and the date (MM/DD/YYYY). */
  custodialParentName: string;
  signedOn: string;
}

const X_LEFT = 36;
const X_END = 576;
const SMALL = { size: 7 };
const TEXT = { size: 9 };
const BOLD = { size: 9, bold: true };
const FILLED = { size: 10 };
const SIGNED = { size: 11, italic: true };

/* The years as a person writes them; the fact holds a list or "all future years". */
function written(years: Form8332Years): string {
  return years === "all_future_years" ? "all future years" : years.join(", ");
}

function partBar(ctx: Ctx, yPos: number, part: string, title: string) {
  drawBox(ctx, X_LEFT, yPos, X_END - X_LEFT, 13, { fill: SHADE });
  drawText(ctx, part, X_LEFT + 4, yPos + 2, BOLD);
  drawText(ctx, title, X_LEFT + 60, yPos + 2, BOLD);
}

/* A signature row: the custodial parent's signature, SSN and date over three labels. */
function signatureRow(
  ctx: Ctx,
  yPos: number,
  label: string,
  signed?: Form8332Signed,
  ssn?: string,
) {
  if (signed !== undefined) {
    drawText(ctx, `/s/ ${signed.custodialParentName}`, X_LEFT + 20, yPos - 13, SIGNED);
    drawText(ctx, ssn ?? "", 400, yPos - 12, FILLED);
    drawText(ctx, signed.signedOn, 505, yPos - 12, FILLED);
  }
  drawLine(ctx, X_LEFT, yPos, 340, yPos);
  drawLine(ctx, 380, yPos, 480, yPos);
  drawLine(ctx, 495, yPos, X_END, yPos);
  drawText(ctx, label, X_LEFT + 40, yPos + 3, SMALL);
  drawText(ctx, "Custodial parent's SSN", 392, yPos + 3, SMALL);
  drawText(ctx, "Date", 528, yPos + 3, SMALL);
}

/* "I agree not to claim …" with the child's name, then the years line. */
function releaseLines(
  ctx: Ctx,
  yPos: number,
  childName: string | undefined,
  yearsLabel: string,
  years: string,
) {
  drawText(ctx, "I agree not to claim an exemption for", X_LEFT, yPos, TEXT);
  drawLine(ctx, 200, yPos + 10, X_END, yPos + 10);
  if (childName !== undefined) drawText(ctx, childName, 206, yPos - 1, FILLED);
  drawText(ctx, "Name of child", 360, yPos + 13, SMALL);
  drawText(ctx, yearsLabel, X_LEFT, yPos + 30, TEXT);
  drawText(ctx, years, X_LEFT + 118, yPos + 29, FILLED);
}

function header(ctx: Ctx, signed: Form8332Signed) {
  drawText(ctx, "Form 8332", X_LEFT, 34, { size: 16, bold: true });
  drawText(ctx, "(Rev. December 2025)", X_LEFT, 54, SMALL);
  drawText(ctx, "Release/Revocation of Release of Claim", 190, 34, { size: 12, bold: true });
  drawText(ctx, "to Exemption for Child by Custodial Parent", 182, 49, { size: 12, bold: true });
  drawText(ctx, "Attach a separate form for each child.", 236, 64, SMALL);
  drawText(ctx, "OMB No. 1545-0074", 490, 34, SMALL);
  drawLine(ctx, X_LEFT, 78, X_END, 78);
  drawText(ctx, "Name of noncustodial parent", X_LEFT, 82, SMALL);
  drawText(ctx, signed.noncustodialParentName, X_LEFT + 4, 93, FILLED);
  drawText(ctx, "Noncustodial parent's social security number (SSN)", 360, 82, SMALL);
  drawText(ctx, signed.noncustodialParentSsn, 470, 93, FILLED);
  drawLine(ctx, X_LEFT, 108, X_END, 108);
}

export async function form8332Pdf(
  release: Form8332ReleaseFactValue,
  signed: Form8332Signed,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  header(ctx, signed);
  partBar(ctx, 116, "Part I", "Release of Claim to Exemption for Current Year");
  const partIYear = release.currentYear === undefined ? "" : String(release.currentYear).slice(-2);
  releaseLines(
    ctx,
    146,
    release.currentYear === undefined ? undefined : signed.childName,
    "for the tax year 20",
    partIYear,
  );
  signatureRow(
    ctx,
    222,
    "Signature of custodial parent releasing claim to exemption",
    release.currentYear === undefined ? undefined : signed,
    release.custodialParentSsn,
  );
  partBar(ctx, 244, "Part II", "Release of Claim to Exemption for Future Years");
  const future = release.futureYears;
  releaseLines(
    ctx,
    274,
    future === undefined ? undefined : signed.childName,
    "for the tax year(s)",
    future === undefined ? "" : written(future),
  );
  signatureRow(
    ctx,
    350,
    "Signature of custodial parent releasing claim to exemption",
    future === undefined ? undefined : signed,
    release.custodialParentSsn,
  );
  partBar(ctx, 372, "Part III", "Revocation of Release of Claim to Exemption for Future Year(s)");
  drawText(ctx, "I revoke the release of claim to an exemption for", X_LEFT, 402, TEXT);
  drawLine(ctx, 250, 412, X_END, 412);
  drawText(ctx, "for the tax year(s)", X_LEFT, 432, TEXT);
  signatureRow(
    ctx,
    478,
    "Signature of custodial parent revoking the release of claim to exemption",
  );
  return doc.save();
}
