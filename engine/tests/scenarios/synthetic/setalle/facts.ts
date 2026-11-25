/*
 * A made-up taxpayer (README.md): a single full-year California resident who
 * exercised incentive stock options in 2024, kept the shares, and paid
 * California AMT for 2024. Her 2024 Schedule P (540) itemized deductions also
 * held large exclusion items. Every name, number and address is invented. No
 * input documents: the W-2 boxes as the form would print them, and last
 * year's Schedule P figures as she reads them off her filed 2024 return.
 */

import {
  CA_PRIOR_YEAR_AMT_KEYS,
  makeW2FactKey,
  type CaPriorYearAmtExclusionsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SETALLE_USER_ID = "setalle-synthetic";
export const SETALLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "2207 Quarry Oak Lane", city: "San Jose", state: "CA", zip: "95125" };
const TAXPAYER = { firstName: "Setalle", lastName: "Marwick", ssn: "400-00-3510" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SETALLE_USER_ID,
  taxYear: SETALLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SETALLE_USER_ID, taxYear: SETALLE_TAX_YEAR, suffix, value });

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Larkspur Circuit Design Inc",
  employerEin: "12-3510001",
  employerAddress: { line1: "88 Foundry Park Way", city: "San Jose", state: "CA", zip: "95112" },
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

/*
 * Her 2024 Schedule P (540), as filed (made up): taxable income $220,000 after
 * a $9,065 itemized deductions limitation; exclusion add-backs for medical
 * ($9,500), property taxes ($54,000) and miscellaneous deductions ($78,000);
 * regular tax before credits $17,002. The deferral item was a $60,000
 * incentive stock option spread, which made 2024 AMT $6,873.
 */
const exclusions: CaPriorYearAmtExclusionsFactValue = {
  returnForm: "540",
  filingStatus: "single",
  taxableIncome: 220000,
  itemizedDeductionsLimitation: 9065,
  exclusionItems: { medicalAndDental: 9500, propertyTaxes: 54000, miscellaneousDeductions: 78000 },
  regularTax: 17002,
};

const PRIOR_RETURN = "Her filed 2024 Form 540 and Schedule P (540), read 2026-11-23";

export const setalleFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/14/1981"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Santa Clara"),
  idFact("occupation", "Hardware engineer"),
  idFact("phone", "408-555-0135"),
  fact("wages", makeW2FactKey("larkspur"), w2, "W-2 from Larkspur Circuit Design Inc."),
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
];
