/*
 * A made-up single short line railroad owner (README.md): every name and
 * amount is invented. The Schedule K-1 (Form 1120-S) is a made PDF in docs/
 * (generate-docs.ts). The track maintenance expenditures and the miles come
 * from the railroad's books and its assignment statements: no information
 * return reports them, so they are stated answers.
 */

import {
  RAILROAD_TRACK_MAINTENANCE_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type K1HoldingFactValue,
  type RailroadTrackMaintenanceFactValue,
  type SCorporationK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NIEDA_USER_ID = "nieda-synthetic";
export const NIEDA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NIEDA_USER_ID,
  taxYear: NIEDA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NIEDA = {
  taxpayer: { firstName: "Nieda", lastName: "Kesterholt", ssn: "400-00-8900" },
  street: "3907 Bell Street",
  city: "Amarillo",
  state: "TX",
  zip: "79109",
};

export const RAILROAD_ID = "caprock-short-line";
export const RAILROAD_KEY = makeBusinessFactKey(RAILROAD_ID);

/* The rebuilt track between mileposts 12 and 19: the capitalized part of line 1. */
export const TRACK_ASSET = "Track rehabilitation, milepost 12 to 19";

/*
 * Her short line railroad (Schedule C), a Class III railroad. Repairs hold
 * the track maintenance she deducts ($202,500.40) and $60,000 of other
 * repairs. The rebuilt track is a 2025 asset; she elects out of the special
 * depreciation allowance for 7-year property.
 */
export const railroad: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Short line freight railroad",
  code: "482110",
  name: "Caprock Short Line Railroad",
  address: { street: "1200 SE 10th Avenue", city: "Amarillo", state: "TX", zip: "79102" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 3_400_000,
  expenses: {
    insurance: 140_000,
    repairs: 262_500.4,
    supplies: 85_000,
    taxesAndLicenses: 95_000,
    utilities: 30_000,
    wages: 1_250_000,
  },
  depreciation: {
    assets: [
      {
        description: TRACK_ASSET,
        placedInService: "2025-08-18",
        cost: 210_000,
        recoveryClass: "7_year",
        method: "200DB",
        convention: "HY",
        acquiredAfterJanuary19: true,
        electedOutOfSpecialAllowance: true,
      },
    ],
    priorYearMacrs: 180_000,
  },
  specifiedService: false,
  w2WagesPaid: 1_250_000,
  qualifiedPropertyUbia: 2_400_000,
};

/*
 * The railroad's 2025 track maintenance: 52.5 miles of its own track, 8
 * miles assigned to a grain shipper on the line, and 2.25 miles of a
 * connecting railroad's track assigned to it.
 */
export const trackMaintenance: RailroadTrackMaintenanceFactValue = {
  businessKey: RAILROAD_KEY,
  classIIOrIIIRailroad: true,
  expenditures: 412_500.4,
  milesOwnedOrLeased: 52.5,
  milesAssignedToOthers: 8,
  milesAssignedToYou: 2.25,
  capitalized: [{ amount: 210_000, asset: TRACK_ASSET }],
};

export const TERMINAL_ID = "llano-grain-terminal";
export const TERMINAL_EIN = "00-0008900";

/* A grain terminal on the line, an S corporation she owns a share of: box 13 code AJ is its track maintenance credit. */
export const terminalK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Llano Grain Terminal, Inc.",
  entityEin: TERMINAL_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 25,
  sharesAtStart: 250,
  sharesAtEnd: 250,
  boxes: [
    { box: "1", amount: 48_000 },
    { box: "13", code: "AJ", amount: 2_450 },
  ],
};

const terminalHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 120_000,
  stockAcquiredAs: "purchased",
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 90_000 }],
  ["2025-06", { date: "2025-06-16", amount: 90_000 }],
  ["2025-09", { date: "2025-09-15", amount: 90_000 }],
  ["2026-01", { date: "2026-01-15", amount: 90_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NIEDA_USER_ID, taxYear: NIEDA_TAX_YEAR, suffix, value });

export const niedaFacts: TaxFactRow[] = [
  idFact("name.first", NIEDA.taxpayer.firstName),
  idFact("name.last", NIEDA.taxpayer.lastName),
  idFact("ssn", NIEDA.taxpayer.ssn),
  idFact("dob", "02/23/1971"),
  idFact("address.street", NIEDA.street),
  idFact("address.city", NIEDA.city),
  idFact("address.state", NIEDA.state),
  idFact("address.zip", NIEDA.zip),
  idFact("occupation", "Railroad owner"),
  idFact("phone", "806-555-0189"),
  fact("self_employment", RAILROAD_KEY, railroad, `${VERBAL}: the railroad's 2025 books.`),
  fact(
    "self_employment",
    RAILROAD_TRACK_MAINTENANCE_KEY,
    trackMaintenance,
    `${VERBAL}: the railroad's track maintenance ledger and its 2025 assignment statements.`,
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(TERMINAL_ID),
    terminalK1,
    "Schedule K-1 (Form 1120-S) (docs/01-schedule-k1-llano-grain-terminal.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(TERMINAL_ID), terminalHolding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
