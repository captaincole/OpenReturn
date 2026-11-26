/*
 * A made-up taxpayer (README.md): every name and amount is invented. She has
 * no input documents: the business amounts and the look-back amounts are what
 * she states from her contract records and her 2021 to 2023 returns.
 */

import {
  LOOK_BACK_CATEGORY,
  LOOK_BACK_FACT_KEY,
  makeBusinessFactKey,
  type BusinessFactValue,
  type SimplifiedLookBackFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELZA_USER_ID = "elza-integration";
export const ELZA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELZA_USER_ID,
  taxYear: ELZA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ELZA = {
  firstName: "Elza",
  lastName: "Marrowind",
  ssn: "400-00-8698",
  street: "77 Juniper Mesa Drive",
  city: "Reno",
  state: "NV",
  zip: "89511",
};

const BUSINESS_ID = "marrowind-fabrication";

/* Her steel fabrication business (Schedule C, material participation), on the accrual method. */
const fabrication: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Structural steel fabrication",
  code: "332312",
  name: "Marrowind Steel Fabrication",
  address: { street: "1200 Foundry Way", city: "Sparks", state: "NV", zip: "89431" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 190000,
  expenses: { supplies: 70000, insurance: 6000, utilities: 4000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * A pedestrian bridge built from 2021 to 2023 on the percentage of completion
 * method, with the simplified marginal impact method elected (Part II). In
 * 2025 the price came down in a final settlement, a post-completion
 * adjustment: with it, 2021 and 2022 had less income, and 2023 more (more
 * still for the minimum tax). She filed and paid the 2025 return on March 2, 2026.
 */
export const elzaLookBack: SimplifiedLookBackFactValue = {
  method: "simplified_marginal_impact",
  priorYears: [
    { taxYear: 2021, incomeAdjustment: -20000, amtiAdjustment: -20000, totalTaxLiability: 5000 },
    { taxYear: 2022, incomeAdjustment: -30000, amtiAdjustment: -30000, totalTaxLiability: 40000 },
    { taxYear: 2023, incomeAdjustment: 6000, amtiAdjustment: 10000, totalTaxLiability: 38000 },
  ],
  filedAndPaidOn: "2026-03-02",
  refundDeposit: {
    routingNumber: "321270742",
    accountNumber: "8697-4410-23",
    accountType: "checking",
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELZA_USER_ID, taxYear: ELZA_TAX_YEAR, suffix, value });

export const elzaFacts: TaxFactRow[] = [
  idFact("name.first", ELZA.firstName),
  idFact("name.last", ELZA.lastName),
  idFact("ssn", ELZA.ssn),
  idFact("dob", "01/19/1983"),
  idFact("address.street", ELZA.street),
  idFact("address.city", ELZA.city),
  idFact("address.state", ELZA.state),
  idFact("address.zip", ELZA.zip),
  idFact("occupation", "Steel fabricator"),
  idFact("phone", "775-555-0142"),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    fabrication,
    "Stated by Elza: her steel fabrication business, from its 2025 books.",
  ),
  fact(
    LOOK_BACK_CATEGORY,
    LOOK_BACK_FACT_KEY,
    elzaLookBack,
    "Stated by Elza: the look-back schedule of the bridge contract, her 2021 to 2023 returns and her bank account.",
  ),
];
