/*
 * Synthetic: the Castellanos family is made up (README.md). Every name,
 * number and address is invented. The girls' 1099-INTs and 1099-DIV are in
 * docs/ (made by generate-docs.ts from the values below); each sourceNote names
 * the made-up document or answer.
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

export const VERIN_USER_ID = "verin-synthetic";
export const VERIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: VERIN_USER_ID,
  taxYear: VERIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HOME = { line1: "1407 Larkspur Ct", city: "Sacramento", state: "CA", zip: "95822" };
const TAXPAYER = { firstName: "Verin", lastName: "Castellanos", ssn: "400-00-0611" };
const SPOUSE = { firstName: "Dorian", lastName: "Castellanos", ssn: "400-00-0612" };

const verinW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Levee Engineering",
  employerEin: "12-3456791",
  employerAddress: { line1: "88 Riverfront Pl", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 168400,
  box2: 21300,
  box3: 168400,
  box4: 10440.8,
  box5: 168400,
  box6: 2441.8,
  box14: [{ label: "CA SDI", amount: 2020.8 }],
  box15: "CA",
  box16: 168400,
  box17: 9850,
};

const child = (firstName: string, ssn: string, dob: string): DependentFactValue => ({
  firstName,
  lastName: "Castellanos",
  ssn,
  relationship: "Daughter",
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

export const LUCIA = "lucia-castellanos";
export const NOOR = "noor-castellanos";

/*
 * Lucia: $600 of her $900 tax-exempt interest is Oregon bond interest, which
 * California taxes. FTB 3803 line 6 ($3,050) is over Form 8814 line 6 ($2,450).
 */
export const luciaIncome: ChildInvestmentIncomeFactValue = {
  taxableInterest: 1240,
  taxExemptInterest: 900,
  taxExemptInterestTaxedByCalifornia: 600,
  ordinaryDividends: 3150,
  qualifiedDividends: 2400,
  capitalGainDistributions: 760,
  estimatedTaxPaid: false,
  californiaEstimatedTaxPaid: false,
  hadOtherIncome: false,
};

/* Noor: interest only, $250 of it Treasury bill interest California does not tax; line 4 under $2,700. */
export const noorIncome: ChildInvestmentIncomeFactValue = {
  taxableInterest: 2000,
  usObligationInterest: 250,
  estimatedTaxPaid: false,
  californiaEstimatedTaxPaid: false,
  hadOtherIncome: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: VERIN_USER_ID, taxYear: VERIN_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/30/1983"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "916-555-0181"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, MADE_UP),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, MADE_UP),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, MADE_UP),
  fact("identity", SPOUSE_KEYS.dob, "04/17/1985", MADE_UP),
];

const CHILDREN: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey(LUCIA),
    child("Lucia", "400-00-0613", "05/09/2012"),
    MADE_UP,
  ),
  fact(
    "dependents",
    makeDependentFactKey(NOOR),
    child("Noor", "400-00-0614", "11/20/2016"),
    MADE_UP,
  ),
  fact(
    "dependents",
    makeChildInvestmentIncomeFactKey(LUCIA),
    luciaIncome,
    `Lucia's 1099-INT and 1099-DIV (docs/01-1099-int-lucia.pdf, docs/02-1099-div-lucia.pdf), and the parents' answers, ${MADE_UP}.`,
  ),
  fact(
    "dependents",
    makeChildInvestmentIncomeFactKey(NOOR),
    noorIncome,
    `Noor's 1099-INT (docs/03-1099-int-noor.pdf), and the parents' answers, ${MADE_UP}.`,
  ),
];

export const verinFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact(
    "wages",
    makeW2FactKey("delta-levee"),
    verinW2,
    `W-2 from Delta Levee Engineering, ${MADE_UP}.`,
  ),
  ...CHILDREN,
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
