/*
 * Source: TaxCalcBench ty25-us-009 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  RENTAL_KEYS,
  SPOUSE_KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type InterestFactValue,
  type RentalFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_US_009_USER_ID = "tcb-us-009-integration";
export const TCB_US_009_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-11T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
/* Last year's return: read for the carryovers, not ingested (#79). */
const PRIOR_YEAR =
  "2024 Form 1040 (docs/04-form-1040-2024.pdf): no Form 8582 or Schedule E, so no unallowed loss carries over.";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_US_009_USER_ID,
  taxYear: TCB_US_009_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const address = { line1: "1 address", city: "city", state: "FL", zip: "33755" };

// docs/01-mcd-w2.pdf
const w2: W2FactValue = {
  employerName: "mcd",
  employerEin: "12-3456789",
  employerAddress: { line1: "1 add", city: "city", state: "AK", zip: "99999" },
  employee: { firstName: "real", lastName: "passive", ssn: "900-45-6789", address },
  box1: 150000,
  box2: 30000,
  box3: 150000,
  box4: 9300,
  box5: 150000,
  box6: 2175,
};

// docs/02-int-1099-int.pdf (the form prints no payer TIN)
const interest: InterestFactValue = { payerName: "Int", box1: 600 };

// docs/03-div-1099-div.pdf (the form prints no payer TIN)
const dividends: DividendFactValue = { payerName: "div", box1a: 1500, box1b: 1500 };

/* scherentslist[0]: a self-rental with a loss. */
export const selfRentalLoss: RentalFactValue = {
  propertyType: "self_rental",
  address: { street: "1 Address", city: "City", state: "FL", zip: "33755" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 10000,
  expenses: { advertising: 50000, depreciationOrDepletion: 3636 }, // noFormDepreciation override
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0, // PRIOR_YEAR
  disposedOfEntirely: false,
  qualifiedBusiness: true, // isQBI
  specifiedService: false,
};

/* scherentslist[1]: a royalty, a passive activity. */
export const royalty: RentalFactValue = {
  propertyType: "royalties",
  royaltiesReceived: 2000,
  royaltyActivity: "passive", // royalty_passive_portfolio "Passive"
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0, // PRIOR_YEAR
  disposedOfEntirely: false,
  qualifiedBusiness: false, // qualified_business false; no isQBI answer
  specifiedService: false,
};

/* scherentslist[2]: a self-rental with income. */
export const selfRentalIncome: RentalFactValue = {
  propertyType: "self_rental",
  address: { street: "2 add", city: "city", state: "FL", zip: "32003" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 10000,
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0, // PRIOR_YEAR
  disposedOfEntirely: false,
  qualifiedBusiness: true, // isQBI
  specifiedService: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_US_009_USER_ID, taxYear: TCB_US_009_TAX_YEAR, suffix, value });

export const tcbUs009Facts: TaxFactRow[] = [
  idFact("name.first", "real"),
  idFact("name.last", "passive"),
  idFact("ssn", "900-45-6789"),
  idFact("dob", "11/11/1951"),
  idFact("address.street", address.line1),
  idFact("address.city", address.city),
  idFact("address.state", address.state),
  idFact("address.zip", address.zip),
  fact("identity", SPOUSE_KEYS.firstName, "spouse", "Answer key header (SpouseNm)."),
  fact("identity", SPOUSE_KEYS.lastName, "last", "Answer key header (SpouseNm)."),
  fact("identity", SPOUSE_KEYS.ssn, "900-45-6789", "Answer key header (SpouseSSN)."),
  fact("identity", SPOUSE_KEYS.dob, "12/12/1991", `${ANSWERS}: sp_date_of_birth.`),
  fact(
    "filing_status",
    SPOUSE_KEYS.itemizesSeparately,
    false,
    "Not in the answers: the key takes the standard deduction (README).",
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
  fact("wages", makeW2FactKey("mcd"), w2, "W-2 from mcd (docs/01-mcd-w2.pdf)."),
  fact(
    "investment_income",
    makeInterestFactKey("int"),
    interest,
    "1099-INT from Int (docs/02-int-1099-int.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("div"),
    dividends,
    "1099-DIV from div (docs/03-div-1099-div.pdf).",
  ),
  fact(
    "rental",
    makeRentalFactKey("1-address"),
    selfRentalLoss,
    `${ANSWERS}: scherentslist[0]. ${PRIOR_YEAR}`,
  ),
  fact(
    "rental",
    makeRentalFactKey("royalties"),
    royalty,
    `${ANSWERS}: scherentslist[1]. ${PRIOR_YEAR}`,
  ),
  fact(
    "rental",
    makeRentalFactKey("2-add"),
    selfRentalIncome,
    `${ANSWERS}: scherentslist[2]. ${PRIOR_YEAR}`,
  ),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, `${ANSWERS}: sche_gen.REProfessional.`),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, true, `${ANSWERS}: sche_gen.require1099.`),
  fact(
    "rental",
    RENTAL_KEYS.filedRequired1099s,
    false,
    `${ANSWERS}: sche_gen.require1099filed "N".`,
  ),
];
