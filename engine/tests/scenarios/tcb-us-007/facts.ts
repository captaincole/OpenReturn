/*
 * Source: TaxCalcBench ty25-us-007 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json. The Form 1095-A is made by
 * generate-docs.ts from the value below.
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  MORTGAGE_KEYS,
  NET_INVESTMENT_INCOME_KEYS,
  PREMIUM_TAX_CREDIT_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeMarketplaceCoverageFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type MarketplaceCoverageFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_US_007_USER_ID = "tcb-us-007-integration";
export const TCB_US_007_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-11T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_US_007_USER_ID,
  taxYear: TCB_US_007_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TAXPAYER = { firstName: "Madison", lastName: "Gray", ssn: "900-45-6789" };
export const HOME = { street: "110 Maitland HWY", city: "Knoxville", state: "TN", zip: "37922" };
const address = { line1: HOME.street, city: HOME.city, state: HOME.state, zip: HOME.zip };

// docs/01-employers-name-w2.pdf
const w2: W2FactValue = {
  employerName: "Employers Name",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "1010 Forks Hwy", city: "City", state: "SC", zip: "29020" },
  employee: { ...TAXPAYER, address },
  box1: 160368,
  box2: 29027,
  box3: 164772,
  box4: 10216,
  box5: 164772,
  box6: 2389,
  box12: [{ code: "D", amount: 4403 }],
  box13: { retirementPlan: true },
  box15: "TN",
  box16: 160368,
  box17: 6794,
};

// docs/03-social-finance-1099-int.pdf
const interest: InterestFactValue = { payerName: "Social Finance", payerTin: PAYER_TIN, box1: 333 };

// docs/04-ibm-1099-div.pdf
const dividends: DividendFactValue = { payerName: "IBM", payerTin: PAYER_TIN, box1a: 7, box1b: 7 };

/* docs/05-etrade-1099-b-intuit.pdf: long-term, basis reported to the IRS (box D). */
export const INTUIT_TRADE_ID = "etr-intuit";
const intuitSale: TradeFactValue = {
  tradeId: INTUIT_TRADE_ID,
  description: "intuit stock",
  dateAcquired: "12/01/2021",
  dateSold: "11/27/2025",
  proceeds: 71600,
  costBasis: 44551,
};

/*
 * docs/06-etrade-1099-b-abc.pdf: held under a year, but the form checks
 * long-term in box 2 and box D. The Form 8949 box is a decision (decisions.ts).
 */
export const ABC_TRADE_ID = "etr-abc";
const abcSale: TradeFactValue = {
  tradeId: ABC_TRADE_ID,
  description: "abc stock",
  dateAcquired: "07/05/2025",
  dateSold: "11/28/2025",
  proceeds: 216,
  costBasis: 300,
};

/* irs1040_schedulec[0]: a consulting business. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "consultant",
  code: "541219", // business_code "Other accounting services"; the key's PrincipalBusinessActivityCd
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false, // Not in the answers: a consultant sells a service; the key has no Part III.
  grossReceipts: 3882,
  expenses: { pensionAndProfitSharing: 100, supplies: 250 },
  otherExpenses: [{ description: "OTHER EXPENSE", amount: 975 }],
  specifiedService: false,
};

/*
 * docs/07-marketplace-1095-a.pdf (made by us; generate-docs.ts). The answers give
 * only the annual advance payment ($6,000) and that the monthly amounts are the
 * same all year. Columns A and B are not in the case: we chose $650 and $700 a
 * month. An MFS filer who is not an applicable taxpayer uses only column C.
 */
export const MARKETPLACE_COVERAGE: MarketplaceCoverageFactValue = {
  marketplaceId: "47-FFM",
  policyNumber: "0000700725",
  issuerName: "Volunteer Health Mutual",
  recipient: { name: "Madison Gray", ssn: TAXPAYER.ssn },
  /* Lines 7–9 print the spouse when advance payments were made; the SSN is the key's SpouseSSN. */
  recipientSpouse: { name: "Salvester A Slone", ssn: "900-45-6789" },
  policyStartDate: "01/01/2025",
  policyEndDate: "12/31/2025",
  address: HOME,
  coveredIndividuals: [
    { name: "Madison Gray", ssn: TAXPAYER.ssn, startDate: "01/01/2025", endDate: "12/31/2025" },
  ],
  months: Array.from({ length: 12 }, () => ({
    enrollmentPremium: 650,
    slcspPremium: 700,
    advancePayment: 500,
  })),
  annualTotals: { enrollmentPremium: 7800, slcspPremium: 8400, advancePayment: 6000 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_US_007_USER_ID, taxYear: TCB_US_007_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/10/1983"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  fact("identity", SPOUSE_KEYS.firstName, "Salvester", "Answer key header (SpouseNm)."),
  fact("identity", SPOUSE_KEYS.middleInitial, "A", "Answer key header (SpouseNm)."),
  fact("identity", SPOUSE_KEYS.lastName, "Slone", "Answer key header (SpouseNm)."),
  fact("identity", SPOUSE_KEYS.ssn, "900-45-6789", "Answer key header (SpouseSSN)."),
  fact("identity", SPOUSE_KEYS.dob, "09/22/1986", `${ANSWERS}: sp_date_of_birth.`),
  fact(
    "filing_status",
    SPOUSE_KEYS.itemizesSeparately,
    false,
    "Not in the answers: the key takes the $15,750 MFS standard deduction, so the spouse does not itemize.",
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.livedApartAllYear,
    false,
    `${ANSWERS}: basic3.livedApartFromSpouse false.`,
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.livedApartLastSixMonths,
    false,
    `${ANSWERS}: basic3.livedWithSpouse6Mos true.`,
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
    false,
    `${ANSWERS}: basic3.legallySeparated false.`,
  ),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("employers-name"),
    w2,
    "W-2 from Employers Name (docs/01-employers-name-w2.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    8059,
    "Form 1098 from Chase Bank, box 1; no points in box 6 (docs/02-chase-bank-1098.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    245552,
    "Form 1098 from Chase Bank, box 2 (docs/02-chase-bank-1098.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "10/10/2021",
    "Form 1098 from Chase Bank, box 3 (docs/02-chase-bank-1098.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("social-finance"),
    interest,
    "1099-INT from Social Finance (docs/03-social-finance-1099-int.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("ibm"),
    dividends,
    "1099-DIV from IBM (docs/04-ibm-1099-div.pdf).",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("etrade", INTUIT_TRADE_ID),
    intuitSale,
    "1099-B from Etrade (docs/05-etrade-1099-b-intuit.pdf).",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("etrade", ABC_TRADE_ID),
    abcSale,
    "1099-B from Etrade (docs/06-etrade-1099-b-abc.pdf).",
  ),
  fact(
    "health_coverage",
    makeMarketplaceCoverageFactKey("47-ffm", "0000700725"),
    MARKETPLACE_COVERAGE,
    "Form 1095-A (docs/07-marketplace-1095-a.pdf).",
  ),
];

const ANSWER_FACTS: TaxFactRow[] = [
  fact(
    "self_employment",
    makeBusinessFactKey("consulting"),
    consulting,
    `${ANSWERS}: irs1040_schedulec[0].`,
  ),
  fact(
    "capital_gains",
    CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm,
    8507,
    `${ANSWERS}: irs1040_schedule_d.st_capital_loss_carryover_input.`,
  ),
  fact(
    "health_coverage",
    PREMIUM_TAX_CREDIT_KEYS.mfsException,
    false,
    `${ANSWERS}: irs8962.mfs_exception_indicator.`,
  ),
  fact(
    "health_coverage",
    PREMIUM_TAX_CREDIT_KEYS.allocatesPolicyOrMarriageCalc,
    false,
    `${ANSWERS}: irs8962.share_policy_alt_calc.`,
  ),
  fact(
    "investment_income",
    NET_INVESTMENT_INCOME_KEYS.additionalModifications,
    1500,
    `${ANSWERS}: f8960.additionalMods.`,
  ),
];

export const tcbUs007Facts: TaxFactRow[] = [...IDENTITY, ...DOCUMENTS, ...ANSWER_FACTS];
