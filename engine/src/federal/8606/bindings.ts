/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { roundDollars } from "../../money.js";
import { SSN } from "../../values.js";
import type { Form8606FilingInfo, IraHolder } from "./filingInfo.js";
import { partIIIFigures, type PartIIIFigures } from "./partIII.js";
import type { Form8606 } from "./types.js";

type Form = FormAccessor<Form8606>;

/* Line 10: "rounded to at least 3 places"; TaxCalcBench's key uses 5. */
const RATIO_PLACES = 5;
const RATIO_SCALE = 10 ** RATIO_PLACES;

const FILED_ALONE =
  "Filled only when Form 8606 is filed by itself, without a return; the engine files it with Form 1040.";
const PREPARER =
  "No paid-preparer facts; this block is signed only when Form 8606 is filed by itself.";

/* The IRA holder this copy is for. */
export function holderOf(info: Form8606FilingInfo): IraHolder | undefined {
  return info.form8606Filers?.[info.form8606CopyIndex ?? 0];
}

/* The Part I bullets on the form (the resolver decides). */
function partIApplies(info: Form8606FilingInfo): boolean {
  return holderOf(info)?.partI === true;
}

/* The question after line 3: a distribution or a Roth conversion means lines 4–13. */
function distributedOrConverted(info: Form8606FilingInfo): boolean {
  const holder = holderOf(info);
  if (!holder?.partI) return false;
  return holder.line7 > 0 || (holder.ira?.convertedToRoth ?? 0) > 0;
}

function converted(info: Form8606FilingInfo): number {
  return holderOf(info)?.ira?.convertedToRoth ?? 0;
}

/* Line 10 times RATIO_SCALE: a whole number from 0 to RATIO_SCALE. */
function scaledRatio(form: Form): number | undefined {
  const line5 = form["0.line.5_basis_less_2026_contributions"];
  const line9 = form["0.line.9_total_value_distributions_conversions"];
  if (line5 === undefined || line9 === undefined || line9 <= 0) return undefined;
  return Math.min(RATIO_SCALE, roundDollars((line5 / line9) * RATIO_SCALE));
}

function timesRatio(amount: number | undefined, form: Form): number | undefined {
  const scaled = scaledRatio(form);
  if (amount === undefined || scaled === undefined) return undefined;
  return roundDollars((amount * scaled) / RATIO_SCALE);
}

/* MANUAL EDIT: Part III (irs-8606-inst-2025::sec::part-iii-distributions-from-roth-iras::b01), from partIII.ts. */
function partIIIBindings() {
  const line =
    (read: (figures: PartIIIFigures) => number | undefined) =>
    (_: unknown, info: Form8606FilingInfo) => {
      const holder = holderOf(info);
      if (!holder?.rothDistribution || !holder.roth) return undefined;
      const figures = partIIIFigures(holder.rothRows, holder.roth);
      // A line 19 of 0: "don't complete Part III" (irs-8606-inst-2025::sec::line-19::b02).
      return figures.line19 === 0 ? undefined : read(figures);
    };
  return {
    "1.line.19_nonqualified_roth_distributions": line((figures) => figures.line19),
    "1.line.20_first_time_homebuyer_expenses": line((figures) =>
      figures.line20 > 0 ? figures.line20 : undefined,
    ),
    "1.line.21_line_19_minus_line_20": line((figures) => figures.line21),
    "1.line.22_basis_roth_contributions": line((figures) => figures.line22),
    "1.line.23_line_21_minus_line_22": line((figures) => figures.line23),
    "1.line.24_basis_roth_conversions_rollovers": line((figures) => figures.line24),
    "1.line.25a_line_23_minus_line_24": line((figures) => figures.line25a),
    // Line 23 of zero skips lines 24 and 25; line 25a of zero skips 25b and 25c (the form's text).
    "1.line.25c_taxable_roth_distributions": line((figures) =>
      figures.line23 === 0 || figures.line25a === 0 ? undefined : figures.line25c,
    ),
  };
}

export function register(): void {
  defineForm<Form8606, Form8606FilingInfo>("form-8606", {
    bindings: {
      // A joint return names only the spouse this copy reports.
      "0.header.taxpayer_name": (_, info) => {
        const owner = holderOf(info)?.owner;
        const first = owner === "spouse" ? info.spouseFirstName : info.taxpayerFirstName;
        const last = owner === "spouse" ? info.spouseLastName : info.taxpayerLastName;
        return owner && first && last ? `${first} ${last}` : undefined;
      },
      "0.header.ssn": (_, info) => {
        const owner = holderOf(info)?.owner;
        if (!owner) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      "0.line.1_nondeductible_traditional_contributions": (_, info) =>
        partIApplies(info)
          ? roundDollars(holderOf(info)?.ira?.nondeductibleContributions ?? 0)
          : undefined,
      "0.line.2_total_traditional_basis": (_, info) =>
        partIApplies(info) ? roundDollars(holderOf(info)?.ira?.basisPriorYears ?? 0) : undefined,
      "0.line.3_total_contributions_and_basis": (form) => {
        const line1 = form["0.line.1_nondeductible_traditional_contributions"];
        const line2 = form["0.line.2_total_traditional_basis"];
        return line1 === undefined || line2 === undefined ? undefined : line1 + line2;
      },
      // irs-8606-inst-2025::sec::line-4::b01: the part of line 1 paid January 1 to April 15, 2026.
      "0.line.4_contributions_made_in_2026": (form, info) => {
        if (!distributedOrConverted(info)) return undefined;
        if (form["0.line.1_nondeductible_traditional_contributions"] === 0) return 0;
        return roundDollars(holderOf(info)?.ira?.contributionsMadeIn2026);
      },
      "0.line.5_basis_less_2026_contributions": (form) => {
        const line3 = form["0.line.3_total_contributions_and_basis"];
        const line4 = form["0.line.4_contributions_made_in_2026"];
        return line3 === undefined || line4 === undefined ? undefined : line3 - line4;
      },
      // MANUAL EDIT: yearEndValue includes outstanding rollovers; absent, the line stays blank.
      "0.line.6_traditional_ira_year_end_value": (_, info) => {
        const yearEndValue = holderOf(info)?.ira?.yearEndValue;
        return distributedOrConverted(info) && yearEndValue !== undefined
          ? roundDollars(yearEndValue)
          : undefined;
      },
      "0.line.7_traditional_ira_distributions": (_, info) => {
        const holder = holderOf(info);
        return holder && distributedOrConverted(info) ? roundDollars(holder.line7) : undefined;
      },
      "0.line.8_net_roth_conversion_amount": (_, info) =>
        distributedOrConverted(info) ? roundDollars(converted(info)) : undefined,
      "0.line.9_total_value_distributions_conversions": (form) => {
        const line6 = form["0.line.6_traditional_ira_year_end_value"];
        const line7 = form["0.line.7_traditional_ira_distributions"];
        const line8 = form["0.line.8_net_roth_conversion_amount"];
        return line6 === undefined || line7 === undefined || line8 === undefined
          ? undefined
          : line6 + line7 + line8;
      },
      "0.line.10_nontaxable_ratio_whole": (form) => {
        const scaled = scaledRatio(form);
        if (scaled === undefined) return undefined;
        return scaled === RATIO_SCALE ? 1 : 0;
      },
      "0.line.10_nontaxable_ratio_decimal": (form) => {
        const scaled = scaledRatio(form);
        if (scaled === undefined) return undefined;
        return String(scaled % RATIO_SCALE).padStart(RATIO_PLACES, "0");
      },
      "0.line.11_nontaxable_conversion_portion": (form) =>
        timesRatio(form["0.line.8_net_roth_conversion_amount"], form),
      "0.line.12_nontaxable_distribution_portion": (form) =>
        timesRatio(form["0.line.7_traditional_ira_distributions"], form),
      "0.line.13_total_nontaxable_distributions": (form) => {
        const line11 = form["0.line.11_nontaxable_conversion_portion"];
        const line12 = form["0.line.12_nontaxable_distribution_portion"];
        return line11 === undefined || line12 === undefined ? undefined : line11 + line12;
      },
      // "No" after line 3 enters line 3. A prior Line 15c Worksheet carryover has no fact.
      "0.line.14_total_traditional_basis_end": (form, info) => {
        const line3 = form["0.line.3_total_contributions_and_basis"];
        if (!distributedOrConverted(info)) return line3;
        const line13 = form["0.line.13_total_nontaxable_distributions"];
        return line3 === undefined || line13 === undefined ? undefined : line3 - line13;
      },
      "1.line.15a_line_7_minus_line_12": (form) => {
        const line7 = form["0.line.7_traditional_ira_distributions"];
        const line12 = form["0.line.12_nontaxable_distribution_portion"];
        return line7 === undefined || line12 === undefined ? undefined : line7 - line12;
      },
      // Line 15b and the repayment reduction have no facts; both read as zero.
      "1.line.15c_taxable_traditional_distributions": (form) => {
        const line15a = form["1.line.15a_line_7_minus_line_12"];
        const line15b = form["1.line.15b_qualified_disaster_distributions"];
        return line15a === undefined ? undefined : line15a - (line15b ?? 0);
      },
      "1.line.16_net_amount_converted": (form, info) => {
        if (converted(info) <= 0) return undefined;
        return partIApplies(info)
          ? form["0.line.8_net_roth_conversion_amount"]
          : roundDollars(converted(info));
      },
      // Without Part I, line 1 is zero, so the basis is line 2's amount.
      "1.line.17_basis_in_conversion": (form, info) => {
        if (converted(info) <= 0) return undefined;
        return partIApplies(info)
          ? form["0.line.11_nontaxable_conversion_portion"]
          : roundDollars(holderOf(info)?.ira?.basisPriorYears ?? 0);
      },
      "1.line.18_taxable_conversion_amount": (form) => {
        const line16 = form["1.line.16_net_amount_converted"];
        const line17 = form["1.line.17_basis_in_conversion"];
        return line16 === undefined || line17 === undefined ? undefined : line16 - line17;
      },
      ...partIIIBindings(),
    },

    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "0.header.home_address": FILED_ALONE,
      "0.header.apt_no": FILED_ALONE,
      "0.header.city_state_zip": FILED_ALONE,
      "0.header.foreign_country_name": FILED_ALONE,
      "0.header.foreign_province_state_county": FILED_ALONE,
      "0.header.foreign_postal_code": FILED_ALONE,
      "1.line.15b_qualified_disaster_distributions":
        "No fact records qualified disaster distributions (Form 8915-F); line 15c reads this line as zero.",
      "1.line.25b_roth_qualified_disaster_distributions":
        "No fact records qualified disaster distributions from a Roth IRA; line 25c reads this line as zero.",
      "1.signing.preparer_self_employed": PREPARER,
      "1.signing.preparer_name": PREPARER,
      "1.signing.preparer_ptin": PREPARER,
      "1.signing.firm_name": PREPARER,
      "1.signing.firm_ein": PREPARER,
      "1.signing.firm_address": PREPARER,
      "1.signing.firm_phone": PREPARER,
    },
  });
}
