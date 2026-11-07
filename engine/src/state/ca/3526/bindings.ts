/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import {
  netCapitalGainFromDispositions,
  netGainFromDispositions,
} from "../../../federal/4952/lines.js";
import { atLeast, numberOrBlank, roundDollars, sumOrBlank } from "../../../money.js";
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
        info.caDisallowedInterestCarryover === undefined
          ? undefined
          : atLeast(0, info.caDisallowedInterestCarryover),
      // ca-3526-inst-2025::sec::taxable-year::b02: "Add line 1 and line 2." Blank, not 0, when both are blank.
      "0.line.3_total_investment_interest": (form) =>
        sumOrBlank(
          form["0.line.1_investment_interest_paid"],
          form["0.line.2_disallowed_prior_year_interest"],
        ),
      /*
       * ca-3526-inst-2025::sec::line-4a::b01: "gross income from property held
       * for investment ... from interest, dividends, annuities, and royalties".
       * MANUAL EDIT: California's own slot: 1099-INT box 1 plus ordinary
       * dividends (1099-DIV box 1a); U.S. obligation interest (box 3) is not
       * California income. Annuities, royalties and K-1 investment income have
       * no fact kind yet.
       */
      "0.line.4a_gross_investment_income": (_, info) => roundDollars(info.caGrossInvestmentIncome),
      /*
       * ca-3526-inst-2025::sec::line-4b::b01: "the excess of total gains over
       * total losses from the disposition of property held for investment ...
       * include capital gain distributions from mutual funds": Schedule D line 16
       * (else 1040 line 7a), a net loss floored at 0, as federal line 4d.
       */
      "0.line.4b_net_gain_investment_property": (form) => {
        const net = netGainFromDispositions(form);
        return net === undefined ? undefined : atLeast(0, net);
      },
      /*
       * ca-3526-inst-2025::sec::line-4c::b01: "the excess of your net long-term
       * capital gain over net short-term capital loss", capped at line 4b as
       * federal line 4e is; figured here so the line stands when Form 4952 does not file.
       */
      "0.line.4c_net_capital_gain_investment_property": (form) => {
        const line4b = form["0.line.4b_net_gain_investment_property"];
        return line4b === undefined
          ? undefined
          : Math.min(line4b, netCapitalGainFromDispositions(form));
      },
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
      "0.line.4f_investment_income": (form) =>
        sumOrBlank(
          form["0.line.4a_gross_investment_income"],
          form["0.line.4d_net_gain_less_capital_gain"],
          form["0.line.4e_elected_net_capital_gain"],
        ),
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
      /*
       * MANUAL EDIT: the federal deduction is Schedule A line 9, which is Form
       * 4952 line 8 or, under the federal Who Must File exception, the interest
       * paid; without a Schedule A the Form 4952 line itself.
       */
      "0.line.9_federal_4952_line_8": (form) =>
        numberOrBlank(form["schedule-a.0.line.9_investment_interest"]) ??
        numberOrBlank(form["form-4952.0.line.8_investment_interest_deduction"]),
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
