/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts); the
 * business and the two fuel facilities are the taxpayer's own answers from
 * the books, the producer registration letters and the emissions rate table.
 */

import {
  makeBusinessFactKey,
  makeCleanFuelFacilityFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type CleanFuelFacilityFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ABELL_USER_ID = "abell-integration";
export const ABELL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ABELL_USER_ID,
  taxYear: ABELL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ABELL = {
  taxpayer: { firstName: "Abell", lastName: "Fenwright", ssn: "400-00-7218" },
  street: "77 County Road 410",
  city: "Hereford",
  state: "TX",
  zip: "79045",
};

const BUSINESS_ID = "fenwright-renewable-fuels";
export const BUSINESS_KEY = makeBusinessFactKey(BUSINESS_ID);

/* The fuel business: sales of the fuel both facilities make. Feedstock is a Part V expense. */
const fuelBusiness: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Renewable fuel production",
  code: "325190",
  name: "Fenwright Renewable Fuels",
  ein: "00-0007218",
  address: { street: "1400 Industrial Park Road", city: "Hereford", state: "TX", zip: "79045" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 612000,
  expenses: {
    insurance: 18400,
    repairs: 26300,
    supplies: 41200,
    utilities: 52700,
    wages: 128000,
  },
  otherExpenses: [
    { description: "Feedstock (used cooking oil, soybean oil, camelina oil)", amount: 164500 },
  ],
  specifiedService: false,
  w2WagesPaid: 128000,
  qualifiedPropertyUbia: 0,
};

export const BIOREFINERY_KEY = makeCleanFuelFacilityFactKey("hereford-biorefinery");

/*
 * The biorefinery: built after the apprenticeship transition date, with
 * prevailing wages paid, so line 7 is Yes. The producer registration letter
 * (activity letters CN and CA) is dated March 14, 2025: the gallons made
 * before it earn nothing. One SAF lot has no unrelated party certification,
 * and one lot of blended diesel is above 50 kg: neither takes a row.
 */
export const biorefinery: CleanFuelFacilityFactValue = {
  description: "Renewable diesel and sustainable aviation fuel biorefinery",
  address: { line1: "1400 Industrial Park Road", line2: "Hereford, TX 79045" },
  coordinates: { latitude: 34.815472, longitude: -102.397615 },
  constructionBegan: "2024-10-07",
  placedInService: "2025-02-03",
  registration: { number: "CN-CA-75-0007218", approvalDate: "2025-03-14" },
  meetsWageAndApprenticeship: true,
  otherFacilityCreditAllowed: false,
  passive: false,
  sales: [
    {
      fuelType: "Renewable diesel",
      sustainableAviationFuel: false,
      feedstock: "Used cooking oil",
      emissionsRate: 22,
      gallons: 60000,
      gallonsProducedBeforeRegistration: 20000,
    },
    {
      fuelType: "Biodiesel",
      sustainableAviationFuel: false,
      feedstock: "Soybean oil",
      emissionsRate: 37,
      gallons: 30000,
      gallonsProducedBeforeRegistration: 0,
    },
    {
      fuelType: "HEFA jet fuel",
      sustainableAviationFuel: true,
      feedstock: "Used cooking oil",
      emissionsRate: 24,
      gallons: 15000,
      gallonsProducedBeforeRegistration: 0,
      unrelatedPartyCertification: true,
    },
    {
      fuelType: "Renewable diesel",
      sustainableAviationFuel: false,
      feedstock: "Camelina oil",
      emissionsRate: 18,
      provisionalEmissionsRate: true,
      gallons: 4321,
      gallonsProducedBeforeRegistration: 0,
    },
    {
      fuelType: "HEFA jet fuel",
      sustainableAviationFuel: true,
      feedstock: "Soybean oil",
      emissionsRate: 31,
      gallons: 2500,
      gallonsProducedBeforeRegistration: 0,
      unrelatedPartyCertification: false,
    },
    {
      fuelType: "Blended diesel",
      sustainableAviationFuel: false,
      feedstock: "Tallow and petroleum",
      emissionsRate: 58,
      gallons: 8000,
      gallonsProducedBeforeRegistration: 0,
    },
  ],
};

export const DIGESTER_KEY = makeCleanFuelFacilityFactKey("cedar-hollow-digester");

/*
 * A biogas upgrading unit on a dairy, owned by the dairy: Abell produces the
 * fuel there under a lease (line 2b names the owner). Placed in service in
 * 2023, with no prevailing wage records: line 7 is No. Registered in November
 * 2024, so every 2025 gallon counts. Abell sold $4,000 of its credit to an
 * unrelated buyer for cash under section 6418.
 */
export const digester: CleanFuelFacilityFactValue = {
  description: "Dairy biogas upgrading unit (renewable natural gas)",
  owner: { name: "Cedar Hollow Dairy LLC", tin: "000007219" },
  address: { line1: "2210 FM 1058", line2: "Hereford, TX 79045" },
  coordinates: { latitude: 34.902114, longitude: -102.51833 },
  constructionBegan: "2022-08-15",
  placedInService: "2023-06-01",
  registration: { number: "CN-75-0007219", approvalDate: "2024-11-20" },
  meetsWageAndApprenticeship: false,
  otherFacilityCreditAllowed: false,
  passive: false,
  transfer: { direction: "sold", amount: 4000, registrationNumber: "R-2025-0007219" },
  sales: [
    {
      fuelType: "Renewable natural gas",
      sustainableAviationFuel: false,
      feedstock: "Dairy manure",
      emissionsRate: 10,
      gallons: 50000,
    },
    {
      fuelType: "Renewable natural gas",
      sustainableAviationFuel: false,
      feedstock: "Landfill gas",
      emissionsRate: 30,
      gallons: 20000,
    },
  ],
};

export const BLENDER_ID = "panhandle-fuel-partners";
export const BLENDER_EIN = "00-0007220";

/* A fuel blending partnership where Abell is a limited partner. Box 15 code X. */
export const blenderK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Panhandle Fuel Partners LP",
  entityEin: BLENDER_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 4,
  lossPercent: 4,
  capitalPercent: 4,
  boxes: [
    { box: "1", amount: 21000 },
    { box: "15", code: "X", amount: 3200 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ABELL_USER_ID, taxYear: ABELL_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";
const FACILITY = `${VERBAL}: the facility's production and sales records, the producer registration letter and the 2025 emissions rate table (Notice 2025-11).`;

export const abellFacts: TaxFactRow[] = [
  idFact("name.first", ABELL.taxpayer.firstName),
  idFact("name.last", ABELL.taxpayer.lastName),
  idFact("ssn", ABELL.taxpayer.ssn),
  idFact("dob", "09/03/1971"),
  idFact("address.street", ABELL.street),
  idFact("address.city", ABELL.city),
  idFact("address.state", ABELL.state),
  idFact("address.zip", ABELL.zip),
  idFact("occupation", "Renewable fuel producer"),
  idFact("phone", "806-555-0172"),
  fact("self_employment", BUSINESS_KEY, fuelBusiness, `${VERBAL}: the fuel business's books.`),
  fact("other", BIOREFINERY_KEY, biorefinery, FACILITY),
  fact("other", DIGESTER_KEY, digester, FACILITY),
  fact(
    "k1",
    makePartnershipK1FactKey(BLENDER_ID),
    blenderK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-panhandle-fuel-partners.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(BLENDER_ID), holding, VERBAL),
];
