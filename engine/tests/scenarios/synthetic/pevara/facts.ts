/*
 * A made-up married couple (README.md): every name and amount is invented. The
 * two installer invoices are in docs/ (made by generate-docs.ts from the values
 * below). The W-2 and 1099-DIV facts are the boxes as the documents would print
 * them; the rest are the couple's answers.
 */

import {
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeDividendFactKey,
  makeRefuelingPropertyFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type DividendFactValue,
  type RefuelingPropertyFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const PEVARA_USER_ID = "pevara-integration";
export const PEVARA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: PEVARA_USER_ID,
  taxYear: PEVARA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const PEVARA = {
  firstName: "Pevara",
  lastName: "Halloran",
  ssn: "400-00-8911",
  street: "2207 Pecan Grove Lane",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

export const TEODOR = { firstName: "Teodor", lastName: "Halloran", ssn: "400-00-8912" };

const address = { line1: PEVARA.street, city: PEVARA.city, state: PEVARA.state, zip: PEVARA.zip };

// Pevara's W-2 from Colorado River Health Partners (made up).
const pevaraW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Colorado River Health Partners",
  employerEin: "00-0008911",
  employerAddress: { line1: "4100 Lamar Boulevard", city: "Austin", state: "TX", zip: "78756" },
  employee: { firstName: PEVARA.firstName, lastName: PEVARA.lastName, ssn: PEVARA.ssn, address },
  box1: 141000,
  box2: 19800,
  box3: 141000,
  box4: 8742,
  box5: 141000,
  box6: 2044.5,
};

// Teodor's W-2 from Balcones Survey Group (made up).
const teodorW2: W2FactValue = {
  owner: "spouse",
  employerName: "Balcones Survey Group LLC",
  employerEin: "00-0008912",
  employerAddress: { line1: "880 Ranch Road 620", city: "Austin", state: "TX", zip: "78734" },
  employee: { firstName: TEODOR.firstName, lastName: TEODOR.lastName, ssn: TEODOR.ssn, address },
  box1: 84000,
  box2: 9100,
  box3: 84000,
  box4: 5208,
  box5: 84000,
  box6: 1218,
};

/* A world stock index fund: box 7 foreign tax under $600 joint, so the election applies (Schedule 3 line 1). */
const fundDividends: DividendFactValue = {
  payerName: "Hill Country World Index Fund",
  payerTin: "00-0018911",
  box1a: 1300,
  box1b: 1100,
  box7: 95,
};

/* Their daughter, 9: a qualifying child for the child tax credit (Form 1040 line 19). */
const daughter: DependentFactValue = {
  firstName: "Liesel",
  lastName: "Halloran",
  ssn: "400-00-8913",
  relationship: "Daughter",
  dob: "05/17/2016",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

/*
 * Two charging ports at their home, each a single item with its own Schedule A.
 * The garage charger costs $4,150 with its panel and wiring: 30% is $1,245,
 * over the $1,000 limit. The driveway charger costs $2,080: 30% is $624.
 */
export const GARAGE_CHARGER: RefuelingPropertyFactValue = {
  description: "Level 2 charger, one port, garage wall",
  placedInServiceDate: "2025-04-11",
  constructionBeganDate: "2025-04-07",
  eligibleCensusTract: true,
  censusTractGeoid: "48453002424",
  cost: 4150,
  businessUsePercent: 0,
  mainHome: true,
};

export const DRIVEWAY_CHARGER: RefuelingPropertyFactValue = {
  description: "Level 2 charger, one port, driveway pedestal",
  placedInServiceDate: "2025-09-26",
  constructionBeganDate: "2025-09-22",
  eligibleCensusTract: true,
  censusTractGeoid: "48453002424",
  cost: 2080,
  businessUsePercent: 0,
  mainHome: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: PEVARA_USER_ID, taxYear: PEVARA_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", PEVARA.firstName),
  idFact("name.last", PEVARA.lastName),
  idFact("ssn", PEVARA.ssn),
  idFact("dob", "08/14/1984"),
  idFact("address.street", PEVARA.street),
  idFact("address.city", PEVARA.city),
  idFact("address.state", PEVARA.state),
  idFact("address.zip", PEVARA.zip),
  idFact("occupation", "Physical therapist"),
  idFact("phone", "512-555-0191"),
  fact("identity", SPOUSE_KEYS.firstName, TEODOR.firstName, "Stated by Pevara."),
  fact("identity", SPOUSE_KEYS.lastName, TEODOR.lastName, "Stated by Pevara."),
  fact("identity", SPOUSE_KEYS.occupation, "Land surveyor", "Stated by Pevara."),
  fact("identity", SPOUSE_KEYS.ssn, TEODOR.ssn, "Teodor's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "02/03/1982", "Stated by Teodor."),
];

export const pevaraFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact("wages", makeW2FactKey("colorado-river-health"), pevaraW2, `W-2, ${MADE_UP}.`),
  fact("wages", makeW2FactKey("balcones-survey"), teodorW2, `W-2, ${MADE_UP}.`),
  fact(
    "investment_income",
    makeDividendFactKey("hill-country-world-index"),
    fundDividends,
    `1099-DIV from Hill Country World Index Fund, ${MADE_UP}.`,
  ),
  fact("dependents", makeDependentFactKey("liesel-halloran"), daughter, MADE_UP),
  fact(
    "other",
    makeRefuelingPropertyFactKey("garage-charger"),
    GARAGE_CHARGER,
    "Installer's invoice (docs/01-invoice-garage-charger.pdf); census tract, main home and use stated by Pevara.",
  ),
  fact(
    "other",
    makeRefuelingPropertyFactKey("driveway-charger"),
    DRIVEWAY_CHARGER,
    "Installer's invoice (docs/02-invoice-driveway-charger.pdf); census tract, main home and use stated by Pevara.",
  ),
];
