/*
 * Made-up taxpayer (README.md): a single full-year California resident in
 * Sacramento who worked part of 2025 in Massachusetts and paid tax there as a
 * nonresident. Every name, number and address is invented. The Massachusetts
 * return is not in the engine: its income and tax are his answers.
 */

import {
  CA_MISC_DEDUCTION_KEYS,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELYAS_USER_ID = "elyas-synthetic";
export const ELYAS_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "2207 Tule Reed Ct", city: "Sacramento", state: "CA", zip: "95822" };
const TAXPAYER = { firstName: "Elyas", lastName: "Machera", ssn: "400-00-0531" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELYAS_USER_ID,
  taxYear: ELYAS_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELYAS_USER_ID, taxYear: ELYAS_TAX_YEAR, suffix, value });

/* One W-2 from a Sacramento employer; his weeks on a Boston project are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Levee Engineering",
  employerEin: "12-3456531",
  employerAddress: { line1: "800 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 95000,
  box2: 9800,
  box3: 95000,
  box4: 5890,
  box5: 95000,
  box6: 1378,
  box14: [{ label: "CA SDI", amount: 1140 }],
  box15: "CA",
  box16: 95000,
  box17: 3900,
};

/* Massachusetts nonresident return (Form 1-NR/PY): wages for weeks worked in Boston. */
const massachusetts: OtherStateTaxFactValue = {
  state: "MA",
  items: [
    {
      description: "Wages, Boston project",
      californiaAmount: 30000,
      otherStateAmount: 30000,
    },
  ],
  taxPaid: 1500,
  otherStateAdjustedGrossIncome: 30000,
};

export const elyasFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "11/03/1990"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "916-555-0173"),
  fact("wages", makeW2FactKey("delta-levee"), w2, "W-2 from Delta Levee Engineering."),
  fact("other", CA_MISC_DEDUCTION_KEYS.investmentFees, 0, "Verbal: no investment fees."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("other", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ma"),
    massachusetts,
    "Verbal, from his 2025 Massachusetts Form 1-NR/PY.",
  ),
];
