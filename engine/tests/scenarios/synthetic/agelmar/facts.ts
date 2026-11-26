/*
 * A made-up taxpayer (README.md): every name, amount and disaster is invented
 * (the FEMA numbers DR-9917-FL and DR-9922-FL are not real disasters). No input
 * documents: the facts are the 1099-R boxes as the documents would print them,
 * and the taxpayer's answers about the disasters and earlier Forms 8915-F.
 */

import {
  makeDisasterRetirementFactKey,
  makeRetirementDistributionFactKey,
  makeW2FactKey,
  type DisasterRetirementFactValue,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const AGELMAR_USER_ID = "agelmar-integration";
export const AGELMAR_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: AGELMAR_USER_ID,
  taxYear: AGELMAR_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const AGELMAR = {
  firstName: "Agelmar",
  lastName: "Tolliver",
  ssn: "400-00-8915",
  street: "418 Bayou Crest Road",
  city: "Pensacola",
  state: "FL",
  zip: "32507",
};

const address = {
  line1: AGELMAR.street,
  city: AGELMAR.city,
  state: AGELMAR.state,
  zip: AGELMAR.zip,
};

// W-2 from Perdido Marine Electric (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Perdido Marine Electric LLC",
  employerEin: "00-0008915",
  employerAddress: { line1: "77 Wharf Street", city: "Pensacola", state: "FL", zip: "32502" },
  employee: { firstName: AGELMAR.firstName, lastName: AGELMAR.lastName, ssn: AGELMAR.ssn, address },
  box1: 68000,
  box2: 7200,
  box3: 68000,
  box4: 4216,
  box5: 68000,
  box6: 986,
};

/* 1099-R: an early 401(k) distribution with $1,200 of after-tax contributions (box 5). */
const marine401k: RetirementDistributionFactValue = {
  payerName: "Panhandle Retirement Services",
  planName: "Gulf Coast Marine 401(k) Plan",
  owner: "taxpayer",
  box1: 15000,
  box2a: 13800,
  box4: 3000,
  box5: 1200,
  box7: "1",
  box7IraSepSimple: false,
  box13: "2025-02-14",
};

/* 1099-R: an early traditional IRA distribution. */
const traditionalIra: RetirementDistributionFactValue = {
  payerName: "Emerald Coast Trust Company",
  owner: "taxpayer",
  box1: 25000,
  box2a: 25000,
  box4: 2500,
  box7: "1",
  box7IraSepSimple: true,
  box13: "2025-03-03",
};

/* 1099-R: a 401(k) hardship distribution for a house the disaster kept from being built. */
const hardship401k: RetirementDistributionFactValue = {
  payerName: "Pelican Plan Administrators",
  planName: "Bayline Shipyard 401(k) Plan",
  owner: "taxpayer",
  box1: 12000,
  box2a: 11400,
  box4: 2400,
  box5: 600,
  box7: "1",
  box7IraSepSimple: false,
  box13: "2025-01-20",
};

export const MARINE_401K_KEY = makeRetirementDistributionFactKey("panhandle-retirement", "early");
export const TRADITIONAL_IRA_KEY = makeRetirementDistributionFactKey(
  "emerald-coast-trust",
  "early",
);
export const HARDSHIP_401K_KEY = makeRetirementDistributionFactKey("pelican-plan", "hardship");

/*
 * Form 8915-F (2024 disasters): two Florida storms of 2024. The first was on
 * the 2024 Form 8915-F, with $8,000 of qualified disaster distributions in
 * 2024 ($6,000 from the 401(k), $2,000 from the IRA, both spread over 3 years).
 */
export const DISASTER_FORM: DisasterRetirementFactValue = {
  owner: "taxpayer",
  disasterYear: 2024,
  disasters: [
    {
      femaNumber: "DR-9917-FL",
      declarationDate: "2024-10-11",
      beginningDate: "2024-10-07",
      endingDate: "2024-11-08",
      mainHomeInAreaWithLoss: true,
      onEarlierForm8915F: true,
      earlierQualifiedDisasterDistributions: 8000,
    },
    {
      femaNumber: "DR-9922-FL",
      declarationDate: "2025-01-10",
      beginningDate: "2024-12-27",
      endingDate: "2025-01-31",
      mainHomeInAreaWithLoss: true,
      onEarlierForm8915F: false,
    },
  ],
  qualifiedDisasterDistributions: [
    { distributionKey: MARINE_401K_KEY, date: "2025-02-14" },
    { distributionKey: TRADITIONAL_IRA_KEY, date: "2025-03-03" },
  ],
  homePurchaseDistributions: [
    { distributionKey: HARDSHIP_401K_KEY, date: "2025-01-20", repaid: 5000 },
  ],
  lastYearForm: { line11: 2000, line13: 2000, line22: 667, line24: 667, line25: 1000 },
  repaymentsThisYear: { plan: 1500 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: AGELMAR_USER_ID, taxYear: AGELMAR_TAX_YEAR, suffix, value });

export const agelmarFacts: TaxFactRow[] = [
  idFact("name.first", AGELMAR.firstName),
  idFact("name.last", AGELMAR.lastName),
  idFact("ssn", AGELMAR.ssn),
  idFact("dob", "05/14/1980"),
  idFact("address.street", AGELMAR.street),
  idFact("address.city", AGELMAR.city),
  idFact("address.state", AGELMAR.state),
  idFact("address.zip", AGELMAR.zip),
  idFact("occupation", "Marine electrician"),
  idFact("phone", "850-555-0191"),
  fact("wages", makeW2FactKey("perdido-marine"), w2, "W-2 from Perdido Marine Electric."),
  fact("retirement", MARINE_401K_KEY, marine401k, "1099-R from Panhandle Retirement Services."),
  fact(
    "retirement",
    TRADITIONAL_IRA_KEY,
    traditionalIra,
    "1099-R from Emerald Coast Trust Company.",
  ),
  fact("retirement", HARDSHIP_401K_KEY, hardship401k, "1099-R from Pelican Plan Administrators."),
  fact(
    "retirement",
    makeDisasterRetirementFactKey("taxpayer-2024"),
    DISASTER_FORM,
    "Stated by Agelmar: both storms damaged his home; the 401(k) and IRA withdrawals are qualified disaster distributions; the hardship withdrawal was for a house the second storm kept from being built, $5,000 repaid in May 2025; $1,500 of the 401(k) withdrawal repaid in March 2026; lines from his 2024 Form 8915-F.",
  ),
];
