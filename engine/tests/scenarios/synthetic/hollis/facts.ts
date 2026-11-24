/*
 * A made-up taxpayer (README.md): every name and amount is invented. The two
 * Form 1099-Bs are made documents (generate-docs.ts renders them from the
 * objects below); the W-2 has no PDF.
 */

import {
  makeSection1256StatementFactKey,
  makeW2FactKey,
  type Section1256StatementFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const HOLLIS_USER_ID = "hollis-integration";
export const HOLLIS_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: HOLLIS_USER_ID,
  taxYear: HOLLIS_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HOLLIS = {
  firstName: "Hollis",
  lastName: "Varga",
  ssn: "400-00-6781",
  street: "2204 Pecan Hollow Road",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const address = { line1: HOLLIS.street, city: HOLLIS.city, state: HOLLIS.state, zip: HOLLIS.zip };

// W-2 from Bluebonnet Logistics (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Bluebonnet Logistics Inc",
  employerEin: "00-0006781",
  employerAddress: { line1: "900 Freight Way", city: "Austin", state: "TX", zip: "78741" },
  employee: { firstName: HOLLIS.firstName, lastName: HOLLIS.lastName, ssn: HOLLIS.ssn, address },
  box1: 95000,
  box2: 11000,
  box3: 95000,
  box4: 5890,
  box5: 95000,
  box6: 1377.5,
};

/*
 * 1099-B from Ridgeline Futures (made up): regulated futures, boxes 8–11 only.
 * Box 11 = box 8 − box 9 + box 10 = 9,840 + 1,250 + 2,115 = 13,205.
 */
export const ridgeline: Section1256StatementFactValue = {
  brokerName: "Ridgeline Futures LLC",
  accountNumber: "RF-20417",
  box8: 9840,
  box9: -1250,
  box10: 2115,
  box11: 13205,
};

/* 1099-B from Mesa Commodity Partners (made up): a realized loss, nothing open. */
export const mesa: Section1256StatementFactValue = {
  brokerName: "Mesa Commodity Partners",
  accountNumber: "MCP-5531",
  box8: -4318,
  box11: -4318,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: HOLLIS_USER_ID, taxYear: HOLLIS_TAX_YEAR, suffix, value });

export const hollisFacts: TaxFactRow[] = [
  idFact("name.first", HOLLIS.firstName),
  idFact("name.last", HOLLIS.lastName),
  idFact("ssn", HOLLIS.ssn),
  idFact("dob", "07/14/1988"),
  idFact("address.street", HOLLIS.street),
  idFact("address.city", HOLLIS.city),
  idFact("address.state", HOLLIS.state),
  idFact("address.zip", HOLLIS.zip),
  idFact("occupation", "Dispatcher"),
  idFact("phone", "512-555-0167"),
  fact("wages", makeW2FactKey("bluebonnet-logistics"), w2, "W-2 from Bluebonnet Logistics."),
  fact(
    "capital_gains",
    makeSection1256StatementFactKey("ridgeline-futures"),
    ridgeline,
    "Form 1099-B from Ridgeline Futures LLC, boxes 8–11 (docs/01-1099-b-ridgeline-futures.pdf).",
  ),
  fact(
    "capital_gains",
    makeSection1256StatementFactKey("mesa-commodity"),
    mesa,
    "Form 1099-B from Mesa Commodity Partners, boxes 8 and 11 (docs/02-1099-b-mesa-commodity.pdf).",
  ),
];
