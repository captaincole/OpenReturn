/*
 * Synthetic: the Albrecht family is made up (README.md). Every name, number
 * and address is invented. Juniper's 1099-INT and 1099-DIV are in docs/ (made
 * by generate-docs.ts from the values below); each sourceNote names the
 * made-up document or answer.
 */

import {
  SPOUSE_KEYS,
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  makeW2FactKey,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TOMAS_USER_ID = "tomas-synthetic";
export const TOMAS_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TOMAS_USER_ID,
  taxYear: TOMAS_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HOME = { line1: "52 Redwood Terrace", city: "Oakland", state: "CA", zip: "94611" };
const TAXPAYER = { firstName: "Tomas", lastName: "Albrecht", ssn: "400-00-0711" };
const SPOUSE = { firstName: "Hana", lastName: "Albrecht", ssn: "400-00-0712" };

const hanaW2: W2FactValue = {
  owner: "spouse",
  employerName: "Bayside Pediatric Clinic",
  employerEin: "12-3456792",
  employerAddress: { line1: "310 Grand Ave", city: "Oakland", state: "CA", zip: "94610" },
  employee: { ...SPOUSE, address: HOME },
  box1: 96500,
  box2: 8900,
  box3: 96500,
  box4: 5983,
  box5: 96500,
  box6: 1399.25,
  box14: [{ label: "CA SDI", amount: 1158 }],
  box15: "CA",
  box16: 96500,
  box17: 3600,
};

export const JUNIPER = "juniper-albrecht";

const juniper: DependentFactValue = {
  firstName: "Juniper",
  lastName: "Albrecht",
  ssn: "400-00-0713",
  relationship: "Son",
  dob: "02/03/2010",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

/*
 * Juniper: $1,600 of his $3,400 interest is Treasury bill interest, which
 * California does not tax. FTB 3803 line 6 ($1,000) is under Form 8814 line 6
 * ($2,600). No capital gain distributions.
 */
export const juniperIncome: ChildInvestmentIncomeFactValue = {
  taxableInterest: 3400,
  usObligationInterest: 1600,
  ordinaryDividends: 1900,
  qualifiedDividends: 1500,
  estimatedTaxPaid: false,
  californiaEstimatedTaxPaid: false,
  hadOtherIncome: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TOMAS_USER_ID, taxYear: TOMAS_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "12/02/1979"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Alameda"),
  idFact("occupation", "Homemaker"),
  idFact("phone", "510-555-0144"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, MADE_UP),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, MADE_UP),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, MADE_UP),
  fact("identity", SPOUSE_KEYS.dob, "07/25/1981", MADE_UP),
];

export const tomasFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact(
    "wages",
    makeW2FactKey("bayside-pediatric"),
    hanaW2,
    `W-2 from Bayside Pediatric Clinic, ${MADE_UP}.`,
  ),
  fact("dependents", makeDependentFactKey(JUNIPER), juniper, MADE_UP),
  fact(
    "dependents",
    makeChildInvestmentIncomeFactKey(JUNIPER),
    juniperIncome,
    `Juniper's 1099-INT and 1099-DIV (docs/01-1099-int-juniper.pdf, docs/02-1099-div-juniper.pdf), and the parents' answers, ${MADE_UP}.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
