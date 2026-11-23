/*
 * Form 1099-LTC, Long-Term Care and Accelerated Death Benefits, Copy B.
 * The layout, box numbers and labels follow the official form (Rev. April 2025):
 * https://www.irs.gov/pub/irs-pdf/f1099ltc.pdf
 */

import type { LtcBenefitsFactValue } from "../../../src/facts/index.js";
import { drawText, type Ctx } from "./draw.js";
import {
  X_BOXES,
  X_GRID_END,
  X_LEFT,
  X_NAME_CELL,
  X_TIN_SPLIT,
  Y_ACCOUNT,
  Y_END,
  Y_NAME,
  Y_ROW_2,
  Y_TOP,
  cell,
  checkbox,
  drawEdges,
  drawFormName,
  drawNameAndAddress,
  drawRightLines,
  drawRightNotice,
  moneyValue,
  newFormPage,
  value,
} from "./form1099SA.js";

export interface Form1099LtcParties {
  payerStreet: string;
  payerCityStateZip: string;
  payerPhone: string;
  policyholderName: string;
  policyholderTin: string;
  policyholderStreet: string;
  policyholderCityStateZip: string;
  insuredStreet: string;
  insuredCityStateZip: string;
}

/* Rows of the box column: box 1, box 2 and box 3 stack beside the payer and the TINs. */
const Y_BOX_2 = 83;
const Y_BOX_3 = 120;
const Y_INSURED = 144;
/* The bottom row: account number, box 4, box 5 and the date certified. */
const X_BOX_4 = 218;
const X_DATE = 441;

const LABEL = { size: 6.5 };

function drawPolicyholder(ctx: Ctx, ltc: LtcBenefitsFactValue, parties: Form1099LtcParties) {
  cell(
    ctx,
    X_LEFT,
    Y_TOP,
    X_BOXES,
    Y_ROW_2,
    "PAYER’S name, street address, city or town, state or province, country, ZIP or foreign " +
      "postal code, and telephone no.",
  );
  [ltc.payerName, parties.payerStreet, parties.payerCityStateZip, parties.payerPhone].forEach(
    (line, index) => value(ctx, line, X_LEFT, Y_TOP + 26 + index * 11),
  );
  cell(ctx, X_LEFT, Y_ROW_2, X_TIN_SPLIT, Y_NAME, "PAYER’S TIN");
  value(ctx, ltc.payerTin ?? "", X_LEFT, Y_ROW_2 + 13);
  cell(ctx, X_TIN_SPLIT, Y_ROW_2, X_BOXES, Y_NAME, "POLICYHOLDER’S TIN");
  value(ctx, parties.policyholderTin, X_TIN_SPLIT, Y_ROW_2 + 13);
  cell(ctx, X_LEFT, Y_NAME, X_BOXES, Y_ACCOUNT, "POLICYHOLDER’S name");
  drawNameAndAddress(ctx, X_LEFT, Y_NAME, {
    name: parties.policyholderName,
    street: parties.policyholderStreet,
    cityStateZip: parties.policyholderCityStateZip,
  });
}

function drawInsured(ctx: Ctx, ltc: LtcBenefitsFactValue, parties: Form1099LtcParties) {
  cell(ctx, X_NAME_CELL, Y_ROW_2, X_GRID_END, Y_INSURED, "INSURED’S TIN");
  value(ctx, ltc.insuredSsn, X_NAME_CELL, Y_ROW_2 + 18);
  cell(ctx, X_BOXES, Y_INSURED, X_GRID_END, Y_ACCOUNT, "INSURED’S name");
  value(ctx, ltc.insuredName, X_BOXES, Y_INSURED + 13);
  drawText(ctx, "Street address (including apt. no.)", X_BOXES + 4, Y_INSURED + 28, LABEL);
  value(ctx, parties.insuredStreet, X_BOXES, Y_INSURED + 37);
  drawText(
    ctx,
    "City or town, state or province, country, and ZIP or foreign postal code",
    X_BOXES + 4,
    Y_INSURED + 52,
    { size: 5.5 },
  );
  value(ctx, parties.insuredCityStateZip, X_BOXES, Y_INSURED + 61);
}

function drawAmountBoxes(ctx: Ctx, ltc: LtcBenefitsFactValue) {
  cell(ctx, X_BOXES, Y_TOP, X_NAME_CELL, Y_BOX_2, "1 Gross long-term care benefits paid");
  moneyValue(ctx, ltc.box1, X_BOXES, Y_BOX_2);
  cell(ctx, X_BOXES, Y_BOX_2, X_NAME_CELL, Y_BOX_3, "2 Accelerated death benefits paid");
  moneyValue(ctx, ltc.box2, X_BOXES, Y_BOX_3);
  cell(ctx, X_BOXES, Y_BOX_3, X_NAME_CELL, Y_INSURED, "3");
  checkbox(ctx, X_BOXES + 7, Y_BOX_3 + 12, ltc.box3 === "per_diem");
  drawText(ctx, "Per", X_BOXES + 18, Y_BOX_3 + 9, LABEL);
  drawText(ctx, "diem", X_BOXES + 18, Y_BOX_3 + 16, LABEL);
  checkbox(ctx, X_BOXES + 43, Y_BOX_3 + 12, ltc.box3 === "reimbursed");
  drawText(ctx, "Reimbursed", X_BOXES + 54, Y_BOX_3 + 9, LABEL);
  drawText(ctx, "amount", X_BOXES + 54, Y_BOX_3 + 16, LABEL);
}

function drawBottomRow(ctx: Ctx, ltc: LtcBenefitsFactValue) {
  cell(ctx, X_LEFT, Y_ACCOUNT, X_BOX_4, Y_END, "Account number (see instructions)");
  cell(ctx, X_BOX_4, Y_ACCOUNT, X_BOXES, Y_END, "4 Qualified contract");
  drawText(ctx, "(optional)", X_BOX_4 + 18, Y_ACCOUNT + 12, LABEL);
  checkbox(ctx, X_BOX_4 + 5, Y_ACCOUNT + 12, ltc.box4 === true);
  cell(ctx, X_BOXES, Y_ACCOUNT, X_DATE, Y_END, "5 (optional)");
  checkbox(ctx, X_DATE - 64, Y_ACCOUNT + 3, ltc.box5 === "chronically_ill");
  drawText(ctx, "Chronically ill", X_DATE - 53, Y_ACCOUNT + 4, LABEL);
  checkbox(ctx, X_DATE - 64, Y_ACCOUNT + 13, ltc.box5 === "terminally_ill");
  drawText(ctx, "Terminally ill", X_DATE - 53, Y_ACCOUNT + 14, LABEL);
  cell(ctx, X_DATE, Y_ACCOUNT, X_GRID_END, Y_END, "Date certified");
  value(ctx, ltc.box5DateCertified ?? "", X_DATE - 4, Y_ACCOUNT + 13);
}

function drawTitleAndCopy(ctx: Ctx) {
  drawRightLines(ctx, ["Long-Term Care and", "Accelerated Death", "Benefits"], Y_TOP + 24, {
    size: 9.5,
    bold: true,
  });
  drawRightLines(ctx, ["Copy B"], Y_ROW_2 + 2, { size: 9.5, bold: true });
  drawRightLines(ctx, ["For Policyholder"], Y_ROW_2 + 14, { size: 8, bold: true });
  drawRightNotice(
    ctx,
    "This is important tax information and is being furnished to the IRS. If you are required " +
      "to file a return, a negligence penalty or other sanction may be imposed on you if this " +
      "item is required to be reported and the IRS determines that it has not been reported.",
    Y_ROW_2 + 26,
  );
}

/* Prints only what the fact holds: a box the fact leaves out prints blank or unchecked. */
export async function form1099LtcPdf(
  ltc: LtcBenefitsFactValue,
  parties: Form1099LtcParties,
  year: number,
): Promise<Uint8Array> {
  const { doc, ctx } = await newFormPage();
  drawPolicyholder(ctx, ltc, parties);
  drawInsured(ctx, ltc, parties);
  drawAmountBoxes(ctx, ltc);
  drawBottomRow(ctx, ltc);
  drawFormName(ctx, { omb: "OMB No. 1545-1519", number: "1099-LTC", year });
  drawTitleAndCopy(ctx);
  drawEdges(ctx, { number: "1099-LTC", url: "www.irs.gov/Form1099LTC" });
  return doc.save();
}
