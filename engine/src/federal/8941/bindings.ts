/*
 * Form 8941, Credit for Small Employer Health Insurance Premiums, for an
 * individual: the header and lines 1 to 14 from the small employer health
 * credit fact of the taxpayer's own employees (figures.ts, lines.ts), line 15
 * from the K-1s, line 16 to Form 3800 Part III line 4h (form3800.ts). Line 12
 * also reduces the premiums deduction of the business or farm
 * (facts/kinds/activitiesOnReturn.ts, facts/kinds/farm.ts). Lines 17 to 20 are
 * for cooperatives, estates, trusts and tax-exempt employers only: blank on an
 * individual's return.
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8941Figures, Form8941FilingInfo } from "./filingInfo.js";
import { line16Of, type CreditLines } from "./lines.js";
import type { Form8941 } from "./types.js";

type Value = number | Unsupported | undefined;

const isGap = (value: Value): value is Unsupported => typeof value === "object";

/*
 * Lines 1 to 14: blank with no fact of the taxpayer's own employees (only line
 * 15), and after line A "No" or line C "Yes" ("Stop"); the gap when the facts
 * do not add up. A line the form skips (lines 3 to 11 at 25 FTEs or more, lines
 * 13 and 14 with line 12 at zero) is blank.
 */
function ownLine(figures: Form8941Figures | undefined, line: keyof CreditLines): Value {
  if (figures === undefined || !figures.claimsCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 15: the K-1 credits, or the gap of a K-1 with no amount; blank with none. */
function line15Of(figures: Form8941Figures | undefined): Value {
  const k1 = figures?.k1Credits;
  if (k1 === undefined) return undefined;
  return "gap" in k1 ? unsupported(k1.gap) : k1.amount;
}

/* Line 16: "Add lines 12 and 15"; blank while both are blank. */
function line16Value(figures: Form8941Figures | undefined): Value {
  const line12 = ownLine(figures, "line12");
  const line15 = line15Of(figures);
  if (isGap(line12)) return line12;
  if (isGap(line15)) return line15;
  if (line12 === undefined && line15 === undefined) return undefined;
  return line16Of(line12, line15);
}

/* A header answer; blank with no fact of the taxpayer's own employees. */
const answer =
  <T>(pick: (answers: NonNullable<Form8941Figures["answers"]>) => T) =>
  (_: unknown, info: Form8941FilingInfo): T | undefined => {
    const answers = info.form8941?.answers;
    return answers === undefined ? undefined : pick(answers);
  };

const line =
  (key: keyof CreditLines) =>
  (_: unknown, info: Form8941FilingInfo): Value =>
    ownLine(info.form8941, key);

export function register(): void {
  defineForm<Form8941, Form8941FilingInfo>("form-8941", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // Line A (irs-8941-inst-2025::sec::line-a::b01): the stated answer, one box.
      "0.header.a_shop_marketplace_premiums_yes": answer((each) => each.shopCoverage),
      "0.header.a_marketplace_identifier": answer((each) =>
        each.shopCoverage ? each.marketplaceIdentifier : undefined,
      ),
      "0.header.a_shop_marketplace_premiums_no": answer((each) => !each.shopCoverage),
      // Line B: "if different from the identifying number listed above".
      "0.header.b_employment_tax_ein": answer((each) => each.employmentTaxEin),
      // Line C (irs-8941-inst-2025::sec::line-c::b01): asked after line A "Yes".
      "0.header.c_prior_credit_claimed_yes": answer((each) =>
        each.shopCoverage ? each.creditClaimedBefore2024 : undefined,
      ),
      "0.header.c_prior_credit_claimed_no": answer((each) =>
        each.shopCoverage ? !each.creditClaimedBefore2024 : undefined,
      ),
      "0.line.1_number_of_employees": line("line1"),
      "0.line.2_full_time_equivalent_employees": line("line2"),
      "0.line.3_average_annual_wages": line("line3"),
      "0.line.4_premiums_paid_qualifying_arrangement": line("line4"),
      "0.line.5_premiums_at_average_premium": line("line5"),
      "0.line.6_smaller_of_4_or_5": line("line6"),
      "0.line.7_multiply_6_by_applicable_percentage": line("line7"),
      "0.line.8_fte_phaseout_amount": line("line8"),
      "0.line.9_wage_phaseout_amount": line("line9"),
      "0.line.10_state_subsidies_and_credits": line("line10"),
      "0.line.11_subtract_10_from_4": line("line11"),
      "0.line.12_smaller_of_9_or_11": line("line12"),
      "0.line.13_employees_with_premiums_paid": line("line13"),
      "0.line.14_ftes_for_line_13_employees": line("line14"),
      "0.line.15_credit_from_pass_through_entities": (_, info) => line15Of(info.form8941),
      "0.line.16_add_lines_12_and_15": (_, info) => line16Value(info.form8941),
      /*
       * Lines 17 and 18: "Cooperatives, estates, and trusts"; lines 19 and 20:
       * "Tax-exempt small employers" (irs-8941-face-2025::sec::face-page-1::b04).
       * An individual is neither: "All others, stop here" at line 16.
       */
      "0.line.17_allocated_to_patrons_or_beneficiaries": () => undefined,
      "0.line.18_subtract_17_from_16": () => undefined,
      "0.line.19_payroll_taxes_paid": () => undefined,
      "0.line.20_smaller_of_16_or_19": () => undefined,
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
