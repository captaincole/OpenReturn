/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * cleaning company, its disabled access expenditure and its 2024 figures are
 * what Flann states from the company's books, payroll and the contractor's
 * invoice; no official form holds them.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  DISABLED_ACCESS_KEYS,
  makeBusinessFactKey,
  makeDisabledAccessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type DisabledAccessFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const FLANN_USER_ID = "flann-synthetic";
export const FLANN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: FLANN_USER_ID,
  taxYear: FLANN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const FLANN = {
  firstName: "Flann",
  lastName: "Dorsaile",
  ssn: "400-00-8827",
  street: "3315 North Fruit Avenue",
  city: "Fresno",
  state: "CA",
  zip: "93705",
};

export const CLEANING_ID = "dorsaile-cleaning";
export const CLEANING_KEY = makeBusinessFactKey(CLEANING_ID);

/* His commercial cleaning company (Schedule C), with an office in a 1978 building. */
export const cleaning: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Janitorial services",
  code: "561720",
  name: "Dorsaile Cleaning Services",
  address: { street: "1240 East Shaw Avenue", city: "Fresno", state: "CA", zip: "93710" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 1240000,
  expenses: {
    advertising: 4300,
    insurance: 38000,
    legalAndProfessional: 8500,
    rentVehiclesMachinery: 42000,
    rentOtherProperty: 36000,
    // Line 21 before the credit: holds the $3,101.40 accessible restroom remodel.
    repairs: 9800,
    supplies: 96000,
    taxesAndLicenses: 61000,
    utilities: 12400,
    wages: 760000,
  },
  specifiedService: false,
  w2WagesPaid: 760000,
  qualifiedPropertyUbia: 0,
};

/* Removing barriers: a wider stall, grab bars and a lower sink in the office restroom (Form 8826 line 1). */
export const RESTROOM_KEY = makeDisabledAccessFactKey("restroom-remodel");
export const restroom: DisabledAccessFactValue = {
  businessKey: CLEANING_KEY,
  expenditures: 3101.4,
  deductedOn: "repairs",
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9000 }],
  ["2025-06", { date: "2025-06-16", amount: 9000 }],
  ["2025-09", { date: "2025-09-15", amount: 9000 }],
  ["2026-01", { date: "2026-01-15", amount: 9000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: FLANN_USER_ID, taxYear: FLANN_TAX_YEAR, suffix, value });

export const flannFacts: TaxFactRow[] = [
  idFact("name.first", FLANN.firstName),
  idFact("name.last", FLANN.lastName),
  idFact("ssn", FLANN.ssn),
  idFact("dob", "05/22/1979"),
  idFact("address.street", FLANN.street),
  idFact("address.city", FLANN.city),
  idFact("address.state", FLANN.state),
  idFact("address.zip", FLANN.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Cleaning company owner"),
  idFact("phone", "559-555-0143"),
  fact("self_employment", CLEANING_KEY, cleaning, `${VERBAL}: the company's books and payroll.`),
  fact(
    "self_employment",
    RESTROOM_KEY,
    restroom,
    `${VERBAL}: the company's books and the contractor's invoice.`,
  ),
  fact(
    "self_employment",
    DISABLED_ACCESS_KEYS.priorYearGrossReceipts,
    1180000,
    `${VERBAL}: 2024 Schedule C line 3.`,
  ),
  fact(
    "self_employment",
    DISABLED_ACCESS_KEYS.priorYearFullTimeEmployees,
    24,
    `${VERBAL}: 2024 payroll records, employees with 30 or more hours a week for 20 or more weeks.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: self-employed for California too.`,
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];
