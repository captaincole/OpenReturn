/*
 * A made-up taxpayer (README.md): a single filer who moved from Seattle to
 * San Diego in July 2024, exercised incentive stock options after the move and
 * kept the shares, and filed Form 540NR for 2024 with California AMT. In 2025
 * she is a full-year resident. Every name, number and address is invented. No
 * input documents: the W-2 boxes as the form would print them, and last
 * year's Schedule P (540NR) figures as she reads them off her filed return.
 */

import {
  CA_PRIOR_YEAR_AMT_KEYS,
  makeW2FactKey,
  type CaPriorYearAmtExclusionsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const HURIN_USER_ID = "hurin-synthetic";
export const HURIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "4410 Torrey Bluff Court", city: "San Diego", state: "CA", zip: "92130" };
const TAXPAYER = { firstName: "Hurin", lastName: "Vestergaard", ssn: "400-00-3511" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: HURIN_USER_ID,
  taxYear: HURIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: HURIN_USER_ID, taxYear: HURIN_TAX_YEAR, suffix, value });

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Coronado Genomics Labs",
  employerEin: "12-3510002",
  employerAddress: {
    line1: "1200 Sorrento Valley Rd",
    city: "San Diego",
    state: "CA",
    zip: "92121",
  },
  employee: { ...TAXPAYER, address: HOME },
  box1: 210000,
  box2: 38000,
  box3: 176100,
  box4: 10918.2,
  box5: 210000,
  box6: 3135,
  box14: [{ label: "CA SDI", amount: 2520 }],
  box15: "CA",
  box16: 210000,
  box17: 15600,
};

/*
 * Her 2024 Schedule P (540NR), as filed (made up). Part I: taxable income
 * $359,309 after a $9,309 itemized deductions limitation; $20,000 of property
 * taxes added back (an exclusion); a $300,000 incentive stock option spread
 * (a deferral item). Part II: line 28 $210,000, line 29a $1,500, line 35
 * $30,000, line 44 regular tax $15,728, line 45 AMT $18,200.
 */
const exclusions: CaPriorYearAmtExclusionsFactValue = {
  returnForm: "540nr",
  filingStatus: "single",
  taxableIncome: 359309,
  itemizedDeductionsLimitation: 9309,
  exclusionItems: { propertyTaxes: 20000 },
  nonresident: {
    itemized: true,
    totalAmtItemizedDeductions: 30000,
    line28: 210000,
    investmentInterest: 1500,
    regularTax: 15728,
  },
};

const PRIOR_RETURN = "Her filed 2024 Form 540NR and Schedule P (540NR), read 2026-11-23";

export const hurinFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/02/1988"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Research scientist"),
  idFact("phone", "858-555-0162"),
  fact("wages", makeW2FactKey("coronado"), w2, "W-2 from Coronado Genomics Labs."),
  fact("other", CA_PRIOR_YEAR_AMT_KEYS.amt, 18200, `${PRIOR_RETURN}: Part II line 45.`),
  fact(
    "other",
    CA_PRIOR_YEAR_AMT_KEYS.creditCarryover,
    0,
    `${PRIOR_RETURN}: no Part III line 10 carryover (first AMT year).`,
  ),
  fact(
    "other",
    CA_PRIOR_YEAR_AMT_KEYS.exclusions,
    exclusions,
    `${PRIOR_RETURN}: Part I lines 3, 15 and 18; Part II lines 28, 29a, 35 and 44.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
