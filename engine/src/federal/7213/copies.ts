/*
 * The copies of Form 7213 a return files: "a separate Form 7213 for each
 * advanced nuclear power facility or each qualified nuclear power facility"
 * (irs-7213-inst-2025::sec::who-must-file::b01), one for each facility fact,
 * then one separate form for the K-1 credits, headed "Credit From Pass-Through
 * Entities" (line-10::b01, line-12::b01). Everything is figured from the
 * facts, so Form 3800 reads every copy.
 */

import {
  getNuclearFacilityFacts,
  type AdvancedNuclearCredit,
  type NuclearFacilityFact,
  type ZeroEmissionNuclearCredit,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { withPrefix, type Cells, type CellValue, type Form7213Copy } from "./cells.js";
import { advancedNuclearLines, percentText, zeroEmissionLines } from "./lines.js";
import { passThroughCopy } from "./passThrough.js";
import { partIISectionOne, partISectionOne } from "./sectionOne.js";

export const PART_I_SECTION_2 = "0.part1_sec2.";
export const PART_II_SECTION_2 = "1.part2_sec2.";
/* The line each part's total is on: Part I line 9 and Part II line 13 (face, "All others ... Form 3800"). */
export const PART_I_TOTAL = `${PART_I_SECTION_2}9_total_lines_7_and_8`;
export const PART_II_TOTAL = `${PART_II_SECTION_2}13_total_lines_11_12`;

/* "Complete Part II only if the facility was placed in service prior to August 16, 2022" (face-part-ii::b01). */
export const PART_II_PLACED_IN_SERVICE_BEFORE = "2022-08-16";

const PARTNER_GAP =
  "An eligible project partner claims the section 45J credit the qualified public entity transfers in its section 45J(e) election statement (line-8::b01), and the instructions do not say how a partner figures Section 2 lines 1 to 9.";
const NOT_QUALIFIED_GAP =
  "Part II is only for a qualified nuclear power facility placed in service before August 16, 2022 (irs-7213-face-2025::sec::face-part-ii::b01), and this facility's date is later: check the date, or state the facility under section 45J.";
const ELECTIVE_GAP =
  "Only an applicable entity (section 6417(d)(1)(A), such as a tax-exempt or governmental entity) can elect to treat the zero-emission nuclear power production credit as a payment (irs-7213-inst-2025::sec::credit-for-zero-emission-nuclear::b03); an individual cannot.";

/* Every Section 2 line of a part as the same gap, so no total drops it. */
function gapLines(prefix: string, keys: string[], reason: string): Cells {
  const gap: Unsupported = unsupported(reason);
  return withPrefix(prefix, Object.fromEntries(keys.map((key) => [key, gap])));
}

const PART_I_LINE_KEYS = [
  "1_nmcl_allocated_mw",
  "2_facility_nameplate_capacity_mw",
  "3_nmcl_share_percent",
  "4_kwh_produced_and_sold",
  "5a_qualifying_electricity_production_kwh",
  "5b_tentative_credit",
  "6a_annual_limitation_mw",
  "6b_annual_limitation_amount",
  "7_smaller_of_5b_or_6b",
  "9_total_lines_7_and_8",
];

/*
 * DECISION (2026-11-27, by the author): Part I line 2, "Facility nameplate
 * capacity" (irs-7213-face-2025::sec::face-part-i::b02), is the nameplate
 * capacity of the taxpayer's ownership share (Section 1 line 6), not of the
 * whole facility (Section 1 line 5), which the same words name. The
 * instructions: "If more than one taxpayer owns a direct interest in a
 * qualified facility, each taxpayer's undivided ownership share in the
 * qualified facility will be treated as a separate qualified facility owned
 * by such taxpayer" (irs-7213-inst-2025::sec::credit-for-the-production-of-electricity::b02),
 * and line 4 takes the taxpayer's own kilowatt hours. Dividing by the whole
 * facility would apply the share twice. For a sole owner the two are equal.
 * docs/rule-decisions.md, "Decided by the author".
 */
function partISectionTwo(credit: AdvancedNuclearCredit): Cells {
  if (credit.role === "eligible_project_partner") {
    return gapLines(PART_I_SECTION_2, PART_I_LINE_KEYS, PARTNER_GAP);
  }
  const lines = advancedNuclearLines({
    facilityLimitationMw: credit.facilityLimitationMw,
    nameplateCapacityMw: credit.ownedNameplateCapacityMw,
    kwhProducedAndSold: credit.kwhProducedAndSold,
  });
  return withPrefix(PART_I_SECTION_2, {
    "1_nmcl_allocated_mw": lines.line1,
    "2_facility_nameplate_capacity_mw": lines.line2,
    "3_nmcl_share_percent": percentText(lines.line3),
    "4_kwh_produced_and_sold": lines.line4,
    "5a_qualifying_electricity_production_kwh": lines.line5a,
    "5b_tentative_credit": lines.line5b,
    "6a_annual_limitation_mw": lines.line6a,
    "6b_annual_limitation_amount": lines.line6b,
    "7_smaller_of_5b_or_6b": lines.line7,
    // Line 9: "Total of lines 7 and 8"; this copy has no line 8 (the K-1 credits have their own copy).
    "9_total_lines_7_and_8": lines.line7,
  });
}

const PART_II_LINE_KEYS = [
  "1_kwh_produced_sold",
  "3_line1_times_rate",
  "4_gross_receipts_electricity_sold",
  "5_zec_program_payments",
  "6_gross_receipts_after_zec",
  "7_line1_times_0_025",
  "8_line6_minus_line7",
  "9_smaller_line3_or_16pct_line8",
  "10_line3_minus_line9",
  "11_increased_credit_amount",
  "13_total_lines_11_12",
];

/* Part II Section 2 lines 1 to 13, or blank from line 6 while the ZEC answer waits. */
function partIISectionTwo(credit: ZeroEmissionNuclearCredit): { cells: Cells; waiting: boolean } {
  if (credit.placedInService >= PART_II_PLACED_IN_SERVICE_BEFORE) {
    return {
      cells: gapLines(PART_II_SECTION_2, PART_II_LINE_KEYS, NOT_QUALIFIED_GAP),
      waiting: false,
    };
  }
  const zecPayments = credit.zecPayments ?? 0;
  const answer = credit.zecPaymentsReducedByFullCredit;
  const waiting = zecPayments > 0 && answer === undefined;
  const lines = zeroEmissionLines({
    kwhProducedAndSold: credit.kwhProducedAndSold,
    grossReceipts: credit.grossReceipts,
    zecPayments,
    zecPaymentsReducedByFullCredit: answer === true,
    prevailingWage: credit.prevailingWage,
  });
  const first: Record<string, CellValue> = {
    "1_kwh_produced_sold": lines.line1,
    "3_line1_times_rate": lines.line3,
    "4_gross_receipts_electricity_sold": lines.line4,
    // Line 5: "(if any)": blank with no ZEC program payments.
    "5_zec_program_payments": zecPayments > 0 ? lines.line5 : undefined,
  };
  if (waiting) return { cells: withPrefix(PART_II_SECTION_2, first), waiting };
  const rest: Record<string, CellValue> = {
    "6_gross_receipts_after_zec": lines.line6,
    "7_line1_times_0_025": lines.line7,
    "8_line6_minus_line7": lines.line8,
    "9_smaller_line3_or_16pct_line8": lines.line9,
    "10_line3_minus_line9": lines.line10,
    "11_increased_credit_amount": lines.line11,
    // Line 13: "Total of lines 11 and 12"; this copy has no line 12.
    "13_total_lines_11_12":
      credit.electivePayment === undefined ? lines.line11 : unsupported(ELECTIVE_GAP),
  };
  return { cells: withPrefix(PART_II_SECTION_2, { ...first, ...rest }), waiting };
}

/* One facility's Form 7213. */
export function facilityCopy(fact: NuclearFacilityFact): Form7213Copy {
  const { facility, credit } = fact.value;
  if (credit.section === "45J") {
    const cells = { ...partISectionOne(facility, credit), ...partISectionTwo(credit) };
    return { key: fact.key, cells, waiting: false };
  }
  const sectionTwo = partIISectionTwo(credit);
  const cells = { ...partIISectionOne(facility, credit), ...sectionTwo.cells };
  return { key: fact.key, cells, waiting: sectionTwo.waiting };
}

/* Every copy: the facilities in the order recorded, and the pass-through form last. */
export function form7213Copies(inputs: ResolverInputs): Form7213Copy[] {
  const facts = getNuclearFacilityFacts(inputs.facts);
  const facilities = facts.map(facilityCopy);
  const passThrough = passThroughCopy(inputs, {
    advanced: facts.some((fact) => fact.value.credit.section === "45J"),
    zeroEmission: facts.some((fact) => fact.value.credit.section === "45U"),
  });
  return passThrough === undefined ? facilities : [...facilities, passThrough];
}
