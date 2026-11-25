/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Tylin runs a landscape design business in Sacramento and sold its equipment,
 * a yard and its improvements in 2025. The federal return took the special
 * depreciation allowance and a larger section 179 expense; California allows
 * neither, so her California depreciation is smaller and Schedule D-1 files.
 * The Form 1099-S has a made document (generate-docs.ts); the W-2 has none.
 * The sale amounts are what she states from her closing statement and her two
 * depreciation schedules (federal and California).
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  SECTION_1231_KEYS,
  makeBusinessFactKey,
  makeBusinessPropertySaleFactKey,
  makeForm1099SFactKey,
  makeSection179RecaptureFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type BusinessPropertySaleFactValue,
  type Form1099SFactValue,
  type Section179RecaptureFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TYLIN_USER_ID = "tylin-synthetic";
export const TYLIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

export const TYLIN = {
  firstName: "Tylin",
  lastName: "Marrowgate",
  ssn: "400-00-0461",
  street: "2209 Riverbend Way",
  city: "Sacramento",
  state: "CA",
  zip: "95831",
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TYLIN_USER_ID,
  taxYear: TYLIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const BUSINESS_ID = "marrowgate-landscape";
const YARD_ADDRESS = "7410 Freeport Blvd, Sacramento, CA 95832";

/* W-2 from a part-time teaching job (made up). */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta River Community College",
  employerEin: "00-0046101",
  employerAddress: { line1: "3835 Freeport Blvd", city: "Sacramento", state: "CA", zip: "95822" },
  employee: {
    firstName: TYLIN.firstName,
    lastName: TYLIN.lastName,
    ssn: TYLIN.ssn,
    address: { line1: TYLIN.street, city: TYLIN.city, state: TYLIN.state, zip: TYLIN.zip },
  },
  box1: 24000,
  box2: 1800,
  box3: 24000,
  box4: 1488,
  box5: 24000,
  box6: 348,
  box14: [{ label: "CA SDI", amount: 288 }],
  box15: "CA",
  box16: 24000,
  box17: 700,
};

/* Her landscape design business (Schedule C). Line 6 also gets the Form 4797 Part IV recapture. */
const landscape: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Landscape design and installation",
  code: "561730",
  name: "Marrowgate Landscape Design",
  address: { street: "7410 Freeport Blvd", city: "Sacramento", state: "CA", zip: "95832" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 95000,
  expenses: { supplies: 14000, utilities: 3000, insurance: 4200 },
  depreciation: { priorYearMacrs: 4000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* Form 1099-S from the title company for the yard and its improvements (made up). */
export const yard1099S: Form1099SFactValue = {
  filerName: "Capitol Valley Title Co",
  filerTin: "00-0046102",
  box1: "2025-07-15",
  box2: 100000,
  box3: YARD_ADDRESS,
};

const FORM_1099S_KEY = makeForm1099SFactKey("capitol-valley-title", "yard-closing");

/*
 * The five properties she sold in 2025. The yard land and its improvements
 * closed together on the one Form 1099-S ($60,000 + $40,000), so each states
 * its price. The federal schedule took the special allowance on the excavator
 * (2021) and the improvements (2019); the California schedule did not. The
 * trailer was bought and sold in 2025, so neither schedule depreciates it.
 */
const sales: Array<[string, BusinessPropertySaleFactValue]> = [
  [
    "excavator",
    {
      description: "Compact excavator",
      kind: "section_1245",
      dateAcquired: "2021-05-10",
      dateSold: "2025-07-15",
      grossSalesPrice: 48000,
      costOrOtherBasis: 80000,
      depreciationAllowed: 80000,
      californiaDepreciationAllowed: 58000,
    },
  ],
  [
    "yard-improvements",
    {
      description: "Yard paving and fencing",
      kind: "section_1250",
      dateAcquired: "2019-03-20",
      dateSold: "2025-07-15",
      grossSalesPrice: 40000,
      costOrOtherBasis: 30000,
      depreciationAllowed: 30000,
      additionalDepreciationAfter1975: 28000,
      californiaDepreciationAllowed: 5000,
      // Straight line for California: no additional depreciation.
      californiaAdditionalDepreciationAfter1976: 0,
      form1099SKey: FORM_1099S_KEY,
    },
  ],
  [
    "yard-land",
    {
      description: "Yard land, 7410 Freeport Blvd",
      kind: "land",
      dateAcquired: "2019-03-20",
      dateSold: "2025-07-15",
      grossSalesPrice: 60000,
      costOrOtherBasis: 45000,
      form1099SKey: FORM_1099S_KEY,
    },
  ],
  [
    "riding-mower",
    {
      description: "Riding mower",
      kind: "section_1245",
      dateAcquired: "2020-04-02",
      dateSold: "2025-03-11",
      grossSalesPrice: 1000,
      costOrOtherBasis: 9000,
      depreciationAllowed: 6000,
    },
  ],
  [
    "dump-trailer",
    {
      description: "Dump trailer",
      kind: "section_1245",
      dateAcquired: "2025-02-01",
      dateSold: "2025-11-01",
      grossSalesPrice: 9000,
      costOrOtherBasis: 12000,
      /* Placed in service and sold in 2025: no depreciation (irs-pub-946-2025::sec::excepted-property::b01). */
    },
  ],
];

/*
 * Part IV: a stump grinder whose business use fell to 40% in 2025. Federal
 * section 179 expense $40,000; California's was $25,000 (R&TC 17201).
 */
const recaptures: Array<[string, Section179RecaptureFactValue]> = [
  [
    "stump-grinder",
    {
      description: "Stump grinder",
      column: "section_179",
      priorDeductions: 40000,
      recomputedDepreciation: 16000,
      californiaPriorDeductions: 25000,
      californiaRecomputedDepreciation: 10000,
      businessId: BUSINESS_ID,
    },
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TYLIN_USER_ID, taxYear: TYLIN_TAX_YEAR, suffix, value });

export const tylinFacts: TaxFactRow[] = [
  idFact("name.first", TYLIN.firstName),
  idFact("name.last", TYLIN.lastName),
  idFact("ssn", TYLIN.ssn),
  idFact("dob", "08/14/1982"),
  idFact("address.street", TYLIN.street),
  idFact("address.city", TYLIN.city),
  idFact("address.state", TYLIN.state),
  idFact("address.zip", TYLIN.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Landscape designer"),
  idFact("phone", "916-555-0146"),
  fact(
    "wages",
    makeW2FactKey("delta-river-college"),
    w2,
    "W-2 from Delta River Community College.",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    landscape,
    "Stated by Tylin: her landscape design business.",
  ),
  fact(
    "other",
    FORM_1099S_KEY,
    yard1099S,
    "Form 1099-S from Capitol Valley Title Co (docs/01-1099-s-capitol-valley-title.pdf).",
  ),
  // Every property she sold was the business's (Schedule C): each sale names it.
  ...sales.map(([slug, value]) =>
    fact(
      "other",
      makeBusinessPropertySaleFactKey(slug),
      { ...value, businessId: BUSINESS_ID },
      "Stated by Tylin: closing statement and her federal and California depreciation schedules.",
    ),
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    3000,
    "Stated by Tylin: her 2022 federal net section 1231 loss, not yet recaptured.",
  ),
  fact(
    "other",
    SECTION_1231_KEYS.californiaNonrecapturedLosses,
    2500,
    "Stated by Tylin: her 2022 California net section 1231 loss, not yet recaptured.",
  ),
  ...recaptures.map(([slug, value]) =>
    fact(
      "other",
      makeSection179RecaptureFactKey(slug),
      value,
      "Stated by Tylin: depreciation schedules; business use fell to 50% or less in 2025.",
    ),
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    "Stated by Tylin: self-employed for California too.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Stated by Tylin."),
  fact("use_tax", "use_tax.owed_amount", 0, "Stated by Tylin: no out-of-state purchases."),
];
