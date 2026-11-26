/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * Form 4255 facts are the amounts of her earlier-year Forms 3468, 3800, 8911,
 * 8933 and 7220 and of IRS notices, as she states them.
 */

import {
  makeCreditRecaptureLineFactKey,
  makeCreditRecapturePropertyFactKey,
  makeEmissionsTierRecaptureFactKey,
  makeW2FactKey,
  type CreditRecaptureLineFactValue,
  type CreditRecapturePropertyFactValue,
  type EmissionsTierRecaptureFactValue,
  type Form4255Line,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LIANDRIN_USER_ID = "liandrin-integration";
export const LIANDRIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (key: string, value: unknown, sourceNote: string, category = "other"): TaxFactRow => ({
  id: `f-${key}`,
  userId: LIANDRIN_USER_ID,
  taxYear: LIANDRIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LIANDRIN = {
  firstName: "Liandrin",
  lastName: "Corvesse",
  ssn: "400-00-4255",
  street: "1180 Mesquite Bend",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

const address = {
  line1: LIANDRIN.street,
  city: LIANDRIN.city,
  state: LIANDRIN.state,
  zip: LIANDRIN.zip,
};

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Brightwater Grid Systems",
  employerEin: "00-0004255",
  employerAddress: { line1: "900 Congress Row", city: "Austin", state: "TX", zip: "78701" },
  employee: {
    firstName: LIANDRIN.firstName,
    lastName: LIANDRIN.lastName,
    ssn: LIANDRIN.ssn,
    address,
  },
  box1: 480000,
  box2: 230000,
  box3: 176100,
  box4: 10918.2,
  box5: 480000,
  box6: 9480,
};

/* Part II properties A to D, in this order. */
const rehabBuilding: CreditRecapturePropertyFactValue = {
  line: "1b",
  description:
    "Rehabilitation credit: certified historic structure, nonresidential (warehouse lofts)",
  originalRate: 0.2,
  creditBase: 400000,
  creditTaken: 24000,
  disposition: {
    placedInService: "2023-03-15",
    ceased: "2025-08-20",
    unusedCreditsWithoutProperty: 0,
    unusedCredit: 8000,
  },
};

const solarCarport: CreditRecapturePropertyFactValue = {
  line: "1j",
  description: "Energy credit: energy property (solar carport on a rental building)",
  originalRate: 0.3,
  creditBase: 120000,
  creditTaken: 36000,
  nonrecourseFinancing: { netChange: 20000, unusedCreditsWithCurrentBase: 1500 },
};

const waferTooling: CreditRecapturePropertyFactValue = {
  line: "1d",
  description: "Advanced manufacturing investment credit: wafer tooling line",
  originalRate: 0.25,
  creditBase: 40000,
  creditTaken: 10000,
  registrationNumber: "EPE-48D-0425517",
  disposition: {
    placedInService: "2024-02-12",
    ceased: "2025-07-15",
    unusedCreditsWithoutProperty: 0,
    unusedCredit: 0,
    zeroYearEvent: "advanced_manufacturing_expansion",
  },
};

const heatPump: CreditRecapturePropertyFactValue = {
  line: "1j",
  description: "Energy credit: energy property (geothermal heat pump)",
  originalRate: 0.3,
  creditBase: 20000,
  creditTaken: 6000,
  disposition: {
    placedInService: "2021-11-05",
    ceased: "2025-04-30",
    unusedCreditsWithoutProperty: 1000,
    unusedCredit: 0,
  },
};

const hydrogen: EmissionsTierRecaptureFactValue = {
  designedEmissionsRate: "0.40 kg CO2e/kg H2",
  basis: 250000,
  energyPercentage: 0.3,
  verificationReport: { emissionsRate: "2.10 kg CO2e/kg H2", energyPercentage: 0.075 },
};

/* Part I lines: the earlier-year amounts and this year's other events. */
const LINES: Array<[Form4255Line, CreditRecaptureLineFactValue, string]> = [
  [
    "1a",
    {
      creditClaimed: 20000,
      grossElectivePayment: 20000,
      grossElectivePaymentAppliedToTax: 5000,
      nonElectiveCreditAppliedToTax: 0,
      excessivePayment: { netPortion: 2000, otherPortion: 0, reasonableCause: false },
    },
    "2024 Form 7207 and Form 3800; IRS notice of an excessive payment (made up).",
  ],
  [
    "1b",
    { creditClaimed: 32000, nonElectiveCreditAppliedToTax: 24000 },
    "2023–2024 Forms 3468 and 3800.",
  ],
  [
    "1c",
    {
      creditClaimed: 8000,
      grossElectivePayment: 8000,
      grossElectivePaymentAppliedToTax: 0,
      nonElectiveCreditAppliedToTax: 0,
      excessivePayment: { netPortion: 1000, otherPortion: 500, reasonableCause: false },
    },
    "2024 Form 7210; IRS notice of an excessive payment (made up).",
  ],
  [
    "1d",
    {
      creditClaimed: 10000,
      grossElectivePayment: 10000,
      grossElectivePaymentAppliedToTax: 0,
      nonElectiveCreditAppliedToTax: 0,
      excessivePayment: { netPortion: 500, otherPortion: 0, reasonableCause: false },
    },
    "2024 Form 3468 Part IV; IRS notice of an excessive payment (made up).",
  ],
  [
    "1j",
    {
      creditClaimed: 132000,
      nonElectiveCreditAppliedToTax: 97000,
      prevailingWageRecaptures: [
        {
          description: "Solar array, Bastrop warehouse: repair crew paid under the prevailing wage",
          credit: 15000,
          placedInService: "2024-06-10",
          failedOn: "2025-09-01",
        },
      ],
      excessiveCreditTransfer: { amount: 5000, reasonableCause: false },
      creditTransferRecapture: 2000,
      apprenticeshipPenalty: 1200,
    },
    "2021–2024 Forms 3468 and 3800; Form 7220; transferee notices (made up).",
  ],
  [
    "2a",
    {
      creditClaimed: 60000,
      grossElectivePayment: 50000,
      grossElectivePaymentAppliedToTax: 0,
      nonElectiveCreditAppliedToTax: 0,
      otherRecapture: { source: "Form 8933, Schedule D", increaseInTax: 9000 },
      excessivePayment: { netPortion: 4000, otherPortion: 1000, reasonableCause: false },
      prevailingWagePenalty: 3000,
    },
    "2024 Form 8933; 2025 Schedule D (Form 8933); Form 7220; IRS notice (made up).",
  ],
  [
    "2b",
    {
      creditClaimed: 18000,
      nonElectiveCreditAppliedToTax: 18000,
      otherRecapture: { source: "Form 8911", increaseInTax: 3600 },
    },
    "2023 Form 8911; refueling property sold in 2025 (made up).",
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LIANDRIN_USER_ID, taxYear: LIANDRIN_TAX_YEAR, suffix, value });

export const liandrinFacts: TaxFactRow[] = [
  idFact("name.first", LIANDRIN.firstName),
  idFact("name.last", LIANDRIN.lastName),
  idFact("ssn", LIANDRIN.ssn),
  idFact("dob", "02/09/1979"),
  idFact("address.street", LIANDRIN.street),
  idFact("address.city", LIANDRIN.city),
  idFact("address.state", LIANDRIN.state),
  idFact("address.zip", LIANDRIN.zip),
  idFact("occupation", "Energy engineer"),
  idFact("phone", "512-555-0425"),
  fact(makeW2FactKey("brightwater"), w2, "W-2 from Brightwater Grid Systems.", "wages"),
  ...LINES.map(([line, value, note]) => fact(makeCreditRecaptureLineFactKey(line), value, note)),
  fact(
    makeCreditRecapturePropertyFactKey("warehouse-lofts"),
    rehabBuilding,
    "2023 Form 3468; sold 2025-08-20.",
  ),
  fact(
    makeCreditRecapturePropertyFactKey("solar-carport"),
    solarCarport,
    "2024 Form 3468; 2025 loan statements.",
  ),
  fact(
    makeCreditRecapturePropertyFactKey("wafer-tooling"),
    waferTooling,
    "2024 Form 3468 Part IV; 2025 expansion.",
  ),
  fact(
    makeCreditRecapturePropertyFactKey("heat-pump"),
    heatPump,
    "2021 Form 3468; sold 2025-04-30.",
  ),
  fact(
    makeEmissionsTierRecaptureFactKey("pflugerville-h2"),
    hydrogen,
    "2024 Form 3468; 2025 verification report.",
  ),
];
