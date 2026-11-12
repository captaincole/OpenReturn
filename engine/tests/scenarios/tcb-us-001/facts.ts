/*
 * Source: TaxCalcBench ty25-us-001 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  AMT_KEYS,
  INVESTMENT_INTEREST_KEYS,
  MORTGAGE_KEYS,
  makeDependentFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_US_001_USER_ID = "tcb-us-001-integration";
export const TCB_US_001_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-11T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_US_001_USER_ID,
  taxYear: TCB_US_001_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the documents print her. */
const TAXPAYER = { firstName: "Test", lastName: "Four", ssn: "900-45-6789" };
const ADDRESS = { line1: "22", city: "City", state: "AK", zip: "99501" };

// docs/01-werk-job-w2.pdf
const werkJobW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Werk Job",
  employerEin: "12-3456789",
  employerAddress: { line1: "1 S Main", city: "City", state: "VA", zip: "20105" },
  employee: { ...TAXPAYER, address: ADDRESS },
  box1: 1100000,
  box2: 378000,
  box3: 168600,
  box4: 10453,
  box5: 1100000,
  box6: 24050,
};

/* docs/03-payer-1099-b.pdf: one long-term sale, basis reported to the IRS (box D). */
export const PAYER_TRADE_ID = "payer-d-01";
const sharesSale: TradeFactValue = {
  tradeId: PAYER_TRADE_ID,
  description: "Shares",
  dateAcquired: "01/01/1999",
  dateSold: "01/01/2025",
  proceeds: 10000000,
  costBasis: 5000000,
};

/*
 * irs1040.dependent_detail[0]: a child born 2020, in the home all year. The answers
 * give no name, SSN or relationship and the key lists no dependent; these are made up.
 */
const child: DependentFactValue = {
  firstName: "Child",
  lastName: "Four",
  ssn: "900-45-6789",
  relationship: "Child",
  dob: "02/02/2020",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_US_001_USER_ID, taxYear: TCB_US_001_TAX_YEAR, suffix, value });

export const tcbUs001Facts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "01/01/1980"),
  idFact("address.street", ADDRESS.line1),
  idFact("address.city", ADDRESS.city),
  idFact("address.state", ADDRESS.state),
  idFact("address.zip", ADDRESS.zip),
  fact(
    "wages",
    makeW2FactKey("werk-job"),
    werkJobW2,
    "W-2 from Werk Job (docs/01-werk-job-w2.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    32000,
    "Form 1098 from Bank, box 1; no points in box 6 (docs/02-bank-1098.pdf).",
  ),
  /* The 1098 leaves box 2 blank (README.md): the taxpayer states the balance. */
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    500000,
    "Verbal: the loan balance on January 1, 2025 (the Form 1098's box 2 is blank).",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("payer", PAYER_TRADE_ID),
    sharesSale,
    "1099-B from Payer (docs/03-payer-1099-b.pdf).",
  ),
  fact(
    "dependents",
    makeDependentFactKey("child-four"),
    child,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name, SSN and relationship are made up.`,
  ),
  /* Schedule A answers (scha_tax, scha_gft). The answers give no medical or non-cash gifts. */
  fact("state_local_tax", "state_local_tax.real_estate", 2500, `${ANSWERS}: scha_tax.taxRE.`),
  fact("state_local_tax", "state_local_tax.personal_property", 300, `${ANSWERS}: scha_tax.taxPP.`),
  fact("charitable", "charitable.cash", 5000, `${ANSWERS}: scha_gft.cash60.`),
  fact("charitable", "charitable.noncash", 0, `${ANSWERS}: no non-cash gifts given.`),
  fact("medical", "medical.expenses_total", 0, `${ANSWERS}: no medical expenses given.`),
  /* f4952: $75,000 paid this year, no carryover, $75,000 of the gain elected as investment income. */
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.expensePaid,
    75000,
    `${ANSWERS}: f4952.currentYearExpenses.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    0,
    `${ANSWERS}: no carryover from 2024 given.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
    75000,
    `${ANSWERS}: f4952.qualDivLineElectedInvest.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.investmentExpenses,
    0,
    `${ANSWERS}: no investment expenses given.`,
  ),
  /* Form 8960 line 9b: Alaska has no income tax, and the answers give none. */
  fact(
    "state_local_tax",
    "state_local_tax.allocable_to_investment_income",
    0,
    `${ANSWERS}: no state income tax (Alaska).`,
  ),
  fact("other", AMT_KEYS.isoExerciseSpread, 250000, `${ANSWERS}: f6251.stockOption.`),
];
