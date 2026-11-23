/*
 * Made-up taxpayers (README.md): a married couple filing jointly in Fresno,
 * California, with a son and a stepdaughter in daycare and with a babysitter,
 * and a dependent care FSA on one W-2. Every name, number and address is
 * invented. The care providers' year-end statements are in docs/ (made by
 * generate-docs.ts from the provider facts); the other facts have no document.
 */

import {
  CA_DEPENDENT_CARE_KEYS,
  DEPENDENT_CARE_KEYS,
  SPOUSE_KEYS,
  makeDependentCareProviderFactKey,
  makeDependentCareQualifyingPersonFactKey,
  makeDependentFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type CaHouseholdFundsEntry,
  type DependentCareProviderFactValue,
  type DependentCareQualifyingPersonFactValue,
  type DependentFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const OTTILIE_USER_ID = "ottilie-synthetic";
export const OTTILIE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";
const HOME = { line1: "2716 Almond Row", city: "Fresno", state: "CA", zip: "93704" };
const TAXPAYER = { firstName: "Ottilie", lastName: "Quintana", ssn: "400-00-0311" };
const SPOUSE = { firstName: "Rafael", lastName: "Quintana", ssn: "400-00-0312" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: OTTILIE_USER_ID,
  taxYear: OTTILIE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: OTTILIE_USER_ID, taxYear: OTTILIE_TAX_YEAR, suffix, value });

/* Ottilie's W-2: $2,000 of dependent care FSA benefits in box 10. */
const orchardW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Valley Orchard Cooperative",
  employerEin: "12-3456781",
  employerAddress: { line1: "900 Packing House Rd", city: "Fresno", state: "CA", zip: "93706" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 58000,
  box2: 4100,
  box3: 60000,
  box4: 3720,
  box5: 60000,
  box6: 870,
  box10: 2000,
  box14: [{ label: "CA SDI", amount: 720 }],
  box15: "CA",
  box16: 58000,
  box17: 1500,
};

const libraryW2: W2FactValue = {
  owner: "spouse",
  employerName: "Fresno Valley Library District",
  employerEin: "12-3456782",
  employerAddress: { line1: "44 Civic Center Sq", city: "Fresno", state: "CA", zip: "93721" },
  employee: { ...SPOUSE, address: HOME },
  box1: 36650,
  box2: 1900,
  box3: 36650,
  box4: 2272,
  box5: 36650,
  box6: 531,
  box14: [{ label: "CA SDI", amount: 440 }],
  box15: "CA",
  box16: 36650,
  box17: 700,
};

const savings: InterestFactValue = { payerName: "Sierra Credit Union", box1: 350 };

const child = (
  firstName: string,
  lastName: string,
  ssn: string,
  relationship: string,
  dob: string,
  monthsLivedWithYou: number,
): DependentFactValue => ({
  firstName,
  lastName,
  ssn,
  relationship,
  dob,
  monthsLivedWithYou,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

const MATEO = "mateo-quintana";
const INES = "ines-varela";

/* A preschool (an organization) and a babysitter who cares for Ines in her own home. */
const preschool: DependentCareProviderFactValue = {
  name: "Sunflower Hill Preschool",
  address: { line1: "1580 Blossom Way", city: "Fresno", state: "CA", zip: "93705" },
  tin: "12-3456783",
  taxExempt: false,
  householdEmployee: false,
  amountPaid: 6500,
  phone: "559-555-0147",
  providerType: "organization",
};

const babysitter: DependentCareProviderFactValue = {
  name: "Lupe Arroyo",
  address: { line1: "318 Fig Garden Ln", city: "Fresno", state: "CA", zip: "93704" },
  tin: "400-00-0377",
  taxExempt: false,
  householdEmployee: false,
  amountPaid: 3000,
  phone: "559-555-0162",
  providerType: "person",
};

/* Each child's expenses paid in 2025, net of the $2,200 the FSA reimbursed. */
const mateoCare: DependentCareQualifyingPersonFactValue = {
  dependentSlug: MATEO,
  expensesPaid: 4300,
};
const inesCare: DependentCareQualifyingPersonFactValue = {
  dependentSlug: INES,
  expensesPaid: 3000,
  physicalCustodyPercent: 58,
};

const householdFunds: CaHouseholdFundsEntry[] = [{ source: "Child support", amount: 4800 }];

export const ottilieFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "06/21/1989"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Orchard manager"),
  idFact("phone", "559-555-0110"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, "Verbal: spouse's SSN."),
  fact("identity", SPOUSE_KEYS.dob, "02/11/1987", "Verbal: spouse's date of birth."),
  fact("wages", makeW2FactKey("valley-orchard"), orchardW2, "W-2 from Valley Orchard Cooperative."),
  fact(
    "wages",
    makeW2FactKey("fresno-library"),
    libraryW2,
    "W-2 from Fresno Valley Library District.",
  ),
  fact("investment_income", makeInterestFactKey("sierra-cu"), savings, "1099-INT, Sierra CU."),
  fact(
    "dependents",
    makeDependentFactKey(MATEO),
    child("Mateo", "Quintana", "400-00-0313", "Son", "03/14/2021", 12),
    "Verbal: son, lived at home all year.",
  ),
  fact(
    "dependents",
    makeDependentFactKey(INES),
    child("Ines", "Varela", "400-00-0314", "Stepdaughter", "09/02/2018", 7),
    "Verbal: Rafael's daughter; with the couple 7 months, shared custody.",
  ),
  fact(
    "dependents",
    makeDependentCareProviderFactKey("sunflower-hill"),
    preschool,
    "Year-end statement (docs/01-sunflower-hill-care-statement.pdf).",
  ),
  fact(
    "dependents",
    makeDependentCareProviderFactKey("lupe-arroyo"),
    babysitter,
    "Year-end statement (docs/02-lupe-arroyo-care-statement.pdf).",
  ),
  fact(
    "dependents",
    makeDependentCareQualifyingPersonFactKey(MATEO),
    mateoCare,
    "Verbal: preschool, net of the FSA.",
  ),
  fact(
    "dependents",
    makeDependentCareQualifyingPersonFactKey(INES),
    inesCare,
    "Verbal: babysitter and after-school care; 58% physical custody.",
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.priorYearExpensesPaid,
    0,
    "Verbal: no 2024 bills paid late.",
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.studentOrDisabledSpouse,
    false,
    "Verbal: neither spouse was a student or disabled.",
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.benefitsGracePeriodCarryover,
    300,
    "FSA statement: $300 of 2024 money used in the grace period.",
  ),
  fact("dependents", DEPENDENT_CARE_KEYS.benefitsForfeited, 100, "FSA statement: $100 forfeited."),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.expensesIncurred,
    9500,
    "Verbal: $6,500 preschool and $3,000 babysitter for 2025.",
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.planExclusionLimit,
    5000,
    "FSA plan summary: $5,000 limit.",
  ),
  fact(
    "dependents",
    CA_DEPENDENT_CARE_KEYS.householdFunds,
    householdFunds,
    "Verbal: child support for Ines from her other parent.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
