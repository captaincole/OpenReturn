/*
 * A made-up single trial sponsor in California (README.md): every name and
 * amount is invented. The clinical testing expenses and the orphan drug
 * designation come from the business's books and the FDA's designation
 * letter: no information return reports them, so they are stated answers.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  ORPHAN_DRUG_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type OrphanDrugCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const EWARD_USER_ID = "eward-synthetic";
export const EWARD_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: EWARD_USER_ID,
  taxYear: EWARD_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const EWARD = {
  firstName: "Eward",
  lastName: "Calloran",
  ssn: "400-00-8821",
  street: "3815 Pringle Street",
  city: "San Diego",
  state: "CA",
  zip: "92103",
};

export const TRIALS_ID = "calloran-rare-disease-trials";
export const TRIALS_KEY = makeBusinessFactKey(TRIALS_ID);

/* His trial sponsorship business (Schedule C): he runs and pays for trials of one orphan drug. */
export const trials: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Clinical trials for a rare disease drug",
  code: "541714",
  name: "Calloran Rare Disease Trials",
  address: { street: "10840 Torreyana Road", city: "San Diego", state: "CA", zip: "92121" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 900000,
  expenses: {
    contractLabor: 260000,
    insurance: 9000,
    legalAndProfessional: 15000,
    rentOtherProperty: 48000,
    rentVehiclesMachinery: 12000,
    supplies: 30000,
    taxesAndLicenses: 14000,
    utilities: 6000,
    wages: 140000,
  },
  specifiedService: false,
  w2WagesPaid: 140000,
  qualifiedPropertyUbia: 0,
};

/*
 * The business's orphan drug credit. Eward does not elect the reduced credit,
 * so line 2a comes off the Schedule C lines that hold the expenses: all of the
 * clinical wages, supplies and computer rental, and the rest from the contract
 * testing.
 */
export const orphanDrugCredit: OrphanDrugCreditFactValue = {
  businessKey: TRIALS_KEY,
  reducedCreditElection: false,
  expenses: {
    wages: 20000,
    supplies: 10000,
    computerRental: 6000,
    contractTesting: 164000.4,
  },
  drugs: [
    {
      name: "pelvarostide",
      designationApplicationNumber: "DRU-2022-8876",
      dateDesignated: "2022-06-08",
    },
  ],
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 20000 }],
  ["2025-06", { date: "2025-06-16", amount: 20000 }],
  ["2025-09", { date: "2025-09-15", amount: 20000 }],
  ["2026-01", { date: "2026-01-15", amount: 20000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: EWARD_USER_ID, taxYear: EWARD_TAX_YEAR, suffix, value });

export const ewardFacts: TaxFactRow[] = [
  idFact("name.first", EWARD.firstName),
  idFact("name.last", EWARD.lastName),
  idFact("ssn", EWARD.ssn),
  idFact("dob", "04/22/1979"),
  idFact("address.street", EWARD.street),
  idFact("address.city", EWARD.city),
  idFact("address.state", EWARD.state),
  idFact("address.zip", EWARD.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Clinical trial sponsor"),
  idFact("phone", "619-555-0164"),
  fact("self_employment", TRIALS_KEY, trials, `${VERBAL}: the business's 2025 books.`),
  fact(
    "self_employment",
    ORPHAN_DRUG_CREDIT_KEY,
    orphanDrugCredit,
    `${VERBAL}: the business's clinical testing ledger and the FDA orphan drug designation letter.`,
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
