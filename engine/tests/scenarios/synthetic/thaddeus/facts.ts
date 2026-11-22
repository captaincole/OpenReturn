/*
 * A made-up married couple (README.md): every name and amount is invented. No
 * input documents: the facts are the boxes as the documents would print them,
 * and the answers the couple states.
 */

import {
  ARCHER_MSA_KEYS,
  LTC_KEYS,
  makeHsaDistributionFactKey,
  makeLtcBenefitsFactKey,
  makeW2FactKey,
  MEDICARE_ADVANTAGE_MSA_KEYS,
  SPOUSE_KEYS,
  type ArcherMsaCoveragePeriod,
  type HsaDistributionFactValue,
  type LtcBenefitsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const THADDEUS_USER_ID = "thaddeus-integration";
export const THADDEUS_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: THADDEUS_USER_ID,
  taxYear: THADDEUS_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const THADDEUS = {
  firstName: "Thaddeus",
  lastName: "Brightwater",
  ssn: "400-00-8853",
  spouseFirstName: "Marguerite",
  spouseSsn: "400-00-8854",
  street: "4417 Alder Crest Lane",
  city: "Tacoma",
  state: "WA",
  zip: "98407",
};

const address = {
  line1: THADDEUS.street,
  city: THADDEUS.city,
  state: THADDEUS.state,
  zip: THADDEUS.zip,
};

// W-2 from Puget Cedar Joinery, a small employer with an HDHP (made up). No box 12 code R.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Puget Cedar Joinery LLC",
  employerEin: "00-0008853",
  employerAddress: { line1: "2810 Harbor Mill Road", city: "Tacoma", state: "WA", zip: "98421" },
  employee: {
    firstName: THADDEUS.firstName,
    lastName: THADDEUS.lastName,
    ssn: THADDEUS.ssn,
    address,
  },
  box1: 142000,
  box2: 21000,
  box3: 142000,
  box4: 8804,
  box5: 142000,
  box6: 2059,
};

// 1099-SA, Thaddeus's Archer MSA: a normal distribution (code 1).
const thaddeusArcher: HsaDistributionFactValue = {
  payerName: "Cascade Health Trust",
  box1: 4850,
  box3: "1",
  box5: "Archer MSA",
  owner: "taxpayer",
};

// 1099-SA, Marguerite's Archer MSA from before Medicare: code 1; she rolled $1,000 to another Archer MSA.
const margueriteArcher: HsaDistributionFactValue = {
  payerName: "Sound Savings Bank",
  box1: 3000,
  box3: "1",
  box5: "Archer MSA",
  owner: "spouse",
};

// Two 1099-SAs, Marguerite's Medicare Advantage MSA: one normal (code 1), one after her disability (code 3).
const margueriteMaNormal: HsaDistributionFactValue = {
  payerName: "Evergreen Medicare MSA Custodian",
  box1: 5200,
  box3: "1",
  box5: "MA MSA",
  owner: "spouse",
};
const margueriteMaDisability: HsaDistributionFactValue = {
  payerName: "Evergreen Medicare MSA Custodian",
  box1: 1800,
  box3: "3",
  box5: "MA MSA",
  owner: "spouse",
};

// 1099-LTCs for Marguerite's mother: a qualified LTC contract and a life policy's accelerated death benefits.
const insured = { insuredName: "Ilse Varnholt", insuredSsn: "400-00-8855" };
const ltcContract: LtcBenefitsFactValue = {
  payerName: "Mount Rainier Mutual Insurance",
  owner: "spouse",
  ...insured,
  box1: 48000,
  box3: "per_diem",
  box4: true,
  box5: "chronically_ill",
};
const lifePolicy: LtcBenefitsFactValue = {
  payerName: "Olympic Life Assurance",
  owner: "spouse",
  ...insured,
  box1: 0,
  box2: 6000,
  box3: "per_diem",
  box5: "chronically_ill",
};

const coverage: ArcherMsaCoveragePeriod[] = [
  { months: 12, coverage: "self-only", annualDeductible: 3600, owner: "taxpayer" },
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: THADDEUS_USER_ID, taxYear: THADDEUS_TAX_YEAR, suffix, value });

export const thaddeusFacts: TaxFactRow[] = [
  idFact("name.first", THADDEUS.firstName),
  idFact("name.last", THADDEUS.lastName),
  idFact("ssn", THADDEUS.ssn),
  idFact("dob", "03/12/1974"),
  idFact("address.street", THADDEUS.street),
  idFact("address.city", THADDEUS.city),
  idFact("address.state", THADDEUS.state),
  idFact("address.zip", THADDEUS.zip),
  idFact("occupation", "Cabinetmaker"),
  idFact("phone", "253-555-0188"),
  fact("identity", SPOUSE_KEYS.firstName, THADDEUS.spouseFirstName, "verbal"),
  fact("identity", SPOUSE_KEYS.lastName, THADDEUS.lastName, "verbal"),
  fact("identity", SPOUSE_KEYS.ssn, THADDEUS.spouseSsn, "verbal"),
  fact("identity", SPOUSE_KEYS.dob, "08/05/1957", "verbal"),
  fact("identity", "identity.spouse.occupation", "Retired", "verbal"),
  fact("wages", makeW2FactKey("puget-cedar"), w2, "W-2 from Puget Cedar Joinery."),
  fact(
    "hsa",
    ARCHER_MSA_KEYS.coverage,
    coverage,
    "verbal: self-only HDHP all year, $3,600 deductible",
  ),
  fact("hsa", ARCHER_MSA_KEYS.ownContributions, 2200, "verbal: Form 5498-SA box 1"),
  fact("hsa", ARCHER_MSA_KEYS.compensation, 142000, "verbal: pay from Puget Cedar Joinery"),
  fact(
    "hsa",
    makeHsaDistributionFactKey("cascade-health", "sa1"),
    thaddeusArcher,
    "1099-SA, Cascade Health Trust.",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("sound-savings", "sa1"),
    margueriteArcher,
    "1099-SA, Sound Savings Bank.",
  ),
  fact(
    "hsa",
    ARCHER_MSA_KEYS.rolledOverOrExcessWithdrawn,
    1000,
    "verbal: rolled to another Archer MSA in 40 days",
  ),
  fact("hsa", ARCHER_MSA_KEYS.qualifiedMedicalExpenses, 3950, "verbal: receipts"),
  fact(
    "hsa",
    ARCHER_MSA_KEYS.exceptedTaxableDistributions,
    1200,
    "verbal: Marguerite's taxable part, past 65",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("evergreen-ma", "sa1"),
    margueriteMaNormal,
    "1099-SA (code 1), Evergreen.",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("evergreen-ma", "sa2"),
    margueriteMaDisability,
    "1099-SA (code 3), Evergreen.",
  ),
  fact("hsa", MEDICARE_ADVANTAGE_MSA_KEYS.qualifiedMedicalExpenses, 4100, "verbal: receipts"),
  fact(
    "hsa",
    MEDICARE_ADVANTAGE_MSA_KEYS.exceptedTaxableDistributions,
    800,
    "verbal: taxable part after the disability",
  ),
  fact("hsa", MEDICARE_ADVANTAGE_MSA_KEYS.valueEndOf2024, 4000, "verbal: December 2024 statement"),
  fact("hsa", MEDICARE_ADVANTAGE_MSA_KEYS.annualDeductible, 6000, "verbal: plan summary"),
  fact(
    "medical",
    makeLtcBenefitsFactKey("mount-rainier", "ltc1"),
    ltcContract,
    "1099-LTC, Mount Rainier Mutual.",
  ),
  fact(
    "medical",
    makeLtcBenefitsFactKey("olympic-life", "ltc1"),
    lifePolicy,
    "1099-LTC, Olympic Life Assurance.",
  ),
  fact("medical", LTC_KEYS.otherPayees, false, "verbal: no one else was paid"),
  fact("medical", LTC_KEYS.periodDays, 120, "verbal: one rate, September 3 to December 31"),
  fact("medical", LTC_KEYS.qualifiedServicesCosts, 30000, "verbal: care home invoices"),
  fact(
    "medical",
    LTC_KEYS.reimbursements,
    6000,
    "verbal: a reimbursement policy paid part of the invoices",
  ),
];
