/*
 * A made-up taxpayer (README.md): every name and amount is invented. The farm
 * amounts are what she states from the nursery's accrual books; the W-2 is
 * the boxes as the document would print them.
 */

import {
  CA_BUSINESS_LOSS_LIMIT_KEYS,
  makeFarmFactKey,
  makeW2FactKey,
  type FarmFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const EDARRA_USER_ID = "edarra-integration";
export const EDARRA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const VERBAL = "Verbal, 2026-11-25";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: EDARRA_USER_ID,
  taxYear: EDARRA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const EDARRA = {
  firstName: "Edarra",
  lastName: "Vashenko",
  ssn: "400-00-7322",
  street: "4410 Oak Knoll Avenue",
  city: "Napa",
  state: "CA",
  zip: "94558",
};

const address = { line1: EDARRA.street, city: EDARRA.city, state: EDARRA.state, zip: EDARRA.zip };

/* Her salary as a winery's chief financial officer (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Silverado Bench Cellars",
  employerEin: "00-0007323",
  employerAddress: { line1: "6200 Silverado Trail", city: "Napa", state: "CA", zip: "94558" },
  employee: { firstName: EDARRA.firstName, lastName: EDARRA.lastName, ssn: EDARRA.ssn, address },
  box1: 420000,
  box2: 98000,
  box3: 176100,
  box4: 10918.2,
  box5: 420000,
  box6: 7830,
  box14: [{ label: "CA SDI", amount: 5040 }],
  box15: "CA",
  box16: 420000,
  box17: 36500,
};

/*
 * Her grapevine nursery (accrual method, inventory at cost, material
 * participation). The land and equipment are leased, so it has no
 * depreciation. The loss before the at-risk rules is more than she has at
 * risk: part of the start-up was financed by a nonrecourse loan from the
 * seller of the stock (box 36b, Form 6198).
 */
export const nursery: FarmFactValue = {
  owner: "taxpayer",
  activity: "Grapevine nursery stock",
  code: "111400",
  accountingMethod: "accrual",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  productSales: 210000,
  purchasedItemSales: 15000,
  cooperativeDistributions: 2000,
  agriculturalProgramPayments: 6000,
  cccLoanElection: true,
  cccLoansReported: 5000,
  cccLoansForfeited: 4000,
  cccForfeitedCommodityBasis: 3500,
  cropInsurance: 9000,
  customHireIncome: 3000,
  otherIncome: 1500,
  inventory: { beginning: 140000, purchases: 60000, ending: 120000, method: "cost" },
  expenses: {
    chemicals: 18000,
    customHire: 12000,
    laborHired: 374000,
    insurance: 9500,
    rentVehiclesMachinery: 36000,
    rentOther: 48000,
    repairs: 6500,
    seedsAndPlants: 22000,
    supplies: 14000,
    taxes: 4200,
    utilities: 11800,
    freightAndTrucking: 4000,
  },
  allInvestmentAtRisk: false,
  atRisk: {
    description: "Grapevine nursery stock",
    simplified: { adjustedBasisAtStart: 310000, increases: 30000 },
  },
  w2WagesPaid: 374000,
  qualifiedPropertyUbia: 0,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: EDARRA_USER_ID, taxYear: EDARRA_TAX_YEAR, suffix, value });

export const edarraFacts: TaxFactRow[] = [
  idFact("name.first", EDARRA.firstName),
  idFact("name.last", EDARRA.lastName),
  idFact("ssn", EDARRA.ssn),
  idFact("dob", "08/30/1976"),
  idFact("address.street", EDARRA.street),
  idFact("address.city", EDARRA.city),
  idFact("address.state", EDARRA.state),
  idFact("address.zip", EDARRA.zip),
  idFact("address.county", "Napa"),
  idFact("occupation", "Chief financial officer"),
  idFact("phone", "707-555-0188"),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer plan all year.`,
  ),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
  fact(
    "other",
    CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover,
    0,
    `${VERBAL}: the nursery started in 2025; no 2024 FTB 3461.`,
  ),
  fact("wages", makeW2FactKey("silverado-bench"), w2, "W-2 from Silverado Bench Cellars."),
  fact(
    "self_employment",
    makeFarmFactKey("oak-knoll-nursery"),
    nursery,
    `${VERBAL}: the nursery's accrual books and its lender's papers.`,
  ),
];
