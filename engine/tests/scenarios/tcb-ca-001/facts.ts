/*
 * Source: TaxCalcBench ty25-ca-001 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  CA_EITC_KEYS,
  EIC_KEYS,
  HEAD_OF_HOUSEHOLD_KEYS,
  makeDependentFactKey,
  makeGovernmentPaymentsFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type GovernmentPaymentsFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_001_USER_ID = "tcb-ca-001-integration";
export const TCB_CA_001_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-13T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_001_USER_ID,
  taxYear: TCB_CA_001_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the documents print her. */
const TAXPAYER = { firstName: "Virginia", lastName: "Test", ssn: "900-45-6789" };
const HOME = {
  street: "3201 LOMA VERDE DR",
  apt: "79",
  city: "SAN JOSE",
  state: "CA",
  zip: "95117",
  county: "Santa Clara",
};
const address = { line1: HOME.street, city: HOME.city, state: HOME.state, zip: HOME.zip };

// docs/01-dollar-tree-store-w2.pdf
const w2: W2FactValue = {
  employerName: "Dollar Tree Store Inc",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "500 Volvo Parkway", city: "Chesapeake", state: "VA", zip: "23320" },
  employee: { ...TAXPAYER, address },
  box1: 2248,
  box2: 11,
  box3: 2248,
  box4: 139,
  box5: 2248,
  box6: 33,
  box7: 0,
  box8: 0,
  box10: 0,
  box11: 0,
  box13: { statutoryEmployee: false, retirementPlan: false, thirdPartySickPay: false },
  box14: [{ label: "CADS", amount: 25 }],
  box15: "CA",
  box16: 2248,
  box17: 0,
};

// docs/02-unemployment-compensation-1099-g.pdf
const unemployment: GovernmentPaymentsFactValue = {
  payerName: "Unemployment Compensation",
  payerTin: PAYER_TIN,
  box1: 6878,
  box4: 0,
};

/*
 * irs1040.dependent_detail and ca_form3532: three sons, in the home all year.
 * The names and SSNs are the key's (Form 540 dependent rows,
 * FTB 3514); the answers give only Elijah's name (README.md).
 */
const son = (
  firstName: string,
  dob: string,
  more: Partial<DependentFactValue> = {},
): DependentFactValue => ({
  firstName,
  lastName: "Test",
  ssn: "900-45-6789",
  relationship: "Son",
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
  ...more,
});

const DEPENDENTS: Array<[string, DependentFactValue, string]> = [
  [
    "elijah-test",
    son("Elijah", "02/07/2011", { fullTimeStudent: true, grossIncome: 0, daysLivedWithYou: 365 }),
    "dependent_detail[0] and ca_form3532",
  ],
  ["jacob-test", son("Jacob", "12/24/2021", { permanentlyDisabled: true }), "dependent_detail[1]"],
  ["johnny-test", son("Johnny", "03/28/2025"), "dependent_detail[2]"],
];

const idFact = (suffix: string, value: string, sourceNote?: string) =>
  identityFact({
    userId: TCB_CA_001_USER_ID,
    taxYear: TCB_CA_001_TAX_YEAR,
    suffix,
    value,
    sourceNote,
  });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "02/27/1993", `${ANSWERS}: irs1040.tp_date_of_birth.`),
  idFact("address.street", HOME.street),
  idFact("address.apt", HOME.apt, "The key's header (AptNumber)."),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", HOME.county, `${ANSWERS}: ca_form540.county_in_ca.`),
];

const DOCUMENTS: TaxFactRow[] = [
  fact(
    "wages",
    makeW2FactKey("dollar-tree-store"),
    w2,
    "W-2 from Dollar Tree Store Inc (docs/01-dollar-tree-store-w2.pdf).",
  ),
  fact(
    "other",
    makeGovernmentPaymentsFactKey("tin-12-3456789", "unemployment-687800"),
    unemployment,
    "1099-G from Unemployment Compensation (docs/02-unemployment-compensation-1099-g.pdf).",
  ),
];

/* The earned income credit answers (1040 line 27a, FTB 3514 Steps 1 and 4). */
const CREDIT_ANSWERS: TaxFactRow[] = [
  fact("other", EIC_KEYS.nonresidentAlien, false, `${ANSWERS}: irs1040.nonresident_alien.`),
  fact("other", EIC_KEYS.mainHomeInUs, true, `${ANSWERS}: irs1040.main_home_not_us is false.`),
  fact("other", EIC_KEYS.claimableAsDependent, false, `${ANSWERS}: irs1040.tp_dependent.`),
  fact(
    "other",
    EIC_KEYS.qualifyingChildOfAnother,
    false,
    "Not in the case: the key's FTB 3514 credit means she is not a qualifying child of another person.",
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

const ANSWER_FACTS: TaxFactRow[] = [
  ...DEPENDENTS.map(([id, value, answers]) =>
    fact("dependents", makeDependentFactKey(id), value, `${ANSWERS}: irs1040.${answers}.`),
  ),
  fact(
    "filing_status",
    HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus,
    "not_married",
    `${ANSWERS}: ca_form3532.marital_status "Not legally married/RDP during the tax year".`,
  ),
  fact(
    "filing_status",
    HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
    "elijah-test",
    `${ANSWERS}: ca_form3532 names Elijah.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  ...CREDIT_ANSWERS,
];

export const tcbCa001Facts: TaxFactRow[] = [...IDENTITY, ...DOCUMENTS, ...ANSWER_FACTS];
