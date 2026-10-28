/* Every value is from docs/Alejandro-8949-Golden.pdf (itemization version). */

import type { ExpectedResults } from "../../types.js";

export const alejandro8949Expected: ExpectedResults = {
  engineFields: {
    "form-8949.0.part1.row1_proceeds": 1650,
    "form-8949.0.part1.row1_cost_basis": 1350,
    "form-8949.0.part1.row1_gain_loss": 300,
    "form-8949.0.part1.totals_proceeds": 1650,
    "form-8949.0.part1.totals_cost_basis": 1350,
    "form-8949.0.part1.totals_adjustment_amount": 0,
    "form-8949.0.part1.totals_gain_loss": 300,

    "form-8949.1.part2.row1_proceeds": 11500,
    "form-8949.1.part2.row1_cost_basis": 9250,
    "form-8949.1.part2.row1_gain_loss": 2250,
    "form-8949.1.part2.totals_proceeds": 11500,
    "form-8949.1.part2.totals_cost_basis": 9250,
    "form-8949.1.part2.totals_adjustment_amount": 0,
    "form-8949.1.part2.totals_gain_loss": 2250,
  },

  renderedText: {
    "form-8949.0.header.taxpayer_name": "Alejandro Reyes",
    "form-8949.0.header.ssn": "234567890",
    "form-8949.0.part1.row1_description": "10 sh NVIDIA CORP",
    "form-8949.0.part1.row1_date_acquired": "02/10/25",
    "form-8949.0.part1.row1_date_sold": "11/20/25",
    "form-8949.0.part1.row1_proceeds": "1,650",
    "form-8949.0.part1.row1_cost_basis": "1,350",
    "form-8949.0.part1.row1_gain_loss": "300",
    "form-8949.0.part1.totals_proceeds": "1,650",
    "form-8949.0.part1.totals_cost_basis": "1,350",
    "form-8949.0.part1.totals_gain_loss": "300",
    "form-8949.1.part2.row1_description": "50 sh APPLE INC",
    "form-8949.1.part2.row1_date_acquired": "06/15/23",
    "form-8949.1.part2.row1_date_sold": "09/15/25",
    "form-8949.1.part2.row1_proceeds": "11,500",
    "form-8949.1.part2.row1_cost_basis": "9,250",
    "form-8949.1.part2.row1_gain_loss": "2,250",
    "form-8949.1.part2.totals_proceeds": "11,500",
    "form-8949.1.part2.totals_cost_basis": "9,250",
    "form-8949.1.part2.totals_gain_loss": "2,250",
  },

  renderedBlank: [
    /* Empty rows must not render "0" in gain_loss. */
    "form-8949.0.part1.row2_description",
    "form-8949.0.part1.row2_gain_loss",
    "form-8949.0.part1.row3_description",
    "form-8949.0.part1.row3_gain_loss",
    "form-8949.1.part2.row2_description",
    "form-8949.1.part2.row2_gain_loss",
    "form-8949.1.part2.row3_description",
    "form-8949.1.part2.row3_gain_loss",
  ],

  renderedChecked: [
    "form-8949.0.part1.box_a_short_term_basis_reported",
    "form-8949.1.part2.box_d_long_term_basis_reported",
  ],
};
