/*
 * Made-up taxpayer (README.md): a single full-year California resident who
 * works for, and owns shares of, an S corporation whose plant is in the former
 * Harbor Gateway Communities enterprise zone. Every name, number and address
 * is invented. She invests in the business, so FTB 3805Z takes items A to D
 * only and no Worksheet I, Section A. Her credit carryovers came to her from
 * the S corporation before the zone was repealed. She also paid Utah tax and
 * has a PTE elective tax credit, so Schedule P (540) takes three credits. The
 * K-1s and the Utah return are not in the engine: their amounts are her
 * answers, and the S corporation had no income for 2025.
 */

import {
  CA_ENTERPRISE_ZONE_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  makeCaPteElectiveCreditFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type CaEnterpriseZoneBusinessFactValue,
  type CaPteElectiveCreditFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SEONID_USER_ID = "seonid-synthetic";
export const SEONID_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "2264 Via Rivera", city: "Palos Verdes Estates", state: "CA", zip: "90274" };
const TAXPAYER = { firstName: "Seonid", lastName: "Tremaine", ssn: "400-00-3806" };
const PLANT = "18300 S Western Ave, Los Angeles, CA 90248";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SEONID_USER_ID,
  taxYear: SEONID_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SEONID_USER_ID, taxYear: SEONID_TAX_YEAR, suffix, value });

/* Her W-2 from the S corporation; $40,000 of box 1 is for weeks on a Salt Lake City job. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Harbor Gateway Plating, Inc.",
  employerEin: "12-3805806",
  employerAddress: { line1: "18300 S Western Ave", city: "Los Angeles", state: "CA", zip: "90248" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 310000,
  box2: 64000,
  box3: 176100,
  box4: 10918.2,
  box5: 310000,
  box6: 5395,
  box14: [{ label: "CA SDI", amount: 3720 }],
  box15: "CA",
  box16: 310000,
  box17: 25600,
};

/*
 * The FTB 3805Z business. She is an investor, so items E to H stay blank.
 * Worksheet I, Section B line 1: her wages, at the share of her time at the
 * plant in the former zone (her daily planner: two days of five).
 */
const zoneBusiness: CaEnterpriseZoneBusinessFactValue = {
  businessName: "Harbor Gateway Plating, Inc.",
  businessAddress: PLANT,
  zoneName: "Harbor Gateway Communities",
  role: "investor",
  incomeItems: [
    {
      line: "wages",
      description: "Harbor Gateway Plating, Inc.",
      amount: 310000,
      zoneShare: 0.4,
    },
  ],
};

/* Her Utah nonresident return (TC-40 with TC-40B) for the Salt Lake City weeks. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    { description: "Wages, Salt Lake City job", californiaAmount: 40000, otherStateAmount: 40000 },
  ],
  taxPaid: 1800,
  otherStateAdjustedGrossIncome: 40000,
};

const pteCredit: CaPteElectiveCreditFactValue = {
  entityName: "South Bay Rack Storage LLC",
  entityId: "202210738061",
  credit: 4000,
};

const LAST_YEAR = "Her filed 2024 FTB 3805Z";

export const seonidFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "02/03/1976"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Los Angeles"),
  idFact("occupation", "Plant operations director"),
  idFact("phone", "310-555-0167"),
  fact("wages", makeW2FactKey("harbor-gateway"), w2, "W-2 from Harbor Gateway Plating, Inc."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    "Verbal, from her 2025 Utah TC-40 and TC-40B.",
  ),
  fact(
    "state_local_tax",
    makeCaPteElectiveCreditFactKey("south-bay-rack"),
    pteCredit,
    "Schedule K-1 (568) from South Bay Rack Storage LLC, other credits line and its statement.",
  ),
  fact("other", CA_PTE_CREDIT_CARRYOVER_KEY, 0, "Verbal: no FTB 3804-CR carryover from 2024."),
  fact(
    "self_employment",
    CA_ENTERPRISE_ZONE_KEYS.business,
    zoneBusiness,
    "Verbal: her W-2, her daily planner, and the K-1 (100S) from Harbor Gateway Plating, Inc.",
  ),
  fact(
    "other",
    CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover,
    30000,
    `${LAST_YEAR}, Schedule Z line 8B column (g).`,
  ),
  fact(
    "other",
    CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover,
    5000,
    `${LAST_YEAR}, Schedule Z line 9B column (g).`,
  ),
  fact("other", CA_ENTERPRISE_ZONE_KEYS.nolCarryovers, [], `${LAST_YEAR}: no EZ NOL carryover.`),
];
