/*
 * A made-up single filer in Texas (README.md): every name and amount is
 * invented. No input documents: the business's amounts and the facility's
 * sales are the filer's answers from the business's books and the plant's
 * production and sales records. No IRS form reports them.
 */

import {
  makeAdvancedManufacturingFacilityFactKey,
  makeBusinessFactKey,
  type AdvancedManufacturingFacilityFactValue,
  type BusinessFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BRAN_USER_ID = "bran-integration";
export const BRAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BRAN_USER_ID,
  taxYear: BRAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BRAN = {
  firstName: "Bran",
  lastName: "Tolliver",
  ssn: "400-00-7207",
  street: "2210 Caddo Lake Drive",
  city: "Marshall",
  state: "TX",
  zip: "75670",
};

export const PLANT_ADDRESS = "4800 Industrial Loop, Marshall, TX 75672";

// The energy components plant Bran owns and runs as a sole proprietor (made up).
const works: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Solar, wind and battery component manufacturing",
  code: "335999",
  name: "Tolliver Energy Works",
  address: { street: "4800 Industrial Loop", city: "Marshall", state: "TX", zip: "75672" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 6400000,
  expenses: {
    supplies: 3150000,
    wages: 1380000,
    utilities: 142000,
    depreciation: 310000,
    insurance: 64000,
    repairs: 38000,
    taxesAndLicenses: 116000,
  },
  specifiedService: false,
  w2WagesPaid: 1380000,
  qualifiedPropertyUbia: 4200000,
};

/*
 * The plant's 2025 sales of eligible components, all produced there and sold
 * to unrelated buyers. Every Part II row has a sale but line 6b
 * (metallurgical coal, not an applicable critical mineral for a tax year that
 * began before July 5, 2025). Bran sold $50,000 of the credit to an
 * unrelated buyer under section 6418.
 */
export const PLANT: AdvancedManufacturingFacilityFactValue = {
  placedInService: "2021-09-13",
  address: PLANT_ADDRESS,
  coordinates: { latitude: 32.534871, longitude: -94.351562 },
  relatedPersonElection: false,
  section48cProperty: false,
  capacitySales: {
    pv_cell: [{ count: 40000, capacityEach: 6 }],
    solar_module: [
      { count: 300, capacityEach: 400 },
      { count: 100, capacityEach: 450 },
    ],
    blade: [{ count: 12, capacityEach: 20000 }],
    nacelle: [{ count: 4, capacityEach: 20000 }],
    tower: [{ count: 4, capacityEach: 20000 }],
    fixed_platform_foundation: [{ count: 1, capacityEach: 150000 }],
    floating_platform_foundation: [{ count: 1, capacityEach: 100000 }],
    central_inverter: [{ count: 2, capacityEach: 1200000 }],
    utility_inverter: [{ count: 3, capacityEach: 200000 }],
    commercial_inverter: [{ count: 10, capacityEach: 50000 }],
    residential_inverter: [{ count: 40, capacityEach: 7600 }],
    microinverter: [{ count: 300, capacityEach: 350 }],
    distributed_wind_inverter: [{ count: 4, capacityEach: 20000 }],
  },
  unitSales: {
    photovoltaic_wafer: 500,
    solar_grade_polysilicon: 1200,
    polymeric_backsheet: 2500,
    torque_tube: 8000,
    structural_fastener: 1500,
  },
  batterySales: {
    battery_cell: [{ count: 2000, capacityKwhEach: 0.18, maxDischargeKwEach: 0.5 }],
    battery_module_with_cells: [{ count: 30, capacityKwhEach: 13.5, maxDischargeKwEach: 5 }],
    battery_module_without_cells: [{ count: 5, capacityKwhEach: 20, maxDischargeKwEach: 4 }],
  },
  electrodeActiveMaterialCosts: 64500,
  vessels: [
    {
      name: "Caddo Runner",
      purpose: "Crew transfer",
      officialNumber: "1290417",
      retrofitted: true,
      salesPrice: 180000,
    },
    {
      name: "Sabine Survey",
      purpose: "Site survey",
      officialNumber: "1311852",
      retrofitted: false,
      salesPrice: 240000,
    },
  ],
  criticalMineralCosts: {
    graphite_purified: 18250,
    lithium_carbonate_hydroxide: 40000,
    nickel_sulphate: 25000,
  },
  passive: false,
  transfer: {
    direction: "sold",
    amount: 50000,
    registrationNumber: "AMP-25-0007207",
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BRAN_USER_ID, taxYear: BRAN_TAX_YEAR, suffix, value });

export const PLANT_KEY = makeAdvancedManufacturingFacilityFactKey("marshall-plant");

export const branFacts: TaxFactRow[] = [
  idFact("name.first", BRAN.firstName),
  idFact("name.last", BRAN.lastName),
  idFact("ssn", BRAN.ssn),
  idFact("dob", "05/02/1974"),
  idFact("address.street", BRAN.street),
  idFact("address.city", BRAN.city),
  idFact("address.state", BRAN.state),
  idFact("address.zip", BRAN.zip),
  idFact("occupation", "Manufacturer"),
  idFact("phone", "903-555-0172"),
  fact("self_employment", makeBusinessFactKey("works"), works, "Stated by Bran, from the books."),
  fact(
    "self_employment",
    PLANT_KEY,
    PLANT,
    "Stated by Bran: the plant's 2025 production and sales records and the transfer agreement.",
  ),
];
