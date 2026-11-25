/*
 * Made-up taxpayers (README.md): a married couple filing jointly in
 * Sacramento, California, with three children and an adult daughter they
 * could claim but do not. Some of the household went without health coverage
 * in 2025, so FTB 3853 figures a penalty for Form 540 line 92. Every name,
 * number and address is invented. No fact has a document: the coverage
 * months, exemptions and ECNs are answers.
 */

import {
  CA_HEALTH_COVERAGE_KEYS,
  SPOUSE_KEYS,
  makeCaHealthCoverageDependentKey,
  makeCaHealthCoverageUnclaimedKey,
  makeDependentFactKey,
  makeW2FactKey,
  type CaHealthCoverageFactValue,
  type DependentFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LELAINE_USER_ID = "lelaine-synthetic";
export const LELAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";
const HOME = { line1: "4410 Larkspur Ct", city: "Sacramento", state: "CA", zip: "95822" };
const TAXPAYER = { firstName: "Lelaine", lastName: "Tarvesh", ssn: "400-00-0531" };
const SPOUSE = { firstName: "Corin", lastName: "Tarvesh", ssn: "400-00-0532" };
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LELAINE_USER_ID,
  taxYear: LELAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LELAINE_USER_ID, taxYear: LELAINE_TAX_YEAR, suffix, value });

const coverage = (key: string, value: CaHealthCoverageFactValue, sourceNote: string) =>
  fact("health_coverage", key, value, sourceNote);

/* Lelaine's W-2: a full year at a nursery. */
const nurseryW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Bloom Nursery",
  employerEin: "12-3456791",
  employerAddress: { line1: "88 Riverbend Rd", city: "Sacramento", state: "CA", zip: "95831" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 86400,
  box2: 7400,
  box3: 86400,
  box4: 5357,
  box5: 86400,
  box6: 1253,
  box14: [{ label: "CA SDI", amount: 1037 }],
  box15: "CA",
  box16: 86400,
  box17: 1000,
};

/* Corin's W-2: a warehouse job that ended in September. */
const warehouseW2: W2FactValue = {
  owner: "spouse",
  employerName: "Capitol Freight Warehousing",
  employerEin: "12-3456792",
  employerAddress: { line1: "1200 Depot Way", city: "West Sacramento", state: "CA", zip: "95691" },
  employee: { ...SPOUSE, address: HOME },
  box1: 24000,
  box2: 1500,
  box3: 24000,
  box4: 1488,
  box5: 24000,
  box6: 348,
  box14: [{ label: "CA SDI", amount: 288 }],
  box15: "CA",
  box16: 24000,
  box17: 200,
};

const child = (
  firstName: string,
  ssn: string,
  relationship: string,
  dob: string,
  monthsLivedWithYou: number,
): DependentFactValue => ({
  firstName,
  lastName: TAXPAYER.lastName,
  ssn,
  relationship,
  dob,
  monthsLivedWithYou,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

const MIRA = "mira-tarvesh";
const DAVAN = "davan-tarvesh";
const PELL = "pell-tarvesh";

/* Mira: no coverage; Marketplace hardship and projected-income exemptions, and a health care sharing ministry. */
const miraCoverage: CaHealthCoverageFactValue = {
  coveredMonths: [],
  exemptions: [
    { code: "K", months: [1, 2, 3, 4] },
    { code: "M", months: [5, 6, 7, 8] },
    { code: "K", months: [9, 10, 11, 12] },
    { code: "F", months: [3, 4, 5, 6] },
  ],
  ecns: ["KH84207", "MP31956", "KH90552"],
  requiredToFile: false,
};

export const lelaineFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.middle_initial", "R"),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/30/1984"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Nursery supervisor"),
  idFact("phone", "916-555-0181"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.occupation, "Forklift operator", "Verbal: spouse's occupation."),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, "Verbal: spouse's SSN."),
  fact("identity", SPOUSE_KEYS.dob, "01/19/1982", "Verbal: spouse's date of birth."),
  fact("wages", makeW2FactKey("delta-bloom"), nurseryW2, "W-2 from Delta Bloom Nursery."),
  fact("wages", makeW2FactKey("capitol-freight"), warehouseW2, "W-2 from Capitol Freight."),
  fact(
    "dependents",
    makeDependentFactKey(MIRA),
    child("Mira", "400-00-0533", "Daughter", "04/22/2010", 12),
    "Verbal: daughter, at home all year.",
  ),
  fact(
    "dependents",
    makeDependentFactKey(DAVAN),
    child("Davan", "400-00-0534", "Son", "06/15/2007", 12),
    "Verbal: son, turned 18 in June, at home all year.",
  ),
  fact(
    "dependents",
    makeDependentFactKey(PELL),
    child("Pell", "400-00-0535", "Son", "03/10/2025", 10),
    "Verbal: son, born March 10, 2025.",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    false,
    "Verbal: not everyone was covered.",
  ),
  fact(
    "health_coverage",
    CA_HEALTH_COVERAGE_KEYS.claimableAsDependent,
    false,
    "Verbal: no one can claim Lelaine as a dependent.",
  ),
  fact(
    "health_coverage",
    CA_HEALTH_COVERAGE_KEYS.salaryReductionPremiums,
    2400,
    "Verbal: Lelaine's pre-tax premiums for her own plan.",
  ),
  coverage(
    CA_HEALTH_COVERAGE_KEYS.taxpayer,
    { coveredMonths: ALL_YEAR },
    "Verbal: Lelaine's employer plan all year.",
  ),
  coverage(
    CA_HEALTH_COVERAGE_KEYS.spouse,
    { coveredMonths: [1, 2, 3, 4, 7, 8, 9] },
    "Verbal: Corin's plan lapsed in May and June and ended with his job in September.",
  ),
  coverage(
    makeCaHealthCoverageDependentKey(MIRA),
    miraCoverage,
    "Covered California notices (ECNs).",
  ),
  coverage(
    makeCaHealthCoverageDependentKey(DAVAN),
    { coveredMonths: [], requiredToFile: false },
    "Verbal: Davan had no coverage and no exemption.",
  ),
  coverage(
    makeCaHealthCoverageDependentKey(PELL),
    { coveredMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12], requiredToFile: false },
    "Verbal: Pell was added to Lelaine's plan in April.",
  ),
  coverage(
    makeCaHealthCoverageUnclaimedKey("sela-tarvesh"),
    {
      person: {
        firstName: "Sela",
        middleInitial: "J",
        lastName: TAXPAYER.lastName,
        ssn: "400-00-0536",
        dob: "09/03/2005",
      },
      coveredMonths: [1, 2, 3, 4, 5, 6],
      affordabilityTests: [{ kind: "employer", months: [7, 8, 9, 10, 11, 12], contribution: 5400 }],
      requiredToFile: true,
      magi: 24000,
    },
    "Verbal: Sela files her own return; student plan to June, then a costly offer from her employer.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];
