/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * W-2 fact is the boxes as the document would print them; the two seller
 * reports are in docs/ (generate-docs.ts); the rest are her answers.
 */

import {
  CLEAN_VEHICLE_KEYS,
  PRIOR_YEAR_KEYS,
  makeCleanVehicleFactKey,
  makeW2FactKey,
  type CleanVehicleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BIRGITTE_USER_ID = "birgitte-integration";
export const BIRGITTE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BIRGITTE_USER_ID,
  taxYear: BIRGITTE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BIRGITTE = {
  firstName: "Birgitte",
  lastName: "Solvang",
  ssn: "400-00-8938",
  street: "77 Larkspur Court",
  city: "Bellevue",
  state: "WA",
  zip: "98004",
};

const address = {
  line1: BIRGITTE.street,
  city: BIRGITTE.city,
  state: BIRGITTE.state,
  zip: BIRGITTE.zip,
};

// Birgitte's W-2 from Lakemont Robotics (made up).
const birgitteW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Lakemont Robotics Inc",
  employerEin: "00-0008938",
  employerAddress: { line1: "1200 112th Ave NE", city: "Bellevue", state: "WA", zip: "98004" },
  employee: {
    firstName: BIRGITTE.firstName,
    lastName: BIRGITTE.lastName,
    ssn: BIRGITTE.ssn,
    address,
  },
  box1: 162000,
  box2: 40000,
  box3: 162000,
  box4: 10044,
  box5: 162000,
  box6: 2349,
};

/* A new electric sedan; the $7,500 credit went to the dealer at the time of sale. */
export const BIRGITTE_NEW_VEHICLE: CleanVehicleFactValue = {
  modelYear: 2025,
  make: "Aurelle",
  model: "Sona S2",
  vin: "7AUSN2SX8SA008938",
  placedInServiceDate: "2025-02-08",
  acquiredDate: "2025-02-08",
  kind: "new",
  creditTransferredToDealer: 7500,
  resoldWithin30Days: false,
  acquiredForUse: true,
  tentativeCredit: 7500,
  businessUsePercent: 0,
};

/* A 2022 electric crossover for her partner's commute, $19,250; the $4,000 credit went to the dealer. */
export const BIRGITTE_USED_VEHICLE: CleanVehicleFactValue = {
  modelYear: 2022,
  make: "Pellam",
  model: "Coastline EV",
  vin: "3PLMCSEV4NN008939",
  placedInServiceDate: "2025-08-30",
  acquiredDate: "2025-08-29",
  kind: "previously_owned",
  creditTransferredToDealer: 4000,
  resoldWithin30Days: false,
  acquiredForUse: true,
  salesPrice: 19250,
  claimedUsedCreditInPrior3Years: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BIRGITTE_USER_ID, taxYear: BIRGITTE_TAX_YEAR, suffix, value });

export const birgitteFacts: TaxFactRow[] = [
  idFact("name.first", BIRGITTE.firstName),
  idFact("name.last", BIRGITTE.lastName),
  idFact("ssn", BIRGITTE.ssn),
  idFact("dob", "05/02/1981"),
  idFact("address.street", BIRGITTE.street),
  idFact("address.city", BIRGITTE.city),
  idFact("address.state", BIRGITTE.state),
  idFact("address.zip", BIRGITTE.zip),
  idFact("occupation", "Robotics engineer"),
  idFact("phone", "425-555-0193"),
  fact("wages", makeW2FactKey("lakemont-robotics"), birgitteW2, "W-2 from Lakemont Robotics."),
  fact(
    "other",
    makeCleanVehicleFactKey("aurelle-sona"),
    BIRGITTE_NEW_VEHICLE,
    "Seller report (docs/01-seller-report-new-vehicle.pdf); personal use only, stated by Birgitte.",
  ),
  fact(
    "other",
    makeCleanVehicleFactKey("pellam-coastline"),
    BIRGITTE_USED_VEHICLE,
    "Seller report (docs/02-seller-report-previously-owned-vehicle.pdf); no earlier used-vehicle credit, stated by Birgitte.",
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 155000, "Stated: 2024 Form 1040 line 11."),
  fact(
    "other",
    CLEAN_VEHICLE_KEYS.priorYearFilingStatus,
    "single",
    "Stated: she filed single for 2024.",
  ),
];
