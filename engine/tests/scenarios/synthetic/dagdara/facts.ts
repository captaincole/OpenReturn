/*
 * A made-up taxpayer (README.md): every name and amount is invented. She has
 * no input documents: the business amounts and the look-back amounts are what
 * she states from her contract records and her 2023 and 2024 returns.
 */

import {
  LOOK_BACK_CATEGORY,
  LOOK_BACK_FACT_KEY,
  makeBusinessFactKey,
  type BusinessFactValue,
  type RegularLookBackFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DAGDARA_USER_ID = "dagdara-integration";
export const DAGDARA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DAGDARA_USER_ID,
  taxYear: DAGDARA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DAGDARA = {
  firstName: "Dagdara",
  lastName: "Holloway",
  ssn: "400-00-8697",
  street: "918 Harbor Light Lane",
  city: "Corpus Christi",
  state: "TX",
  zip: "78418",
};

const BUSINESS_ID = "holloway-boatworks";

/* Her boat building business (Schedule C, material participation), on the accrual method. */
const boatworks: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Custom boat building",
  code: "336612",
  name: "Holloway Custom Boatworks",
  address: { street: "40 Shipyard Road", city: "Corpus Christi", state: "TX", zip: "78402" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 285000,
  expenses: { supplies: 110000, insurance: 9000, utilities: 6000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * The look-back on a 26-meter research vessel built from 2023 to 2025 on the
 * percentage of completion method (Part I, the regular method). With the
 * actual price and costs, 2023 gets $40,000 more income and 2024 $15,000 less;
 * 2025, the completion year, $25,000 less. Lines 1, 4 and 5 are her returns and
 * her preparer's recomputed tax for each year.
 */
export const dagdaraLookBack: RegularLookBackFactValue = {
  method: "regular",
  filingYear: { incomeAdjustment: -25000, taxOnAdjustedIncome: 12817 },
  priorYears: [
    {
      taxYear: 2023,
      taxableIncome: 120000,
      incomeAdjustment: 40000,
      taxOnAdjustedIncome: 31800,
      taxAsReported: 22200,
    },
    {
      taxYear: 2024,
      taxableIncome: 135000,
      incomeAdjustment: -15000,
      taxOnAdjustedIncome: 21843,
      taxAsReported: 25443,
    },
  ],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DAGDARA_USER_ID, taxYear: DAGDARA_TAX_YEAR, suffix, value });

export const dagdaraFacts: TaxFactRow[] = [
  idFact("name.first", DAGDARA.firstName),
  idFact("name.last", DAGDARA.lastName),
  idFact("ssn", DAGDARA.ssn),
  idFact("dob", "06/02/1979"),
  idFact("address.street", DAGDARA.street),
  idFact("address.city", DAGDARA.city),
  idFact("address.state", DAGDARA.state),
  idFact("address.zip", DAGDARA.zip),
  idFact("occupation", "Boat builder"),
  idFact("phone", "361-555-0169"),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    boatworks,
    "Stated by Dagdara: her boat building business, from its 2025 books.",
  ),
  fact(
    LOOK_BACK_CATEGORY,
    LOOK_BACK_FACT_KEY,
    dagdaraLookBack,
    "Stated by Dagdara: the look-back schedule of the research vessel contract and her 2023 and 2024 returns.",
  ),
];
