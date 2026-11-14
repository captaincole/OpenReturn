/*
 * Source: TaxCalcBench ty25-ca-003 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  CA_EITC_KEYS,
  DEPENDENT_CARE_KEYS,
  EIC_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentCareProviderFactKey,
  makeDependentCareQualifyingPersonFactKey,
  makeDependentFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentCareProviderFactValue,
  type DependentCareQualifyingPersonFactValue,
  type DependentFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_003_USER_ID = "tcb-ca-003-integration";
export const TCB_CA_003_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const SSN = "900-45-6789";
const EIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_003_USER_ID,
  taxYear: TCB_CA_003_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The couple as the W-2s print them. Every SSN in the case is 900-45-6789. */
const TAXPAYER = { firstName: "Basset", lastName: "Hound", ssn: SSN };
const SPOUSE = { firstName: "Apple", lastName: "Banana", ssn: SSN };
const HOME = { line1: "1122 Canine Lane", city: "Sacremento", state: "CA", zip: "94203" };

// docs/01-detective-service-w2.pdf (the taxpayer's).
const detectiveServiceW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Detective Service",
  employerEin: EIN,
  employerAddress: { line1: "1123 Scout Lane", city: "Atlanta", state: "GA", zip: "30326" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 19500,
  box2: 1700,
  box3: 19500,
  box4: 1209,
  box5: 19500,
  box6: 283,
  box10: 3000,
  box15: "CA",
  box16: 19500,
  box17: 1000,
};

// docs/02-the-middle-school-w2.pdf (the spouse's).
const middleSchoolW2: W2FactValue = {
  owner: "spouse",
  employerName: "The Middle School",
  employerEin: EIN,
  employerAddress: { line1: "123 Track Star Lane", city: "Atlanta", state: "GA", zip: "30326" },
  employee: { ...SPOUSE, address: HOME },
  box1: 22000,
  box2: 2000,
  box3: 22000,
  box4: 1364,
  box5: 22000,
  box6: 319,
  box10: 3000,
  box15: "CA",
  box16: 22000,
  box17: 2000,
};

/*
 * irs1040_schedulec[0]: the taxpayer's tax preparation business, a $31,000 loss.
 * The address is the home address, as the key's FTB 3514 line 18b prints it.
 */
const taxPrep: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Tax prep business",
  code: "541213", // business_code "Tax preparation services"
  name: "Tax prep business",
  address: { street: HOME.line1, city: HOME.city, state: HOME.state, zip: HOME.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false, // Not in the answers: no cost of goods sold or inventory is given.
  grossReceipts: 50000,
  expenses: {
    advertising: 1000,
    supplies: 1000,
    taxesAndLicenses: 1000,
    travel: 3000,
    wages: 75000,
  },
  allInvestmentAtRisk: true,
  specifiedService: true,
  w2WagesPaid: 75000,
  qualifiedPropertyUbia: 11200,
};

/* irs1040.dependent_detail[0–1]; names and relationships from the key's 540. */
const son = (firstName: string, dob: string): DependentFactValue => ({
  firstName,
  lastName: "HOUND",
  ssn: SSN,
  relationship: "Son",
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

const TERRIER = "terrier-hound";
const DACHSHUND = "dachshund-hound";

/* irs2441.care_provider_grp[0]. */
const sunnyDaycare: DependentCareProviderFactValue = {
  name: "SUNNY DAYCARE",
  address: { line1: "700 BRIGHT CIRCLE", city: "MARIETTA", state: "GA", zip: "30060" },
  tin: EIN,
  taxExempt: false,
  householdEmployee: false,
  amountPaid: 5000,
};

/* irs2441.qualifying_person_grp[0–1]: $2,500 of care for each son. */
const careFor = (dependentSlug: string): DependentCareQualifyingPersonFactValue => ({
  dependentSlug,
  expensesPaid: 2500,
});

const idFact = (suffix: string, value: string, sourceNote?: string) =>
  identityFact({
    userId: TCB_CA_003_USER_ID,
    taxYear: TCB_CA_003_TAX_YEAR,
    suffix,
    value,
    sourceNote,
  });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "01/01/1972", `${ANSWERS}: irs1040.tp_date_of_birth.`),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "San Francisco", `${ANSWERS}: ca_form540.county_in_ca.`),
  fact(
    "identity",
    SPOUSE_KEYS.firstName,
    SPOUSE.firstName,
    "W-2 from The Middle School (docs/02).",
  ),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, "W-2 from The Middle School (docs/02)."),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, "W-2 from The Middle School (docs/02)."),
  fact("identity", SPOUSE_KEYS.dob, "01/01/1974", `${ANSWERS}: irs1040.sp_date_of_birth.`),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("detective-service"),
    detectiveServiceW2,
    "W-2 from Detective Service (docs/01-detective-service-w2.pdf).",
  ),
  fact(
    "wages",
    makeW2FactKey("the-middle-school"),
    middleSchoolW2,
    "W-2 from The Middle School (docs/02-the-middle-school-w2.pdf).",
  ),
];

const DEPENDENTS: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey(TERRIER),
    son("TERRIER", "01/01/2018"),
    `${ANSWERS}: irs1040.dependent_detail[0].`,
  ),
  fact(
    "dependents",
    makeDependentFactKey(DACHSHUND),
    son("DACHSHUND", "01/01/2019"),
    `${ANSWERS}: irs1040.dependent_detail[1].`,
  ),
];

/* Form 2441: the daycare, the two sons, and the Part III answers. */
const DEPENDENT_CARE: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentCareProviderFactKey("sunny-daycare"),
    sunnyDaycare,
    `${ANSWERS}: irs2441.care_provider_grp[0].`,
  ),
  fact(
    "dependents",
    makeDependentCareQualifyingPersonFactKey(TERRIER),
    careFor(TERRIER),
    `${ANSWERS}: irs2441.qualifying_person_grp[0] (dependent_1).`,
  ),
  fact(
    "dependents",
    makeDependentCareQualifyingPersonFactKey(DACHSHUND),
    careFor(DACHSHUND),
    `${ANSWERS}: irs2441.qualifying_person_grp[1] (dependent_2).`,
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.priorYearExpensesPaid,
    0,
    "Not in the answers: no 2024 expenses paid in 2025.",
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.studentOrDisabledSpouse,
    false,
    `${ANSWERS}: irs1040.tp_student and sp_student are false; neither is disabled.`,
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.benefitsGracePeriodCarryover,
    0,
    `${ANSWERS}: irs2441.carryover.`,
  ),
  fact("dependents", DEPENDENT_CARE_KEYS.benefitsForfeited, 0, `${ANSWERS}: irs2441.forfeited.`),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.expensesIncurred,
    5000,
    `${ANSWERS}: irs2441 qualifying_expenses_paid, $2,500 for each son.`,
  ),
  fact(
    "dependents",
    DEPENDENT_CARE_KEYS.planExclusionLimit,
    5000,
    "Not in the answers: neither employer's plan sets a limit under $5,000.",
  ),
];

const ANSWER_FACTS: TaxFactRow[] = [
  fact(
    "self_employment",
    makeBusinessFactKey("tax-prep"),
    taxPrep,
    `${ANSWERS}: irs1040_schedulec[0].`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.subject_to_use_tax is false.`),
  /* The earned income credit answers (1040 line 27a, FTB 3514 Steps 1 and 3). */
  fact("other", EIC_KEYS.nonresidentAlien, false, `${ANSWERS}: irs1040.nonresident_alien.`),
  fact("other", EIC_KEYS.mainHomeInUs, true, `${ANSWERS}: irs1040.main_home_not_us is false.`),
  fact(
    "other",
    EIC_KEYS.claimableAsDependent,
    false,
    `${ANSWERS}: irs1040.tp_dependent, sp_dependent.`,
  ),
  fact(
    "other",
    EIC_KEYS.qualifyingChildOfAnother,
    false,
    "Not in the case: the key's credits mean neither spouse is a qualifying child of another person.",
  ),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, `${ANSWERS}: irs1040.credit_denied_reduced.`),
  fact("other", EIC_KEYS.barredByIrs, false, `${ANSWERS}: irs1040.eic_not_allowed.`),
  fact(
    "other",
    CA_EITC_KEYS.ftbDisallowedEarlierYear,
    false,
    `${ANSWERS}: ca_form3514.prior_disallow_ca_eic_input.`,
  ),
];

export const tcbCa003Facts: TaxFactRow[] = [
  ...IDENTITY,
  ...DOCUMENTS,
  ...DEPENDENTS,
  ...DEPENDENT_CARE,
  ...ANSWER_FACTS,
];
