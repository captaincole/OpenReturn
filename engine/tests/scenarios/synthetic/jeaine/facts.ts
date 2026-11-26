/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the W-2 boxes as they would read, her business's
 * books, her premium statements as she reads them, and her answers.
 */

import {
  CA_EITC_KEYS,
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  EIC_KEYS,
  makeBusinessFactKey,
  makeSelfEmployedHealthPlanFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type SelfEmployedHealthPlanFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JEAINE_USER_ID = "jeaine-integration";
export const JEAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Jeaine, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JEAINE_USER_ID,
  taxYear: JEAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JEAINE = {
  firstName: "Jeaine",
  lastName: "Valtessa",
  ssn: "400-00-7207",
  street: "918 Larkspur Glen Way",
  city: "Sacramento",
  state: "CA",
  zip: "95822",
};

const address = { line1: JEAINE.street, city: JEAINE.city, state: JEAINE.state, zip: JEAINE.zip };

/* Her part-time job at a bookbindery (made up): no health plan is open to part-time staff. */
const bindery: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Heritage Bindery LLC",
  employerEin: "00-0072071",
  employerAddress: {
    line1: "2200 Capitol Mall Annex",
    city: "Sacramento",
    state: "CA",
    zip: "95814",
  },
  employee: { firstName: JEAINE.firstName, lastName: JEAINE.lastName, ssn: JEAINE.ssn, address },
  box1: 52000,
  box2: 13000,
  box3: 52000,
  box4: 3224,
  box5: 52000,
  box6: 754,
  box15: "CA",
  box16: 52000,
  box17: 3300,
};

const BUSINESS_KEY = makeBusinessFactKey("valtessa-restoration");

/* Her book restoration business (Schedule C): the only source of self-employment income. */
const restoration: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Book and document restoration",
  code: "811490",
  name: "Valtessa Restoration",
  address: { street: JEAINE.street, city: JEAINE.city, state: JEAINE.state, zip: JEAINE.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 46000,
  expenses: { supplies: 6300, advertising: 1200, office: 2000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* A self-only policy in her own name, bought straight from the insurer (not the Marketplace). */
const healthPlan: SelfEmployedHealthPlanFactValue = {
  description: "Sierra Foothill Health bronze plan",
  establishedUnder: { kind: "schedule_c", factKey: BUSINESS_KEY },
  healthPremiums: 7980.36,
  throughMarketplace: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JEAINE_USER_ID, taxYear: JEAINE_TAX_YEAR, suffix, value });

export const jeaineFacts: TaxFactRow[] = [
  idFact("name.first", JEAINE.firstName),
  idFact("name.last", JEAINE.lastName),
  idFact("ssn", JEAINE.ssn),
  idFact("dob", "08/02/1983"),
  idFact("address.street", JEAINE.street),
  idFact("address.city", JEAINE.city),
  idFact("address.state", JEAINE.state),
  idFact("address.zip", JEAINE.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Book conservator"),
  idFact("phone", "916-555-0177"),
  fact(
    "wages",
    makeW2FactKey("delta-heritage-bindery"),
    bindery,
    "W-2 from Delta Heritage Bindery LLC.",
  ),
  fact(
    "self_employment",
    BUSINESS_KEY,
    restoration,
    `${VERBAL}: her books for Valtessa Restoration.`,
  ),
  fact(
    "health_coverage",
    makeSelfEmployedHealthPlanFactKey("sierra-foothill-bronze"),
    healthPlan,
    `${VERBAL}: Sierra Foothill Health premium statements; no employer plan open to her in 2025.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: covered by her own policy all year.`,
  ),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
  fact("other", EIC_KEYS.nonresidentAlien, false, VERBAL),
  fact("other", EIC_KEYS.qualifyingChildOfAnother, false, VERBAL),
  fact("other", EIC_KEYS.claimableAsDependent, false, VERBAL),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, VERBAL),
  fact("other", CA_EITC_KEYS.ftbDisallowedEarlierYear, false, VERBAL),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: an independent contractor for California too.`,
  ),
];
