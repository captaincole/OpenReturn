/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2 fact is the boxes as the W-2 would print them, and the
 * carryforward is her answer from her 2024 Form 8859.
 */

import {
  DC_HOMEBUYER_CREDIT_KEYS,
  makeDependentFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TAKIMA_USER_ID = "takima-integration";
export const TAKIMA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TAKIMA_USER_ID,
  taxYear: TAKIMA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TAKIMA = {
  firstName: "Takima",
  lastName: "Brannock",
  ssn: "400-00-8859",
  street: "4410 Larkspur Terrace NE",
  city: "Seattle",
  state: "WA",
  zip: "98105",
};

const address = { line1: TAKIMA.street, city: TAKIMA.city, state: TAKIMA.state, zip: TAKIMA.zip };

// Her W-2 from a made-up Seattle employer.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Cascade Ferryworks Engineering LLC",
  employerEin: "00-0008859",
  employerAddress: { line1: "1800 Alaskan Way", city: "Seattle", state: "WA", zip: "98101" },
  employee: { firstName: TAKIMA.firstName, lastName: TAKIMA.lastName, ssn: TAKIMA.ssn, address },
  box1: 56000,
  box2: 3200,
  box3: 56000,
  box4: 3472,
  box5: 56000,
  box6: 812,
};

const son: DependentFactValue = {
  firstName: "Oren",
  lastName: "Brannock",
  ssn: "400-00-8860",
  relationship: "Son",
  dob: "03/18/2016",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TAKIMA_USER_ID, taxYear: TAKIMA_TAX_YEAR, suffix, value });

export const takimaFacts: TaxFactRow[] = [
  idFact("name.first", TAKIMA.firstName),
  idFact("name.last", TAKIMA.lastName),
  idFact("ssn", TAKIMA.ssn),
  idFact("dob", "07/09/1979"),
  idFact("address.street", TAKIMA.street),
  idFact("address.city", TAKIMA.city),
  idFact("address.state", TAKIMA.state),
  idFact("address.zip", TAKIMA.zip),
  idFact("occupation", "Marine engineer"),
  idFact("phone", "206-555-0188"),
  fact("wages", makeW2FactKey("cascade-ferryworks"), w2, "W-2 from Cascade Ferryworks."),
  fact("dependents", makeDependentFactKey("oren-brannock"), son, VERBAL),
  fact(
    "other",
    DC_HOMEBUYER_CREDIT_KEYS.carryforwardFrom2024,
    3800,
    `${VERBAL}: her 2024 Form 8859, line 4 (credit carryforward to 2025).`,
  ),
];
