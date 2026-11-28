/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * fact holds the boxes as the form would print them. Each investment fact
 * holds the boxes of its Form 8874-A (docs/01- to 07-, made by generate-docs.ts)
 * and Lamgwin's answers about it. The Schedule K-1 (Form 1065) is a made PDF
 * (docs/08-schedule-k1-tallow-row-partners.pdf).
 */

import {
  makeK1HoldingFactKey,
  makeNewMarketsInvestmentFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type NewMarketsInvestmentFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { roundDollars } from "../../../../src/money.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LAMGWIN_USER_ID = "lamgwin-synthetic";
export const LAMGWIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LAMGWIN_USER_ID,
  taxYear: LAMGWIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LAMGWIN = {
  firstName: "Lamgwin",
  lastName: "Harrowgate",
  ssn: "400-00-8874",
  street: "2214 Pecan Hollow Lane",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const address = {
  line1: LAMGWIN.street,
  city: LAMGWIN.city,
  state: LAMGWIN.state,
  zip: LAMGWIN.zip,
};
const investorName = `${LAMGWIN.firstName} ${LAMGWIN.lastName}`;

// W-2 from a made-up bridge engineering firm.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Balcones Span Engineering Inc.",
  employerEin: "00-0008874",
  employerAddress: { line1: "900 Congress Avenue", city: "Austin", state: "TX", zip: "78701" },
  employee: {
    firstName: LAMGWIN.firstName,
    lastName: LAMGWIN.lastName,
    ssn: LAMGWIN.ssn,
    address,
  },
  box1: 520000,
  box2: 140000,
  box3: 176100,
  box4: 10918.2,
  box5: 520000,
  // 1.45% of wages plus the 0.9% Additional Medicare Tax on wages over $200,000.
  box6: 10420,
};

/* Boxes 9 and 10a to 10g as the CDE prints them: 5% for years 1 to 3, 6% for years 4 to 7. */
const allowable = (amount: number) => {
  const years = [5, 5, 5, 6, 6, 6, 6].map((percent) => roundDollars((amount * percent) / 100));
  return {
    box9TotalAllowableCredit: roundDollars((amount * 39) / 100),
    box10AllowableCredits: years,
  };
};

interface MadeInvestment {
  slug: string;
  cdeName: string;
  cdeEin: string;
  cdeAddress: string;
  date: string;
  amount: number;
  disposedOn?: string;
}

/*
 * Seven qualified equity investments, each bought for cash at original issue
 * and held directly. Six have a credit allowance date in 2025 while held
 * (credit years 1, 2, 3, 4, 5 and 7). Harbor Light was made in 2018: its
 * seventh and last credit allowance date was May 5, 2024, so it has no 2025
 * credit and no row. Lamgwin still holds it.
 */
export const INVESTMENTS: MadeInvestment[] = [
  {
    slug: "riverbend",
    cdeName: "Riverbend Community Capital LLC",
    cdeEin: "00-0008801",
    cdeAddress: "410 East 5th Street, Austin, TX 78701",
    date: "2025-03-14",
    amount: 40000,
  },
  {
    slug: "prairie-gate",
    cdeName: "Prairie Gate Development Fund LP",
    cdeEin: "00-0008802",
    cdeAddress: "77 Main Street, Waco, TX 76701",
    date: "2024-06-30",
    amount: 75000,
  },
  {
    slug: "lantern-street",
    cdeName: "Lantern Street CDE Inc.",
    cdeEin: "00-0008803",
    cdeAddress: "1200 Lantern Street, San Antonio, TX 78205",
    date: "2023-09-01",
    amount: 60000,
  },
  {
    slug: "copperline",
    cdeName: "Copperline Neighborhood Fund LLC",
    cdeEin: "00-0008804",
    cdeAddress: "35 Smelter Road, El Paso, TX 79901",
    date: "2022-11-15",
    amount: 120000,
  },
  {
    slug: "blue-mesa",
    cdeName: "Blue Mesa Community Investors LP",
    cdeEin: "00-0008805",
    cdeAddress: "8 Mesa Verde Drive, Lubbock, TX 79401",
    date: "2021-02-08",
    amount: 50000,
  },
  {
    slug: "old-mill",
    cdeName: "Old Mill Renewal Partners LLC",
    cdeEin: "00-0008806",
    cdeAddress: "19 Millrace Way, New Braunfels, TX 78130",
    date: "2019-07-22",
    amount: 90000,
  },
  {
    slug: "harbor-light",
    cdeName: "Harbor Light Capital Corp.",
    cdeEin: "00-0008807",
    cdeAddress: "600 Seawall Boulevard, Galveston, TX 77550",
    date: "2018-05-05",
    amount: 30000,
  },
];

export const investmentValue = (made: MadeInvestment): NewMarketsInvestmentFactValue => ({
  owner: "taxpayer",
  notice: {
    box1CdeName: made.cdeName,
    box2CdeEin: made.cdeEin,
    box5InvestorName: investorName,
    box6InvestorTin: LAMGWIN.ssn,
    box7InvestmentDate: made.date,
    box8Amount: made.amount,
    ...allowable(made.amount),
  },
  cdeAddress: made.cdeAddress,
  passive: false,
  disposedOn: made.disposedOn,
});

export const TALLOW_ID = "tallow-row-partners";

/*
 * A community development partnership Lamgwin manages as a general partner.
 * Its only K-1 item is box 15 code AD, his share of the new markets credit of
 * the qualified equity investments the partnership holds.
 */
export const tallowK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Tallow Row Partners LP",
  entityEin: "00-0008808",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  boxes: [{ box: "15", code: "AD", amount: 1180.4 }],
};

const tallowHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LAMGWIN_USER_ID, taxYear: LAMGWIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const investmentDocName = (index: number, made: MadeInvestment) =>
  `0${index + 1}-form-8874-a-${made.slug}.pdf`;

export const lamgwinFacts: TaxFactRow[] = [
  idFact("name.first", LAMGWIN.firstName),
  idFact("name.last", LAMGWIN.lastName),
  idFact("ssn", LAMGWIN.ssn),
  idFact("dob", "09/03/1976"),
  idFact("address.street", LAMGWIN.street),
  idFact("address.city", LAMGWIN.city),
  idFact("address.state", LAMGWIN.state),
  idFact("address.zip", LAMGWIN.zip),
  idFact("occupation", "Bridge engineer"),
  idFact("phone", "512-555-0174"),
  fact("wages", makeW2FactKey("balcones-span"), w2, "W-2 from Balcones Span Engineering Inc."),
  ...INVESTMENTS.map((made, index) =>
    fact(
      "other",
      makeNewMarketsInvestmentFactKey(made.slug),
      investmentValue(made),
      `Form 8874-A from ${made.cdeName} (docs/${investmentDocName(index, made)}); ${VERBAL}: the CDE's address, not passive, still held.`,
    ),
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(TALLOW_ID),
    tallowK1,
    "Schedule K-1 (Form 1065) (docs/08-schedule-k1-tallow-row-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(TALLOW_ID), tallowHolding, VERBAL),
];
