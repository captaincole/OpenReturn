import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const MARCUS_USER_ID = "marcus-integration";
export const MARCUS_TAX_YEAR = 2025;

const w2: W2FactValue = {
  employerName: "Helix Software, Inc.",
  employerEin: "87-1234567",
  employerAddress: {
    line1: "1455 Mission Street",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
  },
  // $247,650 gross − $23,500 401(k) − $4,150 HSA.
  box1: 220000,
  box2: 40000,
  box3: 176100, // 2025 SS wage cap
  box4: 10918.2, // 6.2% of $176,100
  box5: 243500, // Medicare wages = gross − 401(k); HSA does NOT reduce box 5
  // 1.45% × 243,500 + 0.9% × (243,500 − 200,000) = 3,530.75 + 391.50.
  box6: 3922.25,
  box12: [
    { code: "D", amount: 23500 }, // 2025 401(k) employee deferral max
    { code: "W", amount: 4150 }, // 2025 self-only HSA limit
  ],
  box13: { retirementPlan: true },
  box14: [{ label: "CA SDI", amount: 2922 }],
  box15: "CA",
  box16: 220000,
  box17: 15500,
};

const wealthfrontInterest: InterestFactValue = {
  payerName: "Wealthfront Brokerage LLC",
  payerTin: "27-1967207",
  box1: 700,
};

// 4 VTI quarterly distributions: $3,000 ordinary, $2,000 qualified.
const schwabDividends: DividendFactValue = {
  payerName: "Charles Schwab & Co., Inc.",
  payerTin: "94-1737782",
  box1a: 3000,
  box1b: 2000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({
    userId: MARCUS_USER_ID,
    taxYear: MARCUS_TAX_YEAR,
    suffix,
    value,
  });

export const marcusFacts: TaxFactRow[] = [
  idFact("name.first", "Marcus"),
  idFact("name.last", "Chen"),
  idFact("ssn", "345-67-8901"),
  idFact("dob", "06/15/1988"),
  idFact("address.street", "555 Hayes Street"),
  idFact("address.city", "San Francisco"),
  idFact("address.state", "CA"),
  idFact("address.zip", "94102"),
  idFact("address.county", "San Francisco"),
  idFact("occupation", "Software engineer"),
  idFact("phone", "415-555-0142"),
  idFact("email", "marcus@chen.example"),
  {
    id: "f-w2",
    userId: MARCUS_USER_ID,
    taxYear: MARCUS_TAX_YEAR,
    category: "wages",
    key: makeW2FactKey("helix-software"),
    value: w2,
    sourceNote: "W-2 from Helix Software, Inc.",
    createdAt: "2026-04-29T00:00:00Z",
  },
  {
    id: "f-1099-int-wealthfront",
    userId: MARCUS_USER_ID,
    taxYear: MARCUS_TAX_YEAR,
    category: "investment_income",
    key: makeInterestFactKey("wealthfront-cash"),
    value: wealthfrontInterest,
    sourceNote: "Wealthfront Cash 1099-INT — only box 1 populated.",
    createdAt: "2026-04-29T00:00:00Z",
  },
  {
    id: "f-1099-div-schwab",
    userId: MARCUS_USER_ID,
    taxYear: MARCUS_TAX_YEAR,
    category: "investment_income",
    key: makeDividendFactKey("schwab-brokerage"),
    value: schwabDividends,
    sourceNote: "Schwab consolidated 1099 — 1099-DIV section, 4 VTI quarterly distributions.",
    createdAt: "2026-04-29T00:00:00Z",
  },
  {
    id: "f-mec",
    userId: MARCUS_USER_ID,
    taxYear: MARCUS_TAX_YEAR,
    category: "health_coverage",
    key: "health_coverage.full_year_mec",
    value: true,
    sourceNote: "Verbal confirmation — Helix HDHP + employer coverage all 12 months of 2025.",
    createdAt: "2026-04-29T00:00:00Z",
  },
];
