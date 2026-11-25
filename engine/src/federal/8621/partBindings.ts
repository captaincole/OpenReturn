/*
 * MANUAL EDIT: Form 8621 Parts III to VI for the copy being printed. Each
 * line reads one part of the fund (fund.ts); a part the fund does not take
 * leaves its lines blank.
 */

import { unsupported } from "../../types.js";
import type { Form8621Fund } from "./fund.js";
import { fundLine, type Bindings } from "./fundLine.js";
import type { Line15 } from "./line15.js";
import type { Line16 } from "./line16.js";
import type { PartIIILines, PartIVDisposition, PartIVYearEnd } from "./lines.js";
import type { PartVIColumn } from "./partVI.js";

const ELECTION_B_TAX =
  "Lines 9a and 9b need the return's total tax with and without line 8e; the engine figures the return once, so lines 9a–9c are not figured (irs-8621-inst-2025::sec::line-9b::b01).";
const LINE_20 =
  "Line 20 is the interest on line 19 up to the date the return is filed (irs-8621-inst-2025::sec::line-20::b01); the engine does not know that date.";
const LINE_26 =
  "Line 26 is line 20 less line 24 (irs-8621-inst-2025::sec::lines-25-and-26::b02), and line 20 is not figured.";

const partIII = <V>(read: (lines: PartIIILines) => V | undefined) =>
  fundLine((fund) => (fund.partIII === undefined ? undefined : read(fund.partIII)));

type ElectionB = NonNullable<PartIIILines["electionB"]>;
const electionB = (read: (lines: ElectionB) => number) =>
  partIII((lines) => (lines.electionB === undefined ? undefined : read(lines.electionB)));
const electionBTax = fundLine((fund) =>
  fund.partIII?.electionB === undefined ? undefined : unsupported(ELECTION_B_TAX),
);

// ::part-iii::b01: all QEF shareholders complete lines 6a–7c; Election B adds lines 8a–9c.
const partIIIBindings: Bindings = {
  "1.line.6a_qef_ordinary_earnings_share": partIII((lines) => lines.line6a),
  "1.line.6b_ordinary_earnings_section_951_portion": partIII((lines) => lines.line6b),
  "1.line.6c_qef_ordinary_income": partIII((lines) => lines.line6c),
  "1.line.7a_qef_net_capital_gain_share": partIII((lines) => lines.line7a),
  "1.line.7b_capital_gain_section_951_portion": partIII((lines) => lines.line7b),
  "1.line.7c_qef_net_long_term_gain": partIII((lines) => lines.line7c),
  "1.line.8a_total_qef_income": electionB((lines) => lines.line8a),
  "1.line.8b_qef_distributions": electionB((lines) => lines.line8b),
  "1.line.8c_income_from_shares_disposed": electionB((lines) => lines.line8c),
  "1.line.8d_distributions_and_dispositions_total": electionB((lines) => lines.line8d),
  "1.line.8e_undistributed_qef_earnings": electionB((lines) => lines.line8e),
  "1.line.9a_total_tax": electionBTax,
  "1.line.9b_total_tax_without_line_8e": electionBTax,
  "1.line.9c_deferred_tax_election_b": electionBTax,
};

const yearEnd = (read: (lines: PartIVYearEnd) => number | undefined) =>
  fundLine((fund) => (fund.partIV?.yearEnd === undefined ? undefined : read(fund.partIV.yearEnd)));
const sale = (read: (lines: PartIVDisposition) => number | undefined) =>
  fundLine((fund) => (fund.partIV?.sale === undefined ? undefined : read(fund.partIV.sale)));

// ::part-iv::b01: lines 10a–12 for stock held at the end of the year, 13a–14c for stock sold.
const partIVBindings: Bindings = {
  "1.line.10a_pfic_stock_fmv_year_end": yearEnd((lines) => lines.line10a),
  "1.line.10b_adjusted_basis_year_end": yearEnd((lines) => lines.line10b),
  "1.line.10c_mark_to_market_gain_loss": yearEnd((lines) => lines.line10c),
  "1.line.11_unreversed_inclusions": yearEnd((lines) => lines.line11),
  "1.line.12_mark_to_market_ordinary_loss": yearEnd((lines) => lines.line12),
  "1.line.13a_stock_fmv_at_disposition": sale((lines) => lines.line13a),
  "1.line.13b_adjusted_basis_at_disposition": sale((lines) => lines.line13b),
  "1.line.13c_disposition_gain_loss": sale((lines) => lines.line13c),
  "1.line.14a_unreversed_inclusions_at_disposition": sale((lines) => lines.line14a),
  "1.line.14b_disposition_ordinary_loss": sale((lines) => lines.line14b),
  "1.line.14c_disposition_loss_over_inclusions": sale((lines) => lines.line14c),
};

const line15 = <V>(read: (lines: Line15, fund: Form8621Fund) => V | undefined) =>
  fundLine((fund) => (fund.partV === undefined ? undefined : read(fund.partV.line15, fund)));
const line16 = (read: (lines: Line16) => number) =>
  fundLine((fund) => {
    if (fund.partV?.line16Gap !== undefined) return unsupported(fund.partV.line16Gap);
    return fund.partV?.line16 === undefined ? undefined : read(fund.partV.line16);
  });

const partVBindings: Bindings = {
  // ::line-15::b01: the three-letter code of the currency of lines 15a–15e(1).
  "2.line.part5_currency_code": line15((lines) => lines.currencyCode),
  "2.line.15a_total_distributions_current_year": line15((lines) => lines.line15a),
  "2.line.15b_total_distributions_preceding_3_years": line15((lines) => lines.line15b),
  "2.line.15c_average_preceding_distributions": line15((lines) => lines.line15c),
  "2.line.15d_125_percent_of_average": line15((lines) => lines.line15d),
  "2.line.15e1_excess_distribution": line15((lines) => lines.line15e1),
  // ::line-15::b01; Elections E, G, H enter the deemed dividend here (::how-to-make-the-election-5::b01).
  "2.line.15e2_excess_distribution_us_dollars": line15(
    (lines, fund) => fund.partV?.deemedDividend ?? lines.line15e2,
  ),
  "2.line.15f_gain_or_loss_disposition": line15((lines) => lines.line15f),
  "2.line.16b_current_year_and_pre_pfic_amounts": line16((lines) => lines.line16b),
  "2.line.16c_aggregate_increases_in_tax": line16((lines) => lines.line16c),
  "2.line.16d_foreign_tax_credit": line16((lines) => lines.line16d),
  "2.line.16e_additional_tax": line16((lines) => lines.line16e),
  "2.line.16f_interest_on_tax_increases": line16((lines) => lines.line16f),
};

const COLUMNS = ["i", "ii", "iii", "iv", "v", "vi"] as const;

function columnLine(index: number, read: (column: PartVIColumn) => unknown) {
  return fundLine((fund) => {
    const column = fund.partVI?.[index];
    return column === undefined ? undefined : read(column);
  });
}

/* Part VI, one column per outstanding section 1294 election (::part-vi::b01). */
function partVIBindings(): Bindings {
  const out: Record<string, unknown> = {};
  COLUMNS.forEach((name, index) => {
    out[`3.line.17_tax_year_outstanding_election_col_${name}`] = columnLine(
      index,
      (column) => column.line17,
    );
    out[`3.line.18_undistributed_earnings_col_${name}`] = columnLine(
      index,
      (column) => column.line18,
    );
    out[`3.line.19_deferred_tax_col_${name}`] = columnLine(index, (column) => column.line19);
    out[`3.line.20_interest_accrued_deferred_tax_col_${name}`] = columnLine(index, () =>
      unsupported(LINE_20),
    );
    out[`3.line.21_event_terminating_election_col_${name}`] = columnLine(
      index,
      (column) => column.line21,
    );
    out[`3.line.22_earnings_distributed_col_${name}`] = columnLine(
      index,
      (column) => column.line22,
    );
    out[`3.line.23_deferred_tax_due_col_${name}`] = columnLine(index, (column) => column.line23);
    out[`3.line.24_accrued_interest_due_col_${name}`] = columnLine(
      index,
      (column) => column.line24,
    );
    out[`3.line.25_deferred_tax_outstanding_col_${name}`] = columnLine(
      index,
      (column) => column.line25,
    );
    out[`3.line.26_interest_accrued_after_termination_col_${name}`] = columnLine(index, (column) =>
      column.line25 === undefined ? undefined : unsupported(LINE_26),
    );
  });
  return out as Bindings;
}

export const partBindings: Bindings = {
  ...partIIIBindings,
  ...partIVBindings,
  ...partVBindings,
  ...partVIBindings(),
};
