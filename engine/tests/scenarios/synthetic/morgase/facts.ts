/*
 * Made-up taxpayer (README.md): a single full-year California resident in San
 * Jose who worked part of 2025 in New York and in Illinois and paid tax there
 * as a nonresident. Every name, number and address is invented. The other
 * states' returns are not in the engine: their income and tax are her answers.
 */

import {
  CA_MISC_DEDUCTION_KEYS,
  MORTGAGE_KEYS,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MORGASE_USER_ID = "morgase-synthetic";
export const MORGASE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "1184 Alder Crest Way", city: "San Jose", state: "CA", zip: "95125" };
const TAXPAYER = { firstName: "Morgase", lastName: "Trakand", ssn: "400-00-0521" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MORGASE_USER_ID,
  taxYear: MORGASE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MORGASE_USER_ID, taxYear: MORGASE_TAX_YEAR, suffix, value });

/* One W-2 from a San Jose employer; her days in New York and Illinois are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Willowmere Systems Inc",
  employerEin: "12-3456521",
  employerAddress: { line1: "300 Orchard Pkwy", city: "San Jose", state: "CA", zip: "95134" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 310000,
  box2: 61500,
  box3: 176100,
  box4: 10918,
  box5: 310000,
  box6: 5485,
  box14: [{ label: "CA SDI", amount: 3720 }],
  box15: "CA",
  box16: 310000,
  box17: 24800,
};

/*
 * New York nonresident return (Form IT-203): three items of New York-source
 * wages. New York allocates the stock and the bonus by its own workday rule, so
 * its amounts are higher than California's. Line 9 is every item New York taxed.
 */
const newYork: OtherStateTaxFactValue = {
  state: "NY",
  items: [
    {
      description: "Wages, New York workdays",
      californiaAmount: 46000,
      otherStateAmount: 46000,
    },
    {
      description: "RSU income, NY workdays",
      californiaAmount: 12400,
      otherStateAmount: 15250,
    },
    {
      description: "Bonus, NY workdays",
      californiaAmount: 5600,
      otherStateAmount: 6100,
    },
  ],
  taxPaid: 4180,
  otherStateAdjustedGrossIncome: 70850,
};

/* Illinois nonresident return (Form IL-1040, Schedule NR): wages for days worked in Chicago. */
const illinois: OtherStateTaxFactValue = {
  state: "IL",
  items: [
    {
      description: "Wages, Illinois workdays",
      californiaAmount: 9000,
      otherStateAmount: 9000,
    },
  ],
  taxPaid: 446,
  otherStateAdjustedGrossIncome: 9000,
};

export const morgaseFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/14/1984"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Santa Clara"),
  idFact("occupation", "Solutions architect"),
  idFact("phone", "408-555-0152"),
  fact("wages", makeW2FactKey("willowmere"), w2, "W-2 from Willowmere Systems Inc."),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    18400,
    "Form 1098 from Coyote Creek Bank, box 1; no points in box 6.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    620000,
    "Form 1098 from Coyote Creek Bank, box 2.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "05/22/2019",
    "Form 1098 from Coyote Creek Bank, box 3.",
  ),
  fact("state_local_tax", "state_local_tax.real_estate", 9800, "Santa Clara County tax bill."),
  fact("state_local_tax", "state_local_tax.personal_property", 0, "Verbal: none."),
  fact("medical", "medical.expenses_total", 0, "Verbal: none worth listing."),
  fact("charitable", "charitable.cash", 6000, "Food bank giving statement."),
  fact("charitable", "charitable.noncash", 0, "Verbal: none."),
  fact("charitable", "charitable.carryover", 0, "Verbal: none."),
  fact("other", CA_MISC_DEDUCTION_KEYS.investmentFees, 0, "Verbal: no investment fees."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("other", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ny"),
    newYork,
    "Verbal, from her 2025 New York Form IT-203: items, tax after credits, New York-source AGI.",
  ),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("il"),
    illinois,
    "Verbal, from her 2025 Illinois Form IL-1040 and Schedule NR.",
  ),
];
