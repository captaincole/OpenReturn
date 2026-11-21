/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the documents would print them.
 */

import {
  HOME_ENERGY_KEYS,
  makeEnergyInvoiceFactKey,
  makeW2FactKey,
  MORTGAGE_CREDIT_KEYS,
  MORTGAGE_KEYS,
  type EnergyInvoiceFactValue,
  type MortgageCreditCertificateFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LINNEA_USER_ID = "linnea-integration";
export const LINNEA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LINNEA_USER_ID,
  taxYear: LINNEA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LINNEA = {
  firstName: "Linnea",
  lastName: "Castellano",
  ssn: "400-00-8396",
  street: "418 Mangrove Bend Lane",
  city: "Tampa",
  state: "FL",
  zip: "33612",
};

const address = { line1: LINNEA.street, city: LINNEA.city, state: LINNEA.state, zip: LINNEA.zip };

// W-2 from Harborview Dental Group (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Harborview Dental Group PA",
  employerEin: "00-0008396",
  employerAddress: { line1: "77 Bayshore Court", city: "Tampa", state: "FL", zip: "33606" },
  employee: { firstName: LINNEA.firstName, lastName: LINNEA.lastName, ssn: LINNEA.ssn, address },
  box1: 36000,
  box2: 2400,
  box3: 36000,
  box4: 2232,
  box5: 36000,
  box6: 522,
};

/*
 * The Mortgage Credit Certificate (made up): a 25% rate, so the $2,000 limit
 * applies. The loan ($240,000) is larger than the certified indebtedness
 * ($200,000), so line 1 is 200,000 / 240,000 of the 1098's box 1 interest.
 */
const certificate: MortgageCreditCertificateFactValue = {
  issuerName: "Gulf Coast Housing Finance Authority",
  certificateNumber: "GCHFA-MCC-21-0417",
  issueDate: "06/14/2021",
  creditRatePercent: 25,
  certifiedIndebtedness: 200000,
  originalLoanAmount: 240000,
  interestPaid: 11520,
};

// Invoice from Suncoast Attic Insulation (made up): insulation needs no QMID.
const insulation: EnergyInvoiceFactValue = {
  vendorName: "Suncoast Attic Insulation",
  invoiceNumber: "SAI-25-1182",
  invoiceDate: "04/09/2025",
  items: [{ kind: "insulation", description: "Attic blown-in insulation", cost: 1200 }],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LINNEA_USER_ID, taxYear: LINNEA_TAX_YEAR, suffix, value });

const fromCertificate = "Mortgage Credit Certificate from Gulf Coast Housing Finance Authority";
const fromLastYear = "2024 Form 8396 (verbal, 2026-11-21)";

export const linneaFacts: TaxFactRow[] = [
  idFact("name.first", LINNEA.firstName),
  idFact("name.last", LINNEA.lastName),
  idFact("ssn", LINNEA.ssn),
  idFact("dob", "03/02/1991"),
  idFact("address.street", LINNEA.street),
  idFact("address.city", LINNEA.city),
  idFact("address.state", LINNEA.state),
  idFact("address.zip", LINNEA.zip),
  idFact("occupation", "Dental hygienist"),
  idFact("phone", "813-555-0142"),
  fact("wages", makeW2FactKey("harborview-dental"), w2, "W-2 from Harborview Dental Group."),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    11520,
    "Form 1098 from Pelican State Mortgage, box 1; no points in box 6.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    228400,
    "Form 1098 from Pelican State Mortgage, box 2.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "06/14/2021",
    "Form 1098 from Pelican State Mortgage, box 3.",
  ),
  fact(
    "mortgage",
    MORTGAGE_CREDIT_KEYS.certificate,
    certificate,
    `${fromCertificate}; interest from the Form 1098, box 1.`,
  ),
  fact("other", MORTGAGE_CREDIT_KEYS.carryforwardFrom2022, 300, `${fromLastYear}, line 16.`),
  fact("other", MORTGAGE_CREDIT_KEYS.carryforwardFrom2023, 450, `${fromLastYear}, line 14.`),
  fact("other", MORTGAGE_CREDIT_KEYS.carryforwardFrom2024, 600, `${fromLastYear}, line 17.`),
  fact(
    "home_energy",
    makeEnergyInvoiceFactKey("suncoast-attic-sai-25-1182"),
    insulation,
    "Invoice from Suncoast Attic Insulation.",
  ),
  fact(
    "home_energy",
    HOME_ENERGY_KEYS.mainHomeInUs,
    true,
    "Verbal: the Tampa home is her main home.",
  ),
  fact("home_energy", HOME_ENERGY_KEYS.originalUser, true, "Verbal: she is the original user."),
  fact("home_energy", HOME_ENERGY_KEYS.lastsFiveYears, true, "Verbal: expected to last 5 years."),
  fact("home_energy", HOME_ENERGY_KEYS.newConstruction, false, "Verbal: an existing home."),
  fact("state_local_tax", "state_local_tax.real_estate", 4100, "Hillsborough County tax bill."),
  fact("state_local_tax", "state_local_tax.personal_property", 0, "Verbal: none."),
  fact("medical", "medical.expenses_total", 0, "Verbal: none worth listing."),
  fact("charitable", "charitable.cash", 3000, "Church giving statement."),
  fact("charitable", "charitable.noncash", 0, "Verbal: none."),
  fact("charitable", "charitable.carryover", 0, "Verbal: none."),
];
