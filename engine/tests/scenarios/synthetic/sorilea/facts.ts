/*
 * A made-up taxpayer (README.md): every name, amount and disaster is invented
 * (the FEMA number DR-9930-WA is not a real disaster). The amounts follow
 * Example 1 of the Form 8606 instructions for line 15b
 * (irs-8606-inst-2025::sec::example-1-in-february-2025-an-11-000::b01). No
 * input documents: the facts are the 1099-R boxes as the documents would
 * print them, and the taxpayer's answers.
 */

import {
  makeDisasterRetirementFactKey,
  makeRetirementDistributionFactKey,
  makeTraditionalIraFactKey,
  makeW2FactKey,
  type DisasterRetirementFactValue,
  type RetirementDistributionFactValue,
  type TraditionalIraFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SORILEA_USER_ID = "sorilea-integration";
export const SORILEA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SORILEA_USER_ID,
  taxYear: SORILEA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const SORILEA = {
  firstName: "Sorilea",
  lastName: "Haldane",
  ssn: "400-00-8916",
  street: "903 Cascade Ridge Lane",
  city: "Wenatchee",
  state: "WA",
  zip: "98801",
};

const address = {
  line1: SORILEA.street,
  city: SORILEA.city,
  state: SORILEA.state,
  zip: SORILEA.zip,
};

// W-2 from Columbia Orchard Cooperative (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Columbia Orchard Cooperative",
  employerEin: "00-0008916",
  employerAddress: { line1: "12 Packing House Road", city: "Wenatchee", state: "WA", zip: "98801" },
  employee: { firstName: SORILEA.firstName, lastName: SORILEA.lastName, ssn: SORILEA.ssn, address },
  box1: 40000,
  box2: 3100,
  box3: 40000,
  box4: 2480,
  box5: 40000,
  box6: 580,
};

/* 1099-R: a February distribution, unrelated to the disaster (code 7, normal: she is 64). */
const februaryIra: RetirementDistributionFactValue = {
  payerName: "Wenatchee Valley Savings Bank",
  owner: "taxpayer",
  box1: 11000,
  box2b: { taxableAmountNotDetermined: true },
  box2a: 11000,
  box4: 1100,
  box7: "7",
  box7IraSepSimple: true,
};

/* 1099-R: the September distribution she treats as a qualified disaster distribution. */
const septemberIra: RetirementDistributionFactValue = {
  payerName: "North Cascades Investment Trust",
  owner: "taxpayer",
  box1: 22000,
  box2b: { taxableAmountNotDetermined: true },
  box2a: 22000,
  box4: 2200,
  box7: "7",
  box7IraSepSimple: true,
};

export const FEBRUARY_IRA_KEY = makeRetirementDistributionFactKey("wenatchee-valley", "february");
export const SEPTEMBER_IRA_KEY = makeRetirementDistributionFactKey("north-cascades", "september");

/* Form 8606 answers: $3,000 of basis from earlier nondeductible contributions; the IRAs are empty at year end. */
const traditionalIraAnswers: TraditionalIraFactValue = {
  nondeductibleContributions: 0,
  basisPriorYears: 3000,
  yearEndValue: 0,
};

/* Form 8915-F (2025 disasters): one 2025 wildfire, distribution period through November 3, 2025. */
export const DISASTER_FORM: DisasterRetirementFactValue = {
  owner: "taxpayer",
  disasterYear: 2025,
  disasters: [
    {
      femaNumber: "DR-9930-WA",
      declarationDate: "2025-05-08",
      beginningDate: "2025-03-14",
      endingDate: "2025-04-02",
      mainHomeInAreaWithLoss: true,
    },
  ],
  qualifiedDisasterDistributions: [{ distributionKey: SEPTEMBER_IRA_KEY, date: "2025-09-12" }],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SORILEA_USER_ID, taxYear: SORILEA_TAX_YEAR, suffix, value });

export const sorileaFacts: TaxFactRow[] = [
  idFact("name.first", SORILEA.firstName),
  idFact("name.last", SORILEA.lastName),
  idFact("ssn", SORILEA.ssn),
  idFact("dob", "07/19/1961"),
  idFact("address.street", SORILEA.street),
  idFact("address.city", SORILEA.city),
  idFact("address.state", SORILEA.state),
  idFact("address.zip", SORILEA.zip),
  idFact("occupation", "Orchard manager"),
  idFact("phone", "509-555-0164"),
  fact("wages", makeW2FactKey("columbia-orchard"), w2, "W-2 from Columbia Orchard Cooperative."),
  fact("retirement", FEBRUARY_IRA_KEY, februaryIra, "1099-R from Wenatchee Valley Savings Bank."),
  fact(
    "retirement",
    SEPTEMBER_IRA_KEY,
    septemberIra,
    "1099-R from North Cascades Investment Trust.",
  ),
  fact(
    "retirement",
    makeTraditionalIraFactKey("taxpayer"),
    traditionalIraAnswers,
    "Stated by Sorilea: no contributions for 2025; $3,000 basis on her 2024 Form 8606 line 14; IRAs worth $0 on December 31, 2025.",
  ),
  fact(
    "retirement",
    makeDisasterRetirementFactKey("taxpayer-2025"),
    DISASTER_FORM,
    "Stated by Sorilea: the wildfire damaged her home in March 2025; she treats the September IRA withdrawal as a qualified disaster distribution.",
  ),
];
