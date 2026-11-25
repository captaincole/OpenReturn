/*
 * A made-up taxpayer (README.md): every name and amount is invented. She has
 * no input documents: the equipment sales have no Form 1099, and the amounts
 * are what she states from her depreciation schedule and the dealer's receipts.
 */

import {
  makeBusinessFactKey,
  makeBusinessPropertySaleFactKey,
  type BusinessFactValue,
  type BusinessPropertySaleFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ALANNA_USER_ID = "alanna-integration";
export const ALANNA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ALANNA_USER_ID,
  taxYear: ALANNA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ALANNA = {
  firstName: "Alanna",
  lastName: "Corbray",
  ssn: "400-00-4798",
  street: "2207 Bayshore Court",
  city: "Tampa",
  state: "FL",
  zip: "33611",
};

const BUSINESS_ID = "greenfield-grounds";

/* Her lawn and grounds care business (Schedule C, material participation). */
const lawnCare: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Lawn and grounds care",
  code: "561730",
  name: "Greenfield Lawn & Grounds",
  address: { street: "4100 W Kennedy Blvd", city: "Tampa", state: "FL", zip: "33609" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 96000,
  expenses: { supplies: 14000, utilities: 2400, insurance: 3600 },
  depreciation: { priorYearMacrs: 6000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * The seven pieces of equipment she retired in 2025 (section 1245 property).
 * Five went to a used-equipment dealer at a gain (Part III: one more than its
 * four columns); two were worn out and scrapped for nothing (abandoned, Part II).
 */
const retired: Array<[string, BusinessPropertySaleFactValue]> = [
  [
    "mower-1",
    {
      description: "Zero-turn mower, 60 in. (1 of 2)",
      kind: "section_1245",
      dateAcquired: "2021-03-10",
      dateSold: "2025-04-15",
      grossSalesPrice: 6500,
      costOrOtherBasis: 14000,
      depreciationAllowed: 11200,
    },
  ],
  [
    "mower-2",
    {
      description: "Zero-turn mower, 60 in. (2 of 2)",
      kind: "section_1245",
      dateAcquired: "2021-03-10",
      dateSold: "2025-04-15",
      grossSalesPrice: 6000,
      costOrOtherBasis: 14000,
      depreciationAllowed: 11200,
    },
  ],
  [
    "trailer",
    {
      description: "Utility trailer, 16 ft",
      kind: "section_1245",
      dateAcquired: "2019-07-01",
      dateSold: "2025-05-20",
      grossSalesPrice: 2400,
      costOrOtherBasis: 5000,
      depreciationAllowed: 5000,
    },
  ],
  [
    "leaf-loader",
    {
      description: "Truck leaf loader",
      kind: "section_1245",
      dateAcquired: "2020-02-14",
      dateSold: "2025-06-02",
      grossSalesPrice: 3100,
      costOrOtherBasis: 8000,
      depreciationAllowed: 6400,
    },
  ],
  [
    "skid-steer",
    {
      description: "Compact skid steer",
      kind: "section_1245",
      dateAcquired: "2018-08-01",
      dateSold: "2025-09-12",
      grossSalesPrice: 30500,
      costOrOtherBasis: 30000,
      expenseOfSale: 500,
      depreciationAllowed: 30000,
    },
  ],
  [
    "edger",
    {
      description: "Stick edger, scrapped",
      kind: "section_1245",
      dateAcquired: "2022-04-01",
      dateSold: "2025-03-01",
      grossSalesPrice: 0,
      costOrOtherBasis: 1800,
      depreciationAllowed: 1224,
      abandoned: true,
    },
  ],
  [
    "hedge-trimmers",
    {
      description: "Hedge trimmer set, scrapped",
      kind: "section_1245",
      dateAcquired: "2023-05-15",
      dateSold: "2025-07-01",
      grossSalesPrice: 0,
      costOrOtherBasis: 1200,
      depreciationAllowed: 576,
      abandoned: true,
    },
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ALANNA_USER_ID, taxYear: ALANNA_TAX_YEAR, suffix, value });

export const alannaFacts: TaxFactRow[] = [
  idFact("name.first", ALANNA.firstName),
  idFact("name.last", ALANNA.lastName),
  idFact("ssn", ALANNA.ssn),
  idFact("dob", "09/14/1984"),
  idFact("address.street", ALANNA.street),
  idFact("address.city", ALANNA.city),
  idFact("address.state", ALANNA.state),
  idFact("address.zip", ALANNA.zip),
  idFact("occupation", "Landscaper"),
  idFact("phone", "813-555-0148"),
  fact(
    "self_employment",
    makeBusinessFactKey(BUSINESS_ID),
    lawnCare,
    "Stated by Alanna: her lawn and grounds care business.",
  ),
  // Every piece was the business's (Schedule C): each sale names it.
  ...retired.map(([slug, value]) =>
    fact(
      "other",
      makeBusinessPropertySaleFactKey(slug),
      { ...value, businessId: BUSINESS_ID },
      "Stated by Alanna: depreciation schedule and the dealer's receipts.",
    ),
  ),
];
