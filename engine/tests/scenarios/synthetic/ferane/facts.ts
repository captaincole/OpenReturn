/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2 fact holds the boxes as the form would print them, and
 * the section 965 facts are the lines of her 2024 Form 965-A as she states them.
 */

import {
  makeSection965DeferredFactKey,
  makeSection965InclusionFactKey,
  makeSection965OtherLiabilityFactKey,
  makeSection965SCorporationFactKey,
  makeW2FactKey,
  type Section965DeferredValue,
  type Section965InclusionValue,
  type Section965OtherLiabilityValue,
  type Section965SCorporationValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const FERANE_USER_ID = "ferane-integration";
export const FERANE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: FERANE_USER_ID,
  taxYear: FERANE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const FERANE = {
  firstName: "Ferane",
  lastName: "Halloway",
  ssn: "400-00-9650",
  street: "8817 Lakemont Ridge Road",
  city: "Bellevue",
  state: "WA",
  zip: "98006",
};

const address = { line1: FERANE.street, city: FERANE.city, state: FERANE.state, zip: FERANE.zip };

// W-2 from a made-up shipping firm: under $200,000, so no Additional Medicare Tax.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Puget Narrows Freight Partners",
  employerEin: "00-0009650",
  employerAddress: {
    line1: "1200 Harbor Terminal Way",
    city: "Seattle",
    state: "WA",
    zip: "98134",
  },
  employee: { firstName: FERANE.firstName, lastName: FERANE.lastName, ssn: FERANE.ssn, address },
  box1: 188000,
  box2: 36000,
  box3: 176100,
  box4: 10918.2,
  box5: 188000,
  box6: 2726,
};

/*
 * Part I line 1 (2017): net 965 tax liability $94,200, of which $18,500
 * deferred (Part III, Halvard Ridge); $75,700 paid in 8 installments, the last
 * on the 2024 return. Nothing is due for 2025.
 */
const inclusion2017: Section965InclusionValue = {
  netTaxWithAll965: 412600,
  netTaxWithout965: 318400,
  installmentElection: true,
  paidByInstallmentYear: {
    1: 6056,
    2: 6056,
    3: 6056,
    4: 6056,
    5: 6056,
    6: 11355,
    7: 15140,
    8: 18925,
  },
};

/*
 * Part I line 2 (2018): net 965 tax liability $46,450, of which $12,400
 * deferred (Part III, Tillicum Bay). An audit in 2022 (year 5) raised the
 * liability by $4,000, prorated over the installments; 2025 is year 8.
 */
const inclusion2018: Section965InclusionValue = {
  netTaxWithAll965: 288350,
  netTaxWithout965: 241900,
  installmentElection: true,
  transfersAndAdjustments: 4000,
  paidByInstallmentYear: { 1: 2724, 2: 2724, 3: 2724, 4: 2724, 5: 4324, 6: 5708, 7: 7610 },
};

// Part I line 3 (2019): $6,750 in 8 installments; 2025 is year 7.
const inclusion2019: Section965InclusionValue = {
  netTaxWithAll965: 96800,
  netTaxWithout965: 90050,
  installmentElection: true,
  paidByInstallmentYear: { 1: 540, 2: 540, 3: 540, 4: 540, 5: 540, 6: 1013 },
};

// Part I line 4 (2020): $2,225, no installment election, paid in full with the 2020 return.
const inclusion2020: Section965InclusionValue = {
  netTaxWithAll965: 51200,
  netTaxWithout965: 48975,
  installmentElection: false,
  paidByInstallmentYear: { 1: 2225 },
};

/*
 * Part I line 5: in 2023 she assumed, by agreement, the remaining $60,000 of
 * a 2018 installment liability of another taxpayer (years 6 to 8 of $100,000:
 * 15%, 20% and 25%).
 */
const assumedFromTransferor: Section965OtherLiabilityValue = {
  kind: "transfer_in",
  year: 2018,
  transfersAndAdjustments: 60000,
  counterpartyTin: "987-65-4322",
  paidByInstallmentYear: { 6: 15000, 7: 20000 },
};

/*
 * Part I line 6: her deferred Tillicum Bay liability ($12,400) became payable
 * when she sold the shares in 2022; she elected 8 installments. 2025 is year 4.
 */
const triggeredTillicum: Section965OtherLiabilityValue = {
  kind: "triggered",
  year: 2022,
  triggeredLiability: 12400,
  installmentElection: true,
  paidByInstallmentYear: { 1: 992, 2: 992, 3: 992 },
};

// Part III: the S corporations with section 965 amounts, by inclusion year.
const halvardRidge: Section965SCorporationValue = {
  inclusionYear: 2017,
  name: "Halvard Ridge Holdings Inc",
  ein: "00-0009651",
  netTaxWithThisSCorporation: 336900,
  deferralElection: true,
};

const marrowstone: Section965SCorporationValue = {
  inclusionYear: 2017,
  name: "Marrowstone Trading Co",
  ein: "00-0009652",
  netTaxWithThisSCorporation: 327100,
  deferralElection: false,
};

const tillicumBay: Section965SCorporationValue = {
  inclusionYear: 2018,
  name: "Tillicum Bay Exports Inc",
  ein: "00-0009653",
  netTaxWithThisSCorporation: 254300,
  deferralElection: true,
};

/*
 * Part IV: the Halvard Ridge deferral ($18,500 at the start of 2025), less
 * $6,000 transferred out with shares she sold by agreement in 2025; and a
 * deferred liability of Quilcene Shipping she took on with shares she bought in 2025.
 */
const halvardDeferred: Section965DeferredValue = {
  electionOrTransferYear: 2017,
  name: "Halvard Ridge Holdings Inc",
  ein: "00-0009651",
  beginningDeferred: 18500,
  transferThisYear: -6000,
  transferCounterpartyTin: "00-0009654",
};

const quilceneDeferred: Section965DeferredValue = {
  electionOrTransferYear: 2025,
  name: "Quilcene Shipping Inc",
  ein: "00-0009655",
  transferThisYear: 7250,
  transferCounterpartyTin: "987-65-4323",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: FERANE_USER_ID, taxYear: FERANE_TAX_YEAR, suffix, value });

const LAST_YEAR = "Stated by Ferane from her 2024 Form 965-A.";

export const feraneFacts: TaxFactRow[] = [
  idFact("name.first", FERANE.firstName),
  idFact("name.last", FERANE.lastName),
  idFact("ssn", FERANE.ssn),
  idFact("dob", "02/09/1971"),
  idFact("address.street", FERANE.street),
  idFact("address.city", FERANE.city),
  idFact("address.state", FERANE.state),
  idFact("address.zip", FERANE.zip),
  idFact("occupation", "Logistics executive"),
  idFact("phone", "425-555-0196"),
  fact("wages", makeW2FactKey("puget-narrows"), w2, "W-2 from Puget Narrows Freight Partners."),
  fact("foreign", makeSection965InclusionFactKey(2017), inclusion2017, LAST_YEAR),
  fact("foreign", makeSection965InclusionFactKey(2018), inclusion2018, LAST_YEAR),
  fact("foreign", makeSection965InclusionFactKey(2019), inclusion2019, LAST_YEAR),
  fact("foreign", makeSection965InclusionFactKey(2020), inclusion2020, LAST_YEAR),
  fact(
    "foreign",
    makeSection965OtherLiabilityFactKey("assumed-2018"),
    assumedFromTransferor,
    `${LAST_YEAR} Transfer agreement of 2023.`,
  ),
  fact(
    "foreign",
    makeSection965OtherLiabilityFactKey("tillicum-triggered"),
    triggeredTillicum,
    LAST_YEAR,
  ),
  fact("foreign", makeSection965SCorporationFactKey("halvard-ridge-2017"), halvardRidge, LAST_YEAR),
  fact("foreign", makeSection965SCorporationFactKey("marrowstone-2017"), marrowstone, LAST_YEAR),
  fact("foreign", makeSection965SCorporationFactKey("tillicum-bay-2018"), tillicumBay, LAST_YEAR),
  fact(
    "foreign",
    makeSection965DeferredFactKey("halvard-ridge"),
    halvardDeferred,
    `${LAST_YEAR} 2025 transfer agreement for the shares sold.`,
  ),
  fact(
    "foreign",
    makeSection965DeferredFactKey("quilcene-shipping"),
    quilceneDeferred,
    "Stated by Ferane: 2025 transfer agreement for the shares bought.",
  ),
];
