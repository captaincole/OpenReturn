/*
 * Made-up taxpayers (README.md): a married couple filing jointly in Sacramento,
 * California, with two rental homes and a passive royalty. Every name, number
 * and address is invented. The W-2s have no PDF; the rentals, the royalty and
 * last year's carryovers are the couple's answers.
 */

import {
  makeCaPassiveCarryoverKey,
  makeRentalFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  SPOUSE_KEYS,
  type RentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NOAL_USER_ID = "noal-synthetic";
export const NOAL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "4410 Larkspur Ct", city: "Sacramento", state: "CA", zip: "95819" };
const TAXPAYER = { firstName: "Noal", lastName: "Ashgrove", ssn: "400-00-0421" };
const SPOUSE = { firstName: "Liane", lastName: "Ashgrove", ssn: "400-00-0422" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NOAL_USER_ID,
  taxYear: NOAL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NOAL_USER_ID, taxYear: NOAL_TAX_YEAR, suffix, value });

/* Box 4 is 6.2% and box 6 1.45% of wages; CA SDI is 1.2%. */
interface Withholding {
  federal: number;
  socialSecurity: number;
  medicare: number;
  sdi: number;
  california: number;
}

const w2 = (
  owner: "taxpayer" | "spouse",
  employerName: string,
  employerEin: string,
  wages: number,
  withheld: Withholding,
): W2FactValue => ({
  owner,
  employerName,
  employerEin,
  employerAddress: { line1: "1200 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { ...(owner === "taxpayer" ? TAXPAYER : SPOUSE), address: HOME },
  box1: wages,
  box2: withheld.federal,
  box3: wages,
  box4: withheld.socialSecurity,
  box5: wages,
  box6: withheld.medicare,
  box14: [{ label: "CA SDI", amount: withheld.sdi }],
  box15: "CA",
  box16: wages,
  box17: withheld.california,
});

/*
 * Property A: a house the couple manages. Older depreciation is $9,500 for
 * federal and $8,000 for California (no bonus depreciation for California).
 * Its federal carryover of $10,000 arose in years they did not actively
 * participate, so it goes to Part V.
 */
const larkspurHouse: RentalFactValue = {
  owner: "joint",
  propertyType: "single_family",
  address: { street: "915 Oriole Ln", city: "Sacramento", state: "CA", zip: "95822" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 18000,
  expenses: {
    insurance: 1200,
    managementFees: 1800,
    mortgageInterest: 9000,
    repairs: 2400,
    taxes: 3200,
  },
  depreciation: { priorYearMacrs: 9500, californiaPriorYearDepreciation: 8000 },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 10000,
  activeParticipationWhenLossArose: false,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* Property B: a duplex with net income and a $2,500 carryover from years of active participation. */
const davisDuplex: RentalFactValue = {
  owner: "joint",
  propertyType: "multi_family",
  address: { street: "27 Quail Run", city: "Davis", state: "CA", zip: "95616" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 14400,
  expenses: { insurance: 700, mortgageInterest: 4000, taxes: 2100, depreciationOrDepletion: 3000 },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 2500,
  activeParticipationWhenLossArose: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* Property C: a royalty from a mineral business Noal does not work in: passive. */
const mineralRoyalty: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "royalties",
  royaltiesReceived: 6000,
  expenses: { legalAndProfessional: 1000 },
  royaltyActivity: "passive",
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

const LARKSPUR = makeRentalFactKey("oriole-house");
const DUPLEX = makeRentalFactKey("davis-duplex");
const ROYALTY = makeRentalFactKey("mineral-royalty");

export const noalFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "04/09/1981"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "916-555-0142"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.occupation, "Teacher", "Verbal: spouse's occupation."),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, "Verbal: spouse's SSN."),
  fact("identity", SPOUSE_KEYS.dob, "12/02/1983", "Verbal: spouse's date of birth."),
  fact(
    "wages",
    makeW2FactKey("delta-water"),
    w2("taxpayer", "Delta Water Engineering", "12-3456791", 104000, {
      federal: 11200,
      socialSecurity: 6448,
      medicare: 1508,
      sdi: 1248,
      california: 5100,
    }),
    "W-2 from Delta Water Engineering.",
  ),
  fact(
    "wages",
    makeW2FactKey("river-city-clinic"),
    w2("spouse", "River City Clinic", "12-3456792", 34000, {
      federal: 2600,
      socialSecurity: 2108,
      medicare: 493,
      sdi: 408,
      california: 900,
    }),
    "W-2 from River City Clinic.",
  ),
  fact("rental", LARKSPUR, larkspurHouse, "Verbal: rents, expenses and last year's 8582."),
  fact("rental", DUPLEX, davisDuplex, "Verbal: rents, expenses and last year's 8582."),
  fact("rental", ROYALTY, mineralRoyalty, "Verbal: royalty statement and costs."),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, "Verbal: both work full time."),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, "Verbal: no payments needing a 1099."),
  fact(
    "rental",
    makeCaPassiveCarryoverKey(LARKSPUR),
    9000,
    "Verbal: 2024 FTB 3801 Part VII column (c), the Oriole Ln house.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "rental",
    makeCaPassiveCarryoverKey(DUPLEX),
    2500,
    "Verbal: 2024 FTB 3801 Part VII column (c), the Davis duplex.",
  ),
  fact(
    "rental",
    makeCaPassiveCarryoverKey(ROYALTY),
    0,
    "Verbal: the royalty is not on the 2024 FTB 3801 Part VII.",
  ),
];
