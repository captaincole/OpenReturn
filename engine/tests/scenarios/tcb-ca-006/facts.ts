/*
 * Source: TaxCalcBench ty25-ca-006 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import { SPOUSE_KEYS, makeW2FactKey, type W2FactValue } from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_006_USER_ID = "tcb-ca-006-integration";
export const TCB_CA_006_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const KEY_HEADER = "The key's CA return header (output.xml)";
const EMPLOYER_EIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_006_USER_ID,
  taxYear: TCB_CA_006_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The couple as the W-2s print them. */
const HOUSEHOLD = {
  taxpayer: { firstName: "Jimmy", lastName: "Jones", ssn: "900-45-6789" },
  spouse: { firstName: "Debbie", lastName: "Jones", ssn: "900-45-6789" },
  street: "389 Davant Street",
  city: "Cape Canaveral",
  state: "CA",
  zip: "94117",
};

const address = {
  line1: HOUSEHOLD.street,
  city: HOUSEHOLD.city,
  state: HOUSEHOLD.state,
  zip: HOUSEHOLD.zip,
};

/*
 * docs/01-starbucks-w2.pdf. The PDF prints "CASDI 546" in the box 12d slot; box 12
 * takes only the IRS letter codes, and the key reads it as state disability
 * insurance, so the fact holds it in box 14 (README.md).
 */
const starbucksW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Starbucks",
  employerEin: EMPLOYER_EIN,
  employerAddress: {
    line1: "101 Cape Canaveral Way",
    city: "Cape Canaveral",
    state: "FL",
    zip: "32920",
  },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 54600,
  box2: 4510,
  box3: 54600,
  box4: 3385,
  box5: 54600,
  box6: 791,
  box14: [{ label: "CASDI", amount: 546 }],
  box15: "CA",
  box16: 54600,
  box17: 3520,
};

/*
 * docs/02-microsoft-w2.pdf (the spouse's). The PDF prints "VP 725" in the box 12d
 * slot; the key reads it as a voluntary disability plan, so the fact holds it in box 14.
 */
const microsoftW2: W2FactValue = {
  owner: "spouse",
  employerName: "Microsoft",
  employerEin: EMPLOYER_EIN,
  employerAddress: { line1: "2610 Kings Drive", city: "Sacramento", state: "CA", zip: "94240" },
  employee: { ...HOUSEHOLD.spouse, address },
  box1: 43500,
  box2: 5200,
  box3: 43500,
  box4: 2697,
  box5: 43500,
  box6: 631,
  box14: [
    { label: "Other Deduction", amount: 105 },
    { label: "VP", amount: 725 },
  ],
  box15: "CA",
  box16: 43500,
  box17: 740,
};

const idFact = (suffix: string, value: string, sourceNote?: string) =>
  identityFact({
    userId: TCB_CA_006_USER_ID,
    taxYear: TCB_CA_006_TAX_YEAR,
    suffix,
    value,
    sourceNote,
  });

export const tcbCa006Facts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  /* The W-2 prints no initial; the key's header (and last year's 1040) give "T". */
  idFact("name.middle_initial", "T", `${KEY_HEADER}: Filer/Primary/MiddleInitial.`),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "02/01/1992", `${ANSWERS}: tp_date_of_birth.`),
  idFact("address.street", HOUSEHOLD.street),
  /* The W-2s print no apartment; the key's header (and last year's 1040) give 10B. */
  idFact("address.apt", "10B", `${KEY_HEADER}: Filer/USAddress/AptNumber.`),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("address.county", "Sacramento", `${ANSWERS}: ca_form540.county_in_ca.`),
  fact(
    "identity",
    SPOUSE_KEYS.firstName,
    HOUSEHOLD.spouse.firstName,
    "W-2 from Microsoft (docs/02).",
  ),
  fact(
    "identity",
    SPOUSE_KEYS.lastName,
    HOUSEHOLD.spouse.lastName,
    "W-2 from Microsoft (docs/02).",
  ),
  fact("identity", SPOUSE_KEYS.ssn, HOUSEHOLD.spouse.ssn, "W-2 from Microsoft (docs/02)."),
  fact("identity", SPOUSE_KEYS.dob, "06/15/1993", `${ANSWERS}: sp_date_of_birth.`),
  fact(
    "wages",
    makeW2FactKey("starbucks"),
    starbucksW2,
    "W-2 from Starbucks (docs/01-starbucks-w2.pdf).",
  ),
  fact(
    "wages",
    makeW2FactKey("microsoft"),
    microsoftW2,
    "W-2 from Microsoft (docs/02-microsoft-w2.pdf).",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 12, `${ANSWERS}: ca_form540.use_tax.`),
];
