/*
 * Schedule K-1 (Form 1065), Partner's Share of Income, Deductions, Credits,
 * etc. (2025). Part, item and box numbers, labels and layout follow the IRS
 * form (irs.gov/pub/irs-pdf/f1065sk1.pdf, created 2/26/25). It prints only the
 * values the fact holds: the fact holds item J and item K1 at the end of the
 * year only, so the Beginning columns stay blank. The box 20 code Z statement
 * prints on a page of its own.
 */

import type { PartnershipK1FactValue } from "../../../src/facts/index.js";
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
export interface PartnershipK1Parties {
  /* The partnership's address (its name is the fact's). */
  partnership: Omit<K1Party, "name">;
  /* Item C. */
  irsCenter: string;
  partner: K1Owner;
  /* The header's tax year beginning and ending, for a partnership that is not on the calendar year. */
  fiscalYear?: [string, string];
}

const one = (box: string, label: string) => ({ box, label, rows: 1 });
const coded = (box: string, label: string, rows: number) => ({ box, label, rows, coded: true });

const GRID: K1Grid = [
  [
    one("1", "Ordinary business income (loss)"),
    one("2", "Net rental real estate income (loss)"),
    one("3", "Other net rental income (loss)"),
    one("4a", "Guaranteed payments for services"),
    one("4b", "Guaranteed payments for capital"),
    one("4c", "Total guaranteed payments"),
    one("5", "Interest income"),
    one("6a", "Ordinary dividends"),
    one("6b", "Qualified dividends"),
    one("6c", "Dividend equivalents"),
    one("7", "Royalties"),
    one("8", "Net short-term capital gain (loss)"),
    one("9a", "Net long-term capital gain (loss)"),
    one("9b", "Collectibles (28%) gain (loss)"),
    one("9c", "Unrecaptured section 1250 gain"),
    one("10", "Net section 1231 gain (loss)"),
    coded("11", "Other income (loss)", 3),
    one("12", "Section 179 deduction"),
    coded("13", "Other deductions", 4),
  ],
  [
    coded("14", "Self-employment earnings (loss)", 2),
    coded("15", "Credits", 2),
    { box: "16", label: "Schedule K-3 is attached if checked", rows: 1, check: true },
    coded("17", "Alternative minimum tax (AMT) items", 3),
    coded("18", "Tax-exempt income and nondeductible expenses", 3),
    coded("19", "Distributions", 2),
    coded("20", "Other information", 6),
    coded("21", "Foreign taxes paid or accrued", 5),
  ],
];

const percent = (value: number | undefined): string => {
  const text = optionalPercent(value);
  return text ? `${text} %` : "";
};

const dollars = (amount: number | undefined): string =>
  amount === undefined ? "" : `$ ${optionalAmount(amount)}`;

const yesNo = (value: boolean | undefined) => [
  { label: "Yes", checked: value === true },
  { label: "No", checked: value === false },
];

function partI(value: PartnershipK1FactValue, parties: PartnershipK1Parties): K1LeftItem[] {
  return [
    { part: "Part I", title: "Information About the Partnership" },
    {
      letter: "A",
      label: "Partnership’s employer identification number",
      height: 24,
      lines: [value.entityEin],
    },
    {
      letter: "B",
      label: "Partnership’s name, address, city, state, and ZIP code",
      height: 46,
      lines: partyLines({ name: value.entityName, ...parties.partnership }),
    },
    {
      letter: "C",
      label: "IRS center where partnership filed return:",
      height: 14,
      inlineValue: parties.irsCenter,
    },
    {
      letter: "D",
      label: "Check if this is a publicly traded partnership (PTP)",
      height: 14,
      rightCheck: { checked: value.publiclyTraded },
    },
  ];
}

function partnerHeader(value: PartnershipK1FactValue, partner: K1Owner): K1LeftItem[] {
  return [
    { part: "Part II", title: "Information About the Partner" },
    {
      letter: "E",
      label: "Partner’s SSN or TIN (Do not use TIN of a disregarded entity. See instructions.)",
      height: 24,
      lines: [partner.tin],
    },
    {
      letter: "F",
      label: "Name, address, city, state, and ZIP code for partner entered in E. See instructions.",
      height: 46,
      lines: partyLines(partner),
    },
    ...partnerKind(value, partner),
    {
      letter: "H2",
      label: "If the partner is a disregarded entity (DE), enter the partner’s:  TIN          Name",
      height: 14,
    },
    {
      letter: "I1",
      label: "What type of entity is this partner?",
      height: 14,
      inlineValue: partner.entityType ?? "",
    },
    {
      letter: "I2",
      label: "If this partner is a retirement plan (IRA/SEP/Keogh/etc.), check here",
      height: 14,
      rightCheck: {},
    },
  ];
}

/* Items G and H1: the kind of partner. */
function partnerKind(value: PartnershipK1FactValue, partner: K1Owner): K1LeftItem[] {
  return [
    {
      letter: "G",
      label: "",
      height: 22,
      checks: [
        {
          label: "General partner or LLC member-manager",
          checked: value.partnerType === "general",
        },
        { label: "Limited partner or other LLC member", checked: value.partnerType === "limited" },
      ],
    },
    {
      letter: "H1",
      label: "",
      height: 14,
      checks: [
        { label: "Domestic partner", checked: partner.domestic === true },
        { label: "Foreign partner", checked: partner.domestic === false },
      ],
    },
  ];
}

function shares(value: PartnershipK1FactValue): K1LeftItem[] {
  const liabilities = value.liabilitiesAtEnd ?? {};
  return [
    {
      letter: "J",
      label: "Partner’s share of profit, loss, and capital (see instructions):",
      height: 56,
      columns: ["Beginning", "Ending"],
      rows: [
        { label: "Profit", values: ["", percent(value.profitPercent)] },
        { label: "Loss", values: ["", percent(value.lossPercent)] },
        { label: "Capital", values: ["", percent(value.capitalPercent)] },
      ],
    },
    {
      letter: "",
      label: "Check if decrease is due to:",
      height: 24,
      checks: [
        { label: "Sale or", checked: value.decreasedBySale },
        { label: "Exchange of partnership interest", checked: value.decreasedByExchange },
      ],
    },
    {
      letter: "K1",
      label: "Partner’s share of liabilities:",
      height: 56,
      columns: ["Beginning", "Ending"],
      rows: [
        { label: "Nonrecourse", values: ["", dollars(liabilities.nonrecourse)] },
        {
          label: "Qualified nonrecourse financing",
          values: ["", dollars(liabilities.qualifiedNonrecourseFinancing)],
        },
        { label: "Recourse", values: ["", dollars(liabilities.recourse)] },
      ],
    },
    ...liabilityChecks(value),
  ];
}

/* Items K2 and K3. */
function liabilityChecks(value: PartnershipK1FactValue): K1LeftItem[] {
  return [
    {
      letter: "K2",
      label: "Check this box if item K1 includes liability amounts from lower-tier partnerships",
      height: 22,
      rightCheck: {},
    },
    {
      letter: "K3",
      label:
        "Check if any of the above liability is subject to guarantees or other payment obligations by the partner. See instructions",
      height: 22,
      rightCheck: { checked: value.liabilitiesGuaranteed },
    },
  ];
}

function capital(value: PartnershipK1FactValue): K1LeftItem[] {
  const account = value.capitalAccount ?? {};
  const withdrawals = account.withdrawalsAndDistributions;
  return [
    {
      letter: "L",
      label: "Partner’s Capital Account Analysis",
      height: 80,
      rows: [
        { label: "Beginning capital account", values: [dollars(account.beginning)] },
        { label: "Capital contributed during the year", values: [dollars(account.contributed)] },
        {
          label: "Current year net income (loss)",
          values: [dollars(account.currentYearNetIncome)],
        },
        {
          label: "Other increase (decrease) (attach explanation)",
          values: [dollars(account.otherIncreaseOrDecrease)],
        },
        {
          label: "Withdrawals and distributions",
          values: [withdrawals === undefined ? "" : `$ (${optionalAmount(withdrawals)})`],
        },
        { label: "Ending capital account", values: [dollars(account.ending)] },
      ],
    },
    {
      letter: "M",
      label:
        "Did the partner contribute property with a built-in gain (loss)? If “Yes,” attach statement.",
      height: 30,
      checks: yesNo(value.contributedBuiltInGainProperty),
    },
    {
      letter: "N",
      label: "Partner’s Share of Net Unrecognized Section 704(c) Gain or (Loss)",
      height: 36,
      rows: [
        { label: "Beginning", values: [dollars(value.section704cAtStart)] },
        { label: "Ending", values: [dollars(value.section704cAtEnd)] },
      ],
    },
  ];
}

function drawStatement(
  doc: Awaited<ReturnType<typeof newK1Doc>>,
  value: PartnershipK1FactValue,
  partner: K1Owner,
  year: number,
) {
  if (!value.section199A) return;
  drawStatementPage(
    addPage(doc.doc, doc.fonts),
    {
      heading: "Schedule K-1 (Form 1065), Box 20, Code Z",
      title: "Statement A—QBI Pass-Through Entity Reporting (section 199A information)",
      entity: { name: value.entityName, ein: value.entityEin },
      owner: { name: partner.name, tin: partner.tin },
      rows: section199ARows(value.section199A),
    },
    year,
  );
}

export async function scheduleK1Form1065Pdf(
  value: PartnershipK1FactValue,
  parties: PartnershipK1Parties,
  year: number,
): Promise<Uint8Array> {
  const made = await newK1Doc();
  const ctx = addPage(made.doc, made.fonts);
  drawK1Header(ctx, {
    form: "1065",
    year,
    omb: "1545-0123",
    title: ["Partner’s Share of Income, Deductions,", "Credits, etc."],
    partIIITitle: [
      "Partner’s Share of Current Year Income,",
      "Deductions, Credits, and Other Items",
    ],
    finalK1: value.finalK1,
    amendedK1: value.amendedK1,
    fiscalYear: parties.fiscalYear,
  });
  drawLeftStack(
    ctx,
    [
      ...partI(value, parties),
      ...partnerHeader(value, parties.partner),
      ...shares(value),
      ...capital(value),
    ],
    140,
  );
  const gridBottom = drawPartIIIGrid(ctx, GRID, value.boxes, { "16": value.scheduleK3Attached });
  drawActivityChecks(ctx, gridBottom + 2, [
    {
      box: "22",
      label: "More than one activity for at-risk purposes*",
      checked: value.moreThanOneAtRiskActivity,
    },
    {
      box: "23",
      label: "More than one activity for passive activity purposes*",
      checked: value.moreThanOnePassiveActivity,
    },
  ]);
  drawK1Footer(ctx, "1065", year, "11394R");
  drawStatement(made, value, parties.partner, year);
  return await made.doc.save();
}
