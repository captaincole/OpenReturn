/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2, the 1099-INT, the 1099-DIV,
 * the Form 1098 and the Form 3921 would print them, and her answers.
 */

import {
  AMT_KEYS,
  CA_AMT_CALIFORNIA_CATEGORY,
  CA_AMT_CALIFORNIA_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  CA_RESIDENCY_FACT_KEYS,
  MORTGAGE_KEYS,
  caCaliforniaAmountKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeIsoExerciseFactKey,
  makeW2FactKey,
  type CaResidencyFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type IsoExerciseFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const PEVIN_USER_ID = "pevin-integration";
export const PEVIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: PEVIN_USER_ID,
  taxYear: PEVIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const PEVIN = {
  firstName: "Pevin",
  lastName: "Ardlow",
  ssn: "400-00-5501",
  street: "2280 Sagebrush Court",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

const address = { line1: PEVIN.street, city: PEVIN.city, state: PEVIN.state, zip: PEVIN.zip };
const employee = {
  firstName: PEVIN.firstName,
  lastName: PEVIN.lastName,
  ssn: PEVIN.ssn,
  address,
};

/* January to September, while she lived in San Jose: her only job in 2025. */
const lumenRidgeW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Lumen Ridge Systems Inc",
  employerEin: "00-0005501",
  employerAddress: { line1: "75 Almaden Boulevard", city: "San Jose", state: "CA", zip: "95113" },
  employee,
  box1: 262000,
  box2: 52400,
  box3: 176100,
  box4: 10918.2,
  box5: 262000,
  box6: 3799,
  box15: "CA",
  box16: 262000,
  box17: 22800,
};

const savingsInterest: InterestFactValue = { payerName: "Bay Harbor Credit Union", box1: 3000 };

const brokerageDividends: DividendFactValue = {
  payerName: "Truckee Index Funds",
  box1a: 16000,
  box1b: 12000,
};

/* The options she exercised in June, while a California resident, and still held at year end. */
const isoExercise: IsoExerciseFactValue = {
  employerName: "Lumen Ridge Systems Inc",
  employerTin: "00-0005501",
  box1: "03/01/2021",
  box2: "06/12/2025",
  box3: 8,
  box4: 58,
  box5: 4000,
};

/* Part I: she moved from San Jose to Reno on September 30, 2025. */
const residency: CaResidencyFactValue = {
  residency: "part_year_resident",
  domicileState: "NV",
  becameNonresident: { state: "NV", date: "09/30/2025" },
  daysInCalifornia: 273,
  ownedCaliforniaProperty: false,
  priorResidency: { begin: "07/01/2018", end: "12/31/2024" },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: PEVIN_USER_ID, taxYear: PEVIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-26";

const identity: TaxFactRow[] = [
  idFact("name.first", PEVIN.firstName),
  idFact("name.last", PEVIN.lastName),
  idFact("ssn", PEVIN.ssn),
  idFact("dob", "08/21/1984"),
  idFact("address.street", PEVIN.street),
  idFact("address.city", PEVIN.city),
  idFact("address.state", PEVIN.state),
  idFact("address.zip", PEVIN.zip),
  idFact("occupation", "Hardware engineer"),
  idFact("phone", "775-555-0182"),
];

const documents: TaxFactRow[] = [
  fact("wages", makeW2FactKey("lumen-ridge"), lumenRidgeW2, "W-2 from Lumen Ridge Systems Inc."),
  fact(
    "investment_income",
    makeInterestFactKey("bay-harbor-savings"),
    savingsInterest,
    "1099-INT from Bay Harbor Credit Union.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("truckee-index"),
    brokerageDividends,
    "1099-DIV from Truckee Index Funds.",
  ),
  fact(
    "other",
    makeIsoExerciseFactKey("lumen-ridge", "2025-06-12"),
    isoExercise,
    "Form 3921 from Lumen Ridge Systems Inc.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    5500,
    "Form 1098 from Sierra Home Loans, box 1.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    420000,
    "Form 1098 from Sierra Home Loans, box 2.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "10/06/2025",
    "Form 1098 from Sierra Home Loans, box 3: the loan that bought the Reno house.",
  ),
];

const answers: TaxFactRow[] = [
  fact("other", AMT_KEYS.isoSharesHeldAtYearEnd, true, `${VERBAL}: she still holds the shares.`),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer coverage, then an exchange plan, no gap.`,
  ),
  fact("medical", "medical.expenses_total", 26000, `${VERBAL}: a knee surgery and its therapy.`),
  fact(
    "state_local_tax",
    "state_local_tax.real_estate",
    2400,
    `${VERBAL}: the Washoe County tax paid at the October closing.`,
  ),
  fact("state_local_tax", "state_local_tax.personal_property", 0, `${VERBAL}: no vehicle tax.`),
  fact(
    "state_local_tax",
    "state_local_tax.allocable_to_investment_income",
    0,
    `${VERBAL}: she takes no state tax against investment income on Form 8960.`,
  ),
  fact("charitable", "charitable.cash", 9000, `${VERBAL}: gifts by check to two food banks.`),
  fact("charitable", "charitable.noncash", 0, `${VERBAL}: no gifts of goods.`),
  fact("charitable", "charitable.carryover", 0, `${VERBAL}: no gifts carried over from 2024.`),
  fact(
    "other",
    CA_MISC_DEDUCTION_KEYS.investmentFees,
    7000,
    `${VERBAL}: the advisory fee on her brokerage account.`,
  ),
  fact(
    "identity",
    CA_RESIDENCY_FACT_KEYS.taxpayer,
    residency,
    `${VERBAL}: the move and the dates.`,
  ),
  /* Column E: what she earned or received while a California resident (Schedule CA (540NR)). */
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("1a"),
    262000,
    `${VERBAL}: all of the Lumen Ridge wages, paid while she lived in San Jose.`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("2b"),
    2250,
    `${VERBAL}: the interest credited January to September (her statements).`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("3b"),
    4000,
    `${VERBAL}: the dividends paid January to September (her statements).`,
  ),
  /* Schedule P (540NR) line 29d: the June exercise was while she was a resident. */
  fact(
    CA_AMT_CALIFORNIA_CATEGORY,
    CA_AMT_CALIFORNIA_KEYS.isoExerciseSpread,
    200000,
    `${VERBAL}: she exercised in June, while she lived in San Jose: all of the spread.`,
  ),
];

export const pevinFacts: TaxFactRow[] = [...identity, ...documents, ...answers];
