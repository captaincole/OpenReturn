/*
 * A made-up married couple (README.md): every name and amount is invented. The
 * W-2 facts are the boxes as the documents would print them; the two seller
 * reports are in docs/ (generate-docs.ts); the rest are the couple's answers.
 */

import {
  CLEAN_VEHICLE_KEYS,
  PRIOR_YEAR_KEYS,
  SPOUSE_KEYS,
  makeCleanVehicleFactKey,
  makeW2FactKey,
  type CleanVehicleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ELAYNE_USER_ID = "elayne-integration";
export const ELAYNE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ELAYNE_USER_ID,
  taxYear: ELAYNE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ELAYNE = {
  firstName: "Elayne",
  lastName: "Marwick",
  ssn: "400-00-8936",
  street: "2208 Cedar Hollow Lane",
  city: "Round Rock",
  state: "TX",
  zip: "78665",
};

export const GARETH = { firstName: "Gareth", lastName: "Marwick", ssn: "400-00-8937" };

const address = { line1: ELAYNE.street, city: ELAYNE.city, state: ELAYNE.state, zip: ELAYNE.zip };

// Elayne's W-2 from Brushy Creek Analytics (made up).
const elayneW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Brushy Creek Analytics LLC",
  employerEin: "00-0008936",
  employerAddress: { line1: "900 Sundance Parkway", city: "Round Rock", state: "TX", zip: "78681" },
  employee: { firstName: ELAYNE.firstName, lastName: ELAYNE.lastName, ssn: ELAYNE.ssn, address },
  box1: 96400,
  box2: 9800,
  box3: 96400,
  box4: 5976.8,
  box5: 96400,
  box6: 1397.8,
};

// Gareth's W-2 from Hill Country Water District (made up).
const garethW2: W2FactValue = {
  owner: "spouse",
  employerName: "Hill Country Water District",
  employerEin: "00-0008937",
  employerAddress: { line1: "41 Mesa Park Drive", city: "Georgetown", state: "TX", zip: "78626" },
  employee: { firstName: GARETH.firstName, lastName: GARETH.lastName, ssn: GARETH.ssn, address },
  box1: 62000,
  box2: 6100,
  box3: 62000,
  box4: 3844,
  box5: 62000,
  box6: 899,
};

/* A new electric SUV, for personal use only; they kept the credit for the return (no transfer). */
export const ELAYNE_NEW_VEHICLE: CleanVehicleFactValue = {
  modelYear: 2025,
  make: "Aurelle",
  model: "Ridgeline E4",
  vin: "7AUEL4RX5SA000936",
  placedInServiceDate: "2025-03-14",
  acquiredDate: "2025-03-10",
  kind: "new",
  resoldWithin30Days: false,
  acquiredForUse: true,
  tentativeCredit: 7500,
  businessUsePercent: 0,
};

/* A 2021 electric hatchback bought from a dealer for $14,600; no transfer. */
export const ELAYNE_USED_VEHICLE: CleanVehicleFactValue = {
  modelYear: 2021,
  make: "Pellam",
  model: "Strata EV",
  vin: "3PLMSTEV1MN008937",
  placedInServiceDate: "2025-06-21",
  acquiredDate: "2025-06-20",
  kind: "previously_owned",
  resoldWithin30Days: false,
  acquiredForUse: true,
  salesPrice: 14600,
  claimedUsedCreditInPrior3Years: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ELAYNE_USER_ID, taxYear: ELAYNE_TAX_YEAR, suffix, value });

export const elayneFacts: TaxFactRow[] = [
  idFact("name.first", ELAYNE.firstName),
  idFact("name.last", ELAYNE.lastName),
  idFact("ssn", ELAYNE.ssn),
  idFact("dob", "08/14/1986"),
  idFact("address.street", ELAYNE.street),
  idFact("address.city", ELAYNE.city),
  idFact("address.state", ELAYNE.state),
  idFact("address.zip", ELAYNE.zip),
  idFact("occupation", "Data analyst"),
  idFact("phone", "512-555-0136"),
  fact("identity", SPOUSE_KEYS.firstName, GARETH.firstName, "Stated by Elayne."),
  fact("identity", SPOUSE_KEYS.lastName, GARETH.lastName, "Stated by Elayne."),
  fact("identity", SPOUSE_KEYS.ssn, GARETH.ssn, "Gareth's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "01/30/1984", "Stated by Gareth."),
  fact(
    "wages",
    makeW2FactKey("brushy-creek-analytics"),
    elayneW2,
    "W-2 from Brushy Creek Analytics.",
  ),
  fact(
    "wages",
    makeW2FactKey("hill-country-water"),
    garethW2,
    "W-2 from Hill Country Water District.",
  ),
  fact(
    "other",
    makeCleanVehicleFactKey("aurelle-ridgeline"),
    ELAYNE_NEW_VEHICLE,
    "Seller report (docs/01-seller-report-new-vehicle.pdf); personal use only, stated by Elayne.",
  ),
  fact(
    "other",
    makeCleanVehicleFactKey("pellam-strata"),
    ELAYNE_USED_VEHICLE,
    "Seller report (docs/02-seller-report-previously-owned-vehicle.pdf); no earlier used-vehicle credit, stated by Gareth.",
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 142000, "Stated: 2024 Form 1040 line 11."),
  fact(
    "other",
    CLEAN_VEHICLE_KEYS.priorYearFilingStatus,
    "married_filing_jointly",
    "Stated: they filed jointly for 2024.",
  ),
  fact(
    "other",
    CLEAN_VEHICLE_KEYS.claimableAsDependent,
    false,
    "Stated: nobody can claim either of them as a dependent.",
  ),
];
