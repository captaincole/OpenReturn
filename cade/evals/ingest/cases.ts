import {
  makeCleanVehicleFactKey,
  makeDependentCareProviderFactKey,
  makeDividendFactKey,
  makeForeignIncomeStatementKey,
  makeForm1098TFactKey,
  makeGamblingWinningsFactKey,
  makeHsaDistributionFactKey,
  makeInterestFactKey,
  makeLtcBenefitsFactKey,
  makePaymentTransactionsFactKey,
  makeRetirementDistributionFactKey,
  makeSavingsBondCashedFactKey,
  makeSCorporationK1FactKey,
  makeSection1256StatementFactKey,
  makeSocialSecurityFactKey,
  makeTrustK1FactKey,
  makeW2FactKey,
  MORTGAGE_KEYS,
  type TaxFactRow,
} from "@openreturn/engine/facts";
import { loadScenarios, scenarioFolder } from "@openreturn/engine/scenarios";
import path from "node:path";

export interface IngestCase {
  doc: string;
  /* In the lite tier: one document per type. */
  lite: boolean;
  type: string;
  pdf: string;
  expected: TaxFactRow[];
}

const SCENARIO_DIR = path.resolve(__dirname, "../../../engine/tests/scenarios");

/* A fact key: the exact key, or a pattern for the older rows. */
type KeyMatch = string | RegExp;
const matchesKey = (match: KeyMatch, key: string) =>
  typeof match === "string" ? match === key : match.test(key);

/* [scenario, file, document type, the keys of the facts it produces] */
const MANIFEST: [string, string, string, KeyMatch[]][] = [
  ["alex", "01-alex-w2.pdf", "W-2", [/^employer\./]],
  ["alejandro", "01-alejandro-w2.pdf", "W-2", [/^employer\./]],
  ["alejandro", "02-alejandro-1099.pdf", "Consolidated 1099", [/^account\.apex-individual\./]],
  ["marcus", "01-marcus-w2.pdf", "W-2", [/^employer\./]],
  ["marcus", "02-marcus-1099-wealthfront.pdf", "1099-INT", [/^account\.wealthfront-cash\./]],
  ["marcus", "03-marcus-1099-schwab.pdf", "Consolidated 1099", [/^account\.schwab-brokerage\./]],
  ["jordan", "01-example-corp-w2.pdf", "W-2", [/^employer\./]],
  [
    "jordan",
    "02-example-broker-1099-consolidated.pdf",
    "Consolidated 1099",
    [
      /^account\.example-broker\.(dividends|interest|misc)$/,
      /^account\.example-broker\.trades\.[^.]+$/,
    ],
  ],
  [
    "jordan",
    "03-example-broker-stock-plan-1099.pdf",
    "1099-B",
    [/^account\.example-broker-stock-plan\.trades\./],
  ],
  ["jordan", "04-example-savings-1099-int.pdf", "1099-INT", [/^account\.example-savings\./]],
  [
    "jordan",
    "05-example-exchange-1099-da.pdf",
    "1099-DA",
    [/^account\.example-exchange\.trades\./],
  ],
  [
    "jordan",
    "06-example-exchange-1099-misc.pdf",
    "1099-MISC",
    [/^account\.example-exchange\.misc$/],
  ],
  ["jordan", "07-example-trust-1099-r-code-g.pdf", "1099-R", [/distributions\.code-g$/]],
  ["jordan", "08-example-trust-1099-r-code-h.pdf", "1099-R", [/distributions\.code-h$/]],
  ["jordan", "09-example-hsa-1099-sa.pdf", "1099-SA", [/hsa_distributions\./]],
  ["carter", "01-liberty-trust-1099-r-code-q.pdf", "1099-R", [/^payer\.liberty-trust-company\./]],
  [
    "carter",
    "02-jubilee-retirement-1099-r-code-g.pdf",
    "1099-R",
    [/^payer\.jubilee-retirement-fund\./],
  ],
  ["carter", "03-example-reit-fund-1099-div.pdf", "1099-DIV", [/^account\.example-reit-fund\./]],
  ["carter", "04-ssa-1099.pdf", "SSA-1099", [/^payer\.ssa\./]],
  ["tara", "01-green-ladies-w-2.pdf", "W-2", [makeW2FactKey("the-green-ladies")]],
  ["tara", "02-c-and-r-w-2.pdf", "W-2", [makeW2FactKey("c-r")]],
  ["tara", "03-household-employee-w-2-copy-d.pdf", "Household W-2", [/\.household_w2$/]],
  ["tara", "04-bay-area-door-invoice.pdf", "Energy invoice", [/^vendor\.bay-area-door/]],
  ["tara", "05-sierra-window-invoice.pdf", "Energy invoice", [/^vendor\.sierra-window/]],
  ["tara", "06-valley-comfort-hvac-invoice.pdf", "Energy invoice", [/^vendor\.valley-comfort/]],
  ["tcb-us-003", "01-test-w2.pdf", "W-2", [makeW2FactKey("test")]],
  [
    "tcb-us-003",
    "02-fidelity-advisor-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("fidelity-advisor", "code-1")],
  ],
  [
    "tcb-us-003",
    "03-charles-schwab-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("charles-schwab", "code-7")],
  ],
  [
    "tcb-us-003",
    "04-capital-one-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("capital-one", "code-4")],
  ],
  [
    "tcb-us-003",
    "05-the-roth-company-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("the-roth-company", "code-c")],
  ],
  ["tcb-us-003", "06-ssa-1099.pdf", "SSA-1099", [makeSocialSecurityFactKey("ssa")]],
  ["tcb-us-006", "01-abc-co-w2.pdf", "W-2", [makeW2FactKey("abc-co")]],
  [
    "tcb-us-006",
    "02-poker-club-w2g.pdf",
    "W-2G",
    [makeGamblingWinningsFactKey("tin-12-3456789", "10-10-2025-5000000")],
  ],
  ["tcb-us-006", "03-azure-1099-int.pdf", "1099-INT", [makeInterestFactKey("azure")]],
  ["tcb-us-006", "04-azure-1099-div.pdf", "1099-DIV", [makeDividendFactKey("azure")]],
  [
    "tcb-us-006",
    "05-metro-rides-1099-k.pdf",
    "1099-K",
    [makePaymentTransactionsFactKey("tin-00-0000006", "mr-20417")],
  ],
  [
    "tcb-ca-005",
    "07-chase-bank-1098.pdf",
    "1098",
    [
      MORTGAGE_KEYS.interestForm1098,
      MORTGAGE_KEYS.outstandingPrincipalForm1098,
      MORTGAGE_KEYS.originationDateForm1098,
    ],
  ],
  [
    "perrin",
    "01-rio-grande-valley-1098-t.pdf",
    "1098-T",
    [makeForm1098TFactKey("rio-grande-valley-state", "perrin")],
  ],
  [
    "perrin",
    "02-sunland-park-1098-t.pdf",
    "1098-T",
    [makeForm1098TFactKey("sunland-park-cc", "perrin")],
  ],
  [
    "perrin",
    "03-franklin-mountains-1098-t.pdf",
    "1098-T",
    [makeForm1098TFactKey("franklin-mountains-business", "marisol")],
  ],
  [
    "galad",
    "02-foreign-income-larchmont.pdf",
    "Foreign income statement",
    [makeForeignIncomeStatementKey(makeDividendFactKey("larchmont-international"))],
  ],
  [
    "birgitte",
    "01-seller-report-new-vehicle.pdf",
    "Clean vehicle seller report",
    [makeCleanVehicleFactKey("aurelle-sona")],
  ],
  [
    "birgitte",
    "02-seller-report-previously-owned-vehicle.pdf",
    "Clean vehicle seller report",
    [makeCleanVehicleFactKey("pellam-coastline")],
  ],
  [
    "elayne",
    "01-seller-report-new-vehicle.pdf",
    "Clean vehicle seller report",
    [makeCleanVehicleFactKey("aurelle-ridgeline")],
  ],
  [
    "elayne",
    "02-seller-report-previously-owned-vehicle.pdf",
    "Clean vehicle seller report",
    [makeCleanVehicleFactKey("pellam-strata")],
  ],
  [
    "hollis",
    "01-1099-b-ridgeline-futures.pdf",
    "1099-B futures",
    [makeSection1256StatementFactKey("ridgeline-futures")],
  ],
  [
    "hollis",
    "02-1099-b-mesa-commodity.pdf",
    "1099-B futures",
    [makeSection1256StatementFactKey("mesa-commodity")],
  ],
  [
    "ottilie",
    "01-sunflower-hill-care-statement.pdf",
    "Care provider statement",
    [makeDependentCareProviderFactKey("sunflower-hill")],
  ],
  [
    "ottilie",
    "02-lupe-arroyo-care-statement.pdf",
    "Care provider statement",
    [makeDependentCareProviderFactKey("lupe-arroyo")],
  ],
  [
    "odessa",
    "01-savings-bonds-cashed.pdf",
    "Savings bond record",
    [
      makeSavingsBondCashedFactKey("paper-ee-2004"),
      makeSavingsBondCashedFactKey("electronic-ee-2012"),
      makeSavingsBondCashedFactKey("series-i-2015"),
      makeSavingsBondCashedFactKey("paper-ee-1988"),
    ],
  ],
  [
    "siuan",
    "01-truckee-valley-water-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("truckee-valley-water", "pension")],
  ],
  [
    "siuan",
    "02-harlow-tool-works-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("harlow-tool-works", "lump-sum")],
  ],
  [
    "tuon",
    "01-redwood-valley-mills-1099-r.pdf",
    "1099-R",
    [makeRetirementDistributionFactKey("redwood-valley-pension", "r-1")],
  ],
  [
    "thaddeus",
    "01-cascade-health-1099-sa.pdf",
    "1099-SA",
    [makeHsaDistributionFactKey("cascade-health", "sa1")],
  ],
  [
    "thaddeus",
    "02-sound-savings-1099-sa.pdf",
    "1099-SA",
    [makeHsaDistributionFactKey("sound-savings", "sa1")],
  ],
  [
    "thaddeus",
    "03-evergreen-ma-1099-sa-code-1.pdf",
    "1099-SA",
    [makeHsaDistributionFactKey("evergreen-ma", "sa1")],
  ],
  [
    "thaddeus",
    "04-evergreen-ma-1099-sa-code-3.pdf",
    "1099-SA",
    [makeHsaDistributionFactKey("evergreen-ma", "sa2")],
  ],
  [
    "thaddeus",
    "05-mount-rainier-1099-ltc.pdf",
    "1099-LTC",
    [makeLtcBenefitsFactKey("mount-rainier", "ltc1")],
  ],
  [
    "thaddeus",
    "06-olympic-life-1099-ltc.pdf",
    "1099-LTC",
    [makeLtcBenefitsFactKey("olympic-life", "ltc1")],
  ],
  [
    "galad",
    "01-1099-div-larchmont.pdf",
    "1099-DIV",
    [makeDividendFactKey("larchmont-international")],
  ],
  ["galad", "03-1099-div-northgate.pdf", "1099-DIV", [makeDividendFactKey("northgate-brokerage")]],
  [
    "lan",
    "01-schedule-k1-malkier-fencing.pdf",
    "Schedule K-1 (Form 1120-S)",
    [makeSCorporationK1FactKey("malkier-fencing")],
  ],
  [
    "min",
    "01-schedule-k1-baerlon-bindery.pdf",
    "Schedule K-1 (Form 1120-S)",
    [makeSCorporationK1FactKey("baerlon-bindery")],
  ],
  [
    "elaida",
    "01-schedule-k1-white-tower-glassworks.pdf",
    "Schedule K-1 (Form 1120-S)",
    [makeSCorporationK1FactKey("white-tower-glass")],
  ],
  [
    "gareth",
    "01-schedule-k1-kore-springs-stables.pdf",
    "Schedule K-1 (Form 1120-S)",
    [makeSCorporationK1FactKey("kore-springs-stables")],
  ],
  [
    "mat",
    "01-schedule-k1-shandalle-family-trust.pdf",
    "Schedule K-1 (Form 1041)",
    [makeTrustK1FactKey("shandalle-family-trust")],
  ],
];

/*
 * Fields that need what the user said, not only the document: a 1099-K's businessId
 * links it to a business Cade asked about, and a 1099-R's owner compares the
 * recipient with the taxpayer's name. A seller report, a care provider's statement
 * and a savings bond record each go into a fact that also holds the taxpayer's
 * answers. The eval asks no questions and gives no identity, so it does not score them.
 */
const ANSWER_FIELDS = [
  "businessId",
  "owner",
  "acquiredForUse",
  "resoldWithin30Days",
  "businessUsePercent",
  "businessUseMonths",
  "claimedUsedCreditInPrior3Years",
  "householdEmployee",
  "providerType",
  "employerProvided",
  "ownerQualifies",
  "interestReportedInPriorYears",
];

function documentValue(fact: TaxFactRow): TaxFactRow {
  if (typeof fact.value !== "object" || fact.value === null) return fact;
  const printed = Object.entries(fact.value).filter(([field]) => !ANSWER_FIELDS.includes(field));
  return { ...fact, value: Object.fromEntries(printed) };
}

/* One document per type. */
const LITE = new Set([
  "jordan/01-example-corp-w2.pdf",
  "marcus/03-marcus-1099-schwab.pdf",
  "marcus/02-marcus-1099-wealthfront.pdf",
  "jordan/03-example-broker-stock-plan-1099.pdf",
  "jordan/05-example-exchange-1099-da.pdf",
  "jordan/06-example-exchange-1099-misc.pdf",
  "carter/01-liberty-trust-1099-r-code-q.pdf",
  "jordan/09-example-hsa-1099-sa.pdf",
  "carter/03-example-reit-fund-1099-div.pdf",
  "carter/04-ssa-1099.pdf",
  "tara/03-household-employee-w-2-copy-d.pdf",
  "tara/04-bay-area-door-invoice.pdf",
  "tcb-us-006/02-poker-club-w2g.pdf",
  "tcb-us-006/05-metro-rides-1099-k.pdf",
  "tcb-ca-005/07-chase-bank-1098.pdf",
  "perrin/01-rio-grande-valley-1098-t.pdf",
  "galad/02-foreign-income-larchmont.pdf",
  "birgitte/01-seller-report-new-vehicle.pdf",
  "hollis/01-1099-b-ridgeline-futures.pdf",
  "ottilie/01-sunflower-hill-care-statement.pdf",
  "odessa/01-savings-bonds-cashed.pdf",
  "thaddeus/03-evergreen-ma-1099-sa-code-1.pdf",
  "thaddeus/05-mount-rainier-1099-ltc.pdf",
  "min/01-schedule-k1-baerlon-bindery.pdf",
  "mat/01-schedule-k1-shandalle-family-trust.pdf",
]);

/* Every document in the full tier, as "<scenario>/<file>". */
export const ALL_DOCS = MANIFEST.map(([scenario, file]) => `${scenario}/${file}`);

export async function loadCases(tier: "lite" | "full"): Promise<IngestCase[]> {
  const SCENARIOS = await loadScenarios();
  const cases = MANIFEST.map(([scenario, file, type, patterns]) => {
    const facts = SCENARIOS.find((entry) => entry.name === scenario)?.facts ?? [];
    const expected = facts
      .filter((fact) => patterns.some((pattern) => matchesKey(pattern, fact.key)))
      .map(documentValue);
    if (!expected.length) throw new Error(`${scenario}/${file}: no expected facts match`);
    const doc = `${scenario}/${file}`;
    return {
      doc,
      lite: LITE.has(doc),
      type,
      pdf: path.join(SCENARIO_DIR, scenarioFolder(scenario), "docs", file),
      expected,
    };
  });
  const missing = [...LITE].filter((doc) => !cases.some((testCase) => testCase.doc === doc));
  if (missing.length) throw new Error(`LITE names unknown documents: ${missing.join(", ")}`);
  return tier === "full" ? cases : cases.filter((testCase) => testCase.lite);
}
