/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import type { DepreciableAsset } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { assetGap, businessBasis, RECOVERY_YEARS } from "./assets.js";
import type { Form4562FilingInfo } from "./filingInfo.js";
import { form4562Figures, line44, SECTION_179_GAP } from "./lines.js";
import { ADS_FIELDS, PART_V_FIELDS } from "./notModeled.js";
import { activityOf, line19Bindings, line42Bindings } from "./rows.js";
import type { Form4562 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form4562]: BindingFn<Form4562, Form4562FilingInfo, K> }>;

/* irs-4562-inst-2025::sec::line-1::b01 and ::line-3::b02 (Worksheet 1): the 2025 limits. */
const SECTION_179_MAXIMUM = 2500000;
const SECTION_179_THRESHOLD = 4000000;
/* Section 179 property is tangible personal property: not the real property classes. */
const PERSONAL_PROPERTY_MAX_YEARS = 20;
const SECTION_179_ROWS = 2;

const SPOUSE_SHARE =
  "Married filing separately: line 2 includes the spouse's section 179 property and line 5 the spouse's share of the limit (irs-4562-inst-2025::sec::line-2::b01, ::line-5::b01); no fact gives them.";
const MORE_THAN_TWO_ELECTIONS =
  "More than two assets have a section 179 election; line 6 has two rows, and the engine writes no attached statement.";
const NO_FACT = (what: string) => `No fact gives ${what}.`;
const LISTED = "Listed property (Part V) is not modeled.";
const PART_V = "Part V (listed property and vehicles) is not modeled.";

const assetsOf = (info: Form4562FilingInfo) => activityOf(info)?.depreciation.assets ?? [];
// Line 6 leaves out listed property (irs-4562-inst-2025::sec::line-6::b01); line 7 takes it.
const electing = (asset: DepreciableAsset) =>
  (asset.section179Elected ?? 0) > 0 && !asset.listedProperty;
const electingAny = (asset: DepreciableAsset) => (asset.section179Elected ?? 0) > 0;

/* Part I applies when an asset of this activity has a section 179 election, or a carryover exists. */
function partI(info: Form4562FilingInfo): boolean {
  const depreciation = activityOf(info)?.depreciation;
  return assetsOf(info).some(electingAny) || (depreciation?.section179Carryover ?? 0) > 0;
}

/* A Part I line, blank without a section 179 election and unsupported married filing separately. */
const partILine =
  (line: (info: Form4562FilingInfo, form: FormAccessor<Form4562>) => unknown) =>
  (form: FormAccessor<Form4562>, info: Form4562FilingInfo) => {
    if (!partI(info)) return undefined;
    if (info.filingStatus === "married_filing_separately") return unsupported(SPOUSE_SHARE);
    return line(info, form) as never;
  };

const amount = (value: unknown) => (typeof value === "number" ? value : undefined);

/* Line 2: the business-use cost of every activity's personal property placed in service in 2025. */
function section179PropertyCost(info: Form4562FilingInfo): number {
  const assets = (info.form4562Activities ?? []).flatMap(
    (activity) => activity.depreciation.assets ?? [],
  );
  const personal = assets.filter(
    (asset) => RECOVERY_YEARS[asset.recoveryClass] <= PERSONAL_PROPERTY_MAX_YEARS,
  );
  return roundDollars(sum(...personal.map(businessBasis)));
}

/* A line 6 row: the index-th asset with an election. */
function electionRow(info: Form4562FilingInfo, index: number) {
  const elected = assetsOf(info).filter(electing);
  if (elected.length > SECTION_179_ROWS) return unsupported(MORE_THAN_TWO_ELECTIONS);
  return elected[index];
}

function line6Bindings(): Bindings {
  const out: Record<string, unknown> = {};
  for (let index = 0; index < SECTION_179_ROWS; index++) {
    const prefix = `0.line.6_row${index + 1}`;
    const cell = (read: (asset: DepreciableAsset) => unknown) =>
      partILine((info) => {
        const row = electionRow(info, index);
        return row === undefined || "unsupported" in row ? row : read(row);
      });
    out[`${prefix}_description`] = cell((asset) => asset.description);
    out[`${prefix}_cost`] = cell((asset) => roundDollars(businessBasis(asset)));
    out[`${prefix}_elected_cost`] = cell((asset) => roundDollars(asset.section179Elected));
  }
  return out as Bindings;
}

/* Why an asset of this activity is not figured (listed property, a class that does not fit). */
const assetsGap = (info: Form4562FilingInfo) =>
  assetsOf(info)
    .map(assetGap)
    .find((reason) => reason !== undefined);

const figuresOf = (info: Form4562FilingInfo) => {
  const activity = activityOf(info);
  return activity ? form4562Figures(activity.depreciation) : undefined;
};

export function register(): void {
  defineForm<Form4562, Form4562FilingInfo>("form-4562", {
    bindings: {
      "0.header.name": (_, info) => namesOnReturn(info),
      "0.header.business_or_activity": (_, info) => activityOf(info)?.name,
      "0.header.identifying_number": (_, info) =>
        info.taxpayerSSN ? SSN.format(info.taxpayerSSN) : undefined,
      /*
       * Part I (irs-4562-inst-2025::sec::line-1::b01 through ::line-12::b01).
       * Worksheet 1 (::line-3::b01–b02): the smaller of the property's cost and $2,500,000.
       */
      "0.line.1_maximum_amount": partILine((info) =>
        Math.min(section179PropertyCost(info), SECTION_179_MAXIMUM),
      ),
      "0.line.2_total_cost_section_179_property": partILine(section179PropertyCost),
      "0.line.3_threshold_cost": partILine(() => SECTION_179_THRESHOLD),
      "0.line.4_reduction_in_limitation": partILine((_, form) => {
        const line2 = amount(form["0.line.2_total_cost_section_179_property"]);
        return line2 === undefined ? undefined : atLeast(0, line2 - SECTION_179_THRESHOLD);
      }),
      "0.line.5_dollar_limitation": partILine((_, form) => {
        const line1 = amount(form["0.line.1_maximum_amount"]);
        const line4 = amount(form["0.line.4_reduction_in_limitation"]);
        return line1 === undefined || line4 === undefined ? undefined : atLeast(0, line1 - line4);
      }),
      ...line6Bindings(),
      "0.line.7_listed_property": partILine((info) =>
        assetsOf(info).some((asset) => asset.listedProperty) ? unsupported(LISTED) : undefined,
      ),
      "0.line.8_total_elected_cost": partILine((info) =>
        roundDollars(
          sum(
            ...assetsOf(info)
              .filter(electing)
              .map((asset) => asset.section179Elected),
          ),
        ),
      ),
      "0.line.9_tentative_deduction": partILine((_, form) => {
        const line5 = amount(form["0.line.5_dollar_limitation"]);
        const line8 = amount(form["0.line.8_total_elected_cost"]);
        return line5 === undefined || line8 === undefined ? undefined : Math.min(line5, line8);
      }),
      "0.line.10_carryover_from_2024": partILine((info) =>
        roundDollars(activityOf(info)?.depreciation.section179Carryover),
      ),
      "0.line.11_business_income_limitation": partILine(() => unsupported(SECTION_179_GAP)),
      "0.line.12_section_179_expense_deduction": partILine(() => unsupported(SECTION_179_GAP)),
      "0.line.13_carryover_to_2026": partILine(() => unsupported(SECTION_179_GAP)),
      // Part II line 14 (irs-4562-inst-2025::sec::line-14::b10): the depreciable basis times the rate.
      "0.line.14_special_depreciation_allowance": (_, info) => {
        const gap = assetsGap(info);
        return gap ? unsupported(gap) : figuresOf(info)?.line14;
      },
      "0.line.17_macrs_prior_years": (_, info) => figuresOf(info)?.line17,
      ...line19Bindings(),
      "1.line.21_listed_property": (_, info) =>
        assetsOf(info).some((asset) => asset.listedProperty) ? unsupported(LISTED) : undefined,
      // Line 22: lines 12, 14–17, 19 and 20 column (g), and 21 (lines 15, 16 and 20 are not modeled).
      "1.line.22_total": (_, info) => {
        const figures = figuresOf(info);
        if (!figures) return undefined;
        return figures.gap ? unsupported(figures.gap) : figures.line22;
      },
      ...line42Bindings(),
      "2.line.43_prior_year_amortization": (_, info) =>
        roundDollars(activityOf(info)?.depreciation.priorYearAmortization),
      "2.line.44_total": (_, info) => line44(activityOf(info)?.depreciation),
    },
    unsupported: {
      "0.line.15_section_168f1_election": NO_FACT(
        "property depreciated by the unit-of-production or another method not based on years",
      ),
      "0.line.16_other_depreciation": NO_FACT("ACRS or other depreciation outside MACRS"),
      "0.line.18_general_asset_account_election": NO_FACT("a general asset account election"),
      ...Object.fromEntries(
        ADS_FIELDS.map((field) => [
          field,
          NO_FACT("an asset depreciated under the Alternative Depreciation System"),
        ]),
      ),
      ...Object.fromEntries(PART_V_FIELDS.map((field) => [field, PART_V])),
      "1.line.23a_section_263a_interest_basis": NO_FACT("costs capitalized under section 263A"),
      "1.line.23b_section_263a_other_basis": NO_FACT("costs capitalized under section 263A"),
      "1.line.25_special_depreciation_allowance": PART_V,
      "1.line.28_total_listed_depreciation": PART_V,
      "1.line.29_total_section_179_listed": PART_V,
    },
  });
}
