/*
 * A made-up parent (README.md): every name and amount is invented. The W-2 fact
 * is the boxes as the W-2 would print them. The release fact is what the other
 * parent signed on Form 8332 (docs/01-form-8332-tobin-tarvale.pdf); the
 * revocation fact is Ellorien's own Part III, given in 2024.
 */

import {
  EIC_KEYS,
  HEAD_OF_HOUSEHOLD_KEYS,
  makeDependentFactKey,
  makeForm8332FactKey,
  makeW2FactKey,
  type DependentFactValue,
  type Form8332ReleaseFactValue,
  type Form8332RevocationFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELLORIEN_USER_ID = "ellorien-integration";
export const ELLORIEN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELLORIEN_USER_ID,
  taxYear: ELLORIEN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ELLORIEN = {
  firstName: "Ellorien",
  lastName: "Tarvale",
  ssn: "400-00-8332",
  street: "2248 Juniper Mesa Court",
  city: "Henderson",
  state: "NV",
  zip: "89052",
};

/* The children's other parent: divorced from Ellorien in 2022. */
export const DAVIN = { firstName: "Davin", lastName: "Tarvale", ssn: "400-00-8333" };

const address = {
  line1: ELLORIEN.street,
  city: ELLORIEN.city,
  state: ELLORIEN.state,
  zip: ELLORIEN.zip,
};

const clinicW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Desert Willow Family Clinic",
  employerEin: "00-0008332",
  employerAddress: {
    line1: "810 Horizon Ridge Parkway",
    city: "Henderson",
    state: "NV",
    zip: "89012",
  },
  employee: {
    firstName: ELLORIEN.firstName,
    lastName: ELLORIEN.lastName,
    ssn: ELLORIEN.ssn,
    address,
  },
  box1: 38000,
  box2: 1200,
  box3: 38000,
  box4: 2356,
  box5: 38000,
  box6: 551,
};

const child = {
  lastName: "Tarvale",
  livedInUs: true,
  usCitizenOrResident: true,
} as const;

/* Lives with Ellorien; Ellorien released the 2025 claim to Davin (alternate years). */
export const MIRA: DependentFactValue = {
  ...child,
  firstName: "Mira",
  ssn: "400-00-8341",
  relationship: "Daughter",
  dob: "03/14/2016",
  monthsLivedWithYou: 12,
  releasedToNoncustodialParent: true,
};

/* Lives with Davin; Davin signed Form 8332 for 2025, 2026 and 2027. */
export const TOBIN: DependentFactValue = {
  ...child,
  firstName: "Tobin",
  ssn: "400-00-8342",
  relationship: "Son",
  dob: "07/02/2013",
  monthsLivedWithYou: 4,
  form8332Release: true,
};

/* Lives with Ellorien; the earlier release to Davin was revoked in 2024. */
export const SENNA: DependentFactValue = {
  ...child,
  firstName: "Senna",
  ssn: "400-00-8343",
  relationship: "Daughter",
  dob: "11/20/2018",
  monthsLivedWithYou: 12,
};

/* What Davin signed for Tobin (the input document). */
export const TOBIN_RELEASE: Form8332ReleaseFactValue = {
  custodialParentSsn: DAVIN.ssn,
  currentYear: 2025,
  futureYears: [2026, 2027],
};

/* Ellorien's Part III for Senna, given to Davin in June 2024. */
export const SENNA_REVOCATION: Form8332RevocationFactValue = {
  noncustodialParentFirstName: DAVIN.firstName,
  noncustodialParentLastName: DAVIN.lastName,
  noncustodialParentSsn: DAVIN.ssn,
  revokedYears: "all_future_years",
  givenYear: 2024,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELLORIEN_USER_ID, taxYear: ELLORIEN_TAX_YEAR, suffix, value });

export const ellorienFacts: TaxFactRow[] = [
  idFact("name.first", ELLORIEN.firstName),
  idFact("name.last", ELLORIEN.lastName),
  idFact("ssn", ELLORIEN.ssn),
  idFact("dob", "08/09/1987"),
  idFact("address.street", ELLORIEN.street),
  idFact("address.city", ELLORIEN.city),
  idFact("address.state", ELLORIEN.state),
  idFact("address.zip", ELLORIEN.zip),
  idFact("occupation", "Medical assistant"),
  idFact("phone", "702-555-0183"),
  fact(
    "wages",
    makeW2FactKey("desert-willow-clinic"),
    clinicW2,
    "W-2 from Desert Willow Family Clinic.",
  ),
  fact("dependents", makeDependentFactKey("mira-tarvale"), MIRA, VERBAL),
  fact("dependents", makeDependentFactKey("tobin-tarvale"), TOBIN, VERBAL),
  fact("dependents", makeDependentFactKey("senna-tarvale"), SENNA, VERBAL),
  fact(
    "dependents",
    makeForm8332FactKey("release", "tobin-tarvale"),
    TOBIN_RELEASE,
    "Form 8332 signed by Davin Tarvale (docs/01-form-8332-tobin-tarvale.pdf).",
  ),
  fact(
    "dependents",
    makeForm8332FactKey("revocation", "senna-tarvale"),
    SENNA_REVOCATION,
    `${VERBAL}: Ellorien's copy of the Part III revocation she gave Davin in June 2024.`,
  ),
  fact(
    "filing_status",
    HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
    "mira-tarvale",
    `${VERBAL}: Mira is the qualifying person for head of household.`,
  ),
  fact("other", EIC_KEYS.nonresidentAlien, false, VERBAL),
  fact("other", EIC_KEYS.qualifyingChildOfAnother, false, VERBAL),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, VERBAL),
  fact("other", EIC_KEYS.barredByIrs, false, VERBAL),
];
