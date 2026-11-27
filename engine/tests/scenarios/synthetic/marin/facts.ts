/*
 * A made-up single filer (README.md): every name and amount is invented. No
 * input documents: the grove, its employees and its work opportunity credit
 * are the taxpayer's own answers from the books and the payroll records.
 */

import {
  makeEmpowermentZoneEmployeeFactKey,
  makeFarmFactKey,
  makeGeneralBusinessCreditFactKey,
  type EmpowermentZoneEmployeeFactValue,
  type FarmFactValue,
  type GeneralBusinessCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MARIN_USER_ID = "marin-integration";
export const MARIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MARIN_USER_ID,
  taxYear: MARIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MARIN = {
  taxpayer: { firstName: "Marin", lastName: "Velasquez", ssn: "400-00-8846" },
  street: "3120 N Tenth Street",
  city: "McAllen",
  state: "TX",
  zip: "78501",
};

export const FARM_KEY = makeFarmFactKey("rio-verde-citrus");

/* The work opportunity credit (Form 5884) the grove claims for Eliseo: 40% of $6,000. */
const WORK_OPPORTUNITY_CREDIT = 2400;

/* A citrus grove in the Rio Grande Valley empowerment zone (Hidalgo County). */
const grove: FarmFactValue = {
  owner: "taxpayer",
  activity: "Citrus groves",
  code: "111310",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 184000,
  expenses: {
    fertilizersAndLime: 12000,
    gasolineFuelAndOil: 6500,
    laborHired: 48000,
    repairs: 4000,
    utilities: 3000,
  },
  // Line 22: the Form 5884 credit for Eliseo's wages; Form 8844's is the engine's.
  employmentCredits: WORK_OPPORTUNITY_CREDIT,
  newDepreciableProperty: false,
  w2WagesPaid: 48000,
  qualifiedPropertyUbia: 0,
};

const employee = (
  value: Pick<
    EmpowermentZoneEmployeeFactValue,
    "name" | "livesAndWorksInZone" | "zoneWages" | "workOpportunityCreditWages"
  >,
): EmpowermentZoneEmployeeFactValue => ({
  employerKey: FARM_KEY,
  zone: "Rio Grande Valley, TX",
  fivePercentOwner: false,
  relatedToTaxpayer: false,
  excludedBusiness: false,
  employedAtLeast90Days: true,
  ...value,
});

/* The payroll records of the grove's three hands. */
export const EMPLOYEES: Record<string, EmpowermentZoneEmployeeFactValue> = {
  // Hired from a targeted group: $6,000 of his wages figure the work opportunity credit.
  "eliseo-cantu": employee({
    name: "Eliseo Cantu",
    livesAndWorksInZone: true,
    zoneWages: 21000,
    workOpportunityCreditWages: 6000,
  }),
  "nora-salinas": employee({ name: "Nora Salinas", livesAndWorksInZone: true, zoneWages: 12500 }),
  // Lives in Mission, outside the zone.
  "hector-pena": employee({ name: "Hector Pena", livesAndWorksInZone: false, zoneWages: 14500 }),
};

/* Form 3800 Part III line 4b: the work opportunity credit, stated as its Form 5884 total (no Form 5884 employee facts here). */
const workOpportunity: GeneralBusinessCreditFactValue = {
  sourceForm: "5884",
  line: "4b",
  amount: WORK_OPPORTUNITY_CREDIT,
  passive: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MARIN_USER_ID, taxYear: MARIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";
const PAYROLL = `${VERBAL}: the grove's 2025 payroll records and each hand's address.`;

export const marinFacts: TaxFactRow[] = [
  idFact("name.first", MARIN.taxpayer.firstName),
  idFact("name.last", MARIN.taxpayer.lastName),
  idFact("ssn", MARIN.taxpayer.ssn),
  idFact("dob", "08/03/1969"),
  idFact("address.street", MARIN.street),
  idFact("address.city", MARIN.city),
  idFact("address.state", MARIN.state),
  idFact("address.zip", MARIN.zip),
  idFact("occupation", "Citrus grower"),
  idFact("phone", "956-555-0146"),
  fact("self_employment", FARM_KEY, grove, `${VERBAL}: the grove's books.`),
  ...Object.entries(EMPLOYEES).map(([slug, value]) =>
    fact("self_employment", makeEmpowermentZoneEmployeeFactKey(slug), value, PAYROLL),
  ),
  fact(
    "other",
    makeGeneralBusinessCreditFactKey("rio-verde-work-opportunity"),
    workOpportunity,
    `${VERBAL}: Form 5884 for the grove, prepared with the targeted group certification.`,
  ),
];
