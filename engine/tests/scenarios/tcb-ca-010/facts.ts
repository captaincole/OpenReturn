/*
 * Source: TaxCalcBench ty25-ca-010 (README.md). Document facts copy the PDF in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  CA_EITC_KEYS,
  EIC_KEYS,
  makeW2FactKey,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_010_USER_ID = "tcb-ca-010-integration";
export const TCB_CA_010_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_010_USER_ID,
  taxYear: TCB_CA_010_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the W-2 prints her. */
const TAXPAYER = { firstName: "CA", lastName: "TEST", ssn: "900-45-6789" };
const ADDRESS = { line1: "ABC", city: "AAA", state: "CA", zip: "90011" };

// docs/01-employer-w2.pdf
const employerW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Employer",
  employerEin: "12-3456789",
  employerAddress: { line1: "Address", city: "City", state: "CA", zip: "90011" },
  employee: { ...TAXPAYER, address: ADDRESS },
  box1: 13000,
  box2: 1000,
  box3: 13000,
  box4: 806,
  box5: 13000,
  box6: 189,
  box7: 0,
  box8: 0,
  box10: 0,
  box11: 0,
  box15: "CA",
  box16: 13000,
  box17: 0,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_CA_010_USER_ID, taxYear: TCB_CA_010_TAX_YEAR, suffix, value });

export const tcbCa010Facts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "12/12/2003"),
  idFact("address.street", ADDRESS.line1),
  idFact("address.city", ADDRESS.city),
  idFact("address.state", ADDRESS.state),
  idFact("address.zip", ADDRESS.zip),
  idFact("address.county", "Lake"),
  fact(
    "wages",
    makeW2FactKey("employer"),
    employerW2,
    "W-2 from Employer (docs/01-employer-w2.pdf).",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  /* The earned income credit answers (1040 line 27a, FTB 3514 Steps 1 and 4). */
  fact("other", EIC_KEYS.nonresidentAlien, false, `${ANSWERS}: irs1040.nonresident_alien.`),
  fact("other", EIC_KEYS.mainHomeInUs, true, `${ANSWERS}: irs1040.main_home_not_us is false.`),
  fact("other", EIC_KEYS.claimableAsDependent, false, `${ANSWERS}: irs1040.tp_dependent.`),
  fact(
    "other",
    EIC_KEYS.qualifyingChildOfAnother,
    false,
    "Not in the case: the key's FTB 3514 credit means she is not a qualifying child of another person.",
  ),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, `${ANSWERS}: irs1040.credit_denied_reduced.`),
  fact("other", EIC_KEYS.barredByIrs, false, `${ANSWERS}: irs1040.eic_not_allowed.`),
  fact(
    "other",
    CA_EITC_KEYS.ftbDisallowedEarlierYear,
    false,
    `${ANSWERS}: ca_form3514.prior_disallow_ca_eic_input.`,
  ),
  fact(
    "other",
    CA_EITC_KEYS.fosterYouthTaxpayer,
    false,
    "Not in the case: the key claims no Foster Youth Tax Credit (FTB 3514 Part IX).",
  ),
];
