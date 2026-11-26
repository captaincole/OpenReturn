/*
 * One certificate's Part I, from its facts. A case the engine does not
 * handle is a gap with its reason; undefined while an answer waits.
 */

import { unsupported, type Unsupported } from "../../../types.js";
import type { FilmCertificate } from "./filingInfo.js";
import { partILines, programOf, type FilmProgram, type PartILines } from "./lines.js";

export interface CertificateFigures {
  program: FilmProgram;
  partI: PartILines;
}

export const NO_PROGRAM = unsupported(
  "The certificate number is below 1000, so no credit box of the form fits it (Original starts at 1000).",
);
export const CREDIT_SOLD = unsupported(
  "Line 6 takes FTB 3551 Part III box 7, and the seller reports the sale price as gain (ca-3541-inst-2025::sec::important-information::b06); the engine has neither FTB 3551 nor that income.",
);
export const BOUGHT_BELOW_CREDIT = unsupported(
  "A credit bought for less than its amount makes the buyer report the difference as income (ca-3541-inst-2025::sec::important-information::b06); the engine does not add that income, so the credit is not claimed.",
);

/* The program of the certificate, a gap below 1000, or undefined while the number waits. */
export function certificateProgram(row: FilmCertificate): FilmProgram | Unsupported | undefined {
  if (row.certificateNumber === undefined) return undefined;
  return programOf(row.certificateNumber) ?? NO_PROGRAM;
}

/* Part I lines 1 to 5a and 9, which need only the stated amounts. */
export function statedPartI(row: FilmCertificate): PartILines | undefined {
  const { source, credit, carryover } = row;
  if (source === undefined || credit === undefined || carryover === undefined) return undefined;
  return partILines({
    source,
    credit,
    carryover,
    appliedToSalesAndUseTax: row.appliedToSalesAndUseTax,
  });
}

/* The program and Part I through line 11, or the gap that stops line 10 onwards. */
export function certificateFigures(
  row: FilmCertificate,
): CertificateFigures | Unsupported | undefined {
  const program = certificateProgram(row);
  if (program === undefined || "unsupported" in program) return program;
  if (row.soldToOthers > 0) return CREDIT_SOLD;
  const partI = statedPartI(row);
  if (partI === undefined) return undefined;
  if (row.source === "purchased") {
    if (row.purchasePrice === undefined) return undefined;
    if (row.purchasePrice < (row.credit ?? 0)) return BOUGHT_BELOW_CREDIT;
  }
  return { program, partI };
}
