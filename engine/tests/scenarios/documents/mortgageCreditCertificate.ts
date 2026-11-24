/*
 * A Mortgage Credit Certificate (MCC): the certificate a state or local housing
 * finance agency issues to a home buyer under section 25. The IRS publishes no
 * form for it, and each agency draws its own. This one carries what an MCC names
 * (irs-8396-form-2025::sec::who-can-claim-the-credit::b01; Pub. 530, "Mortgage
 * Interest Credit"): the issuer, the certificate number and date, the holder and
 * the residence, the certificate credit rate and the certified indebtedness
 * amount. The original loan amount and the interest paid are in the fact, but
 * not on an MCC (the loan papers and Form 1098 hold them), so this document
 * leaves them out.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type { MortgageCreditCertificateFactValue } from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  SHADE,
  drawBox,
  drawLine,
  drawText,
  drawTextCenter,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

export interface CertificateParties {
  issuerStreet: string;
  issuerCityStateZip: string;
  holderName: string;
  holderTin: string;
  holderStreet: string;
  holderCityStateZip: string;
  /* The participating lender that made the certified loan. */
  lenderName: string;
  /* The agency officer who signs the certificate. */
  officerName: string;
  officerTitle: string;
}

const X_LEFT = 50;
const X_SPLIT = 306;
const X_RIGHT = 562;
const X_CENTER = PAGE_W / 2;
const ROW = 34;
const LABEL = { size: 7 };

/* A cell with its label at the top left and the value under it. */
function cell(ctx: Ctx, xPos: number, yPos: number, xEnd: number, label: string, value: string) {
  drawBox(ctx, xPos, yPos, xEnd - xPos, ROW);
  drawText(ctx, label, xPos + 4, yPos + 4, LABEL);
  drawText(ctx, value, xPos + 8, yPos + 17, { size: 10 });
}

/* A shaded band that names the part of the certificate below it. */
function band(ctx: Ctx, title: string, yTop: number): number {
  drawBox(ctx, X_LEFT, yTop, X_RIGHT - X_LEFT, 16, { fill: SHADE });
  drawText(ctx, title, X_LEFT + 4, yTop + 4, { size: 8, bold: true });
  return yTop + 16;
}

function drawHeader(
  ctx: Ctx,
  mcc: MortgageCreditCertificateFactValue,
  parties: CertificateParties,
): number {
  drawTextCenter(ctx, mcc.issuerName, X_CENTER, 40, { size: 15, bold: true });
  drawTextCenter(ctx, `${parties.issuerStreet}, ${parties.issuerCityStateZip}`, X_CENTER, 60, {
    size: 9,
  });
  drawLine(ctx, X_LEFT, 76, X_RIGHT, 76, { thickness: 1.5 });
  drawTextCenter(ctx, "MORTGAGE CREDIT CERTIFICATE", X_CENTER, 90, { size: 17, bold: true });
  drawTextCenter(ctx, "Issued under section 25 of the Internal Revenue Code", X_CENTER, 112, {
    size: 9,
    italic: true,
  });
  return 134;
}

function drawCertificate(ctx: Ctx, mcc: MortgageCreditCertificateFactValue, yTop: number): number {
  const y1 = band(ctx, "Certificate", yTop);
  cell(ctx, X_LEFT, y1, X_SPLIT, "Certificate number", mcc.certificateNumber ?? "");
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Date of issue", mcc.issueDate ?? "");
  const y2 = y1 + ROW;
  cell(ctx, X_LEFT, y2, X_SPLIT, "Certificate credit rate", `${mcc.creditRatePercent}%`);
  cell(
    ctx,
    X_SPLIT,
    y2,
    X_RIGHT,
    "Certified indebtedness amount",
    `$ ${fmtMoney(mcc.certifiedIndebtedness)}`,
  );
  return y2 + ROW + 12;
}

/* The residence prints the fact's home address when it has one; else the holder's address. */
function drawHolder(
  ctx: Ctx,
  mcc: MortgageCreditCertificateFactValue,
  parties: CertificateParties,
  yTop: number,
): number {
  const y1 = band(ctx, "Holder and residence", yTop);
  cell(ctx, X_LEFT, y1, X_SPLIT, "Holder's name", parties.holderName);
  cell(ctx, X_SPLIT, y1, X_RIGHT, "Holder's social security number", parties.holderTin);
  const y2 = y1 + ROW;
  const residence = mcc.homeAddress ?? `${parties.holderStreet}, ${parties.holderCityStateZip}`;
  cell(ctx, X_LEFT, y2, X_RIGHT, "Address of the principal residence", residence);
  const y3 = y2 + ROW;
  cell(ctx, X_LEFT, y3, X_RIGHT, "Participating lender", parties.lenderName);
  return y3 + ROW + 14;
}

function drawTerms(ctx: Ctx, yTop: number): number {
  const terms = [
    "The issuer certifies that the holder may claim the mortgage interest credit under section 25 " +
      "for interest paid on the certified indebtedness, at the certificate credit rate shown above, " +
      "for each year the residence is the holder's principal residence.",
    "The credit is claimed on Form 8396, Mortgage Interest Credit, filed with the holder's federal " +
      "income tax return. When the certificate credit rate is more than 20%, the credit for a year " +
      "may not be more than $2,000.",
    "If the loan is refinanced, ask the issuer to reissue the certificate. A sale of the home within " +
      "nine years may cause a federal recapture tax (Form 8828).",
    "Keep this certificate with your tax records. Do not send it with your return.",
  ];
  return terms.reduce(
    (yPos, text) =>
      drawWrapped(ctx, text, X_LEFT, yPos, X_RIGHT - X_LEFT, { size: 8.5, lineGap: 3 }) + 6,
    yTop,
  );
}

function drawSignature(ctx: Ctx, parties: CertificateParties, yTop: number) {
  const yLine = yTop + 34;
  drawText(ctx, parties.officerName, X_LEFT + 4, yLine - 14, { size: 11, italic: true });
  drawLine(ctx, X_LEFT, yLine, X_SPLIT - 20, yLine);
  drawText(ctx, `${parties.officerName}, ${parties.officerTitle}`, X_LEFT, yLine + 4, LABEL);
  drawText(ctx, "Authorized officer of the issuer", X_LEFT, yLine + 14, LABEL);
  drawText(ctx, "SAMPLE DOCUMENT FOR SOFTWARE TESTING. MADE-UP DATA.", X_LEFT, PAGE_H - 50, {
    size: 7,
    italic: true,
  });
}

export async function mortgageCreditCertificatePdf(
  mcc: MortgageCreditCertificateFactValue,
  parties: CertificateParties,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const afterHeader = drawHeader(ctx, mcc, parties);
  const afterCertificate = drawCertificate(ctx, mcc, afterHeader);
  const afterHolder = drawHolder(ctx, mcc, parties, afterCertificate);
  const afterTerms = drawTerms(ctx, afterHolder);
  drawSignature(ctx, parties, afterTerms + 10);
  return doc.save();
}
