/*
 * A made-up taxpayer (README.md): every name, number and amount is invented. No
 * input documents: the W-2 fact is the boxes as the form would print them, and
 * the three refund accounts are her answers.
 */

import {
  REFUND_DEPOSIT_CATEGORY,
  makeRefundDepositFactKey,
  makeW2FactKey,
  type RefundDepositAccountFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MOIRAINE_USER_ID = "moiraine-integration";
export const MOIRAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MOIRAINE_USER_ID,
  taxYear: MOIRAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MOIRAINE = {
  firstName: "Moiraine",
  lastName: "Thistlewood",
  ssn: "400-00-8888",
  street: "915 Sagebrush Court",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

const address = {
  line1: MOIRAINE.street,
  city: MOIRAINE.city,
  state: MOIRAINE.state,
  zip: MOIRAINE.zip,
};

// W-2 from a made-up employer. More withheld than the tax: a refund.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Truckee Meadows Survey Partners LLC",
  employerEin: "00-0008888",
  employerAddress: { line1: "48 Kietzke Lane", city: "Reno", state: "NV", zip: "89502" },
  employee: {
    firstName: MOIRAINE.firstName,
    lastName: MOIRAINE.lastName,
    ssn: MOIRAINE.ssn,
    address,
  },
  box1: 68000,
  box2: 9800,
  box3: 68000,
  box4: 4216,
  box5: 68000,
  box6: 986,
};

/*
 * Her three accounts for the refund. The routing and account numbers are made
 * up; the first routing number is the one on the sample check of the Form 8888
 * instructions. The third account takes what the first two leave.
 */
const savings: RefundDepositAccountFactValue = {
  routingNumber: "250250025",
  accountNumber: "4410-2286-5501",
  accountType: "savings",
  amount: 1500,
};

const brokerage: RefundDepositAccountFactValue = {
  routingNumber: "091999996",
  accountNumber: "RX 55102 93066 41700",
  accountType: "savings",
  amount: 1000,
};

const checking: RefundDepositAccountFactValue = {
  routingNumber: "321999990",
  accountNumber: "7788123450",
  accountType: "checking",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MOIRAINE_USER_ID, taxYear: MOIRAINE_TAX_YEAR, suffix, value });

export const moiraineFacts: TaxFactRow[] = [
  idFact("name.first", MOIRAINE.firstName),
  idFact("name.last", MOIRAINE.lastName),
  idFact("ssn", MOIRAINE.ssn),
  idFact("dob", "07/14/1988"),
  idFact("address.street", MOIRAINE.street),
  idFact("address.city", MOIRAINE.city),
  idFact("address.state", MOIRAINE.state),
  idFact("address.zip", MOIRAINE.zip),
  idFact("occupation", "Land surveyor"),
  idFact("phone", "775-555-0188"),
  fact("wages", makeW2FactKey("truckee-meadows-survey"), w2, "W-2 from Truckee Meadows Survey."),
  fact(
    REFUND_DEPOSIT_CATEGORY,
    makeRefundDepositFactKey(1),
    savings,
    "Stated by Moiraine: $1,500 to her credit union savings account.",
  ),
  fact(
    REFUND_DEPOSIT_CATEGORY,
    makeRefundDepositFactKey(2),
    brokerage,
    "Stated by Moiraine: $1,000 to her brokerage account; the broker said to check Savings.",
  ),
  fact(
    REFUND_DEPOSIT_CATEGORY,
    makeRefundDepositFactKey(3),
    checking,
    "Stated by Moiraine: the rest of the refund to her checking account.",
  ),
];
