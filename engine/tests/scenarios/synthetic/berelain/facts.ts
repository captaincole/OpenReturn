/*
 * A made-up taxpayer (README.md): every name and amount is invented. The Form
 * 1099-S and the Form 1099-DIV are made documents (generate-docs.ts renders them
 * from the objects below); the W-2 has no PDF. The sale amounts are what she
 * states from her closing statement and depreciation records.
 */

import {
  SECTION_1231_KEYS,
  makeBusinessFactKey,
  makeBusinessPropertySaleFactKey,
  makeDividendFactKey,
  makeForm1099SFactKey,
  makeSection179RecaptureFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type BusinessPropertySaleFactValue,
  type DividendFactValue,
  type Form1099SFactValue,
  type Section179RecaptureFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BERELAIN_USER_ID = "berelain-integration";
export const BERELAIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BERELAIN_USER_ID,
  taxYear: BERELAIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BERELAIN = {
  firstName: "Berelain",
  lastName: "Ashcombe",
  ssn: "400-00-4797",
  street: "318 Caprock Lane",
  city: "Lubbock",
  state: "TX",
  zip: "79416",
};

const address = {
  line1: BERELAIN.street,
  city: BERELAIN.city,
  state: BERELAIN.state,
  zip: BERELAIN.zip,
};

const BUSINESS_ID = "caprock-print";
const SHOP_ADDRESS = "1450 Avenue Q, Lubbock, TX 79401";

/* W-2 from a part-time job (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "South Plains Community College",
  employerEin: "00-0047971",
  employerAddress: { line1: "1401 College Avenue", city: "Levelland", state: "TX", zip: "79336" },
  employee: {
    firstName: BERELAIN.firstName,
    lastName: BERELAIN.lastName,
    ssn: BERELAIN.ssn,
    address,
  },
  box1: 12000,
  box2: 900,
  box3: 12000,
  box4: 744,
  box5: 12000,
  box6: 174,
};

/* Her sign and print shop (Schedule C). Line 6 also gets the Form 4797 Part IV recapture. */
const printShop: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Sign and print shop",
  code: "323100",
  name: "Caprock Print & Sign",
  address: { street: "1450 Avenue Q", city: "Lubbock", state: "TX", zip: "79401" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 60000,
  expenses: { supplies: 12000, utilities: 3600, insurance: 2400 },
  depreciation: { priorYearMacrs: 5000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* Form 1099-S from the title company for the shop building, its land and its improvements (made up). */
export const closing1099S: Form1099SFactValue = {
  filerName: "Llano Estacado Title Co",
  filerTin: "00-0047972",
  box1: "2025-08-20",
  box2: 350000,
  box3: SHOP_ADDRESS,
};

const FORM_1099S_KEY = makeForm1099SFactKey("llano-estacado-title", "shop-closing");

/* Form 1099-DIV from a REIT fund (made up): box 2b is unrecaptured section 1250 gain. */
export const reitFund: DividendFactValue = {
  payerName: "High Plains REIT Fund",
  payerTin: "00-0047973",
  box1a: 3200,
  box1b: 2800,
  box2a: 1500,
  box2b: 600,
};

/*
 * The eight properties she sold or retired in 2025 (amounts from her closing
 * statement and depreciation schedule). The building, its improvements and the
 * land closed together on the one Form 1099-S ($260,000 + $20,000 + $70,000).
 */
const sales: Array<[string, BusinessPropertySaleFactValue]> = [
  [
    "shop-building",
    {
      description: "Shop building, 1450 Avenue Q",
      kind: "section_1250",
      dateAcquired: "2016-03-15",
      dateSold: "2025-08-20",
      grossSalesPrice: 260000,
      costOrOtherBasis: 210000,
      expenseOfSale: 15600,
      depreciationAllowed: 48460,
      form1099SKey: FORM_1099S_KEY,
    },
  ],
  [
    "shop-improvements",
    {
      description: "Interior improvements (QIP), 1450 Avenue Q",
      kind: "section_1250",
      dateAcquired: "2019-06-10",
      dateSold: "2025-08-20",
      grossSalesPrice: 20000,
      costOrOtherBasis: 24000,
      expenseOfSale: 1200,
      depreciationAllowed: 24000,
      additionalDepreciationAfter1975: 14400,
      form1099SKey: FORM_1099S_KEY,
    },
  ],
  [
    "delivery-van",
    {
      description: "2021 delivery van",
      kind: "section_1245",
      dateAcquired: "2021-04-01",
      dateSold: "2025-05-14",
      grossSalesPrice: 18500,
      costOrOtherBasis: 42000,
      depreciationAllowed: 31000,
    },
  ],
  [
    "hay-field",
    {
      description: "Hay field, 12 acres, Crosby County",
      kind: "section_1252",
      dateAcquired: "2018-02-01",
      dateSold: "2025-03-03",
      grossSalesPrice: 64000,
      costOrOtherBasis: 50000,
      soilWaterLandClearing: 9000,
      section126ExcludedPayments: 5000,
      section126PaymentsReceived: "2018-09-15",
    },
  ],
  [
    "shop-land",
    {
      description: "Land under the shop, 1450 Avenue Q",
      kind: "land",
      dateAcquired: "2016-03-15",
      dateSold: "2025-08-20",
      grossSalesPrice: 70000,
      costOrOtherBasis: 52000,
      expenseOfSale: 4200,
      form1099SKey: FORM_1099S_KEY,
    },
  ],
  [
    "wide-format-press",
    {
      description: "Wide-format printing press",
      kind: "section_1245",
      dateAcquired: "2019-01-10",
      dateSold: "2025-09-30",
      grossSalesPrice: 1500,
      costOrOtherBasis: 25000,
      depreciationAllowed: 21000,
    },
  ],
  [
    "old-hvac",
    {
      description: "Shop HVAC unit, replaced",
      kind: "section_1250",
      dateAcquired: "2016-03-15",
      dateSold: "2025-02-01",
      grossSalesPrice: 200,
      costOrOtherBasis: 12000,
      depreciationAllowed: 2800,
      partialDisposition: "elective",
    },
  ],
  [
    "design-laptop",
    {
      description: "Design laptop",
      kind: "section_1245",
      dateAcquired: "2025-01-06",
      dateSold: "2025-10-20",
      grossSalesPrice: 900,
      costOrOtherBasis: 2400,
      depreciationAllowed: 2400,
    },
  ],
];

/*
 * Part IV: an embroidery machine (section 179 in 2023, 40% business use in 2025)
 * and a pickup (listed property, 50% business use in 2025). The pickup's amounts
 * are those of Pub. 946's example (irs-pub-946-2025::sec::recapture-of-excess-depreciation::b02).
 */
const recaptures: Array<[string, Section179RecaptureFactValue]> = [
  [
    "embroidery-machine",
    {
      description: "Embroidery machine",
      column: "section_179",
      priorDeductions: 15000,
      recomputedDepreciation: 6866.4,
      businessId: BUSINESS_ID,
    },
  ],
  [
    "pickup",
    {
      description: "Pickup truck",
      column: "section_280f",
      priorDeductions: 16618,
      recomputedDepreciation: 12600,
      businessId: BUSINESS_ID,
    },
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BERELAIN_USER_ID, taxYear: BERELAIN_TAX_YEAR, suffix, value });

export const berelainFacts: TaxFactRow[] = [
  idFact("name.first", BERELAIN.firstName),
  idFact("name.last", BERELAIN.lastName),
  idFact("ssn", BERELAIN.ssn),
  idFact("dob", "04/02/1979"),
  idFact("address.street", BERELAIN.street),
  idFact("address.city", BERELAIN.city),
  idFact("address.state", BERELAIN.state),
  idFact("address.zip", BERELAIN.zip),
  idFact("occupation", "Print shop owner"),
  idFact("phone", "806-555-0147"),
  fact(
    "wages",
    makeW2FactKey("south-plains-college"),
    w2,
    "W-2 from South Plains Community College.",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    printShop,
    "Stated by Berelain: her sign and print shop.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("high-plains-reit"),
    reitFund,
    "Form 1099-DIV from High Plains REIT Fund (docs/02-1099-div-high-plains-reit.pdf).",
  ),
  fact(
    "other",
    FORM_1099S_KEY,
    closing1099S,
    "Form 1099-S from Llano Estacado Title Co (docs/01-1099-s-llano-estacado-title.pdf).",
  ),
  ...sales.map(([slug, value]) =>
    fact(
      "other",
      makeBusinessPropertySaleFactKey(slug),
      value,
      "Stated by Berelain: closing statement and depreciation schedule.",
    ),
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    15000,
    "Stated by Berelain: her 2021 net section 1231 loss, not yet recaptured.",
  ),
  ...recaptures.map(([slug, value]) =>
    fact(
      "other",
      makeSection179RecaptureFactKey(slug),
      value,
      "Stated by Berelain: depreciation schedule; business use fell to 50% or less in 2025.",
    ),
  ),
];
