/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../../money.js";
import type { Form3526FilingInfo } from "./filingInfo.js";
import type { Form3526 } from "./types.js";

/*
 * ca-3526-inst-2025::sec::specific-line-instructions::b01: "California law for
 * the investment interest expense deduction follows federal law." The answers
 * are the Form 4952 answers; the disposition lines read the federal Form 4952
 * through the form accessor. California has no qualified-dividend split
 * (federal lines 4b, 4c, 4g), so the form's line 4 differs from the federal one.
 */
export function register(): void {
  defineForm<Form3526, Form3526FilingInfo>("form-3526", {
    bindings: {
      // ca-3526-inst-2025::sec::taxable-year::b01: "Name(s) as shown on tax return". No combined-name fact; first + last.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      // A nine-digit widget (maxLength 9): the SSN as digits, no formatter.
      "0.header.ssn_itin_fein": (_, info) => info.taxpayerSSN,
      // ca-3526-inst-2025::sec::line-1::b01: "the investment interest paid or accrued during the taxable year".
      "0.line.1_investment_interest_paid": (_, info) => info.investmentInterestPaid,
      // ca-3526-inst-2025::sec::taxable-year::b02: "from 2024 form FTB 3526, line 7. If zero or less, enter 0".
      "0.line.2_disallowed_prior_year_interest": (_, info) =>
        info.disallowedInterestCarryover === undefined
          ? undefined
          : atLeast(0, info.disallowedInterestCarryover),
      // ca-3526-inst-2025::sec::taxable-year::b02: "Add line 1 and line 2." Blank, not 0, when both are blank.
      "0.line.3_total_investment_interest": (form) => {
        const line1 = form["0.line.1_investment_interest_paid"];
        const line2 = form["0.line.2_disallowed_prior_year_interest"];
        if (line1 === undefined && line2 === undefined) return undefined;
        return sum(line1, line2);
      },
      /*
       * ca-3526-inst-2025::sec::line-4a::b01: "gross income from property held
       * for investment ... from interest, dividends, annuities, and royalties".
       * MANUAL EDIT: the slot is interest (1099-INT box 1 and 3) plus ordinary
       * dividends (1099-DIV box 1a), as federal line 4a; annuities, royalties and
       * K-1 investment income have no fact kind yet.
       */
      "0.line.4a_gross_investment_income": (_, info) => roundDollars(info.grossInvestmentIncome),
      /*
       * ca-3526-inst-2025::sec::line-4b::b01: "the excess of total gains over
       * total losses from the disposition of property held for investment ...
       * include capital gain distributions from mutual funds": federal line 4d,
       * which reads Schedule D line 16 (else 1040 line 7a) and floors a net loss at 0.
       */
      "0.line.4b_net_gain_investment_property": (form) =>
        federalLine(form["form-4952.0.line.4d_net_gain_investment_property"]),
      /*
       * ca-3526-inst-2025::sec::line-4c::b01: "the excess of your net long-term
       * capital gain over net short-term capital loss". MANUAL EDIT: federal
       * line 4e is the smaller of that and the net gain; the net capital gain
       * never exceeds the net gain, so the two are equal.
       */
      "0.line.4c_net_capital_gain_investment_property": (form) =>
        federalLine(form["form-4952.0.line.4e_smaller_net_gain_or_capital_gain"]),
      // ca-3526-inst-2025::sec::taxable-year::b02/b03: "Subtract line 4c from line 4b. If zero or less, enter 0".
      "0.line.4d_net_gain_less_capital_gain": (form) => {
        const line4b = form["0.line.4b_net_gain_investment_property"];
        const line4c = form["0.line.4c_net_capital_gain_investment_property"];
        if (line4b === undefined || line4c === undefined) return undefined;
        return atLeast(0, line4b - line4c);
      },
      /*
       * ca-3526-inst-2025::sec::line-4e::b01: a separate California election,
       * "all or part of the amount on line 4c, but not more than the amount on
       * line 4b". MANUAL EDIT: blank when no California election is stated.
       */
      "0.line.4e_elected_net_capital_gain": (form, info) => {
        const elected = info.caElectedNetCapitalGain;
        if (elected === undefined) return undefined;
        const cap = Math.min(
          atLeast(0, form["0.line.4c_net_capital_gain_investment_property"]),
          atLeast(0, form["0.line.4b_net_gain_investment_property"]),
        );
        return Math.min(roundDollars(elected), cap);
      },
      // ca-3526-inst-2025::sec::taxable-year::b03: "Add line 4a, line 4d, and line 4e".
      "0.line.4f_investment_income": (form) => {
        const line4a = form["0.line.4a_gross_investment_income"];
        const line4d = form["0.line.4d_net_gain_less_capital_gain"];
        const line4e = form["0.line.4e_elected_net_capital_gain"];
        if (line4a === undefined && line4d === undefined && line4e === undefined) return undefined;
        return sum(line4a, line4d, line4e);
      },
      /*
       * ca-3526-inst-2025::sec::line-5::b01: "allowed deductions, other than
       * interest expense, directly connected with the production of investment
       * income". MANUAL EDIT: the Form 4952 answer; the Schedule CA Part II
       * line 21 2% limitation is not modeled.
       */
      "0.line.5_investment_expenses": (_, info) => roundDollars(info.investmentExpenses),
      /*
       * ca-3526-inst-2025::sec::taxable-year::b03: "Subtract line 5 from line 4f."
       * MANUAL EDIT: floored at 0 as federal line 6 ("If zero or less, enter
       * -0-"), which California follows (specific-line-instructions::b01).
       */
      "0.line.6_net_investment_income": (form) => {
        const line4f = form["0.line.4f_investment_income"];
        if (line4f === undefined) return undefined;
        return atLeast(0, line4f - (form["0.line.5_investment_expenses"] ?? 0));
      },
      // ca-3526-inst-2025::sec::taxable-year::b03: "Subtract line 6 from line 3. If zero or less, enter 0".
      "0.line.7_disallowed_interest_carryforward": (form) => {
        const line3 = form["0.line.3_total_investment_interest"];
        const line6 = form["0.line.6_net_investment_income"];
        if (line3 === undefined || line6 === undefined) return undefined;
        return atLeast(0, line3 - line6);
      },
      /*
       * ca-3526-inst-2025::sec::taxable-year::b03: "the smaller of line 3 or
       * line 6". The at-risk reduction (line-8::b01, Form 6198) is not modeled.
       */
      "0.line.8_investment_interest_deduction": (form) => {
        const line3 = form["0.line.3_total_investment_interest"];
        const line6 = form["0.line.6_net_investment_income"];
        if (line3 === undefined || line6 === undefined) return undefined;
        return Math.min(line3, line6);
      },
      // ca-3526-inst-2025::sec::taxable-year::b03: "the amount from federal Form 4952, line 8".
      "0.line.9_federal_4952_line_8": (form) =>
        federalLine(form["form-4952.0.line.8_investment_interest_deduction"]),
      /*
       * ca-3526-inst-2025::sec::line-10::b01: "the difference between the
       * deduction allowed by California and federal law": the larger less the
       * smaller. Schedule CA Part II line 9 takes it in column C when line 8 is
       * more, column B when line 9 is more.
       */
      "0.line.10_california_adjustment": (form) => {
        const line8 = form["0.line.8_investment_interest_deduction"];
        const line9 = form["0.line.9_federal_4952_line_8"];
        if (line8 === undefined || line9 === undefined) return undefined;
        return Math.max(line8, line9) - Math.min(line8, line9);
      },
    },
  });
}

// A line of another form is untyped; a Form 4952 that is not filed gives undefined.
function federalLine(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
