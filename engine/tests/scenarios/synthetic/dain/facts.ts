/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * two facility facts are what Dain states from the facilities' meter and
 * sales records, the IRS acceptance letter (Notice 2023-24) and the NRC
 * license; no official form holds them. The Schedule K-1 (Form 1065) is a
 * made PDF in docs/ (generate-docs.ts).
 */

import {
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makeNuclearFacilityFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type K1HoldingFactValue,
  type NuclearFacilityFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DAIN_USER_ID = "dain-synthetic";
export const DAIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DAIN_USER_ID,
  taxYear: DAIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DAIN = {
  firstName: "Dain",
  lastName: "Thornvale",
  ssn: "400-00-7213",
  street: "418 Paluxy Ridge Road",
  city: "Granbury",
  state: "TX",
  zip: "76048",
};

const address = { line1: DAIN.street, city: DAIN.city, state: DAIN.state, zip: DAIN.zip };

// Dain's W-2 from a reactor engineering firm (made up).
const dainW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Brazos Reactor Engineering Inc",
  employerEin: "00-0007213",
  employerAddress: {
    line1: "1200 Lake Granbury Parkway",
    city: "Granbury",
    state: "TX",
    zip: "76048",
  },
  employee: { firstName: DAIN.firstName, lastName: DAIN.lastName, ssn: DAIN.ssn, address },
  box1: 400000,
  box2: 120000,
  box3: 176100,
  box4: 10918.2,
  box5: 400000,
  box6: 7550,
  box13: { retirementPlan: false },
};

export const BUSINESS_ID = "thornvale-generation";
export const BUSINESS_KEY = makeBusinessFactKey(BUSINESS_ID);

/*
 * The single-member LLC that holds his two undivided reactor shares: it sells
 * the shares' electricity ($180,000 from the advanced reactor, $210,000 from
 * the older station, ZEC payments included).
 */
const generation: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Nuclear electric power generation",
  code: "221113",
  name: "Thornvale Generation LLC",
  address: { street: DAIN.street, city: DAIN.city, state: DAIN.state, zip: DAIN.zip },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 390000,
  expenses: {
    insurance: 45000,
    legalAndProfessional: 8000,
    repairs: 150000,
    taxesAndLicenses: 25000,
    utilities: 12000,
  },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

export const ADVANCED_KEY = makeNuclearFacilityFactKey("brazos-bend-unit-1");
export const STATION_KEY = makeNuclearFacilityFactKey("pecos-valley-unit-2");

/*
 * Part I: a 0.5 MW undivided share of a 1,100 MW advanced reactor. The IRS
 * allocated only 0.4 MW of facility limitation to the share (a final recipient
 * of the unutilized NMCL), so line 3 is 80% and the annual limit binds.
 */
export const advancedReactor: NuclearFacilityFactValue = {
  facility: {
    name: "Brazos Bend Advanced Reactor Unit 1, undivided ownership share",
    address: { street: "9500 County Road 302", city: "Glen Rose", state: "TX", zip: "76043" },
    coordinates: { latitude: 32.2981, longitude: -97.7853 },
  },
  credit: {
    section: "45J",
    constructionBegan: "2016-03-01",
    placedInService: "2024-04-29",
    nameplateCapacityMw: 1100,
    ownedNameplateCapacityMw: 0.5,
    acceptanceLetterDate: "2024-08-15",
    facilityLimitationMw: 0.4,
    role: "owner",
    section761aElection: false,
    kwhProducedAndSold: 4000000,
  },
  passive: false,
};

/*
 * Part II: an undivided share of a 1990 station. Its $210,000 of receipts
 * include $30,000 of state ZEC payments that the credit does not reduce, so
 * line 6 keeps them. He meets the prevailing wage requirements (line 11 × 5)
 * and sold $10,000 of the credit under section 6418.
 */
export const olderStation: NuclearFacilityFactValue = {
  facility: {
    name: "Pecos Valley Nuclear Generating Station Unit 2, undivided ownership share",
    owner: { name: "Thornvale Generation LLC", tin: "00-0007214" },
    address: {
      street: "4400 Farm to Market Road 1776",
      city: "Monahans",
      state: "TX",
      zip: "79756",
    },
    coordinates: { latitude: 31.5946, longitude: -102.8921 },
  },
  credit: {
    section: "45U",
    placedInService: "1990-06-15",
    nrcLicenseNumber: "NPF-0972",
    kwhProducedAndSold: 6000000,
    grossReceipts: 210000,
    zecPayments: 30000,
    zecPaymentsReducedByFullCredit: false,
    prevailingWage: true,
    transfer: { direction: "sold", amount: 10000, registrationNumber: "N2505721300001" },
  },
  passive: false,
};

export const ISOTOPE_ID = "llano-isotope-partners";
export const ISOTOPE_EIN = "00-0007215";

/*
 * A partnership that owns other reactor shares, where Dain is a general
 * partner. Its only K-1 items are box 15 code B (section 45J) and code A
 * (section 45U).
 */
export const isotopeK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Llano Isotope Partners LP",
  entityEin: ISOTOPE_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 2,
  lossPercent: 2,
  capitalPercent: 2,
  boxes: [
    { box: "15", code: "A", amount: 2000 },
    { box: "15", code: "B", amount: 3000 },
  ],
};

const isotopeHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DAIN_USER_ID, taxYear: DAIN_TAX_YEAR, suffix, value });

const FACILITY_NOTE = `${VERBAL}: the facility's meter and sales records, the IRS acceptance letter and the NRC license.`;

export const dainFacts: TaxFactRow[] = [
  idFact("name.first", DAIN.firstName),
  idFact("name.last", DAIN.lastName),
  idFact("ssn", DAIN.ssn),
  idFact("dob", "02/11/1979"),
  idFact("address.street", DAIN.street),
  idFact("address.city", DAIN.city),
  idFact("address.state", DAIN.state),
  idFact("address.zip", DAIN.zip),
  idFact("occupation", "Reactor engineer"),
  idFact("phone", "817-555-0172"),
  fact(
    "wages",
    makeW2FactKey("brazos-reactor-engineering"),
    dainW2,
    "W-2 from Brazos Reactor Engineering.",
  ),
  fact("self_employment", BUSINESS_KEY, generation, `${VERBAL}: the LLC's books.`),
  fact("other", ADVANCED_KEY, advancedReactor, FACILITY_NOTE),
  fact("other", STATION_KEY, olderStation, FACILITY_NOTE),
  fact(
    "k1",
    makePartnershipK1FactKey(ISOTOPE_ID),
    isotopeK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-llano-isotope-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(ISOTOPE_ID), isotopeHolding, VERBAL),
];
