/*
 * A made-up couple (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the documents would print them, and
 * the adoption answers as Cade would record them.
 */

import {
  ADOPTION_KEYS,
  makeAdoptionChildFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  SPOUSE_KEYS,
  type AdoptionChildFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ISOLDE_USER_ID = "isolde-integration";
export const ISOLDE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ISOLDE_USER_ID,
  taxYear: ISOLDE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HOUSEHOLD = {
  taxpayer: { firstName: "Isolde", lastName: "Albescu", ssn: "400-00-8839" },
  spouse: { firstName: "Tobiah", lastName: "Albescu", ssn: "400-00-8840" },
  street: "1717 Cypress Creek Lane",
  city: "Houston",
  state: "TX",
  zip: "77008",
};

const address = {
  line1: HOUSEHOLD.street,
  city: HOUSEHOLD.city,
  state: HOUSEHOLD.state,
  zip: HOUSEHOLD.zip,
};

/* Isolde's W-2 (made up): box 12 code T, adoption benefits, is not in box 1 but is in boxes 3 and 5. */
const isoldeW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Larkspur Biomedical Inc",
  employerEin: "00-0008839",
  employerAddress: { line1: "48 Research Parkway", city: "Houston", state: "TX", zip: "77030" },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 168000,
  box2: 31000,
  box3: 176100,
  box4: 10918.2,
  box5: 183500,
  box6: 2660.75,
  box12: [{ code: "T", amount: 15500 }],
};

/* Tobiah's W-2 (made up). */
const tobiahW2: W2FactValue = {
  owner: "spouse",
  employerName: "Gulf Arc Engineering LLC",
  employerEin: "00-0008840",
  employerAddress: { line1: "900 Ship Channel Road", city: "Houston", state: "TX", zip: "77029" },
  employee: { ...HOUSEHOLD.spouse, address },
  box1: 64000,
  box2: 7200,
  box3: 64000,
  box4: 3968,
  box5: 64000,
  box6: 928,
};

/* 1099-INT (made up). */
const interest: InterestFactValue = { payerName: "Bayou Treasury Direct Savings", box1: 34000 };

/*
 * Child 1: a U.S. child with special needs, adoption final in 2025. A 2024 Form
 * 8839 was filed for her (Part III only): lines 3 + 6 were 0, lines 20 + 24 were
 * 2,000. The employer paid 3,000 of the 2025 code T benefits for her.
 */
const juniper: AdoptionChildFactValue = {
  firstName: "Juniper",
  lastName: "Albescu",
  birthYear: 2017,
  specialNeeds: true,
  tin: "400-00-8841",
  finalYear: 2025,
  expensesPaid2025: 1800,
  priorYearCredit: 0,
  priorYearBenefits: 2000,
  employerBenefits2025: 3000,
};

/* Child 2: a foreign child (non-Hague), final in 2025; every year's expenses count. */
const ines: AdoptionChildFactValue = {
  firstName: "Ines",
  lastName: "Albescu",
  birthYear: 2021,
  foreign: true,
  tin: "900-70-8842",
  finalYear: 2025,
  expensesPaidBefore2024: 4200,
  expensesPaid2024: 3850.4,
  expensesPaid2025: 2975.35,
  employerBenefits2025: 12500,
};

/*
 * Child 3: a U.S. child, adoption not final at the end of 2025. The 2023
 * expenses were claimed on the 2024 Form 8839 (lines 3 + 6 = 2,400); the 2024
 * expenses count now, the 2025 ones next year.
 */
const rowan: AdoptionChildFactValue = {
  firstName: "Rowan",
  lastName: "Pell",
  birthYear: 2024,
  tin: "900-93-8843",
  expensesPaid2024: 6820,
  expensesPaid2025: 3100,
  priorYearCredit: 2400,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ISOLDE_USER_ID, taxYear: ISOLDE_TAX_YEAR, suffix, value });

const ANSWERS = "Stated in conversation, 2026-11-21 (made up)";

export const isoldeFacts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "04/02/1984"),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("occupation", "Lab director"),
  idFact("phone", "713-555-0188"),
  fact("identity", SPOUSE_KEYS.firstName, HOUSEHOLD.spouse.firstName, "W-2 from Gulf Arc."),
  fact("identity", SPOUSE_KEYS.lastName, HOUSEHOLD.spouse.lastName, "W-2 from Gulf Arc."),
  fact("identity", SPOUSE_KEYS.occupation, "Structural engineer", "Verbal."),
  fact("identity", SPOUSE_KEYS.ssn, HOUSEHOLD.spouse.ssn, "W-2 from Gulf Arc."),
  fact("identity", SPOUSE_KEYS.dob, "11/19/1982", ANSWERS),
  fact("wages", makeW2FactKey("larkspur-biomedical"), isoldeW2, "W-2 from Larkspur Biomedical."),
  fact("wages", makeW2FactKey("gulf-arc"), tobiahW2, "W-2 from Gulf Arc Engineering."),
  fact(
    "investment_income",
    makeInterestFactKey("bayou-treasury"),
    interest,
    "1099-INT from Bayou Treasury Direct Savings.",
  ),
  fact("dependents", makeAdoptionChildFactKey("juniper"), juniper, `${ANSWERS}: Juniper.`),
  fact("dependents", makeAdoptionChildFactKey("ines"), ines, `${ANSWERS}: Ines.`),
  fact("dependents", makeAdoptionChildFactKey("rowan"), rowan, `${ANSWERS}: Rowan.`),
  fact(
    "dependents",
    ADOPTION_KEYS.creditCarryforward,
    1150,
    `${ANSWERS}: line 23 of the 2024 carryforward worksheet.`,
  ),
];
