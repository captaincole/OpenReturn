/*
 * Tara Black — facts (the "data").
 *
 * IRS ATS test scenario 1 (tax year 2025), moved from Ohio to
 * California. Every dollar amount is the IRS package's; see
 * docs/RELOCATION.md for what changed and what was added.
 */

import {
  HOME_ENERGY_KEYS,
  HOUSEHOLD_EMPLOYMENT_KEYS,
  makeEnergyInvoiceFactKey,
  makeHouseholdEmployeeFactKey,
  makeW2FactKey,
  type EnergyInvoiceFactValue,
  type HouseholdEmployeeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TARA_USER_ID = "tara-integration";
export const TARA_TAX_YEAR = 2025;

const CREATED_AT = "2026-10-18T00:00:00Z";

/** One fact row. `id` is derived from the key so it stays stable. */
const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key.replace(/[^a-z0-9]+/gi, "-")}`,
  userId: TARA_USER_ID,
  taxYear: TARA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TARA_USER_ID, taxYear: TARA_TAX_YEAR, suffix, value });

const TARA_ADDRESS = { line1: "17 Lexington Drive", city: "San Jose", state: "CA", zip: "95125" };

// docs/01-green-ladies-w-2.pdf (values from IRS PDF page 4)
const greenLadies: W2FactValue = {
  employerName: "The Green Ladies",
  employerEin: "00-0000007",
  employerAddress: { line1: "14 Forest Lane", city: "Atlanta", state: "GA", zip: "30033" },
  employee: { firstName: "Tara", lastName: "Black", ssn: "400-00-1032", address: TARA_ADDRESS },
  box1: 22970,
  box2: 1073,
  box3: 22970,
  box4: 1424,
  box5: 22970,
  box6: 333,
  box15: "CA",
  box16: 22970,
  box17: 320,
};

// docs/02-c-and-r-w-2.pdf (values from IRS PDF page 5)
const cAndR: W2FactValue = {
  employerName: "C&R",
  employerEin: "00-0000007",
  employerAddress: { line1: "1121 W Fourth Street", city: "Cincinnati", state: "OH", zip: "45223" },
  employee: { firstName: "Tara", lastName: "Black", ssn: "400-00-1032", address: TARA_ADDRESS },
  box1: 19500,
  box2: 1640,
  box3: 19500,
  box4: 1209,
  box5: 19500,
  box6: 283,
  box15: "CA",
  box16: 19500,
  box17: 416,
};

/*
 * docs/03-household-employee-w-2-copy-d.pdf (made by us from IRS
 * Schedule H, PDF page 9: $3,100 cash wages, no withholding).
 */
const rosaDelgado: HouseholdEmployeeFactValue = {
  employeeName: "Rosa Delgado",
  employerEin: "00-0000029",
  box1: 3100,
  box3: 3100,
  box4: 192.2,
  box5: 3100,
  box6: 44.95,
};

/*
 * docs/04–06 (made by us from IRS Form 5695, PDF pages 12–13). Door,
 * window, and insulation costs leave out installation labor; central
 * air costs include it.
 */
const doors: EnergyInvoiceFactValue = {
  vendorName: "Bay Area Door & Entry",
  invoiceNumber: "BADE-25-0412",
  invoiceDate: "05/14/2025",
  items: [
    { kind: "exterior_door", description: "Front entry door", qmid: "A1B2", cost: 1020 },
    { kind: "exterior_door", description: "Rear entry door", qmid: "A1B3", cost: 920 },
    { kind: "exterior_door", description: "Side entry door", qmid: "A1B4", cost: 800 },
    { kind: "exterior_door", description: "Garage entry door", qmid: "A1B7", cost: 685 },
    { kind: "exterior_door", description: "Patio door", qmid: "A1B8", cost: 685 },
    { kind: "exterior_door", description: "Utility room door", qmid: "A1B9", cost: 685 },
    { kind: "exterior_door", description: "Laundry exterior door", qmid: "A1C1", cost: 685 },
  ],
};

const windows: EnergyInvoiceFactValue = {
  vendorName: "Sierra Window Co.",
  invoiceNumber: "SWC-7781",
  invoiceDate: "06/02/2025",
  items: [{ kind: "window_skylight", description: "Living room window", qmid: "A1B5", cost: 600 }],
};

const hvac: EnergyInvoiceFactValue = {
  vendorName: "Valley Comfort Heating & Air",
  invoiceNumber: "VCHA-3302",
  invoiceDate: "08/20/2025",
  items: [
    { kind: "central_air_conditioner", description: "Main zone", qmid: "A1B6", cost: 2100 },
    { kind: "central_air_conditioner", description: "Upstairs zone", qmid: "A1C2", cost: 400 },
  ],
};

const fromForm5695 = "IRS Form 5695 (docs/irs-ats-2025-scenario-1.pdf, pages 12–13)";

export const taraFacts: TaxFactRow[] = [
  idFact("name.first", "Tara"),
  idFact("name.last", "Black"),
  idFact("ssn", "400-00-1032"),
  idFact("dob", "08/14/1985"),
  idFact("address.street", "17 Lexington Drive"),
  idFact("address.city", "San Jose"),
  idFact("address.state", "CA"),
  idFact("address.zip", "95125"),
  idFact("address.county", "Santa Clara"),
  fact(
    "wages",
    makeW2FactKey("the-green-ladies"),
    greenLadies,
    "W-2 from The Green Ladies (docs/01-green-ladies-w-2.pdf).",
  ),
  fact("wages", makeW2FactKey("c-r"), cAndR, "W-2 from C&R (docs/02-c-and-r-w-2.pdf)."),
  fact(
    "household_employment",
    makeHouseholdEmployeeFactKey("rosa-delgado"),
    rosaDelgado,
    "W-2 Tara issued to Rosa Delgado (docs/03-household-employee-w-2-copy-d.pdf).",
  ),
  fact(
    "household_employment",
    HOUSEHOLD_EMPLOYMENT_KEYS.paid1000InAQuarter,
    false,
    "IRS Schedule H (docs/irs-ats-2025-scenario-1.pdf, page 9): line 9 is No.",
  ),
  fact(
    "home_energy",
    makeEnergyInvoiceFactKey("bay-area-door-entry-bade-25-0412"),
    doors,
    "Invoice from Bay Area Door & Entry (docs/04-bay-area-door-invoice.pdf).",
  ),
  fact(
    "home_energy",
    makeEnergyInvoiceFactKey("sierra-window-co-swc-7781"),
    windows,
    "Invoice from Sierra Window Co. (docs/05-sierra-window-invoice.pdf).",
  ),
  fact(
    "home_energy",
    makeEnergyInvoiceFactKey("valley-comfort-heating-air-vcha-3302"),
    hvac,
    "Invoice from Valley Comfort Heating & Air (docs/06-valley-comfort-hvac-invoice.pdf).",
  ),
  fact(
    "home_energy",
    HOME_ENERGY_KEYS.mainHomeInUs,
    true,
    `${fromForm5695}: lines 17a and 21a are Yes.`,
  ),
  fact(
    "home_energy",
    HOME_ENERGY_KEYS.originalUser,
    true,
    `${fromForm5695}: lines 17b and 21b are Yes.`,
  ),
  fact("home_energy", HOME_ENERGY_KEYS.lastsFiveYears, true, `${fromForm5695}: line 17c is Yes.`),
  fact("home_energy", HOME_ENERGY_KEYS.newConstruction, false, `${fromForm5695}: line 17e is No.`),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    "Added for CA (docs/RELOCATION.md): covered all year.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Added for CA (docs/RELOCATION.md): no use tax."),
];
