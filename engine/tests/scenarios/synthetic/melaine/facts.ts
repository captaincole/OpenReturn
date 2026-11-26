/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * issuer's notice is a PDF in docs/ (generate-docs.ts); the W-2 and the
 * 1099-INT are the boxes as the documents would print them.
 */

import {
  makeInterestFactKey,
  makeMortgageSubsidyNoticeKey,
  makeMortgageSubsidySaleKey,
  makeW2FactKey,
  type InterestFactValue,
  type MortgageSubsidyNoticeFactValue,
  type MortgageSubsidySaleFactValue,
  type MortgageSubsidyTableRow,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MELAINE_USER_ID = "melaine-integration";
export const MELAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const HOME_SLUG = "larkspur-bend";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MELAINE_USER_ID,
  taxYear: MELAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MELAINE = {
  firstName: "Melaine",
  lastName: "Ashgrove",
  ssn: "400-00-8828",
  street: "4418 Sorrel Creek Drive",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

const address = {
  line1: MELAINE.street,
  city: MELAINE.city,
  state: MELAINE.state,
  zip: MELAINE.zip,
};

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Caliche Ridge Engineering",
  employerEin: "00-0008828",
  employerAddress: { line1: "77 Quarry Lake Road", city: "Austin", state: "TX", zip: "78731" },
  employee: { firstName: MELAINE.firstName, lastName: MELAINE.lastName, ssn: MELAINE.ssn, address },
  box1: 67500,
  box2: 14000,
  box3: 67500,
  box4: 4185,
  box5: 67500,
  box6: 978.75,
};

/* A credit union account (taxable) and a municipal bond fund (tax-exempt, box 8). */
const interest: InterestFactValue = {
  payerName: "Blackland Prairie Credit Union",
  payerTin: "00-0018828",
  box1: 240.35,
  box8: 409.8,
};

/*
 * The issuer's table: adjusted qualifying income grows 5% for each year held,
 * the 3-or-more column is 115% of the other (made-up 2020 amounts).
 */
const AQI_BY_YEAR: ReadonlyArray<[number, number, number]> = [
  [20, 51100, 58765],
  [40, 53655, 61703],
  [60, 56338, 64788],
  [80, 59155, 68028],
  [100, 62112, 71429],
  [80, 65218, 75001],
  [60, 68479, 78751],
  [40, 71903, 82688],
  [20, 75498, 86823],
];

const table: MortgageSubsidyTableRow[] = AQI_BY_YEAR.map(([percentage, small, large], index) => ({
  yearsHeld: index + 1,
  holdingPeriodPercentage: percentage,
  adjustedQualifyingIncomeTwoOrFewer: small,
  adjustedQualifyingIncomeThreeOrMore: large,
}));

/* The notice from the bond issuer: a $236,000 bond-financed loan closed June 12, 2020. */
export const MELAINE_NOTICE: MortgageSubsidyNoticeFactValue = {
  subsidyType: "qualified_mortgage_bond",
  issuerState: "Texas",
  issuerPoliticalSubdivision: "Brazos Bend County",
  issuerAgency: "Brazos Bend County Housing Finance Corporation",
  originalLenderName: "Live Oak Hill Mortgage Company",
  originalLenderAddress: "900 Mesquite Plaza, Round Rock, TX 78664",
  loanClosingDate: "2020-06-12",
  federallySubsidizedAmount: 14750,
  table,
};

/* The sale: her main home for five years, so section 121 excludes the whole gain. */
const sale: MortgageSubsidySaleFactValue = {
  propertyAddress: "1207 Larkspur Bend, Round Rock, TX 78664",
  dispositionDate: "2025-08-29",
  fullRepaymentDate: "2025-08-29",
  salesPrice: 330000,
  expensesOfSale: 19800,
  adjustedBasis: 262500,
  gainIncludedInIncome: 0,
  familySizeAtSale: 1,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MELAINE_USER_ID, taxYear: MELAINE_TAX_YEAR, suffix, value });

export const melaineFacts: TaxFactRow[] = [
  idFact("name.first", MELAINE.firstName),
  idFact("name.last", MELAINE.lastName),
  idFact("ssn", MELAINE.ssn),
  idFact("dob", "03/09/1988"),
  idFact("address.street", MELAINE.street),
  idFact("address.city", MELAINE.city),
  idFact("address.state", MELAINE.state),
  idFact("address.zip", MELAINE.zip),
  idFact("occupation", "Civil Engineer"),
  idFact("phone", "512-555-0188"),
  fact("wages", makeW2FactKey("caliche-ridge"), w2, "W-2 from Caliche Ridge Engineering."),
  fact(
    "investment_income",
    makeInterestFactKey("blackland-prairie"),
    interest,
    "1099-INT from Blackland Prairie Credit Union.",
  ),
  fact(
    "mortgage",
    makeMortgageSubsidyNoticeKey(HOME_SLUG),
    MELAINE_NOTICE,
    "Recapture tax notice (docs/01-recapture-tax-notice.pdf).",
  ),
  fact(
    "mortgage",
    makeMortgageSubsidySaleKey(HOME_SLUG),
    sale,
    "Verbal, 2026-11-25: sold the Round Rock home on 08/29/2025; closing statement and basis records.",
  ),
];
