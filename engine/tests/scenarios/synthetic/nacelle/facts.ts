/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the two W-2s' boxes as the documents would print
 * them, and her answer about the payment she sent with Form 4868.
 */

import {
  ESTIMATED_TAX_KEYS,
  makeW2FactKey,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NACELLE_USER_ID = "nacelle-integration";
export const NACELLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NACELLE_USER_ID,
  taxYear: NACELLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NACELLE = {
  firstName: "Nacelle",
  lastName: "Varrow",
  ssn: "400-00-3011",
  street: "1450 Sagebrush Lane",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

const address = {
  line1: NACELLE.street,
  city: NACELLE.city,
  state: NACELLE.state,
  zip: NACELLE.zip,
};

const employee = {
  firstName: NACELLE.firstName,
  lastName: NACELLE.lastName,
  ssn: NACELLE.ssn,
  address,
};

/*
 * Her first job, January to August: 6.2% of $112,450 is $6,971.90 of social
 * security tax (box 4), 1.45% is $1,630.53 of Medicare tax (box 6).
 */
const truckeeW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Truckee Meadows Robotics Inc",
  employerEin: "00-0031101",
  employerAddress: { line1: "900 Kietzke Lane", city: "Reno", state: "NV", zip: "89502" },
  employee,
  box1: 112450,
  box2: 19800,
  box3: 112450,
  box4: 6971.9,
  box5: 112450,
  box6: 1630.53,
};

/*
 * Her second job, September to December: 6.2% of $79,300 is $4,916.60 (box 4),
 * 1.45% is $1,149.85 (box 6). Each employer withheld less than $10,918.20.
 */
const washoeW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Washoe Valley Instruments LLC",
  employerEin: "00-0031102",
  employerAddress: {
    line1: "35 Bowers Mansion Road",
    city: "Washoe Valley",
    state: "NV",
    zip: "89704",
  },
  employee,
  box1: 79300,
  box2: 11400,
  box3: 79300,
  box4: 4916.6,
  box5: 79300,
  box6: 1149.85,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NACELLE_USER_ID, taxYear: NACELLE_TAX_YEAR, suffix, value });

export const nacelleFacts: TaxFactRow[] = [
  idFact("name.first", NACELLE.firstName),
  idFact("name.last", NACELLE.lastName),
  idFact("ssn", NACELLE.ssn),
  idFact("dob", "03/09/1986"),
  idFact("address.street", NACELLE.street),
  idFact("address.city", NACELLE.city),
  idFact("address.state", NACELLE.state),
  idFact("address.zip", NACELLE.zip),
  idFact("occupation", "Controls engineer"),
  idFact("phone", "775-555-0311"),
  fact("wages", makeW2FactKey("truckee-meadows"), truckeeW2, "W-2 from Truckee Meadows Robotics."),
  fact("wages", makeW2FactKey("washoe-valley"), washoeW2, "W-2 from Washoe Valley Instruments."),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.extensionPayment,
    2000,
    "Stated by Nacelle, 2026-11-26: $2,000 paid with Form 4868 on April 15, 2026 (IRS Direct Pay confirmation).",
  ),
];
