/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the W-2 and 1099-NEC boxes as they would read, and
 * the answers Egwene states about each firm and her business.
 */

import {
  makeBusinessFactKey,
  makeNonemployeeCompensationFactKey,
  makeUncollectedWagesFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type NonemployeeCompensationFactValue,
  type UncollectedWagesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const EGWENE_USER_ID = "egwene-integration";
export const EGWENE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: EGWENE_USER_ID,
  taxYear: EGWENE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const EGWENE = {
  firstName: "Egwene",
  lastName: "Marchetti",
  ssn: "400-00-8919",
  street: "2207 Bluebonnet Terrace",
  city: "Waco",
  state: "TX",
  zip: "76710",
};

const address = { line1: EGWENE.street, city: EGWENE.city, state: EGWENE.state, zip: EGWENE.zip };

const CLINIC = { name: "Brazos Valley Clinic PA", ein: "00-0089191" };
const LOGISTICS = { name: "Pecan Hollow Logistics LLC", ein: "00-0089192" };

/* W-2 from Brazos Valley Clinic (made up): her job as a practice manager. */
const clinicW2: W2FactValue = {
  owner: "taxpayer",
  employerName: CLINIC.name,
  employerEin: CLINIC.ein,
  employerAddress: { line1: "1600 Austin Avenue", city: "Waco", state: "TX", zip: "76701" },
  employee: { firstName: EGWENE.firstName, lastName: EGWENE.lastName, ssn: EGWENE.ssn, address },
  box1: 140000,
  box2: 19500,
  box3: 140000,
  box4: 8680,
  box5: 140000,
  box6: 2030,
};

/* 1099-NEC from the same clinic: a signing bonus that belongs on her W-2 (reason code H). */
const clinicNec: NonemployeeCompensationFactValue = {
  payerName: CLINIC.name,
  payerTin: CLINIC.ein,
  box1: 7500.25,
};

/* 1099-NEC from Pecan Hollow Logistics: a year of dispatch work; an SS-8 letter says employee. */
const logisticsNec: NonemployeeCompensationFactValue = {
  payerName: LOGISTICS.name,
  payerTin: LOGISTICS.ein,
  box1: 31200,
};

const CLINIC_NEC_KEY = makeNonemployeeCompensationFactKey("brazos-valley-clinic", "bonus");
const LOGISTICS_NEC_KEY = makeNonemployeeCompensationFactKey("pecan-hollow-logistics", "2025");

/* The four firms of Form 8919, in the order she named them. */
const firms: Array<[string, UncollectedWagesFactValue, string]> = [
  [
    "brazos-valley-clinic",
    {
      firmName: CLINIC.name,
      firmTin: CLINIC.ein,
      reasonCode: "H",
      received1099: true,
      wages: 7500.25,
      form1099Keys: [CLINIC_NEC_KEY],
    },
    "Stated by Egwene: the clinic paid her signing bonus on a 1099-NEC and her salary on a W-2.",
  ],
  [
    "pecan-hollow-logistics",
    {
      firmName: LOGISTICS.name,
      firmTin: LOGISTICS.ein,
      reasonCode: "A",
      determinationDate: "08/14/2025",
      received1099: true,
      wages: 31200,
      form1099Keys: [LOGISTICS_NEC_KEY],
    },
    "Stated by Egwene: Form SS-8 determination letter dated August 14, 2025.",
  ],
  [
    "cedar-mill-tutoring",
    {
      firmName: "Rosalind Okafor DBA Cedar Mill Tutoring",
      firmTin: "400-00-8920",
      reasonCode: "G",
      received1099: false,
      wages: 9800.4,
    },
    "Stated by Egwene: weekly tutoring pay; she filed Form SS-8 in March 2026 with no reply yet.",
  ],
  [
    "lakeshore-events",
    {
      firmName: "Lakeshore Events Group",
      firmTin: "unknown",
      reasonCode: "C",
      determinationDate: "03/03/2025",
      received1099: false,
      wages: 4350,
    },
    "Stated by Egwene: an IRS letter of March 3, 2025 says she is an employee; the firm never gave its EIN.",
  ],
];

/* Her own photography business (Schedule C): $15,000 of receipts, $3,000 of supplies. */
const photography: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Event photography",
  code: "541920",
  name: "Marchetti Photo",
  address: { street: EGWENE.street, city: EGWENE.city, state: EGWENE.state, zip: EGWENE.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 15000,
  expenses: { supplies: 3000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: EGWENE_USER_ID, taxYear: EGWENE_TAX_YEAR, suffix, value });

export const egweneFacts: TaxFactRow[] = [
  idFact("name.first", EGWENE.firstName),
  idFact("name.last", EGWENE.lastName),
  idFact("ssn", EGWENE.ssn),
  idFact("dob", "09/30/1988"),
  idFact("address.street", EGWENE.street),
  idFact("address.city", EGWENE.city),
  idFact("address.state", EGWENE.state),
  idFact("address.zip", EGWENE.zip),
  idFact("occupation", "Practice manager"),
  idFact("phone", "254-555-0189"),
  fact("wages", makeW2FactKey("brazos-valley-clinic"), clinicW2, "W-2 from Brazos Valley Clinic."),
  fact("self_employment", CLINIC_NEC_KEY, clinicNec, "1099-NEC from Brazos Valley Clinic."),
  fact("self_employment", LOGISTICS_NEC_KEY, logisticsNec, "1099-NEC from Pecan Hollow Logistics."),
  ...firms.map(([slug, value, note]) =>
    fact("wages", makeUncollectedWagesFactKey(slug), value, note),
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("marchetti-photo"),
    photography,
    "Stated by Egwene: her photography business.",
  ),
];
