/*
 * Schedule K-1 (Form 1041), Beneficiary's Share of Income, Deductions,
 * Credits, etc. (2025). Part, item and box numbers, labels and layout follow
 * the IRS form (irs.gov/pub/irs-pdf/f1041sk1.pdf, created 5/2/25). It prints
 * only the values the fact holds; the box 14 code I statement (section 199A
 * information) prints on a page of its own.
 */

import type { TrustK1FactValue } from "../../../src/facts/index.js";
import { drawText, drawWrapped } from "./draw.js";
import {
  PART_III_X,
  X_END,
  addPage,
  drawActivityChecks,
  drawK1Footer,
  drawK1Header,
  drawLeftStack,
  drawPartIIIGrid,
  drawStatementPage,
  newK1Doc,
  partyLines,
  section199ARows,
  type K1Grid,
  type K1LeftItem,
  type K1Owner,
  type K1Party,
} from "./scheduleK1Draw.js";

/* What the K-1 prints that the fact does not hold. */
export interface TrustK1Parties {
  /* Item C: the fiduciary (trustee or executor). */
  fiduciary: K1Party;
  beneficiary: K1Owner;
}

const one = (box: string, label: string) => ({ box, label, rows: 1 });
const coded = (box: string, label: string, rows: number) => ({ box, label, rows, coded: true });

const GRID: K1Grid = [
  [
    one("1", "Interest income"),
    one("2a", "Ordinary dividends"),
    one("2b", "Qualified dividends"),
    one("3", "Net short-term capital gain"),
    one("4a", "Net long-term capital gain"),
    one("4b", "28% rate gain"),
    one("4c", "Unrecaptured section 1250 gain"),
    one("5", "Other portfolio and nonbusiness income"),
    one("6", "Ordinary business income"),
    one("7", "Net rental real estate income"),
    one("8", "Other rental income"),
    coded("9", "Directly apportioned deductions", 3),
    one("10", "Estate tax deduction"),
  ],
  [
    coded("11", "Final year deductions", 5),
    coded("12", "Alternative minimum tax adjustment", 4),
    coded("13", "Credits and credit recapture", 3),
    coded("14", "Other information", 3),
  ],
];

function partI(value: TrustK1FactValue, fiduciary: K1Party): K1LeftItem[] {
  return [
    { part: "Part I", title: "Information About the Estate or Trust" },
    {
      letter: "A",
      label: "Estate’s or trust’s employer identification number",
      height: 26,
      lines: [value.entityEin],
    },
    { letter: "B", label: "Estate’s or trust’s name", height: 40, lines: [value.entityName] },
    {
      letter: "C",
      label: "Fiduciary’s name, address, city, state, and ZIP code",
      height: 60,
      lines: partyLines(fiduciary),
    },
    {
      letter: "D",
      label: "Check if Form 1041-T was filed and enter the date it was filed",
      height: 26,
      rightCheck: {},
    },
    {
      letter: "E",
      label: "Check if this is the final Form 1041 for the estate or trust",
      height: 16,
      rightCheck: { checked: value.finalYearOfEntity },
    },
  ];
}

function partII(beneficiary: K1Owner): K1LeftItem[] {
  return [
    { part: "Part II", title: "Information About the Beneficiary" },
    {
      letter: "F",
      label: "Beneficiary’s identifying number",
      height: 26,
      lines: [beneficiary.tin],
    },
    {
      letter: "G",
      label: "Beneficiary’s name, address, city, state, and ZIP code",
      height: 60,
      lines: partyLines(beneficiary),
    },
    {
      letter: "H",
      label: "",
      height: 16,
      checks: [
        { label: "Domestic beneficiary", checked: beneficiary.domestic === true },
        { label: "Foreign beneficiary", checked: beneficiary.domestic === false },
      ],
    },
  ];
}

const NOTE =
  "Note: A statement must be attached showing the beneficiary’s share of income and directly apportioned deductions from each business, rental real estate, and other rental activity.";

function drawStatement(
  made: Awaited<ReturnType<typeof newK1Doc>>,
  value: TrustK1FactValue,
  beneficiary: K1Owner,
  year: number,
) {
  if (!value.section199A) return;
  drawStatementPage(
    addPage(made.doc, made.fonts),
    {
      heading: "Schedule K-1 (Form 1041), Box 14, Code I",
      title: "Section 199A Information",
      entity: { name: value.entityName, ein: value.entityEin },
      owner: { name: beneficiary.name, tin: beneficiary.tin },
      rows: section199ARows(value.section199A),
    },
    year,
  );
}

export async function scheduleK1Form1041Pdf(
  value: TrustK1FactValue,
  parties: TrustK1Parties,
  year: number,
): Promise<Uint8Array> {
  const made = await newK1Doc();
  const ctx = addPage(made.doc, made.fonts);
  drawK1Header(ctx, {
    form: "1041",
    year,
    omb: "1545-0092",
    title: ["Beneficiary’s Share of Income, Deductions,", "Credits, etc."],
    partIIITitle: [
      "Beneficiary’s Share of Current Year Income,",
      "Deductions, Credits, and Other Items",
    ],
    finalK1: value.finalK1,
    amendedK1: value.amendedK1,
  });
  drawLeftStack(ctx, [...partI(value, parties.fiduciary), ...partII(parties.beneficiary)], 140);
  const gridBottom = drawPartIIIGrid(ctx, GRID, value.boxes);
  const noteTop = drawActivityChecks(ctx, gridBottom + 2, []);
  drawWrapped(ctx, NOTE, PART_III_X + 22, noteTop, X_END - PART_III_X - 28, { size: 7.5 });
  drawText(ctx, "For IRS Use Only", PART_III_X + 22, noteTop + 60, { size: 7 });
  drawK1Footer(ctx, "1041", year, "11380D");
  drawStatement(made, value, parties.beneficiary, year);
  return await made.doc.save();
}
