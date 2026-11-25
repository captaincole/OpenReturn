/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Beslan runs a bakery in Fresno and sold its building, its land, an oven and a
 * delivery van in 2025. Two credits moved his bases apart: a federal
 * rehabilitation credit lowered the building's federal basis, and a California
 * credit lowered the California basis of the oven and the van. His car's
 * depreciation limits also differ. So the California ordinary gain is larger,
 * the California section 1231 gain smaller, and Schedule D-1 files. No document
 * is made: the amounts come from his closing statement and depreciation records.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  SECTION_1231_KEYS,
  makeBusinessFactKey,
  makeBusinessPropertySaleFactKey,
  makeSection179RecaptureFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type BusinessPropertySaleFactValue,
  type Section179RecaptureFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BESLAN_USER_ID = "beslan-synthetic";
export const BESLAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

export const BESLAN = {
  firstName: "Beslan",
  lastName: "Ostrowen",
  ssn: "400-00-0462",
  street: "418 Cedar Hollow Ct",
  city: "Fresno",
  state: "CA",
  zip: "93711",
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BESLAN_USER_ID,
  taxYear: BESLAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const BUSINESS_ID = "ostrowen-bakery";

/* W-2 from a weekend job (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Sierra Vista Culinary School",
  employerEin: "00-0046201",
  employerAddress: { line1: "1550 Shaw Ave", city: "Fresno", state: "CA", zip: "93710" },
  employee: {
    firstName: BESLAN.firstName,
    lastName: BESLAN.lastName,
    ssn: BESLAN.ssn,
    address: { line1: BESLAN.street, city: BESLAN.city, state: BESLAN.state, zip: BESLAN.zip },
  },
  box1: 18000,
  box2: 1200,
  box3: 18000,
  box4: 1116,
  box5: 18000,
  box6: 261,
  box14: [{ label: "CA SDI", amount: 216 }],
  box15: "CA",
  box16: 18000,
  box17: 450,
};

/* His bakery (Schedule C). Line 6 also gets the Form 4797 Part IV recapture. */
const bakery: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Retail bakery",
  code: "311810",
  name: "Ostrowen Bakehouse",
  address: { street: "2240 Tulare St", city: "Fresno", state: "CA", zip: "93721" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 120000,
  expenses: { supplies: 30000, utilities: 9000, insurance: 5000 },
  depreciation: { priorYearMacrs: 6000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * The four properties he sold in 2025. The building's federal basis is $10,000
 * lower than its California basis (the federal rehabilitation credit); the
 * oven's and the van's California bases are lower (a California credit).
 */
const sales: Array<[string, BusinessPropertySaleFactValue]> = [
  [
    "bakery-building",
    {
      description: "Bakery building, 2240 Tulare St",
      kind: "section_1250",
      dateAcquired: "2012-06-01",
      dateSold: "2025-09-30",
      grossSalesPrice: 300000,
      costOrOtherBasis: 240000,
      expenseOfSale: 18000,
      depreciationAllowed: 60000,
      californiaCostOrOtherBasis: 250000,
    },
  ],
  [
    "bakery-land",
    {
      description: "Bakery land, 2240 Tulare St",
      kind: "land",
      dateAcquired: "2012-06-01",
      dateSold: "2025-09-30",
      grossSalesPrice: 80000,
      costOrOtherBasis: 50000,
    },
  ],
  [
    "deck-oven",
    {
      description: "Deck oven",
      kind: "section_1245",
      dateAcquired: "2020-08-15",
      dateSold: "2025-09-30",
      grossSalesPrice: 12000,
      costOrOtherBasis: 20000,
      depreciationAllowed: 14000,
      californiaCostOrOtherBasis: 18000,
    },
  ],
  [
    "delivery-van",
    {
      description: "Delivery van",
      kind: "section_1245",
      dateAcquired: "2025-01-20",
      dateSold: "2025-12-05",
      grossSalesPrice: 30000,
      costOrOtherBasis: 34000,
      /* Placed in service and sold in 2025: no depreciation (irs-pub-946-2025::sec::excepted-property::b01). */
      californiaCostOrOtherBasis: 31000,
    },
  ],
];

/*
 * Part IV: his car, listed property whose business use fell to 45% in 2025.
 * California does not follow the federal luxury car limits, so its prior
 * deductions and recomputed depreciation differ.
 */
const recaptures: Array<[string, Section179RecaptureFactValue]> = [
  [
    "bakery-car",
    {
      description: "Car",
      column: "section_280f",
      priorDeductions: 12000,
      recomputedDepreciation: 9000,
      californiaPriorDeductions: 10000,
      californiaRecomputedDepreciation: 6000,
      businessId: BUSINESS_ID,
    },
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BESLAN_USER_ID, taxYear: BESLAN_TAX_YEAR, suffix, value });

export const beslanFacts: TaxFactRow[] = [
  idFact("name.first", BESLAN.firstName),
  idFact("name.last", BESLAN.lastName),
  idFact("ssn", BESLAN.ssn),
  idFact("dob", "11/03/1976"),
  idFact("address.street", BESLAN.street),
  idFact("address.city", BESLAN.city),
  idFact("address.state", BESLAN.state),
  idFact("address.zip", BESLAN.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Baker"),
  idFact("phone", "559-555-0162"),
  fact(
    "wages",
    makeW2FactKey("sierra-vista-culinary"),
    w2,
    "W-2 from Sierra Vista Culinary School.",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    bakery,
    "Stated by Beslan: his bakery.",
  ),
  // Every property he sold was the bakery's (Schedule C): each sale names it.
  ...sales.map(([slug, value]) =>
    fact(
      "other",
      makeBusinessPropertySaleFactKey(slug),
      { ...value, businessId: BUSINESS_ID },
      "Stated by Beslan: closing statement and his federal and California depreciation records.",
    ),
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    0,
    "Stated by Beslan: no net section 1231 loss in the five prior years.",
  ),
  ...recaptures.map(([slug, value]) =>
    fact(
      "other",
      makeSection179RecaptureFactKey(slug),
      value,
      "Stated by Beslan: depreciation records; business use fell to 50% or less in 2025.",
    ),
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    "Stated by Beslan: self-employed for California too.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Stated by Beslan."),
  fact("use_tax", "use_tax.owed_amount", 0, "Stated by Beslan: no out-of-state purchases."),
];
