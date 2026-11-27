/*
 * A made-up married couple (README.md): every name and amount is invented.
 * No input documents: the W-2s are the boxes as the documents would print
 * them. The rest are answers the couple states.
 */

import {
  EIC_KEYS,
  FORM_8862_KEYS,
  SPOUSE_KEYS,
  makeW2FactKey,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GHEALDAN_USER_ID = "ghealdan-integration";
export const GHEALDAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GHEALDAN_USER_ID,
  taxYear: GHEALDAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CORIN = {
  firstName: "Corin",
  lastName: "Abelard",
  ssn: "400-00-8875",
  street: "418 Juniper Flats Road",
  city: "Elko",
  state: "NV",
  zip: "89801",
};

export const NESSA = { firstName: "Nessa", lastName: "Abelard", ssn: "400-00-8876" };

const address = { line1: CORIN.street, city: CORIN.city, state: CORIN.state, zip: CORIN.zip };

// Corin's W-2 from Ruby Valley Feed and Tack (made up).
const corinW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Ruby Valley Feed and Tack LLC",
  employerEin: "00-0008875",
  employerAddress: { line1: "1200 Idaho Street", city: "Elko", state: "NV", zip: "89801" },
  employee: { firstName: CORIN.firstName, lastName: CORIN.lastName, ssn: CORIN.ssn, address },
  box1: 9000,
  box2: 180,
  box3: 9000,
  box4: 558,
  box5: 9000,
  box6: 130.5,
};

// Nessa's W-2 from Lamoille Canyon Lodge (made up).
const nessaW2: W2FactValue = {
  owner: "spouse",
  employerName: "Lamoille Canyon Lodge Inc",
  employerEin: "00-0008876",
  employerAddress: { line1: "50 Canyon Road", city: "Lamoille", state: "NV", zip: "89828" },
  employee: { firstName: NESSA.firstName, lastName: NESSA.lastName, ssn: NESSA.ssn, address },
  box1: 6500,
  box2: 95,
  box3: 6500,
  box4: 403,
  box5: 6500,
  box6: 94.25,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GHEALDAN_USER_ID, taxYear: GHEALDAN_TAX_YEAR, suffix, value });

const STATED = "Stated by Corin and Nessa.";

export const ghealdanFacts: TaxFactRow[] = [
  idFact("name.first", CORIN.firstName),
  idFact("name.last", CORIN.lastName),
  idFact("ssn", CORIN.ssn),
  idFact("dob", "07/21/1994"),
  idFact("address.street", CORIN.street),
  idFact("address.city", CORIN.city),
  idFact("address.state", CORIN.state),
  idFact("address.zip", CORIN.zip),
  idFact("occupation", "Warehouse clerk"),
  idFact("phone", "775-555-0142"),
  fact("identity", SPOUSE_KEYS.firstName, NESSA.firstName, STATED),
  fact("identity", SPOUSE_KEYS.lastName, NESSA.lastName, STATED),
  fact("identity", SPOUSE_KEYS.occupation, "Housekeeper", STATED),
  fact("identity", SPOUSE_KEYS.ssn, NESSA.ssn, "Nessa's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "11/03/1997", STATED),
  fact("wages", makeW2FactKey("ruby-valley"), corinW2, "W-2 from Ruby Valley Feed and Tack."),
  fact("wages", makeW2FactKey("lamoille-canyon"), nessaW2, "W-2 from Lamoille Canyon Lodge."),
  /* The EIC questions for a joint return with no qualifying child. */
  fact("other", EIC_KEYS.nonresidentAlien, false, STATED),
  fact("other", EIC_KEYS.mainHomeInUs, true, STATED),
  fact(
    "other",
    EIC_KEYS.deniedInEarlierYear,
    true,
    "Stated by Corin: the IRS disallowed the 2023 EIC after an audit of his wages from a side job.",
  ),
  fact("other", EIC_KEYS.barredByIrs, false, "Stated by Corin: no ban notice."),
  /* Form 8862. */
  fact(
    "other",
    FORM_8862_KEYS.eicDeniedOnlyForChild,
    false,
    "Stated by Corin: no child was on the 2023 Schedule EIC.",
  ),
  fact(
    "other",
    FORM_8862_KEYS.eicOnlyIncomeMisreported,
    false,
    "Stated by Corin: the audit also found that he lived abroad most of 2023 (line 3 No).",
  ),
  fact("other", FORM_8862_KEYS.daysMainHomeInUs, 365, "Stated by Corin: home in Elko all year."),
  fact(
    "other",
    FORM_8862_KEYS.spouseDaysMainHomeInUs,
    300,
    "Stated by Nessa: in Elko except 65 days with her mother in Canada.",
  ),
];
