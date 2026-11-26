/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * two Forms 1097-BTC and the three Forms 1099-INT are in docs/ (made by
 * generate-docs.ts from the values below). The W-2 and 1099-DIV facts are the
 * boxes as the documents would print them; the two bonds no Form 1097-BTC
 * reports and the carryforward are Varilin's answers from his own records.
 */

import {
  TAX_CREDIT_BOND_CARRYFORWARD_KEY,
  makeBondTaxCreditStatementFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeTaxCreditBondFactKey,
  makeW2FactKey,
  type BondTaxCreditStatementValue,
  type DividendFactValue,
  type InterestFactValue,
  type TaxCreditBondFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const VARILIN_USER_ID = "varilin-integration";
export const VARILIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: VARILIN_USER_ID,
  taxYear: VARILIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const VARILIN = {
  firstName: "Varilin",
  lastName: "Ostrander",
  ssn: "400-00-8920",
  street: "1418 Mesquite Bend Road",
  city: "Abilene",
  state: "TX",
  zip: "79606",
};

const address = {
  line1: VARILIN.street,
  city: VARILIN.city,
  state: VARILIN.state,
  zip: VARILIN.zip,
};

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Callahan Plains Water Engineering",
  employerEin: "00-0089120",
  employerAddress: { line1: "300 Cypress Street", city: "Abilene", state: "TX", zip: "79601" },
  employee: { firstName: VARILIN.firstName, lastName: VARILIN.lastName, ssn: VARILIN.ssn, address },
  box1: 168000,
  box2: 26500,
  box3: 168000,
  box4: 10416,
  box5: 168000,
  box6: 2436,
};

/* The broker passes on the credit of a qualified school construction bond (box 3 "199"). */
export const BROKER_STATEMENT: BondTaxCreditStatementValue = {
  filerName: "Brazos Ridge Securities LLC",
  filerTin: "00-0089121",
  filerIsBondIssuer: false,
  box1Total: 1420.36,
  box2aCode: "C",
  box2bUniqueIdentifier: "99999QSB4",
  box3BondType: "199",
  box5Monthly: [0, 0, 355.09, 0, 0, 355.09, 0, 0, 355.09, 0, 0, 355.09],
};

/* A clean renewable energy bond (box 3 "101") the cooperative issued; a broker-free holding, no pass-through entity. */
export const COOPERATIVE_STATEMENT: BondTaxCreditStatementValue = {
  filerName: "Red River Electric Cooperative",
  filerTin: "00-0089122",
  filerIsBondIssuer: true,
  box1Total: 612.48,
  box2aCode: "A",
  box2bUniqueIdentifier: "RREC-CREB-0451",
  box3BondType: "101",
  box5Monthly: [0, 0, 153.12, 0, 0, 153.12, 0, 0, 153.12, 0, 0, 153.12],
  fromPassThroughEntity: false,
};

/*
 * A qualified energy conservation bond held directly with the issuer's paying
 * agent since its issue, which matured on July 23, 2025: 25% for March 15 and
 * June 15, and 38/92 of 25% for the period ending September 15. No Form
 * 1097-BTC or 1099-INT reports its credit.
 */
export const ENERGY_BOND: TaxCreditBondFactValue = {
  source: "held",
  bondType: "qecb",
  issuerNameCityState: "Pinecrest County Energy Authority, Pinecrest, TX",
  issuerEin: "00-0089123",
  issueDate: "2012-05-01",
  maturityDate: "2025-07-23",
  rows: [{ identifier: "99999QEC7", outstandingAmount: 50000, creditRate: 0.0478 }],
  creditOnForm1099Int: false,
};

/*
 * A build America bond held directly: one row for each 2025 interest payment
 * date, the interest payable. The paying agent's Form 1099-INT reports the cash
 * interest and the credit in box 1; it sent no Form 1097-BTC.
 */
export const WATER_BOND: TaxCreditBondFactValue = {
  source: "held",
  bondType: "bab",
  issuerNameCityState: "Lakeview Unified Water District, Lakeview, TX",
  issuerEin: "00-0089124",
  issueDate: "2010-06-15",
  maturityDate: "2034-06-15",
  rows: [
    { identifier: "99999BAB2, interest 04/01/2025", outstandingAmount: 1600 },
    { identifier: "99999BAB2, interest 10/01/2025", outstandingAmount: 1600 },
  ],
  creditOnForm1099Int: true,
};

const interest = (payerName: string, payerTin: string, box1: number): InterestFactValue => ({
  payerName,
  payerTin,
  box1,
});

/* Box 1 of each Form 1099-INT: the bond credits, and for the BAB the $3,200 of cash interest too. */
export const BROKER_INTEREST = interest("Brazos Ridge Securities LLC", "00-0089121", 1420.36);
export const COOPERATIVE_INTEREST = interest(
  "Red River Electric Cooperative",
  "00-0089122",
  612.48,
);
export const WATER_INTEREST = interest("Lakeview Unified Water District", "00-0089124", 4320);

/* A world stock index fund: box 7 foreign tax under $300, so the election applies (Schedule 3 line 1). */
const fundDividends: DividendFactValue = {
  payerName: "Caprock World Index Fund",
  payerTin: "00-0089125",
  box1a: 1300,
  box1b: 1100,
  box7: 95,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: VARILIN_USER_ID, taxYear: VARILIN_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", VARILIN.firstName),
  idFact("name.last", VARILIN.lastName),
  idFact("ssn", VARILIN.ssn),
  idFact("dob", "10/02/1979"),
  idFact("address.street", VARILIN.street),
  idFact("address.city", VARILIN.city),
  idFact("address.state", VARILIN.state),
  idFact("address.zip", VARILIN.zip),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "325-555-0148"),
];

export const varilinFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact("wages", makeW2FactKey("callahan-plains"), w2, `W-2, ${MADE_UP}.`),
  fact(
    "investment_income",
    makeBondTaxCreditStatementFactKey("brazos-ridge"),
    BROKER_STATEMENT,
    "Form 1097-BTC (docs/01-1097-btc-brazos-ridge.pdf).",
  ),
  fact(
    "investment_income",
    makeBondTaxCreditStatementFactKey("red-river-cooperative"),
    COOPERATIVE_STATEMENT,
    "Form 1097-BTC (docs/02-1097-btc-red-river.pdf); not from a pass-through entity, stated by Varilin.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("brazos-ridge"),
    BROKER_INTEREST,
    "Form 1099-INT (docs/03-1099-int-brazos-ridge.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("red-river-cooperative"),
    COOPERATIVE_INTEREST,
    "Form 1099-INT (docs/04-1099-int-red-river.pdf).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("lakeview-water"),
    WATER_INTEREST,
    "Form 1099-INT (docs/05-1099-int-lakeview-water.pdf).",
  ),
  fact(
    "investment_income",
    makeTaxCreditBondFactKey("pinecrest-qecb"),
    ENERGY_BOND,
    "Varilin's bond records: the bond's terms, the Treasury credit rate and the paying agent's notices.",
  ),
  fact(
    "investment_income",
    makeTaxCreditBondFactKey("lakeview-bab"),
    WATER_BOND,
    "Varilin's bond records; the credit is in box 1 of the Lakeview Form 1099-INT.",
  ),
  fact(
    "other",
    TAX_CREDIT_BOND_CARRYFORWARD_KEY,
    275,
    "2024 Form 8912: line 4 less line 12, a qualified school construction bond credit. Stated by Varilin.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("caprock-world-index"),
    fundDividends,
    `1099-DIV from Caprock World Index Fund, ${MADE_UP}.`,
  ),
];
