/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { SSN } from "../../values.js";
import type { Form4952FilingInfo } from "./filingInfo.js";
import { netCapitalGainFromDispositions, netGainFromDispositions } from "./lines.js";
import type { Form4952 } from "./types.js";

export function register(): void {
  defineForm<Form4952, Form4952FilingInfo>("form-4952", {
    bindings: {
      // No combined-name fact; concatenate first + last. The MFJ spouse name is not modeled.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_investment_interest_paid": (_, info) => info.investmentInterestPaid,
      "0.line.2_disallowed_prior_year_interest": (_, info) => info.disallowedInterestCarryover,
      // A subtotal stays blank, not "0", when every addend is blank.
      "0.line.3_total_investment_interest": (form) => {
        const line1 = form["0.line.1_investment_interest_paid"];
        const line2 = form["0.line.2_disallowed_prior_year_interest"];
        if (line1 === undefined && line2 === undefined) return undefined;
        return sum(line1, line2);
      },
      /*
       * MANUAL EDIT: Part II. Line 4a is interest (1099-INT box 1) plus ordinary
       * dividends (1099-DIV box 1a); annuities, royalties and K-1 investment
       * income have no fact kind yet. Net gain from dispositions goes on 4d.
       */
      "0.line.4a_gross_investment_income": (_, info) => roundDollars(info.grossInvestmentIncome),
      "0.line.4b_qualified_dividends": (_, info) => roundDollars(info.qualifiedDividends),
      "0.line.4c_income_less_qualified_dividends": (form) => {
        const line4a = form["0.line.4a_gross_investment_income"];
        if (line4a === undefined) return undefined;
        return line4a - (form["0.line.4b_qualified_dividends"] ?? 0);
      },
      // MANUAL EDIT: "the excess, if any" of gains over losses: a net loss is 0.
      "0.line.4d_net_gain_investment_property": (form) => {
        const net = netGainFromDispositions(form);
        return net === undefined ? undefined : atLeast(0, net);
      },
      "0.line.4e_smaller_net_gain_or_capital_gain": (form) => {
        const line4d = form["0.line.4d_net_gain_investment_property"];
        if (line4d === undefined) return undefined;
        return Math.min(line4d, netCapitalGainFromDispositions(form));
      },
      "0.line.4f_net_gain_less_capital_gain": (form) => {
        const line4d = form["0.line.4d_net_gain_investment_property"];
        const line4e = form["0.line.4e_smaller_net_gain_or_capital_gain"];
        if (line4d === undefined || line4e === undefined) return undefined;
        return line4d - line4e;
      },
      // MANUAL EDIT: the election is capped: "don't enter more than the sum of lines 4b and 4e".
      "0.line.4g_elected_investment_income": (form, info) => {
        const elected = info.electedQualifiedDividendsAndGain;
        if (elected === undefined) return undefined;
        const cap = sum(
          form["0.line.4b_qualified_dividends"],
          form["0.line.4e_smaller_net_gain_or_capital_gain"],
        );
        return Math.min(roundDollars(elected), cap);
      },
      "0.line.4h_investment_income": (form) => {
        const line4c = form["0.line.4c_income_less_qualified_dividends"];
        const line4f = form["0.line.4f_net_gain_less_capital_gain"];
        const line4g = form["0.line.4g_elected_investment_income"];
        if (line4c === undefined && line4f === undefined && line4g === undefined) return undefined;
        return sum(line4c, line4f, line4g);
      },
      "0.line.5_investment_expenses": (_, info) => roundDollars(info.investmentExpenses),
      "0.line.6_net_investment_income": (form) => {
        const line4h = form["0.line.4h_investment_income"];
        if (line4h === undefined) return undefined;
        return atLeast(0, line4h - (form["0.line.5_investment_expenses"] ?? 0));
      },
      // MANUAL EDIT: Part III. The carryforward is the expense that net investment income does not cover.
      "0.line.7_disallowed_interest_carryforward": (form) => {
        const line3 = form["0.line.3_total_investment_interest"];
        const line6 = form["0.line.6_net_investment_income"];
        if (line3 === undefined || line6 === undefined) return undefined;
        return atLeast(0, line3 - line6);
      },
      /*
       * MANUAL EDIT: An individual enters line 8 on Schedule A line 9. The parts
       * routed to Form 6198 line 4, Schedule E (royalties) or a non-passive
       * trade or business are not modeled.
       */
      "0.line.8_investment_interest_deduction": (form) => {
        const line3 = form["0.line.3_total_investment_interest"];
        const line6 = form["0.line.6_net_investment_income"];
        if (line3 === undefined || line6 === undefined) return undefined;
        return Math.min(line3, line6);
      },
    },

    // This SSN widget (text, maxLength 11) keeps the dashes; the 1040 comb widget strips them.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
