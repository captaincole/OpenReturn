/*
 * A made-up couple (README.md): every name and amount is invented. No input
 * documents: the facts are the W-2 and 1099-NEC boxes as they would read, and
 * the answers each spouse states about the firm that paid them.
 */

import {
  SPOUSE_KEYS,
  makeNonemployeeCompensationFactKey,
  makeUncollectedWagesFactKey,
  makeW2FactKey,
  type NonemployeeCompensationFactValue,
  type UncollectedWagesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GAWYN_USER_ID = "gawyn-integration";
export const GAWYN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GAWYN_USER_ID,
  taxYear: GAWYN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const GAWYN = { firstName: "Gawyn", lastName: "Ashcombe", ssn: "400-00-8921" };
export const MIREILLE = { firstName: "Mireille", lastName: "Ashcombe", ssn: "400-00-8922" };
const HOME = { line1: "5130 Riverbank Lane", city: "Sacramento", state: "CA", zip: "95831" };

const HOME_CARE = { name: "Sierra Foothill Home Care Inc", ein: "00-0089194" };

/* Gawyn's W-2 from Capitol Glass Works (made up). */
const glassW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Capitol Glass Works Inc",
  employerEin: "00-0089193",
  employerAddress: {
    line1: "800 Richards Boulevard",
    city: "Sacramento",
    state: "CA",
    zip: "95811",
  },
  employee: { ...GAWYN, address: HOME },
  box1: 62000,
  box2: 5000,
  box3: 62000,
  box4: 3844,
  box5: 62000,
  box6: 899,
  box15: "CA",
  box16: 62000,
  box17: 2100,
};

/* 1099-NEC to Mireille from Sierra Foothill Home Care: a year of home-care visits. */
const homeCareNec: NonemployeeCompensationFactValue = {
  payerName: HOME_CARE.name,
  payerTin: HOME_CARE.ein,
  box1: 24500,
};

const HOME_CARE_NEC_KEY = makeNonemployeeCompensationFactKey("sierra-foothill-home-care", "2025");

/* Gawyn: weekend site work for a builder that paid cash; he filed Form SS-8 (code G). */
const builders: UncollectedWagesFactValue = {
  owner: "taxpayer",
  firmName: "Delta Ridge Builders LLC",
  firmTin: "00-0089195",
  reasonCode: "G",
  received1099: false,
  wages: 18000,
};

/* Mireille: an SS-8 determination letter says she was the agency's employee (code A). */
const homeCare: UncollectedWagesFactValue = {
  owner: "spouse",
  firmName: HOME_CARE.name,
  firmTin: HOME_CARE.ein,
  reasonCode: "A",
  determinationDate: "05/20/2025",
  received1099: true,
  wages: 24500,
  form1099Keys: [HOME_CARE_NEC_KEY],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GAWYN_USER_ID, taxYear: GAWYN_TAX_YEAR, suffix, value });

export const gawynFacts: TaxFactRow[] = [
  idFact("name.first", GAWYN.firstName),
  idFact("name.last", GAWYN.lastName),
  idFact("ssn", GAWYN.ssn),
  idFact("dob", "04/12/1985"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Glazier"),
  idFact("phone", "916-555-0142"),
  fact("identity", SPOUSE_KEYS.firstName, MIREILLE.firstName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.lastName, MIREILLE.lastName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.occupation, "Home care aide", "Verbal: spouse's occupation."),
  fact("identity", SPOUSE_KEYS.ssn, MIREILLE.ssn, "Verbal: spouse's SSN."),
  fact("identity", SPOUSE_KEYS.dob, "12/02/1987", "Verbal: spouse's date of birth."),
  fact("wages", makeW2FactKey("capitol-glass"), glassW2, "W-2 from Capitol Glass Works."),
  fact(
    "self_employment",
    HOME_CARE_NEC_KEY,
    homeCareNec,
    "1099-NEC from Sierra Foothill Home Care.",
  ),
  fact(
    "wages",
    makeUncollectedWagesFactKey("delta-ridge-builders"),
    builders,
    "Stated by Gawyn: $18,000 of cash pay; Form SS-8 filed in February 2026, no reply.",
  ),
  fact(
    "wages",
    makeUncollectedWagesFactKey("sierra-foothill-home-care"),
    homeCare,
    "Stated by Mireille: Form SS-8 determination letter dated May 20, 2025.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
