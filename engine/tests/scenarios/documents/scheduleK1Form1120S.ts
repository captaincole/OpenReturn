/*
 * Schedule K-1 (Form 1120-S), Shareholder's Share of Income, Deductions,
 * Credits, etc. (2025). Part, item and box numbers, labels and layout follow
 * the IRS form (irs.gov/pub/irs-pdf/f1120ssk.pdf, created 4/9/25). It prints
 * only the values the fact holds; the box 17 code V statement prints on a
 * page of its own.
 */

import type { SCorporationK1FactValue } from "../../../src/facts/index.js";
import {
  addPage,
  drawActivityChecks,
  drawK1Footer,
  drawK1Header,
  drawLeftStack,
  drawPartIIIGrid,
  drawStatementPage,
  newK1Doc,
  optionalAmount,
  optionalPercent,
  partyLines,
  section199ARows,
  type K1Grid,
  type K1LeftItem,
  type K1Owner,
  type K1Party,
} from "./scheduleK1Draw.js";

/* What the K-1 prints that the fact does not hold. */
export interface SCorporationK1Parties {
  /* The corporation's address (its name is the fact's). */
  corporation: Omit<K1Party, "name">;
  /* Item C. */
  irsCenter: string;
  shareholder: K1Owner;
}

const one = (box: string, label: string) => ({ box, label, rows: 1 });
const coded = (box: string, label: string, rows: number) => ({ box, label, rows, coded: true });

const GRID: K1Grid = [
  [
    one("1", "Ordinary business income (loss)"),
    one("2", "Net rental real estate income (loss)"),
    one("3", "Other net rental income (loss)"),
    one("4", "Interest income"),
    one("5a", "Ordinary dividends"),
    one("5b", "Qualified dividends"),
    one("6", "Royalties"),
    one("7", "Net short-term capital gain (loss)"),
    one("8a", "Net long-term capital gain (loss)"),
    one("8b", "Collectibles (28%) gain (loss)"),
    one("8c", "Unrecaptured section 1250 gain"),
    one("9", "Net section 1231 gain (loss)"),
    coded("10", "Other income (loss)", 5),
    one("11", "Section 179 deduction"),
    coded("12", "Other deductions", 8),
  ],
  [
    coded("13", "Credits", 5),
    { box: "14", label: "Schedule K-3 is attached if checked", rows: 1, check: true },
    coded("15", "Alternative minimum tax (AMT) items", 5),
    coded("16", "Items affecting shareholder basis", 5),
    coded("17", "Other information", 10),
  ],
];

const shareRows = (start: string, end: string) => [
  { label: "Beginning of tax year", values: [start] },
  { label: "End of tax year", values: [end] },
];

const dollars = (amount: number | undefined): string =>
  amount === undefined ? "" : `$ ${optionalAmount(amount)}`;

function partI(value: SCorporationK1FactValue, parties: SCorporationK1Parties): K1LeftItem[] {
  return [
    { part: "Part I", title: "Information About the Corporation" },
    {
      letter: "A",
      label: "Corporation’s employer identification number",
      height: 26,
      lines: [value.entityEin],
    },
    {
      letter: "B",
      label: "Corporation’s name, address, city, state, and ZIP code",
      height: 50,
      lines: partyLines({ name: value.entityName, ...parties.corporation }),
    },
    {
      letter: "C",
      label: "IRS Center where corporation filed return",
      height: 26,
      lines: [parties.irsCenter],
    },
    {
      letter: "D",
      label: "Corporation’s total number of shares",
      height: 36,
      rows: shareRows("", ""),
    },
  ];
}

function partII(value: SCorporationK1FactValue, shareholder: K1Owner): K1LeftItem[] {
  const percent = optionalPercent(value.allocationPercent);
  return [
    { part: "Part II", title: "Information About the Shareholder" },
    {
      letter: "E",
      label: "Shareholder’s identifying number",
      height: 26,
      lines: [shareholder.tin],
    },
    {
      letter: "F1",
      label: "Shareholder’s name, address, city, state, and ZIP code",
      height: 50,
      lines: partyLines(shareholder),
    },
    {
      letter: "F2",
      label:
        "If the shareholder is a disregarded entity, a trust, an estate, or a nominee or similar person, enter the individual or entity responsible for reporting:",
      height: 34,
      rows: [{ label: "TIN                                    Name", values: [] }],
    },
    {
      letter: "F3",
      label: "What type of entity is this shareholder?",
      height: 14,
      inlineValue: shareholder.entityType ?? "",
    },
    {
      letter: "G",
      label: "Current year allocation percentage",
      height: 14,
      inlineValue: percent ? `${percent} %` : "%",
    },
    {
      letter: "H",
      label: "Shareholder’s number of shares",
      height: 36,
      rows: shareRows(optionalAmount(value.sharesAtStart), optionalAmount(value.sharesAtEnd)),
    },
    {
      letter: "I",
      label: "Loans from shareholder",
      height: 36,
      rows: shareRows(dollars(value.loansAtStart), dollars(value.loansAtEnd)),
    },
  ];
}

function drawStatement(
  made: Awaited<ReturnType<typeof newK1Doc>>,
  value: SCorporationK1FactValue,
  shareholder: K1Owner,
  year: number,
) {
  if (!value.section199A) return;
  drawStatementPage(
    addPage(made.doc, made.fonts),
    {
      heading: "Schedule K-1 (Form 1120-S), Box 17, Code V",
      title: "Statement A—QBI Pass-Through Entity Reporting (section 199A information)",
      entity: { name: value.entityName, ein: value.entityEin },
      owner: { name: shareholder.name, tin: shareholder.tin },
      rows: section199ARows(value.section199A),
    },
    year,
  );
}

export async function scheduleK1Form1120SPdf(
  value: SCorporationK1FactValue,
  parties: SCorporationK1Parties,
  year: number,
): Promise<Uint8Array> {
  const { doc, fonts } = await newK1Doc();
  const ctx = addPage(doc, fonts);
  drawK1Header(ctx, {
    form: "1120-S",
    year,
    omb: "1545-0123",
    title: ["Shareholder’s Share of Income, Deductions,", "Credits, etc."],
    partIIITitle: [
      "Shareholder’s Share of Current Year Income,",
      "Deductions, Credits, and Other Items",
    ],
    finalK1: value.finalK1,
    amendedK1: value.amendedK1,
  });
  const bottom = drawLeftStack(
    ctx,
    [...partI(value, parties), ...partII(value, parties.shareholder)],
    140,
  );
  drawLeftStack(ctx, [{ letter: "", label: "For IRS Use Only", height: 742 - bottom }], bottom);
  const gridBottom = drawPartIIIGrid(ctx, GRID, value.boxes, { "14": value.scheduleK3Attached });
  drawActivityChecks(ctx, gridBottom + 2, [
    {
      box: "18",
      label: "More than one activity for at-risk purposes*",
      checked: value.moreThanOneAtRiskActivity,
    },
    {
      box: "19",
      label: "More than one activity for passive activity purposes*",
      checked: value.moreThanOnePassiveActivity,
    },
  ]);
  drawK1Footer(ctx, "1120-S", year, "11520D");
  drawStatement({ doc, fonts }, value, parties.shareholder, year);
  return await doc.save();
}
