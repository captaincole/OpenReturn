/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the Schedule K-1 (Form
 * 1065) would print them, and the taxpayer's answers. The amounts at risk are
 * the taxpayer's own figures; no document prints them.
 */

import {
  makeAtRiskFactKey,
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type AtRiskAmounts,
  type BusinessFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ITURALDE_USER_ID = "ituralde-integration";
export const ITURALDE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ITURALDE_USER_ID,
  taxYear: ITURALDE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ITURALDE = {
  taxpayer: { firstName: "Ituralde", lastName: "Varga", ssn: "400-00-4801" },
  street: "604 Basalt Ridge Road",
  city: "Spokane",
  state: "WA",
  zip: "99203",
};

const address = {
  line1: ITURALDE.street,
  city: ITURALDE.city,
  state: ITURALDE.state,
  zip: ITURALDE.zip,
};

/* The W-2 from the freight company where Ituralde works full time. */
const freightW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Arafel Freight Lines",
  employerEin: "00-0004801",
  employerAddress: address,
  employee: { ...ITURALDE.taxpayer, address },
  box1: 150000,
  box2: 26000,
  box3: 150000,
  box4: 9300,
  box5: 150000,
  box6: 2175,
};

/*
 * Ituralde's own documentary film business (Schedule C), a loss this year. A
 * film distributor that shares in the film's profits lent part of the money,
 * so some investment is not at risk (box 32b). Form 6198: Part II from the
 * adjusted basis, Part III for an activity that began after its effective date.
 */
const FILM_KEY = makeBusinessFactKey("varga-film-works");
const filmAtRisk: AtRiskAmounts = {
  description: "Documentary film production",
  simplified: { adjustedBasisAtStart: 12000, increases: 5000, decreases: 9000 },
  detailed: { start: "began_after_effective_date", increasesSince: 21000, decreasesSince: 11000 },
};
const filmBusiness: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Documentary film production",
  code: "512100",
  name: "Varga Film Works",
  address: {
    street: ITURALDE.street,
    city: ITURALDE.city,
    state: ITURALDE.state,
    zip: ITURALDE.zip,
  },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 18000,
  expenses: {
    contractLabor: 21000,
    rentVehiclesMachinery: 9000,
    travel: 6000,
    supplies: 4000,
    insurance: 2000,
    legalAndProfessional: 3000,
  },
  allInvestmentAtRisk: false,
  atRisk: filmAtRisk,
  specifiedService: false,
};

const RANCH_ID = "kandor-ridge-cattle";
const RANCH_KEY = makePartnershipK1FactKey(RANCH_ID);

/*
 * The K-1 from a cattle ranch LLC Ituralde manages with two partners: a box 1
 * loss, interest and a cash distribution. Its share of the LLC's nonrecourse
 * debt is in basis but not at risk.
 */
const ranchK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Kandor Ridge Cattle LLC",
  entityEin: "00-0004802",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 30,
  lossPercent: 30,
  capitalPercent: 30,
  liabilitiesAtStart: { nonrecourse: 60000 },
  liabilitiesAtEnd: { nonrecourse: 60000 },
  boxes: [
    { box: "1", amount: -40000 },
    { box: "5", amount: 420 },
    { box: "19", code: "A", amount: 2000 },
  ],
};

/*
 * Ituralde's answers: he works the ranch most days; his basis at the start of
 * 2025 was $90,000 (his 2024 worksheet line 18, the $60,000 debt share in it);
 * he put $30,000 of cash in during 2025; the at-risk limit held back $6,000 of
 * his 2024 loss.
 */
const ranchHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: false,
  partnershipBasisAtStart: 90000,
  capitalContributions: 30000,
  carriedLosses: { atRisk: { ordinaryBusinessLoss: 6000 } },
};

/* His 2024 Form 6198 for the ranch had Part III, with $0 on line 19b. */
const ranchAtRisk: AtRiskAmounts = {
  description: "Cattle ranching",
  detailed: {
    start: "prior_year_form",
    priorYearAmountAtRisk: 0,
    increasesSince: 30000,
    decreasesSince: 2000,
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ITURALDE_USER_ID, taxYear: ITURALDE_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-23";

export const ituraldeFacts: TaxFactRow[] = [
  idFact("name.first", ITURALDE.taxpayer.firstName),
  idFact("name.last", ITURALDE.taxpayer.lastName),
  idFact("ssn", ITURALDE.taxpayer.ssn),
  idFact("dob", "09/14/1979"),
  idFact("address.street", ITURALDE.street),
  idFact("address.city", ITURALDE.city),
  idFact("address.state", ITURALDE.state),
  idFact("address.zip", ITURALDE.zip),
  idFact("occupation", "Logistics manager"),
  idFact("phone", "509-555-0148"),
  fact("wages", makeW2FactKey("arafel-freight"), freightW2, "W-2 from Arafel Freight Lines"),
  fact(
    "self_employment",
    FILM_KEY,
    filmBusiness,
    `${VERBAL}: the film business's books and its amounts at risk.`,
  ),
  fact("k1", RANCH_KEY, ranchK1, "Schedule K-1 (Form 1065) from Kandor Ridge Cattle LLC."),
  fact(
    "k1",
    makeK1HoldingFactKey(RANCH_ID),
    ranchHolding,
    `${VERBAL}: basis from his 2024 partner's basis worksheet; the carried loss from his 2024 Form 6198.`,
  ),
  fact(
    "other",
    makeAtRiskFactKey(RANCH_KEY),
    ranchAtRisk,
    `${VERBAL}: his 2024 Form 6198 line 19b, his 2025 contribution and distribution.`,
  ),
];
