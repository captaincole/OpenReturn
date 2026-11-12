/*
 * Form 1095-A, Health Insurance Marketplace Statement (2025). Line numbers,
 * labels and layout follow the IRS form (irs.gov/pub/irs-prior/f1095a--2025.pdf,
 * created 6/5/25). It prints only the values the fact holds: a blank cell in the
 * fact is a blank cell on the form.
 */

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import type {
  MarketplaceCoverageAmounts,
  MarketplaceCoverageFactValue,
  MarketplaceCoveredIndividual,
} from "../../../src/facts/index.js";
import {
  PAGE_H,
  PAGE_W,
  drawBox,
  drawText,
  drawTextCenter,
  drawTextRight,
  drawWrapped,
  fmtMoney,
  type Ctx,
} from "./draw.js";

const X0 = 36;
const X_END = 576;
const WIDTH = X_END - X0;
const ROW = 24; // a Part I cell
const PART_I_TOP = 92;
const PART_II_TOP = PART_I_TOP + 18 + ROW * 5 + 8;
const PART_II_ROW = 20;
const PART_III_TOP = PART_II_TOP + 18 + 26 + PART_II_ROW * 5 + 8;
const PART_III_ROW = 20;

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

/* A labeled Part I cell: the label at the top, the value under it. */
function cell(ctx: Ctx, xPos: number, yPos: number, width: number, label: string, value = "") {
  drawBox(ctx, xPos, yPos, width, ROW);
  drawText(ctx, label, xPos + 3, yPos + 3, { size: 6 });
  if (value) drawText(ctx, value, xPos + 8, yPos + 12, { size: 9 });
}

function partHeading(ctx: Ctx, yPos: number, part: string, title: string) {
  drawBox(ctx, X0, yPos, 34, 14, { fill: undefined });
  drawText(ctx, part, X0 + 3, yPos + 3, { size: 8, bold: true });
  drawText(ctx, title, X0 + 42, yPos + 3, { size: 9, bold: true });
}

function drawHeader(ctx: Ctx, year: number) {
  drawText(ctx, "Form", X0, 40, { size: 7 });
  drawText(ctx, "1095-A", X0 + 20, 36, { size: 14, bold: true });
  drawText(ctx, "Department of the Treasury", X0, 58, { size: 6 });
  drawText(ctx, "Internal Revenue Service", X0, 66, { size: 6 });
  drawText(ctx, "Health Insurance Marketplace Statement", 150, 36, { size: 12, bold: true });
  drawText(ctx, "Do not attach to your tax return. Keep for your records.", 168, 56, {
    size: 7,
    bold: true,
  });
  drawText(
    ctx,
    "Go to www.irs.gov/Form1095A for instructions and the latest information.",
    150,
    66,
    {
      size: 7,
      bold: true,
    },
  );
  drawBox(ctx, 420, 34, 8, 8);
  drawText(ctx, "VOID", 432, 34, { size: 7 });
  drawBox(ctx, 420, 58, 8, 8);
  drawText(ctx, "CORRECTED", 432, 58, { size: 7 });
  drawText(ctx, "OMB No. 1545-2232", 492, 34, { size: 6 });
  drawTextRight(ctx, String(year), X_END, 54, { size: 20, bold: true });
}

/* "A date of birth is reported in column C only if an SSN isn't entered in column B." */
const dobUnlessSsn = (person: { ssn?: string; dob?: string } | undefined): string =>
  person?.ssn ? "" : (person?.dob ?? "");

const personCells = (person: { name: string; ssn?: string; dob?: string } | undefined) => [
  person?.name ?? "",
  person?.ssn ?? "",
  dobUnlessSsn(person),
];

function drawPartI(ctx: Ctx, value: MarketplaceCoverageFactValue) {
  partHeading(ctx, PART_I_TOP, "Part I", "Recipient Information");
  const third = WIDTH / 3;
  const rows: Array<{ widths: number[]; labels: string[]; values: string[] }> = [
    {
      widths: [third, third, third],
      labels: [
        "1 Marketplace identifier",
        "2 Marketplace-assigned policy number",
        "3 Policy issuer’s name",
      ],
      values: [value.marketplaceId, value.policyNumber, value.issuerName ?? ""],
    },
    {
      widths: [third * 2 - 30, third / 2 + 10, third / 2 + 20],
      labels: ["4 Recipient’s name", "5 Recipient’s SSN", "6 Recipient’s date of birth"],
      values: personCells(value.recipient),
    },
    {
      widths: [third * 2 - 30, third / 2 + 10, third / 2 + 20],
      labels: [
        "7 Recipient’s spouse’s name",
        "8 Recipient’s spouse’s SSN",
        "9 Recipient’s spouse’s date of birth",
      ],
      values: personCells(value.recipientSpouse),
    },
    {
      widths: [third, third, third],
      labels: [
        "10 Policy start date",
        "11 Policy termination date",
        "12 Street address (including apartment no.)",
      ],
      values: [value.policyStartDate ?? "", value.policyEndDate ?? "", value.address?.street ?? ""],
    },
    {
      widths: [third, third, third],
      labels: [
        "13 City or town",
        "14 State or province",
        "15 Country and ZIP or foreign postal code",
      ],
      values: [value.address?.city ?? "", value.address?.state ?? "", value.address?.zip ?? ""],
    },
  ];
  rows.forEach((row, i) => {
    let xPos = X0;
    row.widths.forEach((width, col) => {
      cell(ctx, xPos, PART_I_TOP + 18 + i * ROW, width, row.labels[col], row.values[col]);
      xPos += width;
    });
  });
}

const PART_II_COLUMNS: Array<{ width: number; label: string }> = [
  { width: 170, label: "A. Covered individual name" },
  { width: 90, label: "B. Covered individual SSN" },
  { width: 90, label: "C. Covered individual date of birth" },
  { width: 95, label: "D. Coverage start date" },
  { width: WIDTH - 20 - 445, label: "E. Coverage termination date" },
];

function coveredCells(person: MarketplaceCoveredIndividual | undefined): string[] {
  return [
    person?.name ?? "",
    person?.ssn ?? "",
    dobUnlessSsn(person),
    person?.startDate ?? "",
    person?.endDate ?? "",
  ];
}

function drawPartII(ctx: Ctx, people: MarketplaceCoveredIndividual[]) {
  partHeading(ctx, PART_II_TOP, "Part II", "Covered Individuals");
  const headTop = PART_II_TOP + 18;
  let xPos = X0 + 20;
  for (const column of PART_II_COLUMNS) {
    drawBox(ctx, xPos, headTop, column.width, 26);
    drawWrapped(ctx, column.label, xPos + 3, headTop + 4, column.width - 6, {
      size: 6.5,
      lineGap: 1,
    });
    xPos += column.width;
  }
  for (let i = 0; i < 5; i += 1) {
    const yPos = headTop + 26 + i * PART_II_ROW;
    drawText(ctx, String(16 + i), X0 + 2, yPos + 6, { size: 8, bold: true });
    const values = coveredCells(people[i]);
    let colX = X0 + 20;
    PART_II_COLUMNS.forEach((column, col) => {
      drawBox(ctx, colX, yPos, column.width, PART_II_ROW);
      if (values[col]) drawText(ctx, values[col], colX + 4, yPos + 6, { size: 8.5 });
      colX += column.width;
    });
  }
}

const AMOUNT_WIDTH = (WIDTH - 110) / 3;

const amountCells = (row: MarketplaceCoverageAmounts | undefined): string[] =>
  [row?.enrollmentPremium, row?.slcspPremium, row?.advancePayment].map((amount) =>
    amount === undefined ? "" : fmtMoney(amount),
  );

function amountRow(ctx: Ctx, yPos: number, line: number, month: string, values: string[]) {
  drawBox(ctx, X0, yPos, 110, PART_III_ROW);
  drawText(ctx, `${line}`, X0 + 2, yPos + 6, { size: 8, bold: true });
  drawText(ctx, month, X0 + 20, yPos + 6, { size: 8, bold: line === 33 });
  values.forEach((value, col) => {
    const xPos = X0 + 110 + col * AMOUNT_WIDTH;
    drawBox(ctx, xPos, yPos, AMOUNT_WIDTH, PART_III_ROW);
    if (value) drawTextRight(ctx, value, xPos + AMOUNT_WIDTH - 8, yPos + 6, { size: 9 });
  });
}

function drawPartIII(ctx: Ctx, value: MarketplaceCoverageFactValue) {
  partHeading(ctx, PART_III_TOP, "Part III", "Coverage Information");
  const headTop = PART_III_TOP + 18;
  const labels = [
    "A. Monthly enrollment premiums",
    "B. Monthly second lowest cost silver plan (SLCSP) premium",
    "C. Monthly advance payment of premium tax credit",
  ];
  drawBox(ctx, X0, headTop, 110, 24);
  drawTextCenter(ctx, "Month", X0 + 55, headTop + 9, { size: 7 });
  labels.forEach((label, col) => {
    const xPos = X0 + 110 + col * AMOUNT_WIDTH;
    drawBox(ctx, xPos, headTop, AMOUNT_WIDTH, 24);
    drawWrapped(ctx, label, xPos + 4, headTop + 4, AMOUNT_WIDTH - 8, { size: 6.5, lineGap: 1 });
  });
  MONTHS.forEach((month, i) => {
    amountRow(ctx, headTop + 24 + i * PART_III_ROW, 21 + i, month, amountCells(value.months[i]));
  });
  const totalsTop = headTop + 24 + 12 * PART_III_ROW;
  amountRow(ctx, totalsTop, 33, "Annual Totals", amountCells(value.annualTotals));
  return totalsTop + PART_III_ROW;
}

export async function form1095APdf(
  value: MarketplaceCoverageFactValue,
  year: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  drawHeader(ctx, year);
  drawPartI(ctx, value);
  drawPartII(ctx, value.coveredIndividuals);
  const bottom = drawPartIII(ctx, value);
  drawText(
    ctx,
    "For Privacy Act and Paperwork Reduction Act Notice, see separate instructions.",
    X0,
    bottom + 4,
    {
      size: 6.5,
      bold: true,
    },
  );
  drawText(ctx, "Cat. No. 60703Q", 380, bottom + 4, { size: 6.5 });
  drawTextRight(ctx, `Form 1095-A (${year})`, X_END, bottom + 4, { size: 6.5 });
  return await doc.save();
}
