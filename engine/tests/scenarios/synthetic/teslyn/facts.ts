/*
 * Made-up taxpayer (README.md): a single full-year California resident in
 * Oakland with three other credits: the credit for prior year AMT (she
 * exercised incentive stock options in 2024 and kept the shares), tax paid to
 * Utah on wages, and a share of two entities that elected to pay California's
 * pass-through entity elective tax. Every name, number and address is
 * invented. The K-1s and the Utah return are not in the engine: their amounts
 * are her answers; last year's Schedule P figures are read off her 2024 return.
 */

import {
  CA_PRIOR_YEAR_AMT_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  makeCaPteElectiveCreditFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type CaPriorYearAmtExclusionsFactValue,
  type CaPteElectiveCreditFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TESLYN_USER_ID = "teslyn-synthetic";
export const TESLYN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const HOME = { line1: "318 Lakeshore Terrace", city: "Oakland", state: "CA", zip: "94610" };
const TAXPAYER = { firstName: "Teslyn", lastName: "Corrane", ssn: "400-00-3805" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TESLYN_USER_ID,
  taxYear: TESLYN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TESLYN_USER_ID, taxYear: TESLYN_TAX_YEAR, suffix, value });

/* One W-2 from an Oakland employer; her weeks on a Salt Lake City project are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Estuary Grid Analytics Inc",
  employerEin: "12-3803805",
  employerAddress: { line1: "1 Embarcadero West", city: "Oakland", state: "CA", zip: "94607" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 300000,
  box2: 61000,
  box3: 176100,
  box4: 10918.2,
  box5: 300000,
  box6: 5250,
  box14: [{ label: "CA SDI", amount: 3600 }],
  box15: "CA",
  box16: 300000,
  box17: 24800,
};

/* Utah nonresident return (TC-40 with TC-40B): wages for weeks worked in Salt Lake City. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    {
      description: "Wages, Salt Lake City project",
      californiaAmount: 40000,
      otherStateAmount: 40000,
    },
  ],
  taxPaid: 1800,
  otherStateAdjustedGrossIncome: 40000,
};

/*
 * Her 2024 Schedule P (540), as filed (made up): taxable income $220,000 after
 * a $9,065 itemized deductions limitation; exclusion add-backs for medical
 * ($9,500), property taxes ($54,000) and miscellaneous deductions ($78,000);
 * regular tax before credits $17,002. A $60,000 incentive stock option spread
 * made 2024 AMT $6,873.
 */
const exclusions: CaPriorYearAmtExclusionsFactValue = {
  returnForm: "540",
  filingStatus: "single",
  taxableIncome: 220000,
  itemizedDeductionsLimitation: 9065,
  exclusionItems: { medicalAndDental: 9500, propertyTaxes: 54000, miscellaneousDeductions: 78000 },
  regularTax: 17002,
};

const PRIOR_RETURN = "Her filed 2024 Form 540 and Schedule P (540)";

const credits: Array<[string, CaPteElectiveCreditFactValue, string]> = [
  [
    "redwood-anchor",
    { entityName: "Redwood Anchor Brewing, Inc.", entityId: "4377102", credit: 9300 },
    "Schedule K-1 (100S) line 13d and its statement",
  ],
  [
    "jack-london",
    { entityName: "Jack London Square Lofts LLC", entityId: "201908812240", credit: 4650 },
    "Schedule K-1 (568) other credits line and its statement",
  ],
];

export const teslynFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "06/02/1980"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Alameda"),
  idFact("occupation", "Grid analyst"),
  idFact("phone", "510-555-0177"),
  fact("wages", makeW2FactKey("estuary"), w2, "W-2 from Estuary Grid Analytics Inc."),
  fact("other", CA_PRIOR_YEAR_AMT_KEYS.amt, 6873, `${PRIOR_RETURN}: Schedule P line 26.`),
  fact(
    "other",
    CA_PRIOR_YEAR_AMT_KEYS.creditCarryover,
    1200,
    `${PRIOR_RETURN}: Part III line 10, column (d), unused 2023 credit.`,
  ),
  fact(
    "other",
    CA_PRIOR_YEAR_AMT_KEYS.exclusions,
    exclusions,
    `${PRIOR_RETURN}: Part I lines 2, 3, 5, 15 and 18; Part II line 25.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    "Verbal, from her 2025 Utah TC-40 and TC-40B.",
  ),
  ...credits.map(([slug, value, source]) =>
    fact(
      "state_local_tax",
      makeCaPteElectiveCreditFactKey(slug),
      value,
      `${value.entityName}: ${source}.`,
    ),
  ),
  fact("other", CA_PTE_CREDIT_CARRYOVER_KEY, 4000, "Her filed 2024 FTB 3804-CR, line 5."),
];
