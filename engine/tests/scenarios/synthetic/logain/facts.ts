/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2, 1099-DIV and 1099-INT facts are the boxes as they would
 * print them, and the 2024 minimum tax lines are his answers from his 2024
 * return.
 */

import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  PRIOR_YEAR_MINIMUM_TAX_KEYS as PRIOR_AMT,
  type DividendFactValue,
  type InterestFactValue,
  type PriorYearCapitalGainWorksheet,
  type PriorYearForeignTaxCredit,
  type PriorYearForm6251,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LOGAIN_USER_ID = "logain-synthetic";
export const LOGAIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LOGAIN_USER_ID,
  taxYear: LOGAIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LOGAIN = {
  firstName: "Logain",
  lastName: "Vedrecht",
  ssn: "400-00-8801",
  street: "6120 Ghealdan Ridge Drive",
  city: "Plano",
  state: "TX",
  zip: "75093",
};

const address = { line1: LOGAIN.street, city: LOGAIN.city, state: LOGAIN.state, zip: LOGAIN.zip };

/* His W-2: no stock options exercised in 2025. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Falme Semiconductor Inc.",
  employerEin: "00-0008801",
  employerAddress: { line1: "900 Legacy Drive", city: "Plano", state: "TX", zip: "75024" },
  employee: { firstName: LOGAIN.firstName, lastName: LOGAIN.lastName, ssn: LOGAIN.ssn, address },
  box1: 650000,
  box2: 175000,
  box3: 176100,
  box4: 10918.2,
  box5: 650000,
  box6: 13475,
};

/* A global index fund (a RIC): box 7 foreign tax is under $300, so the election applies. */
const fundDividends: DividendFactValue = {
  payerName: "Tanchico World Index Fund",
  payerTin: "00-0018801",
  box1a: 34000,
  box1b: 30000,
  box7: 250,
};

const bankInterest: InterestFactValue = { payerName: "Lugard Savings Bank", box1: 6000 };

/*
 * His 2024 Form 6251, as filed. He exercised incentive stock options in 2024
 * and still holds the shares (line 2i, a deferral item). Line 2a is his 2024
 * Schedule A taxes; line 2e a net operating loss deduction from an old business;
 * line 2g interest on private activity bonds. Line 8 is the AMT foreign tax
 * credit, the same as his 2024 Schedule 3 line 1 (the election).
 */
const form6251For2024: PriorYearForm6251 = {
  line1: 562000,
  line2a: 10000,
  line2e: 18000,
  line2g: 110000,
  line8: 280,
  line10: 151350,
  line11: 160493,
};

/* His 2024 Schedule D Tax Worksheet (2024 Schedule D line 19: $8,000 from a REIT). */
const worksheetFor2024: PriorYearCapitalGainWorksheet = {
  worksheet: "schedule_d",
  line10: 90000,
  line13: 82000,
  line14: 480000,
  line21: 472000,
  scheduleDLine19: 8000,
};

const foreignTaxCreditFor2024: PriorYearForeignTaxCredit = {
  method: "election_without_form_1116",
  scheduleThreeLine1: 280,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LOGAIN_USER_ID, taxYear: LOGAIN_TAX_YEAR, suffix, value });

const STATED = "Stated, 2026-11-23, from his 2024 return";

export const logainFacts: TaxFactRow[] = [
  idFact("name.first", LOGAIN.firstName),
  idFact("name.last", LOGAIN.lastName),
  idFact("ssn", LOGAIN.ssn),
  idFact("dob", "02/19/1982"),
  idFact("address.street", LOGAIN.street),
  idFact("address.city", LOGAIN.city),
  idFact("address.state", LOGAIN.state),
  idFact("address.zip", LOGAIN.zip),
  idFact("occupation", "Chip design engineer"),
  idFact("phone", "972-555-0188"),
  fact("wages", makeW2FactKey("falme-semiconductor"), w2, "W-2 from Falme Semiconductor Inc."),
  fact(
    "investment_income",
    makeDividendFactKey("tanchico-world-index"),
    fundDividends,
    "Form 1099-DIV from Tanchico World Index Fund.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("lugard-savings"),
    bankInterest,
    "Form 1099-INT from Lugard Savings Bank.",
  ),
  fact("other", PRIOR_AMT.filingStatus, "single", `${STATED}: filed single.`),
  fact("other", PRIOR_AMT.form6251, form6251For2024, `${STATED}: 2024 Form 6251.`),
  fact("other", PRIOR_AMT.otherExclusionItems, 0, `${STATED}: no other exclusion items.`),
  fact(
    "other",
    PRIOR_AMT.minimumTaxCreditNolDeduction,
    15000,
    `${STATED}: his preparer's MTCNOL worksheet.`,
  ),
  fact("other", PRIOR_AMT.creditCarryforward, 12000, `${STATED}: 2024 Form 8801 line 26.`),
  fact(
    "other",
    PRIOR_AMT.capitalGainWorksheet,
    worksheetFor2024,
    `${STATED}: 2024 Schedule D Tax Worksheet.`,
  ),
  fact("other", PRIOR_AMT.filedForm2555, false, `${STATED}: no Form 2555.`),
  fact(
    "other",
    PRIOR_AMT.foreignTaxCredit,
    foreignTaxCreditFor2024,
    `${STATED}: 2024 Schedule 3 line 1, no Form 1116.`,
  ),
];
